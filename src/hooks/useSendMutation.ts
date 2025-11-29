import { usePassword } from "./usePassword";
import {
  chunkArrayGenerator,
  delayForSeconds,
  downloadJsonFile,
  floorToWholeNumber,
  getPrivateKey,
} from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type {
  Account,
  Activity,
  SendResult,
  SendStats,
  ValidationResult,
} from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { WalletReader } from "../lib/WalletReader";
import toast from "react-hot-toast";
import { executeUsdtTransfers } from "../lib/transfers";
import Decimal from "decimal.js";

interface SendMutationData {
  accounts: Account[];
  amount: string;
  difference: string;
  delay: number;
  mode: "single" | "batch";
  gasLimit: "average" | "fast" | "instant";
  targetCharacters: string[];
  validate: boolean;
  skipValidated: boolean;
}

interface PreparedAccount {
  status: boolean;
  skipped: boolean;
  account: Account;
  balance: Decimal;
  amount: Decimal;
  amountNeeded: Decimal;
  error?: unknown;
  validation: Activity | null;
}

interface RefillTransaction {
  from: Account;
  to: Account;
  amount: Decimal;
}

const useSendMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const password = usePassword()!;

  /**
   * Check if account has sufficient balance
   */
  const checkBalance = async (
    account: Account
  ): Promise<{ hasBalance: boolean; balance: Decimal }> => {
    try {
      const reader = new WalletReader(account.walletAddress);
      const balance = await reader.getUSDTBalance();

      console.log(
        `USDT Balance for ${account.title} (${account.walletAddress}): ${balance}`
      );

      return {
        hasBalance: balance.greaterThan(new Decimal(1)),
        balance,
      };
    } catch (error) {
      console.error(
        `Failed to fetch balance for ${account.title} (${account.walletAddress}):`,
        error
      );
      return {
        hasBalance: false,
        balance: new Decimal(0),
      };
    }
  };

  /**
   * Generate and submit transaction
   */
  const sendTransaction = async ({
    account,
    amount,
    receiver,
    data,
  }: {
    account: Account;
    amount: Decimal;
    receiver: string;
    data: SendMutationData;
  }) => {
    const amountStr = amount.toString();
    const reader = new WalletReader(account.walletAddress);
    const privateKey = await getPrivateKey(account.id, password);
    const hashMaker = new HashMaker({
      privateKey,
      provider: reader.getProvider(),
    });

    /* Initialize Hash Maker */
    await hashMaker.initialize();

    console.log(
      `Sending $${amountStr} from ${account.title} (${
        account.walletAddress
      }) to ${receiver} targeting [${data.targetCharacters.join(", ")}]`
    );

    /* Generate transaction */
    const hashResult = (await hashMaker.generateTransaction({
      amount: amountStr,
      gasLimit: data.gasLimit,
      targetCharacters: data.targetCharacters,
      receiver,
    })) as HashResult;

    console.log(`Hash Result: ${account.title}`, hashResult);

    try {
      /* Submit transaction */
      const result = await hashMaker.submitTransferTransaction(hashResult);

      console.log(`Submit Result: ${account.title}`, result);
      return {
        status: true,
        amount,
        hashResult,
        result,
      };
    } catch (error) {
      console.error(
        `Transaction submission failed for ${account.title} (${account.walletAddress}):`,
        error
      );
      return {
        status: false,
        amount,
        hashResult,
        result: null,
      };
    }
  };

  /** Get account validation */
  const getValidation = async (account: Account): Promise<Activity | null> => {
    if (!account.url) return null;

    try {
      const packer = new Packer(account.url);
      await packer.initialize();

      /* Check activity */
      return await packer.getActivity();
    } catch (error) {
      console.error(
        `Validation check failed for ${account.title} (W:${account.walletAddress}) (D:${account.depositAddress}):`,
        error
      );
      return null;
    }
  };

  /**
   * Validate transaction if enabled
   */
  const validateTransaction = async (
    account: Account,
    delay: number
  ): Promise<ValidationResult | null> => {
    if (!account.url) return null;

    try {
      /* Delay before validation */
      await delayForSeconds(delay);

      const packer = new Packer(account.url);
      await packer.initialize();

      /* Check activity */
      let validation = await packer.checkActivity();

      /* Retry if not validated */
      if (!validation.activity) {
        await delayForSeconds(delay);
        validation = await packer.checkActivity();
      }

      return validation;
    } catch (error) {
      console.error(
        `Validation failed for ${account.title} (W:${account.walletAddress}) (D:${account.depositAddress}):`,
        error
      );
      return null;
    }
  };

  /** Prepare account by checking balance and determining amount to send */
  const prepareAccount = async (
    account: Account,
    data: SendMutationData,
    applyDifference: boolean = true,
    checkValidation: boolean = true
  ): Promise<PreparedAccount> => {
    /* Initialize validation */
    let validation: Activity | null = null;

    try {
      /* Parallel fetch validation and balance */
      const [validationResult, balanceResult] = await Promise.all([
        checkValidation ? getValidation(account) : Promise.resolve(null),
        checkBalance(account),
      ]);

      /* Check if already validated */
      if (checkValidation) {
        validation = validationResult;
      }

      /* Check balance */
      const { hasBalance, balance } = balanceResult;

      if (!hasBalance) {
        return {
          status: false,
          skipped: true,
          account,
          balance,
          amount: new Decimal(0),
          amountNeeded: new Decimal(0),
          validation,
          error: "Insufficient balance",
        };
      }

      const maxAmount = new Decimal(data.amount);

      let amount: Decimal;
      let amountNeeded: Decimal;

      /* Initial phase: Apply difference for randomization */
      const maxDifference = new Decimal(data.difference);
      if (applyDifference && maxDifference.gt(0)) {
        const minAmount = maxAmount.minus(maxDifference);

        /* If balance >= minAmount, send random amount between minAmount and maxAmount (inclusive) */
        /* If balance < minAmount, send whatever balance is available */
        if (balance >= minAmount) {
          /* Generate random value between minAmount and maxAmount */
          const randomAmount = Decimal.random()
            .times(maxDifference.plus(1))
            .plus(minAmount);
          const cappedAmount = Decimal.min(randomAmount, balance);

          /* Floor to whole number for final send */
          amount = floorToWholeNumber(cappedAmount);

          /* amountNeeded = leftover decimals that can be used for refilling others */
          /* Truncate to 4 decimals to avoid precision issues */
          amountNeeded = new Decimal(balance).minus(new Decimal(amount));
        } else {
          /* Floor to whole number for final send */
          amount = floorToWholeNumber(balance);

          /* amountNeeded = leftover decimals that can be used for refilling others */
          amountNeeded = new Decimal(balance).minus(new Decimal(amount));
        }
      } else {
        /* Refilled accounts: Send whatever balance they have, but cap at maxAmount */
        const cappedAmount = Decimal.min(balance, maxAmount);
        /* Floor to whole number for final send */
        amount = floorToWholeNumber(cappedAmount);
        amountNeeded = new Decimal(0);
      }

      return {
        status: true,
        skipped: false,
        account,
        amount,
        balance,
        amountNeeded,
        validation,
      };
    } catch (error: unknown) {
      console.error(
        `Failed to prepare ${account.title} (${account.walletAddress}):`,
        error
      );

      return {
        status: false,
        skipped: false,
        account,
        error,
        amount: new Decimal(0),
        balance: new Decimal(0),
        amountNeeded: new Decimal(0),
        validation,
      };
    }
  };

  /**
   * Process a single account send operation
   */
  const processAccount = async (
    prepared: PreparedAccount,
    data: SendMutationData
  ): Promise<SendResult> => {
    const { account, amount, balance, amountNeeded } = prepared;
    const receiver = account.depositAddress;
    let hashResult: HashResult | null = null;

    try {
      /* Send transaction */
      const txResult = await sendTransaction({
        account,
        amount,
        receiver,
        data,
      });
      hashResult = txResult.hashResult;

      /* Validate if enabled */
      let validation: ValidationResult | null = null;
      if (data.validate && account.url && txResult.status) {
        validation = await validateTransaction(account, data.delay);
      }

      return {
        status: txResult.status,
        account,
        hashResult,
        receiver,
        amount,
        balance,
        amountNeeded,
        validation,
      };
    } catch (error: unknown) {
      console.error(
        `Failed to send from ${account.title} (${account.walletAddress}):`,
        error
      );

      return {
        status: false,
        skipped: false,
        amount,
        balance,
        amountNeeded,
        account,
        error,
        receiver,
        hashResult,
      };
    } finally {
      incrementProgress();
    }
  };

  /**
   * Calculate statistics from results
   */
  const calculateStats = (results: SendResult[]): SendStats => {
    const successfulSends = results.filter((r) => r.status && !r.skipped);
    const successfulValidations = results.filter(
      (r) => r.status && r.validation?.activity
    );
    const totalAmountSent = successfulSends.reduce(
      (sum, r) => sum.plus(new Decimal(r.amount)),
      new Decimal(0)
    );

    return {
      totalAccounts: results.length,
      successfulSends: successfulSends.length,
      successfulValidations: successfulValidations.length,
      totalAmountSent,
    };
  };

  /**
   * Process accounts in single mode (sequential)
   */
  const processSingle = async (
    accounts: PreparedAccount[],
    data: SendMutationData
  ): Promise<SendResult[]> => {
    const results: SendResult[] = [];
    for (const account of accounts) {
      const result = await processAccount(account, data);
      results.push(result);
    }
    return results;
  };

  /**
   * Process accounts in batch mode (parallel chunks)
   */
  const processBatch = async (
    accounts: PreparedAccount[],
    data: SendMutationData
  ): Promise<SendResult[]> => {
    const results: SendResult[] = [];
    for (const chunk of chunkArrayGenerator(accounts, 10)) {
      const chunkResults = await Promise.all(
        chunk.map((account) => processAccount(account, data))
      );
      results.push(...chunkResults);
    }
    return results;
  };

  /**
   * Prepare accounts by checking balances and determining amounts
   */
  const getPreparedAccounts = async (
    accounts: Account[],
    data: SendMutationData,
    applyDifference: boolean = true,
    checkValidation: boolean = true
  ) => {
    const preparedAccounts = [];
    for (const chunk of chunkArrayGenerator(accounts, 10)) {
      const chunkResults = await Promise.all(
        chunk.map((account) =>
          prepareAccount(account, data, applyDifference, checkValidation)
        )
      );
      preparedAccounts.push(...chunkResults);
    }
    return preparedAccounts;
  };

  /**
   * Plan refill transactions to fill skipped accounts
   * Fills each recipient to maxAmount completely before moving to the next recipient
   */
  const planRefillTransactions = (
    donorAccounts: PreparedAccount[],
    recipientAccounts: PreparedAccount[],
    maxAmount: Decimal
  ): RefillTransaction[] => {
    const transactions: RefillTransaction[] = [];

    /* Filter donors who have amountNeeded > 0 */
    const availableDonors = donorAccounts
      .filter((acc) => acc.amountNeeded && acc.amountNeeded.gt(0))
      .map((acc) => ({ ...acc, remainingToGive: acc.amountNeeded! }));

    /* Process each recipient - fill ONE completely before moving to next */
    for (const recipient of recipientAccounts) {
      let needed = new Decimal(maxAmount).minus(new Decimal(recipient.balance));

      /* Keep taking from donors until this recipient is filled to maxAmount or donors run out */
      for (const donor of availableDonors) {
        if (needed.lte(0)) break;
        if (donor.remainingToGive.lte(0)) continue;

        const transferAmount = Decimal.min(donor.remainingToGive, needed);

        transactions.push({
          from: donor.account,
          to: recipient.account,
          amount: transferAmount,
        });

        donor.remainingToGive = new Decimal(donor.remainingToGive).minus(
          new Decimal(transferAmount)
        );
        needed = new Decimal(needed).minus(new Decimal(transferAmount));
      }

      /** Calculated filled amount */
      const filledAmount = new Decimal(recipient.balance).plus(
        new Decimal(maxAmount)
          .minus(new Decimal(recipient.balance))
          .minus(new Decimal(needed))
      );

      /* Only move to next recipient after trying to fill this one completely */
      console.log(
        `Recipient ${recipient.account.title}: filled to ${filledAmount}, still needs ${needed}`
      );
    }

    return transactions;
  };

  /**
   * Execute refill transactions in chunks
   * Groups by sender to avoid nonce collisions
   */
  const executeRefillTransactions = async (
    transactions: RefillTransaction[]
  ): Promise<{ success: number; failed: number }> => {
    const { success, failed } = await executeUsdtTransfers({
      transactions,
      password,
      onResult: () => {
        incrementProgress();
      },
    });

    return { success, failed };
  };

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["send-funds"],
    mutationFn: async (data: SendMutationData) => {
      /* Reset progress */
      resetProgress();

      /* Max amount to send */
      const maxAmount = new Decimal(data.amount);

      /* PHASE 1: Prepare all accounts and determine amounts */
      console.log("=== PHASE 1: Preparing accounts ===");
      const preparedAccounts = await getPreparedAccounts(data.accounts, data);

      /* Apply skipValidated filter */
      const availableAccounts = preparedAccounts.filter((item) => {
        if (data.skipValidated && item.validation?.activity) {
          return false;
        }
        return true;
      });

      /* Debug log for available accounts after filtering */
      console.log(
        `Available accounts after skipValidated filter: ${availableAccounts.length}`,
        availableAccounts
      );

      /* Filter accounts that are ready to send */
      const accountsToProcess = availableAccounts.filter(
        (acc) => acc.status && !acc.skipped
      );

      /* Filter skipped accounts for refill */
      const skippedAccounts = availableAccounts.filter((acc) => acc.skipped);

      /* Debug logs */
      console.log(
        `Accounts to process: ${accountsToProcess.length}`,
        accountsToProcess
      );
      console.log(
        `Skipped accounts: ${skippedAccounts.length}`,
        skippedAccounts
      );

      /* Set initial target (will be updated) */
      setTarget(accountsToProcess.length);

      /* PHASE 2: Send from accounts with sufficient balance */
      console.log("=== PHASE 2: Sending from funded accounts ===");
      const phase1Results =
        data.mode === "single"
          ? await processSingle(accountsToProcess, data)
          : await processBatch(accountsToProcess, data);

      /* PHASE 3: Refill skipped accounts */
      console.log("=== PHASE 3: Refilling skipped accounts ===");
      let refillStats = { success: 0, failed: 0 };

      if (skippedAccounts.length > 0) {
        const refillTransactions = planRefillTransactions(
          accountsToProcess,
          skippedAccounts,
          maxAmount
        );

        /* Debug log for planned refill transactions */
        console.log(
          `Planned ${refillTransactions.length} refill transactions`,
          refillTransactions
        );

        if (refillTransactions.length > 0) {
          toast.loading(
            `Refilling ${refillTransactions.length} transactions...`
          );
          resetProgress();
          setTarget(refillTransactions.length);
          refillStats = await executeRefillTransactions(refillTransactions);
          console.log(
            `Refill complete: ${refillStats.success} success, ${refillStats.failed} failed`
          );
        }
      }

      /* PHASE 4: Prepare and send from refilled accounts */
      console.log("=== PHASE 4: Sending from refilled accounts ===");
      let phase2Results: SendResult[] = [];

      if (skippedAccounts.length > 0) {
        /* Re-prepare skipped accounts to get updated balances after refill */
        const skippedAccountList = skippedAccounts.map((acc) => acc.account);
        const refilledPrepared = await getPreparedAccounts(
          skippedAccountList,
          data,
          false,
          false
        );

        /* Filter accounts that now have balance to send */
        const refilledToProcess = refilledPrepared.filter(
          (acc) => acc.status && !acc.skipped
        );

        console.log(
          `Refilled accounts ready to send: ${refilledToProcess.length}`
        );

        if (refilledToProcess.length > 0) {
          /* Set target for refilled accounts */
          toast.loading(
            `Sending from ${refilledToProcess.length} refilled accounts...`
          );

          resetProgress();
          setTarget(refilledToProcess.length);

          /* Process using same mode as phase 1 */
          phase2Results =
            data.mode === "single"
              ? await processSingle(refilledToProcess, data)
              : await processBatch(refilledToProcess, data);
        }
      }

      /* Combine all results */
      const allResults = [...phase1Results, ...phase2Results];

      /* Calculate statistics */
      const stats = calculateStats(allResults);

      /* Download results as JSON */
      downloadJsonFile("send-results", {
        timestamp: new Date().toISOString(),
        parameters: data,
        stats,
        results: allResults,
      });

      return {
        results: allResults,
        refillStats,
        ...stats,
      };
    },
  });

  return { mutation, progress, target };
};

export { useSendMutation };

import { usePassword } from "./usePassword";
import {
  chunkArrayGenerator,
  delayForSeconds,
  downloadJsonFile,
  floorToWholeNumber,
  getPrivateKey,
  isWalletAddress,
} from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type {
  Account,
  ParticipationResult,
  SendConfig,
  SendResult,
  SendStats,
} from "../types";
import { useProgress } from "./useProgress";
import { WalletReader } from "../lib/WalletReader";
import toast from "react-hot-toast";
import { executeUsdtTransfers } from "../lib/transfers";
import Decimal from "decimal.js";
import { usePackerProvider } from "./usePackerProvider";

interface SendTarget {
  account: Account;
  receiver?: string | null;
}

interface SendMutationData extends SendConfig {
  accounts: SendTarget[];
}

interface PreparedAccount {
  status: boolean;
  skipped: boolean;
  account: Account;
  balance: Decimal;
  amount: Decimal;
  amountNeeded: Decimal;
  receiver: string;
  error?: unknown;
  validation: ParticipationResult | null;
}

interface RefillTransaction {
  from: Account;
  to: Account;
  amount: Decimal;
}

const useSendMutation = () => {
  const { getProvider } = usePackerProvider();
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
        hasBalance: balance.gte(
          new Decimal(
            account.provider
              ? getProvider(account.provider).MINIMUM_DEPOSIT_AMOUNT
              : 1
          )
        ),
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
  const getValidation = async (
    target: SendTarget,
    checkValidation: boolean
  ) => {
    const { account } = target;
    if (!account.provider || !account.url) return null;

    try {
      const Packer = getProvider(account.provider);
      const packer = new Packer(account.url);
      await packer.initialize();

      const [receiver, activity] = await Promise.all([
        await packer.confirmDepositAddress(target.receiver || ""),
        checkValidation
          ? await packer.getParticipation()
          : Promise.resolve(null),
      ]);
      /* Check activity */
      return { receiver, activity };
    } catch (error) {
      console.error(
        `Validation check failed for ${account.title} (W:${account.walletAddress}):`,
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
  ): Promise<ParticipationResult | null> => {
    if (!account.provider || !account.url) return null;

    try {
      /* Delay before validation */
      await delayForSeconds(delay);
      const Packer = getProvider(account.provider);
      const packer = new Packer(account.url);
      await packer.initialize();

      /* Check activity */
      let validation = await packer.confirmParticipation();

      /* Retry if not validated */
      if (!validation.participating) {
        await delayForSeconds(delay);
        validation = await packer.confirmParticipation();
      }

      return validation;
    } catch (error) {
      console.error(
        `Validation failed for ${account.title} (W:${account.walletAddress}):`,
        error
      );
      return null;
    }
  };

  /** Prepare account by checking balance and determining amount to send */
  const prepareAccount = async (
    target: SendTarget,
    data: SendMutationData,
    applyDifference: boolean = true,
    checkValidation: boolean = true
  ): Promise<PreparedAccount> => {
    /* Initialize validation */
    let validation: ParticipationResult | null = null;
    let receiver = target.receiver || "";

    const { account } = target;

    try {
      /* Parallel fetch validation and balance */
      const [validationResult, balanceResult] = await Promise.all([
        getValidation(target, checkValidation),
        checkBalance(account),
      ]);

      /* Check if already validated */
      receiver = validationResult?.receiver || receiver;
      validation = validationResult?.activity || null;

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
          receiver,
          validation,
          error: "Insufficient balance",
        };
      }

      const requiredAmount = new Decimal(data.amount);

      let amount: Decimal;
      let amountNeeded: Decimal;

      /* Initial phase: Apply difference for randomization */
      const difference = new Decimal(data.difference);

      /* Determine if we can apply difference */
      const canApplyDifference = applyDifference && difference.gt(0);

      if (canApplyDifference) {
        const maxAmount = new Decimal(data.amount);
        const minAmount = maxAmount.minus(difference);

        /* If balance >= minAmount, send random amount between minAmount and maxAmount (inclusive) */
        /* If balance < minAmount, send whatever balance is available */
        if (balance.gte(minAmount)) {
          /* Generate random value between minAmount and maxAmount */
          const randomAmount = Decimal.random()
            .times(difference.plus(1))
            .plus(minAmount);
          const cappedAmount = Decimal.min(randomAmount, balance);

          /* Floor to whole number for final send */
          amount = floorToWholeNumber(cappedAmount);

          /* amountNeeded = leftover decimals that can be used for refilling others */
          /* Truncate to 4 decimals to avoid precision issues */
          amountNeeded = balance.minus(amount);
        } else {
          /* Floor to whole number for final send */
          amount = floorToWholeNumber(balance);

          /* amountNeeded = leftover decimals that can be used for refilling others */
          amountNeeded = balance.minus(amount);
        }
      } else {
        /* Send whatever balance they have, but cap at requiredAmount */
        const cappedAmount = Decimal.min(balance, requiredAmount);
        /* Floor to whole number for final send */
        amount = floorToWholeNumber(cappedAmount);
        amountNeeded = new Decimal(0);
      }

      /* Check for lesser amount if not allowed */
      const isLesserAmount =
        !data.allowLesserAmount && amount.lt(requiredAmount);

      /* Return skipped if lesser amount is not allowed */
      if (isLesserAmount) {
        return {
          status: false,
          skipped: true,
          account,
          balance,
          amount,
          amountNeeded,
          receiver,
          validation,
          error: `Amount to send (${amount.toString()}) is less than configured amount (${requiredAmount.toString()})`,
        };
      }

      return {
        status: true,
        skipped: false,
        account,
        amount,
        balance,
        amountNeeded,
        validation,
        receiver,
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
        receiver,
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
    const { account, amount, receiver, balance, amountNeeded } = prepared;
    let hashResult: HashResult | null = null;

    try {
      if (!receiver || !isWalletAddress(receiver)) {
        throw new Error("Invalid receiver address");
      }

      /* Send transaction */
      const txResult = await sendTransaction({
        account,
        amount,
        receiver,
        data,
      });
      hashResult = txResult.hashResult;

      /* Validate if enabled */
      let validation: ParticipationResult | null = null;
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
      (sum, r) => sum.plus(r.amount),
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
    targets: SendTarget[],
    data: SendMutationData,
    applyDifference: boolean = true,
    checkValidation: boolean = true
  ) => {
    const preparedAccounts = [];
    for (const chunk of chunkArrayGenerator(targets, 10)) {
      const chunkResults = await Promise.all(
        chunk.map((target) =>
          prepareAccount(target, data, applyDifference, checkValidation)
        )
      );
      preparedAccounts.push(...chunkResults);
    }
    return preparedAccounts;
  };

  /**
   * Plan refill transactions to fill skipped accounts
   * Fills each recipient to requiredAmount completely before moving to the next recipient
   */
  const planRefillTransactions = (
    donorAccounts: PreparedAccount[],
    recipientAccounts: PreparedAccount[],
    amount: Decimal
  ): RefillTransaction[] => {
    const transactions: RefillTransaction[] = [];

    /* Filter donors who have amountNeeded > 0 */
    const availableDonors = donorAccounts
      .filter((acc) => acc.amountNeeded && acc.amountNeeded.gt(0))
      .map((acc) => ({ ...acc, remainingToGive: acc.amountNeeded! }));

    /* Process each recipient - fill ONE completely before moving to next */
    for (const recipient of recipientAccounts) {
      let needed = amount.minus(recipient.balance);

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

        donor.remainingToGive = donor.remainingToGive.minus(transferAmount);
        needed = needed.minus(transferAmount);
      }

      /** Calculated filled amount */
      const filledAmount = recipient.balance.plus(
        amount.minus(recipient.balance).minus(needed)
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

      /* Amount to send */
      const amount = new Decimal(data.amount);

      /* Difference for randomization */
      const difference = new Decimal(data.difference);

      /* Prepare all accounts and determine amounts */
      const preparedAccounts = await getPreparedAccounts(data.accounts, data);

      /* Apply skipValidated filter */
      const availableAccounts = preparedAccounts.filter((item) => {
        if (data.skipValidated && item.validation?.participating) {
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

      /* Process initial sends */
      const phase1Results =
        data.mode === "single"
          ? await processSingle(accountsToProcess, data)
          : await processBatch(accountsToProcess, data);

      let phase2Results: SendResult[] = [];
      let refillStats = { success: 0, failed: 0 };

      /* Determine if refill is needed */
      const shouldRefill =
        data.refill && difference.gt(0) && skippedAccounts.length > 0;

      /* Process refill if needed */
      if (shouldRefill) {
        const refillTransactions = planRefillTransactions(
          accountsToProcess,
          skippedAccounts,
          amount
        );

        /* Debug log for planned refill transactions */
        console.log(
          `Planned ${refillTransactions.length} refill transactions`,
          refillTransactions
        );

        if (refillTransactions.length > 0) {
          /* Toast for refill start */
          toast.loading(
            `Refilling ${refillTransactions.length} transactions...`
          );

          /* Set target for refill transactions */
          resetProgress();
          setTarget(refillTransactions.length);

          /* Execute refill transactions */
          refillStats = await executeRefillTransactions(refillTransactions);

          /* Debug log for refill stats */
          console.log(
            `Refill complete: ${refillStats.success} success, ${refillStats.failed} failed`
          );

          /* Re-prepare skipped accounts to get updated balances after refill */
          const skippedAccountList = skippedAccounts.map((acc) => ({
            account: acc.account,
            receiver: acc.receiver,
          }));

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

          /* Debug log for refilled accounts ready to process */
          console.log(
            `Refilled accounts ready to send: ${refilledToProcess.length}`
          );

          if (refilledToProcess.length > 0) {
            /* Toast for sending from refilled accounts */
            toast.loading(
              `Sending from ${refilledToProcess.length} refilled accounts...`
            );

            /* Set target for refilled sends */
            resetProgress();
            setTarget(refilledToProcess.length);

            /* Process using same mode as phase 1 */
            phase2Results =
              data.mode === "single"
                ? await processSingle(refilledToProcess, data)
                : await processBatch(refilledToProcess, data);
          }
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

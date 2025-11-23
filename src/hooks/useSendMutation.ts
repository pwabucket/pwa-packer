import { usePassword } from "./usePassword";
import {
  chunkArrayGenerator,
  delayForSeconds,
  getPrivateKey,
} from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type {
  Account,
  SendResult,
  SendStats,
  ValidationResult,
} from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { WalletReader, type UsdtTokenContract } from "../lib/WalletReader";
import { ethers } from "ethers";
import {
  BASE_GAS_PRICE,
  GAS_LIMITS_TRANSFER,
  USDT_DECIMALS,
} from "../lib/transaction";

interface SendMutationData {
  accounts: Account[];
  amount: string;
  difference: string;
  delay: number;
  mode: "single" | "batch";
  gasLimit: "average" | "fast" | "instant";
  targetCharacters: string[];
  validate: boolean;
}

interface PreparedAccount {
  status: boolean;
  skipped?: boolean;
  account: Account;
  balance: number;
  amount: number;
  amountNeeded?: number;
  error?: unknown;
}

interface RefillTransaction {
  from: Account;
  to: Account;
  amount: number;
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
  ): Promise<{ hasBalance: boolean; balance: number }> => {
    const reader = new WalletReader(account.walletAddress);
    const balance = await reader.getUSDTBalance();

    console.log(
      `USDT Balance for ${account.title} (${account.walletAddress}): ${balance}`
    );

    return {
      hasBalance: balance >= 1,
      balance: Math.floor(balance),
    };
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
    amount: number;
    receiver: string;
    data: SendMutationData;
  }) => {
    const amountStr = amount.toFixed(2);
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
        amount: parseFloat(amountStr),
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
        amount: parseFloat(amountStr),
        hashResult,
        result: null,
      };
    }
  };

  /**
   * Send USDT directly (without hash targeting) for refill operations
   */
  const sendUSDTDirect = async (from: Account, to: string, amount: number) => {
    const amountStr = amount.toFixed(2);
    const reader = new WalletReader(from.walletAddress);
    const provider = reader.getProvider();
    const usdtToken = reader.getUsdtTokenContract();

    const privateKey = await getPrivateKey(from.id, password);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(
      `Refilling: Sending $${amountStr} USDT from ${from.title} (${from.walletAddress}) to ${to}`
    );

    const connectedToken = usdtToken.connect(wallet) as UsdtTokenContract;
    const tx = await connectedToken.transfer(
      to,
      ethers.parseUnits(amountStr, USDT_DECIMALS),
      {
        gasLimit: GAS_LIMITS_TRANSFER["fast"],
        gasPrice: BASE_GAS_PRICE,
      }
    );

    const result = await tx.wait();
    console.log(`Refill Result: ${from.title}`, result);

    return result;
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
    applyDifference: boolean = true
  ): Promise<PreparedAccount> => {
    try {
      /* Check balance */
      const { hasBalance, balance } = await checkBalance(account);
      if (!hasBalance) {
        return {
          status: false,
          skipped: true,
          account,
          balance,
          amount: 0,
          amountNeeded: 0,
          error: "Insufficient balance",
        };
      }

      const maxAmount = Math.floor(parseFloat(data.amount));

      let amount: number;
      let amountNeeded: number;

      if (applyDifference) {
        /* Initial phase: Apply difference for randomization */
        const maxDifference = Math.floor(parseFloat(data.difference));
        const minAmount = maxAmount - maxDifference;

        /* If balance >= minAmount, send random amount between minAmount and maxAmount */
        /* If balance < minAmount, send whatever balance is available */
        if (balance >= minAmount) {
          const randomAmount = Math.random() * maxDifference + minAmount;
          /* Floor to whole number (no decimals) */
          amount = Math.floor(Math.min(randomAmount, balance));
        } else {
          amount = Math.floor(balance);
        }

        /* Calculate how much is needed to reach maxAmount */
        /* For accounts with balance < minAmount: 0 */
        amountNeeded = balance >= minAmount ? maxAmount - amount : 0;
      } else {
        /* Refilled accounts: Send whatever balance they have, but cap at maxAmount */
        amount = Math.floor(Math.min(balance, maxAmount));
        amountNeeded = 0;
      }

      return {
        status: true,
        skipped: false,
        account,
        amount,
        balance,
        amountNeeded,
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
        amount: 0,
        balance: 0,
        amountNeeded: 0,
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
        result: txResult.result,
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
      (sum, r) => sum + r.amount,
      0
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
  const getAmounts = async (
    accounts: Account[],
    data: SendMutationData,
    applyDifference: boolean = true
  ) => {
    const preparedAccounts = [];
    for (const chunk of chunkArrayGenerator(accounts, 10)) {
      const chunkResults = await Promise.all(
        chunk.map((account) => prepareAccount(account, data, applyDifference))
      );
      preparedAccounts.push(...chunkResults);
    }
    return preparedAccounts;
  };

  /**
   * Plan refill transactions to fill skipped accounts
   */
  const planRefillTransactions = (
    donorAccounts: PreparedAccount[],
    recipientAccounts: PreparedAccount[],
    maxAmount: number
  ): RefillTransaction[] => {
    const transactions: RefillTransaction[] = [];

    /* Filter donors who have amountNeeded > 0 */
    const availableDonors = donorAccounts
      .filter((acc) => acc.amountNeeded && acc.amountNeeded > 0)
      .map((acc) => ({ ...acc, remainingToGive: acc.amountNeeded! }));

    /* Process each recipient */
    for (const recipient of recipientAccounts) {
      let needed = maxAmount - recipient.balance;

      for (const donor of availableDonors) {
        if (donor.remainingToGive <= 0 || needed <= 0) continue;

        const transferAmount = Math.min(donor.remainingToGive, needed);

        transactions.push({
          from: donor.account,
          to: recipient.account,
          amount: transferAmount,
        });

        donor.remainingToGive -= transferAmount;
        needed -= transferAmount;

        if (needed <= 0) break;
      }
    }

    return transactions;
  };

  /**
   * Execute refill transactions
   */
  const executeRefillTransactions = async (
    transactions: RefillTransaction[]
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const tx of transactions) {
      try {
        await sendUSDTDirect(tx.from, tx.to.walletAddress, tx.amount);
        success++;
      } catch (error) {
        console.error(
          `Refill failed from ${tx.from.title} to ${tx.to.title}:`,
          error
        );
        failed++;
      }
    }

    return { success, failed };
  };

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["sendFunds"],
    mutationFn: async (data: SendMutationData) => {
      /* Reset progress */
      resetProgress();

      /* Max amount to send */
      const maxAmount = Math.floor(parseFloat(data.amount));

      /* PHASE 1: Prepare all accounts and determine amounts */
      console.log("=== PHASE 1: Preparing accounts ===");
      const preparedAccounts = await getAmounts(data.accounts, data);

      /* Filter accounts that are ready to send */
      const accountsToProcess = preparedAccounts.filter(
        (acc) => acc.status && !acc.skipped
      );

      /* Filter skipped accounts for refill */
      const skippedAccounts = preparedAccounts.filter((acc) => acc.skipped);

      console.log(`Accounts to process: ${accountsToProcess.length}`);
      console.log(`Skipped accounts: ${skippedAccounts.length}`);

      /* Set initial target (will be updated) */
      const totalTransactions =
        accountsToProcess.length + skippedAccounts.length;
      setTarget(totalTransactions);

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

        console.log(`Planned ${refillTransactions.length} refill transactions`);

        if (refillTransactions.length > 0) {
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
        const refilledPrepared = await getAmounts(
          skippedAccountList,
          data,
          false
        );

        /* Filter accounts that now have balance to send */
        const refilledToProcess = refilledPrepared.filter(
          (acc) => acc.status && !acc.skipped
        );

        console.log(
          `Refilled accounts ready to send: ${refilledToProcess.length}`
        );

        /* Process using same mode as phase 1 */
        phase2Results =
          data.mode === "single"
            ? await processSingle(refilledToProcess, data)
            : await processBatch(refilledToProcess, data);
      }

      /* Combine all results */
      const allResults = [...phase1Results, ...phase2Results];

      /* Calculate statistics */
      const stats = calculateStats(allResults);

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

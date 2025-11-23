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
import { WalletReader } from "../lib/WalletReader";

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
  balance?: number;
  amount: number;
  amountNeeded?: number;
  error?: unknown;
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
      balance,
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
    data: SendMutationData
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

      const maxDifference = Math.floor(parseFloat(data.difference));
      const maxAmount = Math.floor(parseFloat(data.amount));
      const minAmount = maxAmount - maxDifference;

      // If balance >= minAmount, send random amount between minAmount and maxAmount
      // If balance < minAmount, send whatever balance is available
      let amount: number;
      if (balance >= minAmount) {
        const randomAmount = Math.random() * maxDifference + minAmount;
        // Floor to whole number (no decimals)
        amount = Math.floor(Math.min(randomAmount, balance));
      } else {
        amount = Math.floor(balance);
      }

      // Calculate how much is needed to reach maxAmount
      // For accounts with balance < minAmount: 0
      // For others: difference between maxAmount and amount sent
      const amountNeeded = balance >= minAmount ? maxAmount - amount : 0;

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
  const getAmounts = async (accounts: Account[], data: SendMutationData) => {
    const preparedAccounts = [];
    for (const chunk of chunkArrayGenerator(accounts, 10)) {
      const chunkResults = await Promise.all(
        chunk.map((account) => prepareAccount(account, data))
      );
      preparedAccounts.push(...chunkResults);
    }
    return preparedAccounts;
  };

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["sendFunds"],
    mutationFn: async (data: SendMutationData) => {
      resetProgress();
      setTarget(data.accounts.length);

      const preparedAccounts = await getAmounts(data.accounts, data);
      const accountsToProcess = preparedAccounts.filter(
        (acc) => acc.status && !acc.skipped
      );

      const skippedAccounts = preparedAccounts.filter((acc) => acc.skipped);

      /* Update target to only accounts that will be processed */
      setTarget(accountsToProcess.length);

      /* Process accounts based on mode */
      const results =
        data.mode === "single"
          ? await processSingle(accountsToProcess, data)
          : await processBatch(accountsToProcess, data);

      /* Calculate statistics */
      const stats = calculateStats(results);

      return { results, ...stats };
    },
  });

  return { mutation, progress, target };
};

export { useSendMutation };

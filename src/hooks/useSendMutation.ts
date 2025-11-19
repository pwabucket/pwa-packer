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
  delay: number;
  mode: "single" | "batch";
  gasLimit: "average" | "fast" | "instant";
  targetCharacters: string[];
  validate: boolean;
}

const useSendMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const password = usePassword()!;

  /**
   * Check if account has sufficient balance
   */
  const checkBalance = async (
    account: Account,
    amount: string
  ): Promise<{ hasBalance: boolean; balance: number }> => {
    const reader = new WalletReader(account.walletAddress);
    const balance = await reader.getUSDTBalance();

    console.log(
      `USDT Balance for ${account.title} (${account.walletAddress}): ${balance}`
    );

    return {
      hasBalance: balance >= parseFloat(amount),
      balance,
    };
  };

  /**
   * Generate and submit transaction
   */
  const sendTransaction = async (
    account: Account,
    receiver: string,
    data: SendMutationData
  ) => {
    const reader = new WalletReader(account.walletAddress);
    const privateKey = await getPrivateKey(account.id, password);
    const hashMaker = new HashMaker({
      privateKey,
      provider: reader.getProvider(),
    });

    await hashMaker.initialize();

    console.log(
      `Sending $${data.amount} from ${account.title} (${
        account.walletAddress
      }) to ${receiver} targeting [${data.targetCharacters.join(", ")}]`
    );

    /* Generate transaction */
    const hashResult = (await hashMaker.generateTransaction({
      amount: data.amount,
      gasLimit: data.gasLimit,
      targetCharacters: data.targetCharacters,
      receiver,
    })) as HashResult;

    console.log(`Hash Result: ${account.title}`, hashResult);

    try {
      /* Submit transaction */
      const result = await hashMaker.submitTransferTransaction(hashResult);

      console.log(`Submit Result: ${account.title}`, result);
      return { hashResult, result };
    } catch (error) {
      console.error(
        `Transaction submission failed for ${account.title} (${account.walletAddress}):`,
        error
      );
      return { hashResult, result: null };
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

  /**
   * Process a single account send operation
   */
  const processAccount = async (
    account: Account,
    data: SendMutationData
  ): Promise<SendResult> => {
    const receiver = account.depositAddress;
    let hashResult: HashResult | null = null;

    try {
      /* Check balance */
      const { hasBalance } = await checkBalance(account, data.amount);
      if (!hasBalance) {
        return {
          status: false,
          skipped: true,
          account,
          receiver,
          hashResult,
        };
      }

      /* Send transaction */
      const txResult = await sendTransaction(account, receiver, data);
      hashResult = txResult.hashResult;

      /* Validate if enabled */
      let validation: ValidationResult | null = null;
      if (data.validate && account.url) {
        validation = await validateTransaction(account, data.delay);
      }

      return {
        status: true,
        account,
        hashResult,
        receiver,
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
  const calculateStats = (results: SendResult[], amount: string): SendStats => {
    const successfulSends = results.filter(
      (r) => r.status && !r.skipped
    ).length;
    const successfulValidations = results.filter(
      (r) => r.status && r.validation?.activity
    ).length;
    const totalAmountSent = successfulSends * parseFloat(amount);

    return {
      totalAccounts: results.length,
      successfulSends,
      successfulValidations,
      totalAmountSent,
    };
  };

  /**
   * Process accounts in single mode (sequential)
   */
  const processSingle = async (
    accounts: Account[],
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
    accounts: Account[],
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

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["sendFunds"],
    mutationFn: async (data: SendMutationData) => {
      resetProgress();
      setTarget(data.accounts.length);

      /* Process accounts based on mode */
      const results =
        data.mode === "single"
          ? await processSingle(data.accounts, data)
          : await processBatch(data.accounts, data);

      /* Calculate statistics */
      const stats = calculateStats(results, data.amount);

      return { results, ...stats };
    },
  });

  return { mutation, progress, target };
};

export { useSendMutation };

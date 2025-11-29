import { useAppStore } from "../store/useAppStore";
import {
  BASE_GAS_PRICE,
  GAS_LIMITS_TRANSFER,
  USDT_DECIMALS,
} from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { chunkArrayGenerator, getPrivateKey } from "../lib/utils";
import type { Account } from "../types";
import { useProgress } from "./useProgress";
import { WalletReader, type UsdtTokenContract } from "../lib/WalletReader";
import Decimal from "decimal.js";

interface WithdrawMutationParams {
  accounts: Account[];
  amount?: string;
  address: string;
}

interface WithdrawalResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
  amount?: number;
  result?: ethers.ContractTransactionReceipt | null;
  error?: unknown;
}

interface WithdrawalStats {
  totalAccounts: number;
  successfulSends: number;
  totalSentValue: Decimal;
}

const useWithdrawalMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const password = useAppStore((state) => state.password)!;

  /**
   * Determine the amount to withdraw from an account
   * If no amount specified, returns the entire balance
   */
  const determineWithdrawalAmount = async (
    account: Account,
    requestedAmount?: string
  ): Promise<{ amount: string; balance: Decimal } | null> => {
    const reader = new WalletReader(account.walletAddress);
    const balance = await reader.getUSDTBalance();

    /* Use entire balance if no amount specified */
    if (!requestedAmount || requestedAmount.trim() === "") {
      console.log(
        `Balance of ${account.title} (${
          account.walletAddress
        }): ${balance.toString()} USDT`
      );
      return { amount: balance.toString(), balance };
    }

    /* Check if sufficient balance */
    const amountValue = new Decimal(requestedAmount);
    if (balance.lt(amountValue)) {
      return null; /* Insufficient balance */
    }

    return { amount: requestedAmount, balance };
  };

  /**
   * Execute USDT withdrawal for a single account
   */
  const executeWithdrawal = async (
    account: Account,
    receiver: string,
    amount: string
  ): Promise<ethers.ContractTransactionReceipt | null> => {
    const reader = new WalletReader(account.walletAddress);
    const provider = reader.getProvider();
    const usdtToken = reader.getUsdtTokenContract();

    const privateKey = await getPrivateKey(account.id, password);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(
      `Withdrawing ${amount} USDT from ${account.title} (${account.walletAddress}) to ${receiver}`
    );

    /* Transfer USDT */
    const connectedToken = usdtToken.connect(wallet) as UsdtTokenContract;
    const tx = await connectedToken.transfer(
      receiver,
      ethers.parseUnits(amount, USDT_DECIMALS),
      {
        gasLimit: GAS_LIMITS_TRANSFER["fast"],
        gasPrice: BASE_GAS_PRICE,
      }
    );

    /* Wait for confirmation */
    const result = await tx.wait();
    console.log(
      `Withdrawal successful for ${account.title} (${account.walletAddress}):`,
      result
    );

    return result;
  };

  /**
   * Process withdrawal for a single account
   */
  const processWithdrawal = async (
    account: Account,
    receiver: string,
    requestedAmount?: string
  ): Promise<WithdrawalResult> => {
    try {
      /* Determine amount */
      const withdrawalInfo = await determineWithdrawalAmount(
        account,
        requestedAmount
      );

      /* Skip if insufficient balance */
      if (!withdrawalInfo) {
        return {
          status: false,
          skipped: true,
          account,
        };
      }

      /* Execute withdrawal */
      const result = await executeWithdrawal(
        account,
        receiver,
        withdrawalInfo.amount
      );

      return {
        status: true,
        account,
        amount: parseFloat(withdrawalInfo.amount),
        result,
      };
    } catch (error) {
      console.error(
        `Failed to send from account ${account.title} (${account.walletAddress}):`,
        error
      );

      return {
        status: false,
        account,
        error,
      };
    }
  };

  /**
   * Process withdrawals in parallel chunks with rate limiting
   */
  const processWithdrawalsInChunks = async (
    accounts: Account[],
    receiver: string,
    amount?: string,
    chunkSize: number = 10
  ): Promise<WithdrawalResult[]> => {
    const results: WithdrawalResult[] = [];

    for (const chunk of chunkArrayGenerator(accounts, chunkSize)) {
      const chunkResults = await Promise.all(
        chunk.map(async (account) => {
          const result = await processWithdrawal(account, receiver, amount);
          incrementProgress();
          return result;
        })
      );

      results.push(...chunkResults);
    }

    return results;
  };

  /**
   * Calculate statistics from withdrawal results
   */
  const calculateStats = (results: WithdrawalResult[]): WithdrawalStats => {
    const successfulSends = results.filter(
      (r) => r.status && !r.skipped
    ).length;
    const totalSentValue = results
      .filter((r) => r.status && r.amount)
      .reduce((sum, r) => sum.plus(new Decimal(r.amount || 0)), new Decimal(0));

    return {
      totalAccounts: results.length,
      successfulSends,
      totalSentValue,
    };
  };

  const mutation = useMutation({
    mutationKey: ["withdrawal"],
    mutationFn: async (data: WithdrawMutationParams) => {
      resetProgress();
      setTarget(data.accounts.length);

      /* Process all withdrawals */
      const results = await processWithdrawalsInChunks(
        data.accounts,
        data.address,
        data.amount
      );

      /* Calculate statistics */
      const stats = calculateStats(results);

      return { results, ...stats };
    },
  });

  return { mutation, target, progress };
};

export { useWithdrawalMutation };

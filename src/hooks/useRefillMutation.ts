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
import { WalletReader } from "../lib/WalletReader";

interface RefillMutationParams {
  accounts: Account[];
  amount: string;
}

interface RefillItem {
  account: Account;
  difference: number;
}

interface RefillTodo {
  from: Account;
  to: Account;
  amount: number;
}

interface RefillResult {
  status: boolean;
  task: RefillTodo;
  result?: ethers.ContractTransactionReceipt | null;
  error?: unknown;
}

const useRefillMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const password = useAppStore((state) => state.password)!;

  /** Form */

  const mutation = useMutation({
    mutationKey: ["refill"],
    mutationFn: async (data: RefillMutationParams) => {
      /* Reset Progress */
      resetProgress();

      /* Total Accounts */
      let totalTransactions = 0;

      /* Successful Sends Counter */
      let successfulSends = 0;

      /* Total Sent Value */
      let totalSentValue = 0;

      /* Refill Todo List */
      const todo: RefillTodo[] = [];

      /* Refill Results */
      const results: RefillResult[] = [];

      /* Required Balance */
      const requiredBalance = parseFloat(data.amount);

      /* Analyze Accounts */
      const excessFundsAccounts: RefillItem[] = [];
      const insufficientFundsAccounts: RefillItem[] = [];

      await Promise.all(
        data.accounts.map(async (account) => {
          const reader = new WalletReader(account.walletAddress);
          const balance = await reader.getUSDTBalance();

          if (balance > requiredBalance) {
            excessFundsAccounts.push({
              account,
              difference: balance - requiredBalance,
            });
          } else if (balance < requiredBalance) {
            insufficientFundsAccounts.push({
              account,
              difference: requiredBalance - balance,
            });
          }
        })
      );

      console.log("Excess funds accounts:", excessFundsAccounts);
      console.log("Insufficient funds accounts:", insufficientFundsAccounts);

      for (const item of insufficientFundsAccounts) {
        let needed = item.difference;

        for (const excessItem of excessFundsAccounts) {
          if (excessItem.difference <= 0) continue;

          const transferAmount = Math.min(needed, excessItem.difference);
          todo.push({
            from: excessItem.account,
            to: item.account,
            amount: transferAmount,
          });

          excessItem.difference -= transferAmount;
          needed -= transferAmount;

          if (needed <= 0) break;
        }
      }

      /* Set Max Progress */
      setTarget(todo.length);

      /* Total Transactions */
      totalTransactions = todo.length;

      for (const chunk of chunkArrayGenerator(todo, 10)) {
        await Promise.all(
          chunk.map(async (task) => {
            try {
              const reader = new WalletReader(task.from.walletAddress);
              const provider = reader.getProvider();
              const usdtToken = reader.getUsdtTokenContract();

              const privateKey = await getPrivateKey(task.from.id, password);
              const wallet = new ethers.Wallet(privateKey, provider);

              console.log(
                `Refilling ${task.to.title} (${task.to.walletAddress}) with ${task.amount} USDT from ${task.from.title} (${task.from.walletAddress})`
              );

              const connectedToken = usdtToken.connect(
                wallet
              ) as typeof usdtToken;

              const txGasPrice = BASE_GAS_PRICE;
              const txGasLimit = GAS_LIMITS_TRANSFER["fast"];

              const tx = await connectedToken.transfer(
                task.to.walletAddress,
                ethers.parseUnits(task.amount.toString(), USDT_DECIMALS),
                {
                  gasLimit: txGasLimit,
                  gasPrice: txGasPrice,
                }
              );

              /* Wait for Transaction to be Mined */
              const result = await tx.wait();

              /* Log Result */
              console.log(result);

              totalSentValue += task.amount;
              successfulSends++;

              results.push({
                status: true,
                task,
                result,
              });
            } catch (error) {
              console.error(`Failed to refill account ${task.to.id}:`, error);

              results.push({
                status: false,
                task,
                error,
              });
            } finally {
              incrementProgress();
            }
          })
        );
      }

      return { results, successfulSends, totalTransactions, totalSentValue };
    },
  });

  return { mutation, target, progress };
};

export { useRefillMutation };

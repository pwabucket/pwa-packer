import { useAppStore } from "../store/useAppStore";
import {
  BASE_GAS_PRICE,
  GAS_LIMIT_NATIVE,
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
  token: "bnb" | "usdt";
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
  result?: ethers.TransactionReceipt | null;
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

      const requiredGasInEther = parseFloat(
        ethers.formatEther(BASE_GAS_PRICE * GAS_LIMIT_NATIVE)
      );

      /* Fetch balances in chunks to avoid rate limiting */
      for (const chunk of chunkArrayGenerator(data.accounts, 20)) {
        await Promise.all(
          chunk.map(async (account) => {
            const reader = new WalletReader(account.walletAddress);
            const balance =
              data.token === "bnb"
                ? await reader.getBNBBalance()
                : await reader.getUSDTBalance();

            let balanceValue = balance;

            if (data.token === "bnb") {
              balanceValue = balance - requiredGasInEther;
            }

            if (balanceValue > requiredBalance) {
              excessFundsAccounts.push({
                account,
                difference: balanceValue - requiredBalance,
              });
            } else if (balanceValue < requiredBalance) {
              insufficientFundsAccounts.push({
                account,
                difference: requiredBalance - balanceValue,
              });
            }
          })
        );
      }

      console.log("Excess funds accounts:", excessFundsAccounts);
      console.log("Insufficient funds accounts:", insufficientFundsAccounts);

      for (const item of insufficientFundsAccounts) {
        let needed = item.difference;

        for (const excessItem of excessFundsAccounts) {
          if (excessItem.difference <= 0) continue;

          let transferAmount = Math.min(needed, excessItem.difference);

          /* For BNB transfers, reserve gas for this specific transfer */
          if (data.token === "bnb") {
            /* Make sure we have enough to cover both the transfer amount AND gas */
            const maxTransferableAmount =
              excessItem.difference - requiredGasInEther;
            if (maxTransferableAmount <= 0) continue;
            transferAmount = Math.min(transferAmount, maxTransferableAmount);
          }

          if (transferAmount <= 0) continue;

          todo.push({
            from: excessItem.account,
            to: item.account,
            amount: transferAmount,
          });

          /* For BNB, account for both the transfer and gas cost */
          const totalCost =
            data.token === "bnb"
              ? transferAmount + requiredGasInEther
              : transferAmount;

          excessItem.difference = excessItem.difference - totalCost;
          needed = needed - transferAmount;

          if (needed <= 0) break;
        }
      }

      /* Set Max Progress */
      setTarget(todo.length);

      /* Total Transactions */
      totalTransactions = todo.length;

      /* Group tasks by sender to avoid nonce conflicts */
      const tasksBySender = new Map<Account, RefillTodo[]>();
      for (const task of todo) {
        const sender = task.from;
        if (!tasksBySender.has(sender)) {
          tasksBySender.set(sender, []);
        }
        tasksBySender.get(sender)!.push(task);
      }

      /* Process each sender's tasks sequentially, but process different senders in parallel */
      const senderGroups = Array.from(tasksBySender.entries());

      for (const chunk of chunkArrayGenerator(senderGroups, 10)) {
        await Promise.all(
          chunk.map(async ([sender, senderTasks]) => {
            const reader = new WalletReader(sender.walletAddress);
            const provider = reader.getProvider();
            const usdtToken = reader.getUsdtTokenContract();

            const privateKey = await getPrivateKey(sender.id, password);
            const wallet = new ethers.Wallet(privateKey, provider);

            const connectedToken = usdtToken.connect(
              wallet
            ) as typeof usdtToken;

            /* Process this sender's tasks sequentially */
            for (const task of senderTasks) {
              /* Use toFixed(8) for consistent 8 decimal precision */
              const amountStr = task.amount.toFixed(8);
              try {
                console.log(
                  `Refilling ${task.to.title} (${
                    task.to.walletAddress
                  }) with ${amountStr} ${data.token.toUpperCase()} from ${
                    task.from.title
                  } (${task.from.walletAddress})`
                );

                let tx: ethers.TransactionResponse | null = null;

                if (data.token === "bnb") {
                  tx = await wallet.sendTransaction({
                    to: task.to.walletAddress,
                    value: ethers.parseEther(amountStr),
                    gasPrice: BASE_GAS_PRICE,
                    gasLimit: GAS_LIMIT_NATIVE,
                  });
                } else {
                  tx = await connectedToken.transfer(
                    task.to.walletAddress,
                    ethers.parseUnits(amountStr, USDT_DECIMALS),
                    {
                      gasPrice: BASE_GAS_PRICE,
                      gasLimit: GAS_LIMITS_TRANSFER["fast"],
                    }
                  );
                }

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
                console.error(
                  `Failed to refill account ${task.to.title} (${task.to.walletAddress}) from ${task.from.title} (${task.from.walletAddress}):`,
                  error
                );

                results.push({
                  status: false,
                  task,
                  error,
                });
              } finally {
                incrementProgress();
              }
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

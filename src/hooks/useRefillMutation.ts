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
import { WalletReader, type UsdtTokenContract } from "../lib/WalletReader";

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

interface RefillStats {
  successfulSends: number;
  totalTransactions: number;
  totalSentValue: number;
}

const useRefillMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const password = useAppStore((state) => state.password)!;

  /**
   * Fetch account balance for given token
   */
  const fetchBalance = async (
    account: Account,
    token: "bnb" | "usdt"
  ): Promise<number> => {
    const reader = new WalletReader(account.walletAddress);
    return token === "bnb"
      ? await reader.getBNBBalance()
      : await reader.getUSDTBalance();
  };

  /**
   * Analyze accounts and categorize into excess/insufficient funds
   */
  const analyzeAccounts = async (
    accounts: Account[],
    token: "bnb" | "usdt",
    requiredBalance: number,
    requiredGasInEther: number
  ): Promise<{
    excessFundsAccounts: RefillItem[];
    insufficientFundsAccounts: RefillItem[];
  }> => {
    const excessFundsAccounts: RefillItem[] = [];
    const insufficientFundsAccounts: RefillItem[] = [];

    /* Fetch balances in chunks to avoid rate limiting */
    for (const chunk of chunkArrayGenerator(accounts, 10)) {
      await Promise.all(
        chunk.map(async (account) => {
          const balance = await fetchBalance(account, token);

          /* Adjust balance for BNB (reserve gas) */
          const balanceValue =
            token === "bnb" ? balance - requiredGasInEther : balance;

          /* Categorize account */
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

    return { excessFundsAccounts, insufficientFundsAccounts };
  };

  /**
   * Calculate optimal transfer amount considering gas costs
   */
  const calculateTransferAmount = (
    needed: number,
    available: number,
    token: "bnb" | "usdt",
    requiredGasInEther: number
  ): number => {
    let transferAmount = Math.min(needed, available);

    /* For BNB, reserve gas for the transfer */
    if (token === "bnb") {
      const maxTransferable = available - requiredGasInEther;
      if (maxTransferable <= 0) return 0;
      transferAmount = Math.min(transferAmount, maxTransferable);
    }

    return transferAmount > 0 ? transferAmount : 0;
  };

  /**
   * Plan refill transactions by matching excess with insufficient accounts
   */
  const planRefillTransactions = (
    excessFundsAccounts: RefillItem[],
    insufficientFundsAccounts: RefillItem[],
    token: "bnb" | "usdt",
    requiredGasInEther: number
  ): RefillTodo[] => {
    const todo: RefillTodo[] = [];

    for (const insufficientItem of insufficientFundsAccounts) {
      let needed = insufficientItem.difference;

      for (const excessItem of excessFundsAccounts) {
        if (excessItem.difference <= 0 || needed <= 0) continue;

        /* Calculate transfer amount */
        const transferAmount = calculateTransferAmount(
          needed,
          excessItem.difference,
          token,
          requiredGasInEther
        );

        if (transferAmount <= 0) continue;

        /* Add to todo list */
        todo.push({
          from: excessItem.account,
          to: insufficientItem.account,
          amount: transferAmount,
        });

        /* Update remaining amounts */
        const totalCost =
          token === "bnb"
            ? transferAmount + requiredGasInEther
            : transferAmount;

        excessItem.difference -= totalCost;
        needed -= transferAmount;
      }
    }

    return todo;
  };

  /**
   * Group tasks by sender to avoid nonce conflicts
   */
  const groupTasksBySender = (
    tasks: RefillTodo[]
  ): Map<Account, RefillTodo[]> => {
    const tasksBySender = new Map<Account, RefillTodo[]>();

    for (const task of tasks) {
      if (!tasksBySender.has(task.from)) {
        tasksBySender.set(task.from, []);
      }
      tasksBySender.get(task.from)!.push(task);
    }

    return tasksBySender;
  };

  /**
   * Execute a single transfer transaction
   */
  const executeTransfer = async (
    task: RefillTodo,
    token: "bnb" | "usdt",
    wallet: ethers.Wallet,
    usdtToken?: UsdtTokenContract
  ): Promise<ethers.TransactionReceipt | null> => {
    const amountStr = task.amount.toFixed(8);

    console.log(
      `Refilling ${task.to.title} (${
        task.to.walletAddress
      }) with ${amountStr} ${token.toUpperCase()} from ${task.from.title} (${
        task.from.walletAddress
      })`
    );

    let tx: ethers.TransactionResponse;

    if (token === "bnb") {
      tx = await wallet.sendTransaction({
        to: task.to.walletAddress,
        value: ethers.parseEther(amountStr),
        gasPrice: BASE_GAS_PRICE,
        gasLimit: GAS_LIMIT_NATIVE,
      });
    } else {
      tx = await usdtToken!.transfer(
        task.to.walletAddress,
        ethers.parseUnits(amountStr, USDT_DECIMALS),
        {
          gasPrice: BASE_GAS_PRICE,
          gasLimit: GAS_LIMITS_TRANSFER["fast"],
        }
      );
    }

    return await tx.wait();
  };

  /**
   * Process all tasks for a single sender sequentially
   */
  const processSenderTasks = async (
    sender: Account,
    tasks: RefillTodo[],
    token: "bnb" | "usdt"
  ): Promise<RefillResult[]> => {
    const results: RefillResult[] = [];
    const reader = new WalletReader(sender.walletAddress);
    const provider = reader.getProvider();
    const usdtToken = reader.getUsdtTokenContract();

    const privateKey = await getPrivateKey(sender.id, password);
    const wallet = new ethers.Wallet(privateKey, provider);
    const connectedToken = usdtToken.connect(wallet) as UsdtTokenContract;

    /* Process tasks sequentially to avoid nonce conflicts */
    for (const task of tasks) {
      try {
        const result = await executeTransfer(
          task,
          token,
          wallet,
          connectedToken
        );

        console.log(
          `Refill successful for ${task.to.title} (${task.to.walletAddress}) from ${task.from.title} (${task.from.walletAddress}):`,
          result
        );

        results.push({
          status: true,
          task,
          result,
        });
      } catch (error) {
        console.error(
          `Failed to refill ${task.to.title} (${task.to.walletAddress}) from ${task.from.title} (${task.from.walletAddress}):`,
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

    return results;
  };

  /**
   * Execute all refill transactions in parallel chunks
   */
  const executeRefillTransactions = async (
    tasksBySender: Map<Account, RefillTodo[]>,
    token: "bnb" | "usdt"
  ): Promise<RefillResult[]> => {
    const results: RefillResult[] = [];
    const senderGroups = Array.from(tasksBySender.entries());

    /* Process senders in parallel chunks */
    for (const chunk of chunkArrayGenerator(senderGroups, 10)) {
      const chunkResults = await Promise.all(
        chunk.map(([sender, tasks]) => processSenderTasks(sender, tasks, token))
      );

      results.push(...chunkResults.flat());

      /* Small delay between chunks to avoid rate limiting */
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return results;
  };

  /**
   * Calculate statistics from results
   */
  const calculateStats = (results: RefillResult[]): RefillStats => {
    const successfulSends = results.filter((r) => r.status).length;
    const totalSentValue = results
      .filter((r) => r.status)
      .reduce((sum, r) => sum + r.task.amount, 0);

    return {
      successfulSends,
      totalTransactions: results.length,
      totalSentValue,
    };
  };

  const mutation = useMutation({
    mutationKey: ["refill"],
    mutationFn: async (data: RefillMutationParams) => {
      resetProgress();
      setTarget(0);

      const requiredBalance = parseFloat(data.amount);
      const requiredGasInEther = parseFloat(
        ethers.formatEther(BASE_GAS_PRICE * GAS_LIMIT_NATIVE)
      );

      /* Step 1: Analyze accounts */
      const { excessFundsAccounts, insufficientFundsAccounts } =
        await analyzeAccounts(
          data.accounts,
          data.token,
          requiredBalance,
          requiredGasInEther
        );

      /* Step 2: Plan transactions */
      const todo = planRefillTransactions(
        excessFundsAccounts,
        insufficientFundsAccounts,
        data.token,
        requiredGasInEther
      );

      setTarget(todo.length);

      /* Step 3: Group by sender */
      const tasksBySender = groupTasksBySender(todo);

      /* Step 4: Execute transactions */
      const results = await executeRefillTransactions(
        tasksBySender,
        data.token
      );

      /* Step 5: Calculate statistics */
      const stats = calculateStats(results);

      return { results, ...stats };
    },
  });

  return { mutation, target, progress };
};

export { useRefillMutation };

import { useAppStore } from "../store/useAppStore";
import {
  BASE_GAS_PRICE,
  GAS_LIMIT_NATIVE,
  GAS_LIMITS_TRANSFER,
  USDT_DECIMALS,
} from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import {
  chunkArrayGenerator,
  getPrivateKey,
  truncateDecimals,
} from "../lib/utils";
import type { Account } from "../types";
import { useProgress } from "./useProgress";
import { WalletReader, type UsdtTokenContract } from "../lib/WalletReader";

interface RefillMutationParams {
  accounts: Account[];
  token: "bnb" | "usdt";
  amount: string;
  greedy: boolean;
}

interface RefillItem {
  account: Account;
  balance: number /* Actual balance */;
  difference: number /* Positive for excess, negative for insufficient */;
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
    requiredBalance: number
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

          /* Don't deduct gas here - it's handled per-transaction in calculateTransferAmount */
          const balanceValue = balance;

          /* Categorize account */
          if (balanceValue > requiredBalance) {
            excessFundsAccounts.push({
              account,
              balance: balanceValue,
              difference: balanceValue - requiredBalance,
            });
          } else if (balanceValue < requiredBalance) {
            insufficientFundsAccounts.push({
              account,
              balance: balanceValue,
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
   * Note: For BNB, when a donor sends, they need gas for that send transaction.
   * The 'available' amount is the donor's difference (excess or balance), which is already
   * gas-adjusted in analyzeAccounts. But EACH send needs gas, so we deduct per transaction.
   */
  const calculateTransferAmount = (
    needed: number,
    available: number,
    token: "bnb" | "usdt",
    requiredGasInEther: number
  ): number => {
    let transferAmount = Math.min(needed, available);

    /* For BNB, each send transaction consumes gas from the sender */
    if (token === "bnb") {
      /* The sender needs gas to execute this transfer */
      const maxTransferable = available - requiredGasInEther;
      if (maxTransferable <= 0) return 0;
      transferAmount = Math.min(transferAmount, maxTransferable);
    }

    return transferAmount > 0 ? transferAmount : 0;
  };

  /**
   * Plan refill transactions by matching excess with insufficient accounts
   * In greedy mode, insufficient accounts can also donate to prioritize filling some accounts completely
   */
  const planRefillTransactions = (
    token: "bnb" | "usdt",
    greedy: boolean = false,
    excessFundsAccounts: RefillItem[],
    insufficientFundsAccounts: RefillItem[],
    requiredGasInEther: number
  ): RefillTodo[] => {
    const todo: RefillTodo[] = [];

    if (greedy) {
      /* GREEDY MODE: Prioritize filling accounts completely */
      /* All accounts can be donors in greedy mode */
      /* Insufficient accounts can donate their balance (even if below target) */
      const allPotentialDonors = [
        ...excessFundsAccounts,
        ...insufficientFundsAccounts.map((item) => ({
          account: item.account,
          balance: item.balance,
          difference: item.balance,
        })),
      ];

      /* Track which accounts have already been recipients to prevent draining them */
      const processedRecipients = new Set<string>();

      for (const recipient of insufficientFundsAccounts) {
        let needed = recipient.difference;

        /* Sort donors by available funds (most available first) */
        /* Exclude accounts that have already been filled as recipients */
        const availableDonors = allPotentialDonors
          .filter(
            (d) =>
              d.account.id !== recipient.account.id &&
              !processedRecipients.has(d.account.id)
          )
          .sort((a, b) => b.difference - a.difference);

        for (const donor of availableDonors) {
          if (donor.difference <= 0 || needed <= 0) continue;

          const transferAmount = calculateTransferAmount(
            needed,
            donor.difference,
            token,
            requiredGasInEther
          );

          if (transferAmount <= 0) continue;

          todo.push({
            from: donor.account,
            to: recipient.account,
            amount: transferAmount,
          });

          const totalCost =
            token === "bnb"
              ? transferAmount + requiredGasInEther
              : transferAmount;

          donor.difference -= totalCost;
          needed -= transferAmount;
        }

        /* Mark this recipient as processed so it won't be drained by future recipients */
        processedRecipients.add(recipient.account.id);
      }
    } else {
      /* NORMAL MODE: Only excess accounts donate to insufficient accounts */
      /* Sort excess accounts by available funds (most available first) */
      const sortedDonors = [...excessFundsAccounts].sort(
        (a, b) => b.difference - a.difference
      );

      for (const insufficientItem of insufficientFundsAccounts) {
        let needed = insufficientItem.difference;

        for (const excessItem of sortedDonors) {
          if (excessItem.difference <= 0 || needed <= 0) continue;

          const transferAmount = calculateTransferAmount(
            needed,
            excessItem.difference,
            token,
            requiredGasInEther
          );

          if (transferAmount <= 0) continue;

          todo.push({
            from: excessItem.account,
            to: insufficientItem.account,
            amount: transferAmount,
          });

          const totalCost =
            token === "bnb"
              ? transferAmount + requiredGasInEther
              : transferAmount;

          excessItem.difference -= totalCost;
          needed -= transferAmount;
        }
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
    const amountStr = truncateDecimals(task.amount, 8);

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
        await analyzeAccounts(data.accounts, data.token, requiredBalance);

      /* Step 2: Plan transactions */
      const todo = planRefillTransactions(
        data.token,
        data.greedy,
        excessFundsAccounts,
        insufficientFundsAccounts,
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

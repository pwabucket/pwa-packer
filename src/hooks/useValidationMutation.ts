import { useMutation } from "@tanstack/react-query";
import type { Account, Activity } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { chunkArrayGenerator, delayForSeconds } from "../lib/utils";
import Decimal from "decimal.js";

interface ValidationMutationParams {
  accounts: Account[];
  delay?: number;
}

interface ValidationResult {
  status: boolean;
  account: Account;
  activity?: Activity;
  error?: unknown;
}

interface ValidationStats {
  totalAccounts: number;
  activeAccounts: number;
  totalAmount: Decimal;
  availableBalance: Decimal;
}

const useValidationMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  /**
   * Validate a single account
   */
  const validateAccount = async (
    account: Account
  ): Promise<ValidationResult> => {
    /* Skip if no URL */
    if (!account.url) {
      return { status: false, account, error: "No URL provided" };
    }

    try {
      const packer = new Packer(account.url);
      await packer.initialize();
      await packer.getTime();

      /* Check activity */
      const activity = await packer.checkActivity();

      return { status: true, account, activity };
    } catch (error) {
      return { status: false, account, error };
    }
  };

  /**
   * Calculate statistics from validation results
   */
  const calculateStats = (results: ValidationResult[]): ValidationStats => {
    let activeAccounts = 0;
    let totalAmount = new Decimal(0);
    let availableBalance = new Decimal(0);

    for (const result of results) {
      if (result.status && result.activity) {
        /* Count active accounts */
        if (result.activity.activity) {
          activeAccounts++;
          totalAmount = totalAmount.plus(
            new Decimal(result.activity.amount) || new Decimal(0)
          );
        }

        /* Sum available balance */
        availableBalance = availableBalance.plus(
          new Decimal(result.activity.activityBalance) || new Decimal(0)
        );
      }
    }

    return {
      totalAccounts: results.length,
      activeAccounts,
      totalAmount,
      availableBalance,
    };
  };

  /**
   * Process accounts in chunks with rate limiting
   */
  const processAccountsInChunks = async (
    accounts: Account[],
    chunkSize: number = 10,
    delayBetweenChunks: number = 2
  ): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];

    for (const chunk of chunkArrayGenerator(accounts, chunkSize)) {
      /* Process chunk in parallel */
      const chunkResults = await Promise.all(
        chunk.map(async (account) => {
          const result = await validateAccount(account);
          incrementProgress();
          return result;
        })
      );

      results.push(...chunkResults);

      /* Delay between chunks to avoid rate limiting */
      await delayForSeconds(delayBetweenChunks);
    }

    return results;
  };

  const mutation = useMutation({
    mutationKey: ["validate"],
    mutationFn: async (data: ValidationMutationParams) => {
      resetProgress();
      setTarget(data.accounts.length);

      /* Process all accounts */
      const results = await processAccountsInChunks(
        data.accounts,
        10,
        data.delay ?? 2
      );

      /* Calculate statistics */
      const stats = calculateStats(results);

      return { results, ...stats };
    },
  });

  return { mutation, target, progress };
};

export { useValidationMutation };

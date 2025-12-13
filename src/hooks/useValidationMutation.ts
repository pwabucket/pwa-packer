import { useMutation } from "@tanstack/react-query";
import { useProgress } from "./useProgress";
import { chunkArrayGenerator, delayForSeconds } from "../lib/utils";
import Decimal from "decimal.js";
import { usePackerProvider } from "./usePackerProvider";
import type {
  Account,
  ValidationMutationParams,
  ValidationResult,
  ValidationStats,
} from "../types";

const useValidationMutation = () => {
  const Packer = usePackerProvider();
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

      /* Check activity */
      const activity = await packer.confirmParticipation();

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
        if (result.activity.participating) {
          activeAccounts++;
          totalAmount = totalAmount.plus(
            new Decimal(result.activity.amount) || new Decimal(0)
          );
        }

        /* Sum available balance */
        availableBalance = availableBalance.plus(
          new Decimal(result.activity.balance) || new Decimal(0)
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

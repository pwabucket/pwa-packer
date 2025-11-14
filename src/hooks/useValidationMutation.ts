import { useMutation } from "@tanstack/react-query";
import type { Account, Activity } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { chunkArrayGenerator, delayForSeconds } from "../lib/utils";

interface ValidationMutationParams {
  accounts: Account[];
}

interface ValidationResult {
  status: boolean;
  account: Account;
  activity?: Activity;
  error?: unknown;
}

const useValidationMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  const mutation = useMutation({
    mutationKey: ["validate"],
    mutationFn: async (data: ValidationMutationParams) => {
      /* Reset Progress */
      resetProgress();

      const results: ValidationResult[] = [];

      const totalAccounts = data.accounts.length;
      let activeAccounts = 0;
      let totalAmount = 0;
      let availableBalance = 0;

      /* Set Target for Progress */
      setTarget(totalAccounts);

      for (const chunk of chunkArrayGenerator(data.accounts, 10)) {
        const chunkResults = await Promise.all<ValidationResult>(
          chunk.map(async (account) => {
            /* Skip if no URL */
            if (!account.url) {
              incrementProgress();
              return { status: false, account, error: "No URL provided" };
            }

            /* Random Delay to avoid rate limiting */
            await delayForSeconds(Math.floor(Math.random() * 30) + 1);

            const packer = new Packer(account.url);

            try {
              await packer.initialize();
              await packer.getTime();

              /* Check Activity */
              const activity = await packer.checkActivity();

              /* Count Active Accounts */
              if (activity.activity) {
                activeAccounts++;
                totalAmount += Number(activity.amount) || 0;
              }

              /* Sum Available Balance */
              availableBalance += Number(activity.activityBalance) || 0;

              /* Push Successful Result */
              return { status: true, account, activity };
            } catch (error) {
              /* Push Failed Result */
              return { status: false, account, error };
            } finally {
              /* Delay to avoid rate limiting */
              await delayForSeconds(5);

              /* Increment Progress */
              incrementProgress();
            }
          })
        );

        /* Append Chunk Results */
        results.push(...chunkResults);
      }

      return {
        results,
        totalAccounts,
        activeAccounts,
        totalAmount,
        availableBalance,
      };
    },
  });

  return { mutation, target, progress };
};

export { useValidationMutation };

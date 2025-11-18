import { useMutation } from "@tanstack/react-query";
import type { Account, Activity } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { delayForSeconds } from "../lib/utils";

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

      for (const account of data.accounts) {
        /* Skip if no URL */
        if (!account.url) {
          incrementProgress();
          results.push({ status: false, account, error: "No URL provided" });
          continue;
        }

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
          results.push({ status: true, account, activity });
        } catch (error) {
          /* Push Failed Result */
          results.push({ status: false, account, error });
        } finally {
          /* Increment Progress */
          incrementProgress();
        }

        /* Delay to avoid rate limiting */
        await delayForSeconds(20);
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

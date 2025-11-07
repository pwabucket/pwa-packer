import { useMutation } from "@tanstack/react-query";
import type { Account } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";

interface ValidationMutationParams {
  accounts: Account[];
}

interface ValidationResult {
  status: boolean;
  account: Account;
  activity?: unknown;
  error?: unknown;
}

const useValidationMutation = () => {
  const { progress, resetProgress, incrementProgress } = useProgress();

  /** Form */

  const mutation = useMutation({
    mutationKey: ["validate"],
    mutationFn: async (data: ValidationMutationParams) => {
      /* Reset Progress */
      resetProgress();

      /* Results Array */
      const results: ValidationResult[] = [];

      for (const account of data.accounts) {
        if (!account.url) {
          results.push({ status: false, account, error: "No URL provided" });
          incrementProgress();
          continue;
        }
        const packer = new Packer(account.url);
        try {
          await packer.initialize();
          await packer.getTime();

          /* Check Activity */
          const activity = await packer.checkActivity();

          /* Push Successful Result */
          results.push({ status: true, account, activity });
        } catch (error) {
          /* Push Failed Result */
          results.push({ status: false, account, error });
        } finally {
          /* Delay to avoid rate limiting */
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              Math.max(1000, Math.floor(Math.random() * 5000))
            )
          );

          /* Increment Progress */
          incrementProgress();
        }
      }
    },
  });

  return { mutation, progress };
};

export { useValidationMutation };

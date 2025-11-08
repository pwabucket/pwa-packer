import { useMutation } from "@tanstack/react-query";
import type { Account } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { chunkArrayGenerator, delayBetween } from "../lib/utils";

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

  const mutation = useMutation({
    mutationKey: ["validate"],
    mutationFn: async (data: ValidationMutationParams) => {
      /* Reset Progress */
      resetProgress();

      const results: ValidationResult[] = [];

      for (const chunk of chunkArrayGenerator(data.accounts, 10)) {
        const chunkResults = await Promise.all<ValidationResult>(
          chunk.map(async (account) => {
            /* Skip if no URL */
            if (!account.url) {
              incrementProgress();
              return { status: false, account, error: "No URL provided" };
            }

            const packer = new Packer(account.url);

            try {
              await packer.initialize();
              await packer.getTime();

              /* Check Activity */
              const activity = await packer.checkActivity();

              /* Push Successful Result */
              return { status: true, account, activity };
            } catch (error) {
              /* Push Failed Result */
              return { status: false, account, error };
            } finally {
              /* Delay to avoid rate limiting */
              await delayBetween(2000, 5000);

              /* Increment Progress */
              incrementProgress();
            }
          })
        );

        /* Append Chunk Results */
        results.push(...chunkResults);
      }

      return results;
    },
  });

  return { mutation, progress };
};

export { useValidationMutation };

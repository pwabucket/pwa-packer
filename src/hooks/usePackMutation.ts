import { useMutation } from "@tanstack/react-query";
import type { Account, PackResult } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { chunkArrayGenerator, delayForSeconds } from "../lib/utils";

/** Parameters for Pack Mutation */
interface PackMutationParams {
  accounts: Account[];
}

const usePackMutation = () => {
  const { progress, resetProgress, incrementProgress } = useProgress();

  const mutation = useMutation({
    mutationKey: ["pack-accounts"],
    mutationFn: async (data: PackMutationParams) => {
      /* Reset Progress */
      resetProgress();

      /* Initialize Results Array */
      const results: PackResult[] = [];

      /* Get Total Accounts */
      const totalAccounts = data.accounts.length;

      /* Initialize Total Withdrawn */
      let totalWithdrawn = 0;

      /* Packed Accounts Counter */
      let packedAccounts = 0;

      for (const chunk of chunkArrayGenerator(data.accounts, 10)) {
        const chunkResults = await Promise.all<PackResult>(
          chunk.map(async (account) => {
            /* Skip if no URL */
            if (!account.url) {
              incrementProgress();
              return { status: false, account, error: "No URL provided" };
            }

            try {
              /* Create Packer Instance */
              const packer = new Packer(account.url);

              /* Initialize Packer */
              await packer.initialize();

              /* Get Time and Validate */
              await packer.getTime();
              await packer.validate();

              /* Delay to avoid rate limiting */
              await delayForSeconds(1);

              /* Get Activity */
              const activity = await packer.getActivity();

              /* Delay to avoid rate limiting */
              await delayForSeconds(1);

              /* Check Activity */
              const { data: withdrawActivity } =
                await packer.getWithdrawActivity();
              const amount = Number(withdrawActivity.activityBalance || 0);

              /* Skip if No Activity Balance */
              if (amount <= 0) {
                return {
                  status: false,
                  skipped: true,
                  account,
                  amount,
                  activity,
                  withdrawActivity,
                };
              }

              /* Delay to avoid rate limiting */
              await delayForSeconds(10);

              /* Determine Withdrawal Address */
              const withdrawalAddress =
                withdrawActivity.withdrawalAddress || account.walletAddress;

              /* Perform Pack Operation */
              const packResponse = await packer.withdrawActivity(
                withdrawalAddress
              );

              /* Check Pack Response */
              if (packResponse.code !== 200) {
                return {
                  status: false,
                  account,
                  error: `Pack failed with message: ${packResponse.msg}`,
                };
              }

              /* Increment Packed Accounts */
              packedAccounts++;

              /* Update Total Withdrawn */
              totalWithdrawn += amount;

              /* Push Successful Result */
              return {
                status: true,
                account,
                amount,
                activity,
                withdrawActivity,
                response: packResponse,
              };
            } catch (error) {
              /* Push Failed Result */
              return { status: false, account, error };
            } finally {
              /* Delay to avoid rate limiting */
              await delayForSeconds(15);

              /* Increment Progress */
              incrementProgress();
            }
          })
        );

        /* Append Chunk Results */
        results.push(...chunkResults);
      }

      return { results, totalAccounts, packedAccounts, totalWithdrawn };
    },
  });

  return { mutation, progress };
};

export { usePackMutation };

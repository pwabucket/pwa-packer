import { useMutation } from "@tanstack/react-query";
import type { Account, PackResult } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { delayForSeconds } from "../lib/utils";

/** Parameters for Pack Mutation */
interface PackMutationParams {
  accounts: Account[];
}

const usePackMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

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

      /* Set Target for Progress */
      setTarget(totalAccounts);

      for (const account of data.accounts) {
        /* Skip if no URL */
        if (!account.url) {
          results.push({
            status: false,
            skipped: true,
            account,
            error: "No URL provided",
          });
          incrementProgress();
          continue;
        }

        try {
          /* Create Packer Instance */
          const packer = new Packer(account.url);

          /* Initialize Packer */
          await packer.initialize();

          /* Get Activity */
          const activity = await packer.getActivity();

          /* Check Activity */
          const { data: withdrawActivity } = await packer.getWithdrawActivity();
          const amount = Number(withdrawActivity.activityBalance || 0);

          /* Skip if No Activity Balance */
          if (amount <= 0) {
            results.push({
              status: false,
              skipped: true,
              account,
              amount,
              activity,
              withdrawActivity,
            });
            continue;
          }

          /* Determine Withdrawal Address */
          const withdrawalAddress =
            withdrawActivity.withdrawalAddress || account.walletAddress;

          /* Perform Pack Operation */
          const packResponse = await packer.withdrawActivity(withdrawalAddress);

          /* Check Pack Response */
          if (packResponse.code !== 200) {
            results.push({
              status: false,
              account,
              error: `Pack failed with message: ${packResponse.msg}`,
            });
            continue;
          }

          /* Increment Packed Accounts */
          packedAccounts++;

          /* Update Total Withdrawn */
          totalWithdrawn += amount;

          /* Push Successful Result */
          results.push({
            status: true,
            account,
            amount,
            activity,
            withdrawActivity,
            response: packResponse,
          });
        } catch (error) {
          /* Push Failed Result */
          results.push({ status: false, account, error });
        } finally {
          /* Increment Progress */
          incrementProgress();
        }

        /* Delay to Avoid Rate Limiting */
        await delayForSeconds(30);
      }

      return { results, totalAccounts, packedAccounts, totalWithdrawn };
    },
  });

  return { mutation, target, progress };
};

export { usePackMutation };

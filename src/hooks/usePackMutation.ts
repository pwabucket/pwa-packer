import { useMutation } from "@tanstack/react-query";
import type { Account, PackResult } from "../types";
import { useProgress } from "./useProgress";
import { delayForSeconds } from "../lib/utils";
import { Decimal } from "decimal.js";
import { usePackerProvider } from "./usePackerProvider";

/** Parameters for Pack Mutation */
interface PackMutationParams {
  accounts: Account[];
  delay: number;
}

interface PackStats {
  totalAccounts: number;
  packedAccounts: number;
  totalWithdrawn: Decimal.Value;
}

const usePackMutation = () => {
  const { getProvider } = usePackerProvider();

  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  /**
   * Process a single account pack operation
   */
  const processAccount = async (account: Account): Promise<PackResult> => {
    /* Validate account has URL */
    if (!account.url) {
      return {
        status: false,
        skipped: true,
        account,
        error: "No URL provided",
      };
    }

    try {
      /* Initialize packer and fetch data */
      const Packer = getProvider(account.provider);
      const packer = new Packer(account.url);
      await packer.initialize();

      const activity = await packer.getParticipation();
      const withdrawalInfo = await packer.getWithdrawalInfo();
      const amount = new Decimal(withdrawalInfo?.balance || 0);

      /* Skip if no balance */
      if (amount.lte(0)) {
        return {
          status: false,
          skipped: true,
          account,
          amount,
          activity,
          withdrawalInfo,
        };
      }

      /* Determine withdrawal address */
      const withdrawalAddress = withdrawalInfo.address || account.walletAddress;

      /* Perform withdrawal */
      const packResponse = await packer.processWithdrawal(withdrawalAddress);

      /* Validate response */
      if (packResponse.status !== "success") {
        return {
          status: false,
          account,
          error: `Pack failed with message: ${packResponse.error}`,
        };
      }

      /* Return success */
      return {
        status: true,
        account,
        amount,
        activity,
        withdrawalInfo,
        response: packResponse,
      };
    } catch (error) {
      return {
        status: false,
        account,
        error,
      };
    }
  };

  /**
   * Calculate statistics from results
   */
  const calculateStats = (results: PackResult[]): PackStats => {
    const packedAccounts = results.filter((r) => r.status && !r.skipped).length;
    const totalWithdrawn = results.reduce(
      (sum, r) =>
        sum.plus(r.status && r.amount ? new Decimal(r.amount) : new Decimal(0)),
      new Decimal(0)
    );

    return {
      totalAccounts: results.length,
      packedAccounts,
      totalWithdrawn,
    };
  };

  const mutation = useMutation({
    mutationKey: ["pack-accounts"],
    mutationFn: async (data: PackMutationParams) => {
      resetProgress();
      setTarget(data.accounts.length);

      const results: PackResult[] = [];

      /* Process accounts sequentially */
      for (const account of data.accounts) {
        const result = await processAccount(account);
        results.push(result);
        incrementProgress();

        /* Delay between operations only if not skipped and not last account */
        const isLastAccount =
          account === data.accounts[data.accounts.length - 1];
        if (!result.skipped && !isLastAccount) {
          await delayForSeconds(data.delay);
        }
      }

      /* Calculate and return statistics */
      const stats = calculateStats(results);
      return { results, ...stats };
    },
  });

  return { mutation, target, progress };
};

export { usePackMutation };

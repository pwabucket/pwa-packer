import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import * as yup from "yup";
import { useAccountsChooser } from "./useAccountsChooser";
import type {
  Account,
  PlanAccountStatus,
  PlanFileContent,
  PlanStats,
} from "../types";
import { format, startOfWeek } from "date-fns";
import {
  chunkArrayGenerator,
  delayForSeconds,
  downloadJsonFile,
  floorToWholeNumber,
  randomItem,
} from "../lib/utils";
import { useProgress } from "./useProgress";
import toast from "react-hot-toast";
import { getActivityStreak } from "../lib/activity";
import { WalletReader } from "../lib/WalletReader";
import { usePassword } from "./usePassword";
import { executeUsdtTransfers } from "../lib/transfers";
import Decimal from "decimal.js";
import { usePackerProvider } from "./usePackerProvider";

/** Plan Form Schema */
const PlanFormSchema = yup
  .object({
    total: yup.string().required().label("Total"),
    maximum: yup.string().required().label("Maximum"),
    fill: yup.boolean().required().label("Fill"),
  })
  .required();

/** Plan Form Data */
interface PlanFormData {
  total: string;
  maximum: string;
  fill: boolean;
}

interface PreparedAccount extends PlanAccountStatus {
  balance: Decimal;
}

interface PreparedResult extends PreparedAccount {
  amount: Decimal;
}

/** Plan Creator Component */
const usePlanCreator = (onCreate: (data: PlanFileContent) => void) => {
  const { getProvider } = usePackerProvider();
  const accountsChooser = useAccountsChooser();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const { selectedAccounts } = accountsChooser;
  const password = usePassword()!;

  /** Form */
  const form = useForm<PlanFormData>({
    resolver: yupResolver(PlanFormSchema),
    defaultValues: {
      total: "",
      maximum: "",
      fill: true,
    },
  });

  /**
   * Check if account has sufficient balance
   */
  const checkBalance = async (account: Account) => {
    try {
      const reader = new WalletReader(account.walletAddress);
      const balance = await reader.getUSDTBalance();

      console.log(
        `USDT Balance for ${account.title} (${account.walletAddress}): ${balance}`
      );

      return balance;
    } catch (error) {
      console.error(
        `Failed to fetch balance for ${account.title} (${account.walletAddress}):`,
        error
      );
      return new Decimal(0);
    }
  };

  const checkActivity = async (account: Account) => {
    if (!account.url) {
      return {
        activity: null,
        streak: 0,
      };
    }

    try {
      /* Instantiate */
      const Packer = getProvider(account.provider);
      const packer = new Packer(account.url);

      /* Initialize */
      await packer.initialize();

      /* Get activity */
      const activity = await packer.getParticipation();
      const result = await packer.getWithdrawalHistory();
      const streak = getActivityStreak(result);

      return {
        activity,
        streak,
      };
    } catch (error) {
      return {
        activity: null,
        streak: 0,
      };
    }
  };

  /* Prepare account */
  const prepareAccount = async (account: Account): Promise<PreparedAccount> => {
    try {
      if (!account.url) {
        throw new Error("Account is missing a URL!");
      }

      const [balance, activity] = await Promise.all([
        checkBalance(account),
        checkActivity(account),
      ]);

      return {
        status: true,
        account,
        balance,
        activity,
      };
    } catch (error) {
      console.error(`Error while preparing ${account.title}`, error);
      return {
        status: false,
        account,
        balance: new Decimal(0),
        activity: {
          activity: null,
          streak: 0,
        },
      };
    }
  };

  /* Get prepared accounts */
  const getPreparedAccounts = async (accounts: Account[]) => {
    const results: PreparedAccount[] = [];
    for (const chunk of chunkArrayGenerator(accounts, 10)) {
      const chunkResults = await Promise.all(
        chunk.map(async (account) => {
          const result = await prepareAccount(account);
          incrementProgress();
          return result;
        })
      );

      results.push(...chunkResults);

      await delayForSeconds(1);
    }

    return results;
  };

  /* Calculate stats */
  const calculateStats = (results: PreparedResult[]): PlanStats => {
    const totalAccounts = results.length;
    const totalAmount = results.reduce(
      (total, item) => total.plus(item.amount),
      new Decimal(0)
    );
    const firstActivityCount = results.filter(
      (item) => item.activity.streak === 0
    ).length;
    const secondActivityCount = results.filter(
      (item) => item.activity.streak === 1
    ).length;
    const consistentActivityCount = results.filter(
      (item) => item.activity.streak >= 2
    ).length;

    return {
      totalAccounts,
      totalAmount,
      firstActivityCount,
      secondActivityCount,
      consistentActivityCount,
    };
  };

  const planFillTransfers = (plans: PreparedResult[]) => {
    /* Separate accounts into categories */
    const participatingAccounts = plans.filter((item) => item.amount.gt(0));
    const nonParticipatingAccounts = plans.filter((item) => item.amount.eq(0));

    /* Find accounts that need balance adjustments */
    const accountsNeedingFunds = participatingAccounts.filter((item) =>
      item.balance.lt(item.amount)
    );
    const accountsWithExcess = [
      ...participatingAccounts.filter((item) => item.balance.gt(item.amount)),
      ...nonParticipatingAccounts.filter((item) =>
        item.balance.gt(new Decimal(0))
      ),
    ];

    /* Calculate totals with 4 decimals */
    const totalNeeded = accountsNeedingFunds.reduce(
      (sum, item) => sum.plus(item.amount.minus(item.balance)),
      new Decimal(0)
    );

    const totalExcess = accountsWithExcess.reduce(
      (sum, item) => sum.plus(item.balance.minus(item.amount)),
      new Decimal(0)
    );

    console.log({
      participatingAccounts: participatingAccounts.length,
      accountsNeedingFunds: accountsNeedingFunds.length,
      accountsWithExcess: accountsWithExcess.length,
      totalNeeded,
      totalExcess,
    });

    if (totalNeeded.eq(0)) {
      console.log("No accounts need funding");
      return [];
    }

    if (totalExcess.lt(totalNeeded)) {
      console.warn(
        `Insufficient excess funds: need ${totalNeeded}, have ${totalExcess}`
      );
      toast.error(
        `Not enough excess funds to fill all accounts. Need ${totalNeeded}, have ${totalExcess}`
      );
    }

    /* Create transfer plan */
    const transactions = [];

    /* Sort by priority: accounts with excess that are participating should give first */
    accountsWithExcess.sort((a, b) => {
      const aExcess = a.balance.minus(a.amount);
      const bExcess = b.balance.minus(b.amount);
      return bExcess.minus(aExcess).toNumber(); /* Higher excess first */
    });

    /* Sort recipients by need (higher deficit first) */
    accountsNeedingFunds.sort((a, b) => {
      const aDeficit = a.amount.minus(a.balance);
      const bDeficit = b.amount.minus(b.balance);
      return bDeficit.minus(aDeficit).toNumber();
    });

    let remainingNeeded = [...accountsNeedingFunds].map((item) => ({
      account: item.account,
      needed: item.amount.minus(item.balance),
    }));

    /* Create transactions from excess accounts to deficit accounts (participating first) */
    for (const donor of accountsWithExcess) {
      let availableToGive = donor.balance.minus(donor.amount);

      if (availableToGive.lte(0)) continue;

      for (const recipient of remainingNeeded) {
        if (recipient.needed.lte(0)) continue;
        if (availableToGive.lte(0)) break;

        const transferAmount = Decimal.min(availableToGive, recipient.needed);

        transactions.push({
          from: donor.account,
          to: recipient.account,
          amount: transferAmount,
        });

        availableToGive = availableToGive.minus(transferAmount);
        recipient.needed = recipient.needed.minus(transferAmount);
      }
    }

    /* After fulfilling participating accounts, distribute remaining excess to non-participating accounts */
    const remainingExcess = accountsWithExcess
      .map((item) => ({
        account: item.account,
        excess: item.balance.minus(item.amount),
      }))
      .filter((item) => item.excess.gt(0));

    if (remainingExcess.length > 0) {
      const totalRemainingExcess = remainingExcess.reduce(
        (sum, item) => sum.plus(item.excess),
        new Decimal(0)
      );

      /* Any non-participating account can collect excess funds */
      const nonParticipatingCollectors = nonParticipatingAccounts;

      if (nonParticipatingCollectors.length > 0 && totalRemainingExcess.gt(0)) {
        console.log(
          `Distributing ${totalRemainingExcess} excess funds to ${nonParticipatingCollectors.length} non-participating accounts`
        );

        /* Distribute excess to non-participating accounts (they can collect as much as available) */
        for (const donor of remainingExcess) {
          if (donor.excess.lte(0)) continue;

          for (const collector of nonParticipatingCollectors) {
            if (donor.excess.lte(0)) break;

            /* Transfer all available excess from this donor to this collector */
            const transferAmount = new Decimal(donor.excess);

            transactions.push({
              from: donor.account,
              to: collector.account,
              amount: transferAmount,
            });

            donor.excess = new Decimal(0);
          }
        }
      }
    }

    console.log(
      `Created ${transactions.length} transactions to balance accounts`
    );
    console.log({ transactions });

    return transactions;
  };

  const fillAccounts = async (plans: PreparedResult[]) => {
    const transactions = planFillTransfers(plans);

    if (transactions.length === 0) {
      console.log("No fill transactions needed");
      return { success: 0, failed: 0 };
    }

    toast.loading(`Executing ${transactions.length} fill transactions...`);

    /* Reset progress for fill transactions */
    resetProgress();
    setTarget(transactions.length);

    const { success, failed } = await executeUsdtTransfers({
      transactions,
      password,
      onResult() {
        incrementProgress();
      },
    });

    if (success > 0) {
      toast.success(
        `Successfully executed ${success} fill transactions${
          failed > 0 ? `, ${failed} failed` : ""
        }`
      );
    } else if (failed > 0) {
      toast.error(`All ${failed} fill transactions failed`);
    }

    return { success, failed };
  };

  const planAvailableAccounts = (
    preparedAccounts: PreparedAccount[],
    data: PlanFormData
  ) => {
    const availableAccounts = preparedAccounts
      .filter((item) => item.status && !item.activity.activity?.participating)
      .sort((a, b) => a.activity.streak - b.activity.streak)
      .map((item) => ({
        ...item,
        amount: new Decimal(0),
      }));

    const maximum = floorToWholeNumber(new Decimal(data.maximum));
    const total = floorToWholeNumber(new Decimal(data.total));

    let needed = total;

    for (const item of availableAccounts) {
      if (needed.lte(0)) break;
      const minimum = new Decimal(
        getProvider(item.account.provider).MINIMUM_DEPOSIT_AMOUNT
      );
      const difference = maximum.minus(minimum);

      const randomAmount = floorToWholeNumber(
        Decimal.random().times(difference.plus(1)).plus(minimum)
      );
      const amount = Decimal.min(needed, randomAmount);
      item.amount = amount;
      needed = needed.minus(amount);
    }

    while (needed.gt(0)) {
      const usableAccounts = availableAccounts.filter((item) =>
        item.amount.lt(maximum)
      );

      if (usableAccounts.length === 0) break;
      const randomAccount = randomItem(usableAccounts);
      randomAccount.amount = randomAccount.amount.plus(1);
      needed = needed.minus(1);
    }

    return availableAccounts;
  };

  /** Mutation */
  const mutation = useMutation({
    mutationKey: ["plan-accounts"],
    mutationFn: async (data: PlanFormData) => {
      resetProgress();
      setTarget(selectedAccounts.length);
      const preparedAccounts = await getPreparedAccounts(selectedAccounts);
      const availableAccounts = planAvailableAccounts(preparedAccounts, data);

      if (data.fill) {
        await fillAccounts(availableAccounts);
      }

      const results: PreparedResult[] = availableAccounts.filter((item) =>
        item.amount.gt(new Decimal(0))
      );

      const stats: PlanStats = calculateStats(results);

      const week = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStr = format(week, "yyyy-MM-dd");
      const plan: PlanFileContent = {
        parameters: data,
        week,
        stats,
        results,
      };

      /* Download result */
      downloadJsonFile(`plan-${weekStr}-week`, plan);

      return {
        results,
        stats,
        plan,
      };
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: PlanFormData) => {
    const result = await mutation.mutateAsync(data);
    onCreate(result.plan);
    toast.success("Plan created and downloaded successfully!");
  };

  return {
    form,
    accountsChooser,
    mutation,
    progress,
    target,
    handleFormSubmit,
  };
};

export { usePlanCreator };

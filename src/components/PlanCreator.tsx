import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { useMutation } from "@tanstack/react-query";
import * as yup from "yup";
import { AccountsChooser } from "../components/AccountsChooser";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import type {
  Account,
  Activity,
  PlanAccountStatus,
  PlanFileContent,
  PlanStats,
} from "../types";
import { Packer } from "../lib/Packer";
import { format, startOfWeek } from "date-fns";
import {
  chunkArrayGenerator,
  delayForSeconds,
  downloadJsonFile,
  floorToWholeNumber,
  formatCurrency,
  randomItem,
  truncateDecimals,
} from "../lib/utils";
import { useProgress } from "../hooks/useProgress";
import { Progress } from "../components/Progress";
import { PlanResults } from "../components/PlanResults";
import toast from "react-hot-toast";
import { getActivityStreak } from "../lib/activity";
import { LabelToggle } from "./LabelToggle";
import { WalletReader } from "../lib/WalletReader";
import { usePassword } from "../hooks/usePassword";
import { executeUsdtTransfers } from "../lib/transfers";

/** Plan Form Schema */
const PlanFormSchema = yup
  .object({
    total: yup.string().required().label("Total"),
    minimum: yup.string().required().label("Minimum"),
    maximum: yup.string().required().label("Maximum"),
    fill: yup.boolean().required().label("Fill"),
  })
  .required();

/** Plan Form Data */
interface PlanFormData {
  total: string;
  minimum: string;
  maximum: string;
  fill: boolean;
}

interface PreparedAccount extends PlanAccountStatus {
  balance: number;
}

interface PreparedResult extends PreparedAccount {
  amount: number;
}

/** Plan Creator Component */
const PlanCreator = () => {
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
      minimum: "",
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
      const balanceStr = truncateDecimals(balance, 4);

      console.log(
        `USDT Balance for ${account.title} (${account.walletAddress}): ${balanceStr}`
      );

      return balance;
    } catch (error) {
      console.error(
        `Failed to fetch balance for ${account.title} (${account.walletAddress}):`,
        error
      );
      return 0;
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
      const packer = new Packer(account.url);

      /* Initialize */
      await packer.initialize();

      /* Get activity */
      const activity: Activity = await packer.getActivity();

      const result = await packer.getWithdrawActivityList();
      const list = result.data.list;
      const streak = getActivityStreak(list);

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
        balance: 0,
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
    const totalAmount = results.reduce((total, item) => total + item.amount, 0);
    const firstActivity = results.filter(
      (item) => item.activity.streak === 0
    ).length;
    const secondActivity = results.filter(
      (item) => item.activity.streak === 1
    ).length;
    const consistentActivity = results.filter(
      (item) => item.activity.streak >= 2
    ).length;

    return {
      totalAccounts,
      totalAmount,
      firstActivity,
      secondActivity,
      consistentActivity,
    };
  };

  const planFillTransfers = (plans: PreparedResult[]) => {
    /* Helper to truncate to 4 decimals as number */
    const truncate4 = (value: number) => parseFloat(truncateDecimals(value, 4));

    /* Separate accounts into categories */
    const participatingAccounts = plans.filter((item) => item.amount > 0);
    const nonParticipatingAccounts = plans.filter((item) => item.amount === 0);

    /* Find accounts that need balance adjustments */
    const accountsNeedingFunds = participatingAccounts.filter(
      (item) => item.balance < item.amount
    );
    const accountsWithExcess = [
      ...participatingAccounts.filter((item) => item.balance > item.amount),
      ...nonParticipatingAccounts.filter((item) => item.balance > 0),
    ];

    /* Calculate totals with 4 decimals */
    const totalNeeded = truncate4(
      accountsNeedingFunds.reduce(
        (sum, item) => sum + truncate4(item.amount - item.balance),
        0
      )
    );
    const totalExcess = truncate4(
      accountsWithExcess.reduce(
        (sum, item) => sum + truncate4(item.balance - item.amount),
        0
      )
    );

    console.log({
      participatingAccounts: participatingAccounts.length,
      accountsNeedingFunds: accountsNeedingFunds.length,
      accountsWithExcess: accountsWithExcess.length,
      totalNeeded,
      totalExcess,
    });

    if (totalNeeded === 0) {
      console.log("No accounts need funding");
      return [];
    }

    if (totalExcess < totalNeeded) {
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
      const aExcess = truncate4(a.balance - a.amount);
      const bExcess = truncate4(b.balance - b.amount);
      return bExcess - aExcess; /* Higher excess first */
    });

    /* Sort recipients by need (higher deficit first) */
    accountsNeedingFunds.sort((a, b) => {
      const aDeficit = truncate4(a.amount - a.balance);
      const bDeficit = truncate4(b.amount - b.balance);
      return bDeficit - aDeficit;
    });

    let remainingNeeded = [...accountsNeedingFunds].map((item) => ({
      account: item.account,
      needed: truncate4(item.amount - item.balance),
    }));

    /* Create transactions from excess accounts to deficit accounts (participating first) */
    for (const donor of accountsWithExcess) {
      let availableToGive = truncate4(donor.balance - donor.amount);

      if (availableToGive <= 0) continue;

      for (const recipient of remainingNeeded) {
        if (recipient.needed <= 0) continue;
        if (availableToGive <= 0) break;

        const transferAmount = truncate4(
          Math.min(availableToGive, recipient.needed)
        );

        transactions.push({
          from: donor.account,
          to: recipient.account,
          amount: transferAmount,
        });

        availableToGive = truncate4(availableToGive - transferAmount);
        recipient.needed = truncate4(recipient.needed - transferAmount);
      }
    }

    /* After fulfilling participating accounts, distribute remaining excess to non-participating accounts */
    const remainingExcess = accountsWithExcess
      .map((item) => ({
        account: item.account,
        excess: truncate4(Math.max(0, item.balance - item.amount)),
      }))
      .filter((item) => item.excess > 0);

    if (remainingExcess.length > 0) {
      const totalRemainingExcess = truncate4(
        remainingExcess.reduce((sum, item) => sum + item.excess, 0)
      );

      /* Any non-participating account can collect excess funds */
      const nonParticipatingCollectors = nonParticipatingAccounts;

      if (nonParticipatingCollectors.length > 0 && totalRemainingExcess > 0) {
        console.log(
          `Distributing ${totalRemainingExcess} excess funds to ${nonParticipatingCollectors.length} non-participating accounts`
        );

        /* Distribute excess to non-participating accounts (they can collect as much as available) */
        for (const donor of remainingExcess) {
          if (donor.excess <= 0) continue;

          for (const collector of nonParticipatingCollectors) {
            if (donor.excess <= 0) break;

            /* Transfer all available excess from this donor to this collector */
            const transferAmount = truncate4(donor.excess);

            transactions.push({
              from: donor.account,
              to: collector.account,
              amount: transferAmount,
            });

            donor.excess = 0;
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

  const planAmounts = (
    preparedAccounts: PreparedAccount[],
    data: PlanFormData
  ) => {
    const availableAccounts = preparedAccounts
      .filter((item) => item.status && !item.activity.activity?.activity)
      .sort((a, b) => a.activity.streak - b.activity.streak)
      .map((item) => ({
        ...item,
        amount: 0,
      }));

    const total = floorToWholeNumber(parseFloat(data.total));
    const minimum = floorToWholeNumber(parseFloat(data.minimum));
    const maximum = floorToWholeNumber(parseFloat(data.maximum));
    const difference = maximum - minimum;

    let needed = total;

    for (const item of availableAccounts) {
      if (needed <= 0) break;
      const randomAmount = floorToWholeNumber(
        Math.random() * (difference + 1) + minimum
      );
      const amount = Math.min(needed, randomAmount);
      item.amount = amount;
      needed -= amount;
    }

    while (needed > 0) {
      const usableAccounts = availableAccounts.filter(
        (item) => item.amount < maximum
      );

      if (usableAccounts.length === 0) break;
      const randomAccount = randomItem(usableAccounts);
      randomAccount.amount += 1;
      needed -= 1;
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
      const availableAccounts = planAmounts(preparedAccounts, data);

      if (data.fill) {
        await fillAccounts(availableAccounts);
      }

      const results: PreparedResult[] = availableAccounts.filter(
        (item) => item.amount > 0
      );

      const stats: PlanStats = calculateStats(results);

      const week = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStr = format(week, "yyyy-MM-dd");
      const fileContent: PlanFileContent = {
        parameters: data,
        week,
        stats,
        results,
      };

      /* Download result */
      downloadJsonFile(`plan-${weekStr}-week`, fileContent);

      return {
        results,
        stats,
      };
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: PlanFormData) => {
    await mutation.mutateAsync(data);
    toast.success("Plan created and downloaded successfully!");
  };

  return (
    <div className="flex flex-col gap-4">
      {mutation.data ? (
        <>
          {/* Plan Results Summary */}
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Plan created successfully!</p>
            <p className="text-lime-300">
              Amount: {formatCurrency(mutation.data.stats.totalAmount, 3)}
            </p>
            <p className="text-blue-300">
              Accounts: (
              <span className="text-green-300">
                {mutation.data.stats.firstActivity}
              </span>{" "}
              /{" "}
              <span className="text-amber-300">
                {mutation.data.stats.secondActivity}
              </span>{" "}
              /{" "}
              <span className="text-red-300">
                {mutation.data.stats.consistentActivity}
              </span>
              ) ({mutation.data.stats.totalAccounts})
            </p>
          </div>

          {/* Plan Results */}
          <PlanResults results={mutation.data.results} />
        </>
      ) : (
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col gap-2"
          >
            {/* Total */}
            <Controller
              name="total"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="total">Total Amount</Label>
                  <Input
                    {...field}
                    id="total"
                    type="number"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="Total Amount"
                    disabled={mutation.isPending}
                  />
                  <FormFieldError message={fieldState.error?.message} />
                  <p className="text-xs text-neutral-400 text-center px-4">
                    This is the total amount to send from all accounts combined,
                    the total may be less if accounts are not sufficient.
                  </p>
                </div>
              )}
            />

            {/* Minimum */}
            <Controller
              name="minimum"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="minimum">Minimum Amount</Label>
                  <Input
                    {...field}
                    id="minimum"
                    type="number"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="Minimum Amount"
                    disabled={mutation.isPending}
                  />
                  <FormFieldError message={fieldState.error?.message} />
                  <p className="text-xs text-neutral-400 text-center px-4">
                    This is the minimum amount to send from each account.
                    Accounts will not send less than this amount.
                  </p>
                </div>
              )}
            />

            {/* Maximum */}
            <Controller
              name="maximum"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maximum">Maximum Amount</Label>
                  <Input
                    {...field}
                    id="maximum"
                    type="number"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="Maximum Amount"
                    disabled={mutation.isPending}
                  />
                  <FormFieldError message={fieldState.error?.message} />
                  <p className="text-xs text-neutral-400 text-center px-4">
                    This is the maximum amount to send from each account.
                    Accounts will not exceed this amount.
                  </p>
                </div>
              )}
            />

            {/* Fill */}
            <Controller
              name="fill"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <LabelToggle
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={mutation.isPending}
                  >
                    Fill Plan
                  </LabelToggle>
                  <FormFieldError message={fieldState.error?.message} />
                  <p className="text-xs text-neutral-400 text-center px-4">
                    If enabled, accounts will be filled to meet the plan's total
                    amount.
                  </p>
                </div>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Planning..." : `Draft Plan`}
            </Button>

            {/* Progress Bar */}
            {mutation.isPending && <Progress max={target} current={progress} />}

            {/* Accounts Chooser */}
            <AccountsChooser
              {...accountsChooser}
              disabled={mutation.isPending}
            />
          </form>
        </FormProvider>
      )}
    </div>
  );
};

export { PlanCreator };

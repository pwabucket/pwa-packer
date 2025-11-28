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
  PlanResult,
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
} from "../lib/utils";
import { useProgress } from "../hooks/useProgress";
import { Progress } from "../components/Progress";
import { PlanResults } from "../components/PlanResults";
import toast from "react-hot-toast";
import { getActivityStreak } from "../lib/activity";

/** Plan Form Schema */
const PlanFormSchema = yup
  .object({
    total: yup.string().required().label("Total"),
    minimum: yup.string().required().label("Minimum"),
    maximum: yup.string().required().label("Maximum"),
  })
  .required();

/** Plan Form Data */
interface PlanFormData {
  total: string;
  minimum: string;
  maximum: string;
}

/** Plan Creator Component */
const PlanCreator = () => {
  const accountsChooser = useAccountsChooser();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const { selectedAccounts } = accountsChooser;

  /** Form */
  const form = useForm<PlanFormData>({
    resolver: yupResolver(PlanFormSchema),
    defaultValues: {
      total: "",
      minimum: "",
      maximum: "",
    },
  });

  /* Prepare account */
  const prepareAccount = async (
    account: Account
  ): Promise<PlanAccountStatus> => {
    if (!account.url) {
      return {
        status: true,
        skipped: true,
        account,
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

      /* Exclude accounts with activity */
      if (activity.activity) {
        return {
          status: true,
          skipped: true,
          account,
          streak: 0,
        };
      }

      const result = await packer.getWithdrawActivityList();
      const list = result.data.list;

      const streak = getActivityStreak(list);

      return {
        status: true,
        skipped: false,
        streak,
        account,
      };
    } catch (error) {
      console.error(`Error preparing account: ${account.title}`, error);
      return {
        status: false,
        skipped: false,
        account,
        streak: 0,
      };
    }
  };

  /* Get eligible accounts */
  const getEligibleAccounts = async (accounts: Account[]) => {
    const results: PlanAccountStatus[] = [];
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
  const calculateStats = (results: PlanResult[]): PlanStats => {
    const totalAccounts = results.length;
    const totalAmount = results.reduce((total, item) => total + item.amount, 0);
    const firstActivity = results.filter((item) => item.streak === 0).length;
    const secondActivity = results.filter((item) => item.streak === 1).length;
    const consistentActivity = results.filter(
      (item) => item.streak >= 2
    ).length;

    return {
      totalAccounts,
      totalAmount,
      firstActivity,
      secondActivity,
      consistentActivity,
    };
  };

  /** Mutation */
  const mutation = useMutation({
    mutationKey: ["plan-accounts"],
    mutationFn: async (data: PlanFormData) => {
      resetProgress();
      setTarget(selectedAccounts.length);
      const eligibleAccounts = await getEligibleAccounts(selectedAccounts);
      const availableAccounts = eligibleAccounts
        .filter((item) => item.status && !item.skipped)
        .sort((a, b) => a.streak - b.streak)
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

      const results: PlanResult[] = availableAccounts.filter(
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
              Total Amount: {formatCurrency(mutation.data.stats.totalAmount, 3)}
            </p>
            <p className="text-blue-300">
              Total Accounts: {mutation.data.stats.totalAccounts}
            </p>

            <p className="text-green-300">
              First Activity: {mutation.data.stats.firstActivity}
            </p>

            <p className="text-amber-300">
              Second Activity: {mutation.data.stats.secondActivity}
            </p>

            <p className="text-red-300">
              Consistent Activity: {mutation.data.stats.consistentActivity}
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

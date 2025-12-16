import * as yup from "yup";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AccountsChooser } from "../components/AccountsChooser";
import toast from "react-hot-toast";
import { Label } from "../components/Label";
import { Input } from "../components/Input";
import { FormFieldError } from "../components/FormFieldError";
import type { Account } from "../types";
import { useProgress } from "../hooks/useProgress";
import { useMutation } from "@tanstack/react-query";
import { chunkArrayGenerator, delayForSeconds } from "../lib/utils";
import { Progress } from "../components/Progress";
import { usePackerProvider } from "../hooks/usePackerProvider";
import { useProviderAccountsChooser } from "../hooks/useProviderAccountsChooser";

interface StatusCheckResult {
  account: Account;
  status: boolean;
  skipped?: boolean;
}

/** Status Check Form Schema */
const StatusCheckFormSchema = yup
  .object({
    value: yup.number().required().label("Value"),
  })
  .required();

/** Status Check Form Data */
interface StatusCheckFormData {
  value: number;
}

/** StatusCheck Page Component */
const StatusCheck = () => {
  const { getProvider } = usePackerProvider();
  const accountsChooser = useProviderAccountsChooser();
  const { selectedAccounts } = accountsChooser;
  const { target, setTarget, progress, incrementProgress, resetProgress } =
    useProgress();

  /** Form */
  const form = useForm<StatusCheckFormData>({
    resolver: yupResolver(StatusCheckFormSchema),
    defaultValues: {
      value: 0,
    },
  });

  /** Mutation for Status Check */
  const mutation = useMutation({
    mutationKey: ["status-check"],
    mutationFn: async ({
      accounts,
      expectedValue,
      delayBetweenChunks = 2,
    }: {
      accounts: Account[];
      expectedValue: number;
      delayBetweenChunks?: number;
    }) => {
      /* Setup Progress */
      resetProgress();
      setTarget(accounts.length);

      /* Initialize results array */
      const results: StatusCheckResult[] = [];

      /* Check accounts in chunks */
      for (const chunk of chunkArrayGenerator(accounts, 10)) {
        /* Check each account in the chunk */
        const chunkResults = await Promise.all(
          chunk.map(async (account) => {
            const result = await checkAccountStatus(account, expectedValue);
            incrementProgress();
            return result;
          })
        );

        /* Append chunk results to main results */
        results.push(...chunkResults);

        /* Small delay between chunks to avoid rate limiting */
        await delayForSeconds(delayBetweenChunks);
      }

      /* Calculate statistics */
      const stats = calculateStats(results);

      return {
        results,
        ...stats,
      };
    },
  });

  /* Calculate Statistics */
  const calculateStats = (results: StatusCheckResult[]) => {
    const totalAccounts = results.length;
    const successfulChecks = results.filter(
      (result) => result.status && !result.skipped
    ).length;

    const failedChecks = results.filter(
      (result) => !result.status && !result.skipped
    ).length;

    const skippedChecks = results.filter((result) => result.skipped).length;

    return {
      totalAccounts,
      successfulChecks,
      failedChecks,
      skippedChecks,
    };
  };

  /** Check Account Status */
  const checkAccountStatus = async (
    account: Account,
    expectedValue: number
  ): Promise<StatusCheckResult> => {
    if (!account.provider || !account.url)
      return {
        account,
        status: false,
        skipped: true,
      };
    try {
      const Packer = getProvider(account.provider);
      const packer = new Packer(account.url!);
      await packer.initialize();
      const status = await packer.getAccountStatus();

      console.log("Status Check:", account.title, status, expectedValue);

      return {
        account,
        status: status === expectedValue,
        skipped: false,
      };
    } catch {
      return {
        account,
        status: false,
        skipped: false,
      };
    }
  };

  /** Handle Form Submit */
  const handleFormSubmit = async (data: StatusCheckFormData) => {
    /* StatusCheck Accounts */
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await mutation.mutateAsync({
      accounts: selectedAccounts,
      expectedValue: data.value,
    });

    toast.success("Status check completed.");
  };

  return (
    <InnerPageLayout title="Status Check" className="gap-2">
      {mutation.isSuccess ? (
        <>
          {/* Status Check Summary */}
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">
              Status checks completed successfully!
            </p>
            <p className="text-blue-300">
              Accounts: ({mutation.data?.successfulChecks} /{" "}
              {mutation.data?.totalAccounts})
            </p>

            <p className="text-rose-300">
              Failed: ({mutation.data?.failedChecks} /{" "}
              {mutation.data?.totalAccounts})
            </p>

            <p className="text-yellow-300">
              Skipped: {mutation.data?.skippedChecks}
            </p>
          </div>
        </>
      ) : (
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col gap-2"
          >
            {/* Value */}
            <Controller
              name="value"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="value">Expected Value</Label>
                  <Input
                    {...field}
                    disabled={mutation.isPending}
                    id="value"
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Expected Value"
                  />
                  <FormFieldError message={fieldState.error?.message} />
                </div>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Checking..." : "Check Status"}
            </Button>
          </form>
        </FormProvider>
      )}

      {/* Progress Bar */}
      {mutation.isPending && <Progress max={target} current={progress} />}

      {/* Accounts Chooser */}
      <AccountsChooser
        {...accountsChooser}
        disabled={mutation.isPending}
        results={mutation.data?.results || undefined}
      />
    </InnerPageLayout>
  );
};

export { StatusCheck };

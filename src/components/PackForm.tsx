import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { Progress } from "../components/Progress";
import { toast } from "react-hot-toast";
import { usePackMutation } from "../hooks/usePackMutation";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { Dialog } from "radix-ui";
import { PackResults } from "../components/PackResults";
import { Label } from "../components/Label";
import { Slider } from "../components/Slider";
import { usePendingActivity } from "../hooks/usePendingActivity";
import { formatCurrency } from "../lib/utils";
import useLocationToggle from "../hooks/useLocationToggle";
import type { useAccountsSelector } from "../hooks/useAccountsSelector";
import { LabelToggle } from "./LabelToggle";

import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";
import { FormFieldError } from "./FormFieldError";

interface PackFormProps {
  selector: ReturnType<typeof useAccountsSelector>;
}

/** Pack Form Schema */
const PackFormSchema = yup
  .object({
    delay: yup
      .number()
      .required()
      .min(5)
      .max(60)
      .default(20)
      .label("Delay (seconds)"),

    force: yup.boolean().required().label("Force"),
  })
  .required();

/** Pack Page Component */
const PackForm = ({ selector }: PackFormProps) => {
  const [showResults, setShowResults] = useLocationToggle(
    "pack-results-dialog"
  );

  /** Form */
  const form = useForm({
    defaultValues: {
      delay: 20,
      force: false,
    },
    resolver: yupResolver(PackFormSchema),
  });

  const { mutation, target, progress } = usePackMutation();

  const handleFormSubmit = async (data: { delay: number; force: boolean }) => {
    /* Pack Accounts */
    if (selector.selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    /* Execute Pack Mutation */
    const { totalWithdrawn } = await mutation.mutateAsync({
      accounts: selector.selectedAccounts,
      delay: data.delay,
      force: data.force,
    });

    /* Show Success Toast */
    toast.success(
      `Packing completed! Total withdrawn: ${formatCurrency(
        totalWithdrawn,
        3
      )} USDT`
    );
  };

  /** Prevent auto-logout when viewing results */
  usePendingActivity(showResults);

  return (
    <div className="flex flex-col gap-2">
      {mutation.isSuccess && (
        <>
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Packing completed successfully!</p>
            <p className="text-blue-300">
              Accounts: ({mutation.data?.packedAccounts} /{" "}
              {mutation.data?.totalAccounts})
            </p>
            <p className="text-lime-300">
              Total Withdrawn:{" "}
              {formatCurrency(mutation.data?.totalWithdrawn, 3)} USDT
            </p>
          </div>

          {/* Pack Results Dialog */}
          <Dialog.Root open={showResults} onOpenChange={setShowResults}>
            <Dialog.Trigger asChild>
              <Button className="mx-auto">View Detailed Results</Button>
            </Dialog.Trigger>
            <PackResults results={mutation.data.results} />
          </Dialog.Root>
        </>
      )}

      {/* Pack Button */}
      {!mutation.isSuccess && (
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col gap-4"
          >
            <p className="text-center text-neutral-400 text-sm">
              This will pack the selected accounts.
            </p>
            <Button disabled={mutation.isPending} type="submit">
              <HiOutlineCurrencyDollar className="size-5" />
              {mutation.isPending ? "Packing..." : "Pack Selected Accounts"}
            </Button>

            <Controller
              name="delay"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1">
                  <Label className="text-center">
                    Delay per transaction (seconds)
                  </Label>
                  <Slider
                    min={0}
                    max={60}
                    step={5}
                    value={[field.value]}
                    onValueChange={([value]) => field.onChange(value)}
                    disabled={mutation.isPending}
                  />
                  <p className="text-xs text-center text-neutral-400">
                    {field.value} seconds
                  </p>
                  <FormFieldError message={fieldState.error?.message} />
                </div>
              )}
            />

            {/* Force */}
            <Controller
              name="force"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <LabelToggle
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={mutation.isPending}
                  >
                    Force Packing
                  </LabelToggle>
                  <FormFieldError message={fieldState.error?.message} />
                  <p className="text-xs text-neutral-400 text-center px-4">
                    <span className="text-red-500 font-bold">DANGER:</span> If
                    enabled, the tool will force packing of accounts even if
                    they do not meet the usual criteria.
                  </p>
                </div>
              )}
            />
          </form>
        </FormProvider>
      )}

      {/* Progress Bar */}
      {mutation.isPending && <Progress max={target} current={progress} />}

      {/* Accounts Chooser */}
      <AccountsChooser
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </div>
  );
};

export { PackForm };

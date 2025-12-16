import { Button } from "../components/Button";
import { Controller, FormProvider } from "react-hook-form";
import { Input } from "../components/Input";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { AccountsChooser } from "../components/AccountsChooser";
import { formatCurrency } from "../lib/utils";
import { Progress } from "../components/Progress";
import { PlanResults } from "../components/PlanResults";
import { LabelToggle } from "./LabelToggle";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { usePlanCreator } from "../hooks/usePlanCreator";
import type { PlanFileContent } from "../types";

/** Plan Creator Component */
const PlanCreator = ({
  onCreate,
}: {
  onCreate: (data: PlanFileContent) => void;
}) => {
  const { form, mutation, handleFormSubmit, selector, progress, target } =
    usePlanCreator(onCreate);

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
                {mutation.data.stats.firstActivityCount}
              </span>{" "}
              /{" "}
              <span className="text-amber-300">
                {mutation.data.stats.secondActivityCount}
              </span>{" "}
              /{" "}
              <span className="text-red-300">
                {mutation.data.stats.consistentActivityCount}
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
                  <Label htmlFor="total">
                    <img src={USDTIcon} className="size-4 inline-block" /> Total
                    Amount
                  </Label>
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
            <AccountsChooser {...selector} disabled={mutation.isPending} />
          </form>
        </FormProvider>
      )}
    </div>
  );
};

export { PlanCreator };

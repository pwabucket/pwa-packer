import { FormProvider } from "react-hook-form";
import type { useAccountsSelector } from "../hooks/useAccountsSelector";
import type { SendFormData, useSendForm } from "../hooks/useSendForm";
import type { useSendMutation } from "../hooks/useSendMutation";
import { Dialog } from "radix-ui";
import useLocationToggle from "../hooks/useLocationToggle";
import { Button } from "./Button";
import { SendResults } from "../pages/SendResults";
import { formatCurrency } from "../lib/utils";
import { SendFormFields } from "./SendFormFields";
import { Progress } from "./Progress";
import { AccountsChooser } from "./AccountsChooser";
import { usePendingActivity } from "../hooks/usePendingActivity";

interface SendFormProps {
  handleFormSubmit: (data: SendFormData) => void;
  selector: ReturnType<typeof useAccountsSelector>;
  mutation: ReturnType<typeof useSendMutation>;
  form: ReturnType<typeof useSendForm>;
  showAmount?: boolean;
  showDifference?: boolean;
}

const SendForm = ({
  handleFormSubmit,
  selector,
  mutation: { mutation, progress, target },
  form: { form, append, remove },
  showAmount,
  showDifference,
}: SendFormProps) => {
  const [showResults, setShowResults] = useLocationToggle(
    "send-results-dialog"
  );

  /** Prevent auto-logout when viewing results */
  usePendingActivity(showResults);

  return (
    <div className="flex flex-col gap-2">
      {/* Send Results Summary / Dialog */}
      {mutation.isSuccess && (
        <>
          {/* Send Results Summary */}
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Transfers completed successfully!</p>
            <p className="text-blue-300">
              Accounts: ({mutation.data?.successfulSends} /{" "}
              {mutation.data?.totalAccounts})
            </p>

            <p className="text-rose-300">
              Validations: ({mutation.data?.successfulValidations} /{" "}
              {mutation.data?.totalAccounts})
            </p>

            <p className="text-lime-300">
              Total Amount:{" "}
              {formatCurrency(mutation.data?.totalAmountSent || 0, 3)} USDT
            </p>
          </div>

          {/* Send Results Dialog */}
          <Dialog.Root open={showResults} onOpenChange={setShowResults}>
            <Dialog.Trigger asChild>
              <Button className="mx-auto">View Detailed Results</Button>
            </Dialog.Trigger>
            <SendResults results={mutation.data.results} />
          </Dialog.Root>
        </>
      )}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4"
        >
          {!mutation.isSuccess && (
            <>
              <p className="text-center text-sm text-blue-400">
                A transfer will be initiated from each account to their
                respective deposit addresses.
              </p>

              {/** Send Form Fields */}
              <SendFormFields
                append={append}
                remove={remove}
                disabled={mutation.isPending}
                showAmount={showAmount}
                showDifference={showDifference}
              />
            </>
          )}

          {/* Progress Bar */}
          {mutation.isPending && <Progress max={target} current={progress} />}

          {/* Accounts Chooser */}
          <AccountsChooser
            {...selector}
            disabled={mutation.isPending}
            results={mutation.data?.results}
          />
        </form>
      </FormProvider>
    </div>
  );
};

export { SendForm };

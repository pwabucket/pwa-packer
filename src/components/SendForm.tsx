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
  sendMutation: ReturnType<typeof useSendMutation>;
  sendForm: ReturnType<typeof useSendForm>;
  showAddress?: boolean;
  showAmount?: boolean;
  showDifference?: boolean;
  showValidate?: boolean;
  showSkipValidated?: boolean;
  showAllowLesserAmount?: boolean;
  showRefill?: boolean;
}

const SendForm = ({
  handleFormSubmit,
  selector,
  sendMutation,
  sendForm,
  showAddress,
  showAmount,
  showDifference,
  showValidate,
  showSkipValidated,
  showAllowLesserAmount,
  showRefill,
}: SendFormProps) => {
  const [showResults, setShowResults] = useLocationToggle(
    "send-results-dialog"
  );

  /** Prevent auto-logout when viewing results */
  usePendingActivity(showResults);

  return (
    <div className="flex flex-col gap-2">
      {/* Send Results Summary / Dialog */}
      {sendMutation.mutation.isSuccess && (
        <>
          {/* Send Results Summary */}
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Transfers completed successfully!</p>
            <p className="text-blue-300">
              Accounts: ({sendMutation.mutation.data?.successfulSends} /{" "}
              {sendMutation.mutation.data?.totalAccounts})
            </p>

            <p className="text-rose-300">
              Validations: ({sendMutation.mutation.data?.successfulValidations}{" "}
              / {sendMutation.mutation.data?.totalAccounts})
            </p>

            <p className="text-lime-300">
              Total Amount:{" "}
              {formatCurrency(
                sendMutation.mutation.data?.totalAmountSent || 0,
                3
              )}{" "}
              USDT
            </p>
          </div>

          {/* Send Results Dialog */}
          <Dialog.Root open={showResults} onOpenChange={setShowResults}>
            <Dialog.Trigger asChild>
              <Button className="mx-auto">View Detailed Results</Button>
            </Dialog.Trigger>
            <SendResults results={sendMutation.mutation.data.results} />
          </Dialog.Root>
        </>
      )}

      <FormProvider {...sendForm.form}>
        <form
          onSubmit={sendForm.form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4"
        >
          {!sendMutation.mutation.isSuccess && (
            <>
              <p className="text-center text-sm text-blue-400">
                A transfer will be initiated from each account to their
                respective deposit addresses.
              </p>

              {/** Send Form Fields */}
              <SendFormFields
                sendForm={sendForm}
                disabled={sendMutation.mutation.isPending}
                showAddress={showAddress}
                showRefill={showRefill}
                showAmount={showAmount}
                showDifference={showDifference}
                showValidate={showValidate}
                showSkipValidated={showSkipValidated}
                showAllowLesserAmount={showAllowLesserAmount}
              />
            </>
          )}

          {/* Progress Bar */}
          {sendMutation.mutation.isPending && (
            <Progress
              max={sendMutation.target}
              current={sendMutation.progress}
            />
          )}

          {/* Accounts Chooser */}
          <AccountsChooser
            {...selector}
            disabled={sendMutation.mutation.isPending}
            results={sendMutation.mutation.data?.results}
          />
        </form>
      </FormProvider>
    </div>
  );
};

export { SendForm };

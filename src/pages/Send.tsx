import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { usePassword } from "../hooks/usePassword";
import { FormProvider } from "react-hook-form";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { AccountsChooser } from "../components/AccountsChooser";
import { Dialog } from "radix-ui";
import { SendResults } from "./SendResults";
import toast from "react-hot-toast";
import { SendFormFields } from "../components/SendFormFields";
import { useSendForm, type SendFormData } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";
import { Progress } from "../components/Progress";
import { Button } from "../components/Button";
import { usePendingActivity } from "../hooks/usePendingActivity";
import { formatCurrency } from "../lib/utils";
import useLocationToggle from "../hooks/useLocationToggle";

/** Send Page Component */
const Send = () => {
  const [showResults, setShowResults] = useLocationToggle(
    "send-results-dialog"
  );
  const password = usePassword();

  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  /** Form */
  const { form, append, remove } = useSendForm();

  /* Mutation for Sending Funds */
  const { mutation, target, progress } = useSendMutation();

  /** Handle Form Submit */
  const handleFormSubmit = async (data: SendFormData) => {
    /* Validate Accounts */
    if (selectedAccounts.length === 0) {
      toast.error("No accounts available to send funds from.");
      return;
    }

    /* Validate Password */
    if (!password) {
      toast.error("Password is not set in memory.");
      return;
    }

    /* Validate Target Characters */
    if (data.targetCharacters.length === 0) {
      toast.error("Please select at least one target character.");
      return;
    }

    const { results } = await mutation.mutateAsync({
      ...data,
      accounts: selectedAccounts,
    });

    /* Count Successful Sends */
    const successfulSends = results.filter((result) => result.status).length;

    /* Show Summary Alert */
    toast.success(
      `Successfully sent from ${successfulSends}/${selectedAccounts.length} accounts.`
    );

    /* Reset Form */
    form.reset();

    return results;
  };

  /** Prevent auto-logout when viewing results */
  usePendingActivity(showResults);

  return (
    <InnerPageLayout title="Send" className="gap-2">
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
              />
            </>
          )}

          {/* Progress Bar */}
          {mutation.isPending && <Progress max={target} current={progress} />}

          {/* Accounts Chooser */}
          <AccountsChooser
            {...accountsChooser}
            disabled={mutation.isPending}
            results={mutation.data?.results}
          />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Send };

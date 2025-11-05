import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { usePassword } from "../hooks/usePassword";
import { FormProvider } from "react-hook-form";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { AccountsChooser } from "../components/AccountsChooser";
import { Dialog } from "radix-ui";
import { SendResults } from "./SendResults";
import toast from "react-hot-toast";
import { SendFormFields } from "../components/SendFormFields";
import { useSendForm } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";

/** Send Form Data Interface */
interface SendFormData {
  amount: string;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
}

/** Send Page Component */
const Send = () => {
  const password = usePassword();

  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  /** Form */
  const { form, append, remove } = useSendForm();

  /* Mutation for Sending Funds */
  const mutation = useSendMutation();

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

    const results = await mutation.mutateAsync({
      accounts: selectedAccounts,
      amount: data.amount,
      targetCharacters: data.targetCharacters,
      gasLimit: data.gasLimit,
    });

    /* Count Successful Sends */
    const successfulSends = results.filter((result) => result.status).length;

    /* Show Summary Alert */
    toast.success(
      `Successfully sent from ${successfulSends}/${selectedAccounts.length} accounts.`
    );

    return results;
  };

  return (
    <InnerPageLayout title="Send" className="gap-2">
      {mutation.isSuccess && mutation.data ? (
        <Dialog.Root open onOpenChange={() => mutation.reset()}>
          <SendResults results={mutation.data} />
        </Dialog.Root>
      ) : null}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4"
        >
          <p className="text-center text-blue-500">
            A transfer will be initiated from each account to their respective
            deposit addresses.
          </p>

          {/** Send Form Fields */}
          <SendFormFields
            append={append}
            remove={remove}
            disabled={mutation.isPending}
          />

          {/* Accounts Chooser */}
          <AccountsChooser {...accountsChooser} disabled={mutation.isPending} />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Send };

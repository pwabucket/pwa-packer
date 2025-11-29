import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import toast from "react-hot-toast";
import { useSendForm, type SendFormData } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";
import { SendForm } from "../components/SendForm";

/** Send Page Component */
const Send = () => {
  const selector = useAccountsChooser();
  const { selectedAccounts } = selector;

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

  return (
    <InnerPageLayout title="Send" className="gap-2">
      <SendForm
        handleFormSubmit={handleFormSubmit}
        selector={selector}
        mutation={{ mutation, target, progress }}
        form={{ form, append, remove }}
      />
    </InnerPageLayout>
  );
};

export { Send };

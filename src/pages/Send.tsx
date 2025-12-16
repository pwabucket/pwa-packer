import { InnerPageLayout } from "../layouts/InnerPageLayout";
import toast from "react-hot-toast";
import { useSendForm, type SendFormData } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";
import { SendForm } from "../components/SendForm";
import { useProviderAccountsChooser } from "../hooks/useProviderAccountsChooser";

/** Send Page Component */
const Send = () => {
  const selector = useProviderAccountsChooser();

  /** Send Form */
  const sendForm = useSendForm();

  /* Send Mutation */
  const sendMutation = useSendMutation();

  /** Handle Form Submit */
  const handleFormSubmit = async (data: SendFormData) => {
    /* Validate Accounts */
    if (selector.selectedAccounts.length === 0) {
      toast.error("No accounts available to send funds from.");
      return;
    }

    /* Validate Target Characters */
    if (data.targetCharacters.length === 0) {
      toast.error("Please select at least one target character.");
      return;
    }

    const { results } = await sendMutation.mutation.mutateAsync({
      ...data,
      accounts: selector.selectedAccounts.map((account) => ({
        account,
        receiver: account.depositAddress,
      })),
    });

    /* Count Successful Sends */
    const successfulSends = results.filter((result) => result.status).length;

    /* Show Summary Alert */
    toast.success(
      `Successfully sent from ${successfulSends}/${selector.selectedAccounts.length} accounts.`
    );

    /* Reset Form */
    sendForm.form.reset();

    return results;
  };

  return (
    <InnerPageLayout title="Send" className="gap-2">
      <SendForm
        handleFormSubmit={handleFormSubmit}
        selector={selector}
        sendMutation={sendMutation}
        sendForm={sendForm}
        showAddress={false}
      />
    </InnerPageLayout>
  );
};

export { Send };

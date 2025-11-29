import { useMemo } from "react";
import type { PlanFileContent } from "../types";
import { useSendForm, type SendFormData } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";
import toast from "react-hot-toast";
import { useAccountsSelector } from "../hooks/useAccountsSelector";
import { SendForm } from "./SendForm";
import { PlanInfo } from "./PlanInfo";

const PlanSender = ({ plan }: { plan: PlanFileContent }) => {
  const accounts = useMemo(() => plan.results.map((p) => p.account), [plan]);
  const selector = useAccountsSelector(accounts);

  /** Form */
  const sendForm = useSendForm({
    amount: plan.parameters.maximum,
  });

  /* Mutation for Sending Funds */
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

    /* Send Funds */
    await sendMutation.mutation.mutateAsync({
      ...data,
      accounts: selector.selectedAccounts,
    });

    /* Show Summary Alert */
    toast.success("Transfer Submitted Successfully.");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Plan Info */}
      <PlanInfo plan={plan} />

      <SendForm
        handleFormSubmit={handleFormSubmit}
        selector={selector}
        mutation={sendMutation}
        form={sendForm}
        showAmount={false}
        showDifference={false}
        showSkipValidated={false}
      />
    </div>
  );
};

export { PlanSender };

import { useMemo } from "react";
import type { PlanFileContent } from "../types";
import { useSendForm, type SendFormData } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";
import toast from "react-hot-toast";
import { useAccountsSelector } from "../hooks/useAccountsSelector";
import { SendForm } from "./SendForm";

const PlanSender = ({ plan }: { plan: PlanFileContent }) => {
  const accounts = useMemo(() => plan.results.map((p) => p.account), [plan]);
  const selector = useAccountsSelector(accounts);

  /** Form */
  const { form, append, remove } = useSendForm({
    amount: plan.parameters.maximum,
  });

  /* Mutation for Sending Funds */
  const { mutation, target, progress } = useSendMutation();

  /** Handle Form Submit */
  const handleFormSubmit = async (data: SendFormData) => {
    /* Validate Target Characters */
    if (data.targetCharacters.length === 0) {
      toast.error("Please select at least one target character.");
      return;
    }

    /* Send Funds */
    await mutation.mutateAsync({
      ...data,
      accounts: selector.selectedAccounts,
    });

    /* Show Summary Alert */
    toast.success("Transfer Submitted Successfully.");
  };

  return (
    <SendForm
      handleFormSubmit={handleFormSubmit}
      selector={selector}
      mutation={{ mutation, target, progress }}
      form={{ form, append, remove }}
      showAmount={false}
      showDifference={false}
    />
  );
};

export { PlanSender };

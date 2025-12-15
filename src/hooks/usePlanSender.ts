import { useEffect, useMemo } from "react";
import type { PlanFileContent } from "../types";
import { useSendForm, type SendFormData } from "./useSendForm";
import { useSendMutation } from "./useSendMutation";
import toast from "react-hot-toast";
import { useAccountsSelector } from "./useAccountsSelector";

const usePlanSender = (plan: PlanFileContent) => {
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
      accounts: selector.selectedAccounts.map((account) => ({
        account,
        receiver: account.depositAddress,
      })),
    });

    /* Show Summary Alert */
    toast.success("Transfer Submitted Successfully.");
  };

  const setValue = sendForm.form.setValue;
  const toggleAllAccounts = selector.toggleAllAccounts;

  /** Initialize Form and Selection on Plan Change */
  useEffect(() => {
    if (plan) {
      setValue("amount", plan.parameters.maximum);
      toggleAllAccounts(true);
    }
  }, [plan, setValue, toggleAllAccounts]);

  return {
    plan,
    selector,
    sendForm,
    sendMutation,
    handleFormSubmit,
  };
};

export { usePlanSender };

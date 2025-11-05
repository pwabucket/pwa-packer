import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { FormProvider } from "react-hook-form";
import { useAppStore } from "../store/useAppStore";
import { AccountsChooser } from "../components/AccountsChooser";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import toast from "react-hot-toast";
import { WithdrawFormFields } from "../components/WithdrawFormFields";
import {
  useWithdrawalForm,
  type WithdrawFormData,
} from "../hooks/useWithdrawalForm";
import { useWithdrawalMutation } from "../hooks/useWithdrawalMutation";

const Withdraw = () => {
  const password = useAppStore((state) => state.password);

  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  /** Form */
  const { form } = useWithdrawalForm();

  /** Mutation */
  const mutation = useWithdrawalMutation();

  const handleFormSubmit = async (data: WithdrawFormData) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected for withdrawal.");
      return;
    }

    /* Validate Password */
    if (!password) {
      toast.error("Password is not set in memory.");
      return;
    }

    const { successfulSends, totalSentValue } = await mutation.mutateAsync({
      accounts: selectedAccounts,
      amount: data.amount,
      address: data.address,
    });

    /* Show Summary Alert */
    toast.success(
      `Successfully sent $${totalSentValue} from ${successfulSends}/${selectedAccounts.length} accounts.`
    );
  };

  return (
    <InnerPageLayout title="Withdraw Funds">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          <WithdrawFormFields disabled={mutation.isPending} />

          {/* Accounts Chooser */}
          <AccountsChooser {...accountsChooser} disabled={mutation.isPending} />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Withdraw };

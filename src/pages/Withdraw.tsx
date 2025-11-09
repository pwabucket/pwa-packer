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
import { Progress } from "../components/Progress";

const Withdraw = () => {
  const password = useAppStore((state) => state.password);

  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  /** Form */
  const { form } = useWithdrawalForm();

  /** Mutation */
  const { mutation, progress } = useWithdrawalMutation();

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

    /* Reset Form */
    form.reset();
  };

  return (
    <InnerPageLayout title="Withdraw Funds" className="gap-2">
      {mutation.isSuccess && (
        <div className="flex flex-col text-center text-sm">
          <p className="text-green-400">Withdrawal completed successfully!</p>
          <p className="text-blue-300">
            Accounts: ({mutation.data?.successfulSends} /{" "}
            {mutation.data?.totalAccounts})
          </p>
          <p className="text-lime-300">
            Total Amount:{" "}
            {Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(mutation.data?.totalSentValue || 0)}{" "}
            USDT
          </p>
        </div>
      )}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Withdraw Form Fields */}
          <WithdrawFormFields disabled={mutation.isPending} />

          {/* Progress Bar */}
          {mutation.isPending && (
            <Progress max={selectedAccounts.length} current={progress} />
          )}

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

export { Withdraw };

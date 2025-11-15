import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { FormProvider } from "react-hook-form";
import { useAppStore } from "../store/useAppStore";
import { AccountsChooser } from "../components/AccountsChooser";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import toast from "react-hot-toast";
import { RefillFormFields } from "../components/RefillFormFields";
import { useRefillForm, type RefillFormData } from "../hooks/useRefillForm";
import { useRefillMutation } from "../hooks/useRefillMutation";
import { Progress } from "../components/Progress";

const Refill = () => {
  const password = useAppStore((state) => state.password);

  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  /** Form */
  const { form } = useRefillForm();

  /* Watch Token */
  const token = form.watch("token");

  /** Mutation */
  const { mutation, target, progress } = useRefillMutation();

  const handleFormSubmit = async (data: RefillFormData) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected for refill.");
      return;
    }

    /* Validate Password */
    if (!password) {
      toast.error("Password is not set in memory.");
      return;
    }

    await mutation.mutateAsync({
      accounts: selectedAccounts,
      amount: data.amount,
      token: data.token,
    });

    /* Show Summary Alert */
    toast.success("Successfully refilled accounts");

    /* Reset Form */
    form.reset();
  };

  return (
    <InnerPageLayout title="Refill" className="gap-2">
      {mutation.isSuccess && (
        <div className="flex flex-col text-center text-sm">
          <p className="text-green-400">Refill completed successfully!</p>
          <p className="text-blue-300">
            Transactions: ({mutation.data?.successfulSends} /{" "}
            {mutation.data?.totalTransactions})
          </p>
          <p className="text-lime-300">
            Total Amount: {mutation.data?.totalSentValue?.toFixed(8)}{" "}
            {token.toUpperCase()}
          </p>
        </div>
      )}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Refill Form Fields */}
          <RefillFormFields token={token} disabled={mutation.isPending} />

          {/* Progress Bar */}
          {mutation.isPending && <Progress max={target} current={progress} />}

          {/* Accounts Chooser */}
          <AccountsChooser {...accountsChooser} disabled={mutation.isPending} />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Refill };

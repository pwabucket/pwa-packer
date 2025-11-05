import { FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { WithdrawFormFields } from "../components/WithdrawFormFields";
import {
  useWithdrawalForm,
  type WithdrawFormData,
} from "../hooks/useWithdrawalForm";
import { useWithdrawalMutation } from "../hooks/useWithdrawalMutation";
import type { Account } from "../types";

const AccountDialogWithdrawTab = ({ account }: { account: Account }) => {
  /** Form */
  const { form } = useWithdrawalForm();

  /** Mutation */
  const mutation = useWithdrawalMutation();

  const handleFormSubmit = async (data: WithdrawFormData) => {
    const { totalSentValue } = await mutation.mutateAsync({
      accounts: [account],
      amount: data.amount,
      address: data.address,
    });

    /* Show Summary Alert */
    toast.success(`Successfully sent $${totalSentValue}.`);
  };

  return (
    <>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          <p className="text-center text-neutral-400 text-sm bg-neutral-800/50 p-4 rounded-lg break-all">
            A withdrawal will be initiated from{" "}
            <span className="text-lime-300 text-xs">
              W: {account.walletAddress}
            </span>
            .
          </p>

          <WithdrawFormFields disabled={mutation.isPending} />
        </form>
      </FormProvider>
    </>
  );
};

export { AccountDialogWithdrawTab };

import type { Account } from "../types";
import { usePassword } from "../hooks/usePassword";
import { useSendForm, type SendFormData } from "../hooks/useSendForm";
import { useSendMutation } from "../hooks/useSendMutation";
import toast from "react-hot-toast";
import { FormProvider } from "react-hook-form";
import { SendFormFields } from "./SendFormFields";
import { SendResultsAccordion } from "./SendResultsAccordion";
import { MdReceipt } from "react-icons/md";

const AccountDialogSendTab = ({ account }: { account: Account }) => {
  const password = usePassword();

  /** Form */
  const { form, append, remove } = useSendForm();

  /* Mutation for Sending Funds */
  const { mutation } = useSendMutation();

  /** Handle Form Submit */
  const handleFormSubmit = async (data: SendFormData) => {
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

    await mutation.mutateAsync({
      ...data,
      accounts: [account],
    });

    /* Show Summary Alert */
    toast.success("Transfer Submitted Successfully.");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Send Results Accordion */}
      {mutation.isSuccess && mutation.data ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-yellow-500 text-center">
            <MdReceipt className="inline-block mr-1" /> Transfer Receipt
          </h2>
          <SendResultsAccordion results={mutation.data.results} />
        </div>
      ) : null}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4"
        >
          <p className="text-center text-neutral-400 text-sm bg-neutral-800/50 p-4 rounded-lg break-all">
            A transfer will be initiated from{" "}
            <span className="text-lime-300 text-xs">
              W: {account.walletAddress}
            </span>{" "}
            to{" "}
            <span className="text-orange-300 text-xs">
              D: {account.depositAddress}
            </span>
            .
          </p>

          {/** Send Form Fields */}
          <SendFormFields
            append={append}
            remove={remove}
            disabled={mutation.isPending}
            showDifference={false}
          />
        </form>
      </FormProvider>
    </div>
  );
};

export { AccountDialogSendTab };

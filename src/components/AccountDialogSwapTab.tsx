import { FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { SwapFormFields } from "./SwapFormFields";
import { useSwapForm, type SwapFormData } from "../hooks/useSwapForm";
import { useSwapMutation } from "../hooks/useSwapMutation";
import { useSwapQuote } from "../hooks/useSwapQuote";
import type { Account } from "../types";

const AccountDialogSwapTab = ({ account }: { account: Account }) => {
  /** Form */
  const { form } = useSwapForm();

  /* Watch fields */
  const direction = form.watch("direction");
  const amount = form.watch("amount");
  const slippage = form.watch("slippage");

  /** Quote */
  const { data: quote, isLoading: isQuoteLoading } = useSwapQuote({
    account,
    direction,
    amount,
    slippage,
  });

  /** Mutation */
  const { mutation } = useSwapMutation();

  const handleFormSubmit = async (data: SwapFormData) => {
    try {
      const result = await mutation.mutateAsync({
        account,
        direction: data.direction,
        amount: data.amount,
        slippage: data.slippage,
      });

      toast.success(
        `Swapped ${result.amountIn} ${
          data.direction === "BNB_TO_USDT" ? "BNB" : "USDT"
        } → ${result.amountOut} ${
          data.direction === "BNB_TO_USDT" ? "USDT" : "BNB"
        }`,
      );
    } catch (error: any) {
      console.error("Swap failed:", error);
      toast.error(
        "Swap failed: An error occurred during the swap. Please try again.",
      );
    }
  };

  return (
    <>
      {mutation.isSuccess && (
        <div className="flex flex-col text-center text-sm mb-4">
          <p className="text-green-400">Swap completed!</p>
          <p className="text-blue-300 text-xs break-all">
            Tx: {mutation.data?.txHash}
          </p>
          <p className="text-lime-300">
            {mutation.data?.amountIn}{" "}
            {mutation.data?.direction === "BNB_TO_USDT" ? "BNB" : "USDT"} →{" "}
            {mutation.data?.amountOut}{" "}
            {mutation.data?.direction === "BNB_TO_USDT" ? "USDT" : "BNB"}
          </p>
        </div>
      )}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          <p className="text-center text-neutral-400 text-sm bg-neutral-800/50 p-4 rounded-lg break-all">
            A swap will be initiated from{" "}
            <span className="text-lime-300 text-xs">
              W: {account.walletAddress}
            </span>
            .
          </p>

          <SwapFormFields
            direction={direction}
            disabled={mutation.isPending}
            quote={quote}
            isQuoteLoading={isQuoteLoading}
          />
        </form>
      </FormProvider>
    </>
  );
};

export { AccountDialogSwapTab };

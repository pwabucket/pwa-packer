import BNBIcon from "../assets/bnb-bnb-logo.svg";
import useAppStore from "../store/useAppStore";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { TextArea } from "../components/TextArea";
import { getWalletAddressFromPrivateKey } from "../lib/utils";
import { BASE_GAS_PRICE, GAS_LIMIT_NATIVE, RPC } from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import * as yup from "yup";

/** Parse Amount to Smallest Unit (18 Decimals) */
const parseToSmallUnit = (amount: number) => {
  return parseFloat(amount.toFixed(18));
};

/** Calculate Required BNB for Gas and Transaction Fees */
const calculateRequiredBNB = (amount: string, accountCount: number) => {
  const amountToSplit = parseFloat(amount);
  if (amountToSplit > 0 && accountCount > 0) {
    /* Calculate Required Gas Amount */
    const requiredGasAmount =
      BigInt(accountCount) * BASE_GAS_PRICE * GAS_LIMIT_NATIVE;

    /* Convert to Ether */
    const gasAmountInEther = ethers.formatEther(requiredGasAmount);

    /* Total Amount */
    return parseToSmallUnit(amountToSplit + parseFloat(gasAmountInEther));
  }
  return 0;
};

/** Gas Form Schema */
const GasFormSchema = yup
  .object({
    amount: yup.string().required().label("Amount"),
    privateKey: yup.string().required().label("Private Key"),
  })
  .required();

/** Gas Form Data */
interface GasFormData {
  amount: string;
  privateKey: string;
}

/** Gas Page Component */
const Gas = () => {
  const accounts = useAppStore((state) => state.accounts);

  /** Form */
  const form = useForm<GasFormData>({
    resolver: yupResolver(GasFormSchema),
    defaultValues: {
      amount: "",
      privateKey: "",
    },
  });

  /** Mutation */
  const mutation = useMutation({
    mutationKey: ["gasSplit"],
    mutationFn: async (data: GasFormData) => {
      const perAccountAmount = parseFloat(data.amount) / accounts.length;
      const value = ethers.parseEther(perAccountAmount.toFixed(18));

      const provider = new ethers.JsonRpcProvider(RPC);
      const wallet = new ethers.Wallet(data.privateKey, provider);
      const senderAddress = await wallet.getAddress();

      /* Get Chain ID and Starting Nonce */
      const { chainId } = await provider.getNetwork();
      let nonce = await provider.getTransactionCount(wallet.address, "pending");

      /* Send Transactions to Each Account */
      const results = [];
      let successfulTxCount = 0;

      for (const account of accounts) {
        /* Log Sending Info */
        console.log(
          `Sending ${perAccountAmount} BNB to account ${account.title} (${account.walletAddress}) from ${senderAddress}...`
        );

        const tx = {
          to: account.walletAddress,
          gasLimit: GAS_LIMIT_NATIVE,
          gasPrice: BASE_GAS_PRICE,
          chainId,
          value,
          nonce,
        };
        const signedTx = await wallet.signTransaction(tx);
        const broadcast = await provider.broadcastTransaction(signedTx);
        const receipt = await broadcast.wait();

        results.push({
          status: true,
          account,
          tx,
          receipt,
        });
        successfulTxCount++;
        nonce++;
      }

      alert(`${successfulTxCount} transactions sent successfully.`);

      return results;
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: GasFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <InnerPageLayout title="Gas">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Amount */}
          <Controller
            name="amount"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">
                  <img src={BNBIcon} className="size-4 inline-block" /> Amount
                  of BNB to Split
                </Label>
                <Input
                  {...field}
                  id="amount"
                  autoComplete="off"
                  placeholder="Amount"
                  disabled={mutation.isPending}
                />

                <div className="flex flex-col">
                  {/* Total Required BNB */}
                  <p className="text-sm px-4 text-yellow-500 text-center font-mono wrap-break-word">
                    Total BNB Required:{" "}
                    {calculateRequiredBNB(field.value, accounts.length)}
                  </p>

                  {/* Each Account's Share */}
                  <p className="text-sm px-4 text-lime-500 text-center font-mono wrap-break-word">
                    Each:{" "}
                    {accounts.length > 0
                      ? parseToSmallUnit(field.value / accounts.length)
                      : 0}{" "}
                    BNB
                  </p>
                </div>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Private Key */}
          <Controller
            name="privateKey"
            render={({ field, fieldState }) => (
              <>
                <Label htmlFor="privateKey">Private Key</Label>
                <TextArea
                  {...field}
                  disabled={mutation.isPending}
                  id="privateKey"
                  autoComplete="off"
                  placeholder="Private Key"
                  rows={4}
                />
                <p className="text-sm px-4 text-blue-500 text-center font-mono wrap-break-word">
                  {getWalletAddressFromPrivateKey(field.value)}
                </p>
                <p className="text-center text-xs text-neutral-400">
                  BNB will be sent from this address.
                </p>
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Processing..." : "Send Gas to All Accounts"}
          </Button>
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Gas };

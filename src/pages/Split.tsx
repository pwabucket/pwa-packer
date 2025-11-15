import BNBIcon from "../assets/bnb-bnb-logo.svg";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { TextArea } from "../components/TextArea";
import { getWalletAddressFromPrivateKey } from "../lib/utils";
import { BASE_GAS_PRICE, GAS_LIMIT_NATIVE } from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import * as yup from "yup";
import { AccountsChooser } from "../components/AccountsChooser";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import toast from "react-hot-toast";
import { useProgress } from "../hooks/useProgress";
import { Progress } from "../components/Progress";
import { useState } from "react";
import { ParcelDialog } from "../components/ParcelDialog";
import { usePendingActivity } from "../hooks/usePendingActivity";
import { TokenButton } from "../components/TokenButton";
import { launchParcel } from "../lib/parcel";

/** Parse Amount to Smallest Unit (18 Decimals) */
const parseToSmallUnit = (amount: number) => {
  return parseFloat(amount.toFixed(18));
};

/** Calculate Required BNB for Split and Transaction Fees */
const calculateRequiredBNB = (amount: string, accountCount: number) => {
  const amountToSplit = parseFloat(amount);
  if (amountToSplit > 0 && accountCount > 0) {
    /* Calculate Required Split Amount */
    const requiredSplitAmount =
      BigInt(accountCount) * BASE_GAS_PRICE * GAS_LIMIT_NATIVE;

    /* Convert to Ether */
    const gasAmountInEther = ethers.formatEther(requiredSplitAmount);

    /* Total Amount */
    return parseToSmallUnit(amountToSplit + parseFloat(gasAmountInEther));
  }
  return 0;
};

/** Split Form Schema */
const SplitFormSchema = yup
  .object({
    token: yup
      .string()
      .required()
      .oneOf(["bnb", "usdt"])
      .default("bnb")
      .label("Token"),
    amount: yup.string().required().label("Amount"),
    privateKey: yup.string().required().label("Private Key"),
  })
  .required();

/** Split Form Data */
interface SplitFormData {
  token: "bnb" | "usdt";
  amount: string;
  privateKey: string;
}

/** Split Page Component */
const Split = () => {
  const { target, progress, resetProgress } = useProgress();
  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;
  const [showIframe, setShowIframe] = useState(false);

  /** Form */
  const form = useForm<SplitFormData>({
    resolver: yupResolver(SplitFormSchema),
    defaultValues: {
      token: "bnb",
      amount: "",
      privateKey: "",
    },
  });

  /* Watch Token */
  const token = form.watch("token");

  /** Mutation */
  const mutation = useMutation({
    mutationKey: ["split-tokens"],
    mutationFn: async (data: SplitFormData) => {
      /** Reset Progress */
      resetProgress();

      if (selectedAccounts.length === 0) {
        toast.error("No accounts selected for split.");
        return;
      }

      const result = await new Promise((resolve) => {
        launchParcel({
          path: "/split",
          enableIframe: (status) => setShowIframe(status),
          onReady: (event) => {
            event.source!.postMessage(
              {
                blockchain: "bsc",
                token: data.token,
                amount: data.amount,
                wallet: {
                  address: getWalletAddressFromPrivateKey(data.privateKey),
                  privateKey: data.privateKey,
                },
                recipients: selectedAccounts.map((acc) => acc.walletAddress),
              },
              { targetOrigin: event.origin }
            );

            resolve({ status: true });
          },
        });
      });

      return result;
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: SplitFormData) => {
    await mutation.mutateAsync(data);
  };

  /* Set Pending Activity */
  usePendingActivity(true);

  return (
    <InnerPageLayout title="Split">
      {/* Iframe for Parcel */}
      {showIframe ? (
        <ParcelDialog
          path="/split"
          open={showIframe}
          onOpenChange={setShowIframe}
        />
      ) : null}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Token Selector */}
          <Controller
            name="token"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4 py-2">
                  <TokenButton
                    token="bnb"
                    selected={field.value === "bnb"}
                    onClick={() => field.onChange("bnb")}
                  />
                  <TokenButton
                    token="usdt"
                    selected={field.value === "usdt"}
                    onClick={() => field.onChange("usdt")}
                  />
                </div>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Amount */}
          <Controller
            name="amount"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">
                  <img
                    src={token === "bnb" ? BNBIcon : USDTIcon}
                    className="size-4 inline-block"
                  />{" "}
                  Amount of {token.toUpperCase()} to Split
                </Label>
                <Input
                  {...field}
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Amount"
                  disabled={mutation.isPending}
                />

                {token === "bnb" ? (
                  <div className="flex flex-col">
                    {/* Total Required BNB */}
                    <p className="text-sm px-4 text-yellow-500 text-center font-mono wrap-break-word">
                      Total BNB Required:{" "}
                      {calculateRequiredBNB(
                        field.value,
                        selectedAccounts.length
                      )}
                    </p>

                    {/* Each Account's Share */}
                    <p className="text-sm px-4 text-lime-500 text-center font-mono wrap-break-word">
                      Each:{" "}
                      {selectedAccounts.length > 0
                        ? parseToSmallUnit(
                            field.value / selectedAccounts.length
                          )
                        : 0}{" "}
                      BNB
                    </p>
                  </div>
                ) : null}

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
                  {token.toUpperCase()} will be sent from this address.
                </p>
                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Processing..."
              : `Split ${token.toUpperCase()} to Accounts`}
          </Button>

          {/* Progress Bar */}
          {mutation.isPending && <Progress max={target} current={progress} />}

          {/* Accounts Chooser */}
          <AccountsChooser {...accountsChooser} disabled={mutation.isPending} />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Split };

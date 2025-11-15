import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { getPrivateKey, getWalletAddressFromPrivateKey } from "../lib/utils";
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
import { usePassword } from "../hooks/usePassword";
import { launchParcel } from "../lib/parcel";

/** Merge Form Schema */
const MergeFormSchema = yup
  .object({
    token: yup
      .string()
      .required()
      .oneOf(["bnb", "usdt"])
      .default("bnb")
      .label("Token"),
    address: yup.string().required().label("Address"),
  })
  .required();

/** Merge Form Data */
interface MergeFormData {
  token: "bnb" | "usdt";
  address: string;
}

/** Merge Page Component */
const Merge = () => {
  const password = usePassword();

  const accountsChooser = useAccountsChooser();

  const { target, progress, resetProgress } = useProgress();
  const { selectedAccounts } = accountsChooser;

  const [showIframe, setShowIframe] = useState(false);

  /** Form */
  const form = useForm<MergeFormData>({
    resolver: yupResolver(MergeFormSchema),
    defaultValues: {
      token: "bnb",
      address: "",
    },
  });

  /* Watch Token */
  const token = form.watch("token");

  /** Mutation */
  const mutation = useMutation({
    mutationKey: ["merge-tokens"],
    mutationFn: async (data: MergeFormData) => {
      /** Reset Progress */
      resetProgress();

      if (selectedAccounts.length === 0) {
        toast.error("No accounts selected for merge.");
        return;
      }

      /* Prepare Senders */
      const senders = await Promise.all(
        selectedAccounts.map(async (account) => {
          const privateKey = await getPrivateKey(account.id, password!);
          return {
            address: getWalletAddressFromPrivateKey(privateKey),
            privateKey,
          };
        })
      );

      const result = await new Promise((resolve) => {
        launchParcel({
          path: "/merge",
          enableIframe: (status) => setShowIframe(status),
          onReady: (event) => {
            event.source!.postMessage(
              {
                blockchain: "bsc",
                token: data.token,
                receiver: data.address,
                senders,
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
  const handleFormSubmit = async (data: MergeFormData) => {
    await mutation.mutateAsync(data);
  };

  /* Set Pending Activity */
  usePendingActivity(true);

  return (
    <InnerPageLayout title="Merge">
      {/* Iframe for Parcel */}
      {showIframe ? (
        <ParcelDialog
          path="/merge"
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

          {/* Address */}
          <Controller
            name="address"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  {...field}
                  id="address"
                  autoComplete="off"
                  placeholder="Address"
                  disabled={mutation.isPending}
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Processing..."
              : `Merge ${token.toUpperCase()} from Accounts`}
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

export { Merge };

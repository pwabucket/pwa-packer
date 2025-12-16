import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import * as yup from "yup";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { TextArea } from "../components/TextArea";
import {
  cn,
  copyToClipboard,
  getWalletAddressFromPrivateKey,
} from "../lib/utils";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import {
  MdOutlineAutorenew,
  MdAccountBalanceWallet,
  MdOutlineContentCopy,
} from "react-icons/md";
import { usePackerProvider } from "../hooks/usePackerProvider";
import type { ProviderType } from "../types";
import { Select } from "./Select";
import { useAppStore } from "../store/useAppStore";

/** Account Form Data */
interface AccountFormData {
  title: string;
  depositAddress?: string | null;
  provider: ProviderType;
  url?: string;
  privateKey: string;
}

/** Account Form Schema */
const AccountFormSchema = yup
  .object({
    title: yup.string().required().label("Title"),
    depositAddress: yup.string().nullable().label("Deposit Address"),
    provider: yup
      .string()
      .required()
      .oneOf(["default", "leonardo"])
      .label("Provider"),
    url: yup.string().url().label("URL"),
    privateKey: yup.string().required().label("Private Key"),
  })
  .required();

/** Account Form Props */
interface AccountFormProps {
  handleFormSubmit: (data: AccountFormData) => void;
  initialValues?: AccountFormData;
}

/** Account Form Component */
const AccountForm = ({ handleFormSubmit, initialValues }: AccountFormProps) => {
  const currentProvider = useAppStore((state) => state.provider);
  const { createProvider } = usePackerProvider();

  /** Form */
  const form = useForm({
    resolver: yupResolver(AccountFormSchema),
    defaultValues: {
      title: initialValues?.title || "",
      depositAddress: initialValues?.depositAddress || "",
      provider: initialValues?.provider || currentProvider,
      url: initialValues?.url || "",
      privateKey: initialValues?.privateKey || "",
    },
  });

  const mutation = useMutation({
    mutationKey: ["get-deposit-address"],
    mutationFn: async (url: string) => {
      if (provider !== "default") {
        /* Create Packer Instance */
        const packer = createProvider(provider, url);

        /* Initialize Packer */
        await packer.initialize();

        /* Get Address */
        const address = await packer.getDepositAddress();

        return address;
      }
    },
  });

  /* Fill Deposit Address from URL */
  const fillDepositAddress = async (url: string) => {
    const address = await mutation.mutateAsync(url);
    form.setValue("depositAddress", address);
    toast.success("Deposit Address filled successfully");
  };

  /* Generate New Wallet Private Key */
  const generateWalletPrivateKey = () => {
    const wallet = ethers.Wallet.createRandom();
    form.setValue("privateKey", wallet.privateKey);
    toast.success("New wallet generated successfully");
  };

  const provider = form.watch("provider");

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        {/* Title */}
        <Controller
          name="title"
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="title">Account Title</Label>
              <Input
                {...field}
                id="title"
                autoComplete="off"
                placeholder="Account Title"
              />
              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        {/* Provider */}
        <Controller
          name="provider"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor="provider">Provider</Label>
              <Select id="provider" {...field}>
                <Select.Option value="default">Default</Select.Option>
                <Select.Option value="leonardo">Leonardo</Select.Option>
              </Select>
              <FormFieldError message={fieldState.error?.message} />
            </div>
          )}
        />

        {/* Deposit Address */}
        <Controller
          name="depositAddress"
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="depositAddress">Deposit Address</Label>
              <Input
                {...field}
                id="depositAddress"
                autoComplete="off"
                placeholder="Deposit Address"
              />
              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        {/* URL */}
        <Controller
          name="url"
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="url">URL</Label>
              <div className="flex gap-2 w-full">
                <Input
                  {...field}
                  id="url"
                  autoComplete="off"
                  placeholder="URL"
                  className="grow"
                />
                <button
                  type="button"
                  className={cn(
                    "border border-neutral-700 cursor-pointer",
                    "shrink-0 p-2 rounded-full size-10",
                    "flex items-center justify-center"
                  )}
                  onClick={() => copyToClipboard(field.value)}
                >
                  <MdOutlineContentCopy className="size-4" />
                </button>
              </div>
              {provider !== "default" && field.value && (
                <div className="flex justify-end">
                  <button
                    disabled={mutation.isPending}
                    type="button"
                    onClick={() => fillDepositAddress(field.value)}
                    className={cn(
                      "text-sm text-orange-300 cursor-pointer hover:underline disabled:opacity-50",
                      "flex items-center gap-1"
                    )}
                  >
                    <MdAccountBalanceWallet className="size-3" />
                    {mutation.isPending
                      ? "Fetching..."
                      : "Fill Deposit Address from URL"}
                  </button>
                </div>
              )}
              <FormFieldError message={fieldState.error?.message} />
            </>
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
                id="privateKey"
                autoComplete="off"
                placeholder="Private Key"
                rows={4}
              />
              {!field.value && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={generateWalletPrivateKey}
                    className={cn(
                      "text-sm text-lime-300 cursor-pointer hover:underline disabled:opacity-50",
                      "flex items-center gap-1"
                    )}
                  >
                    <MdOutlineAutorenew className="size-3" />
                    Generate New Wallet
                  </button>
                </div>
              )}
              <p className="text-sm px-4 text-lime-300 text-center font-mono wrap-break-word">
                {getWalletAddressFromPrivateKey(field.value)}
              </p>
              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit" className="mt-4">
          Save
        </Button>
      </form>
    </FormProvider>
  );
};

export { AccountForm, AccountFormSchema };
export type { AccountFormData, AccountFormProps };

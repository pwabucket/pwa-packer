import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import * as yup from "yup";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { TextArea } from "../components/TextArea";
import { cn, getWalletAddressFromPrivateKey } from "../lib/utils";
import { Packer } from "../lib/Packer";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { MdOutlineAutorenew, MdAccountBalanceWallet } from "react-icons/md";

/** Account Form Data */
interface AccountFormData {
  title: string;
  depositAddress: string;
  url?: string;
  privateKey: string;
}

/** Account Form Schema */
const AccountFormSchema = yup
  .object({
    title: yup.string().required().label("Title"),
    depositAddress: yup.string().required().label("Deposit Address"),
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
  /** Form */
  const form = useForm({
    resolver: yupResolver(AccountFormSchema),
    defaultValues: {
      title: initialValues?.title || "",
      depositAddress: initialValues?.depositAddress || "",
      url: initialValues?.url || "",
      privateKey: initialValues?.privateKey || "",
    },
  });

  const mutation = useMutation({
    mutationKey: ["get-deposit-address"],
    mutationFn: async (url: string) => {
      const packer = new Packer(url);
      const { data } = await packer.validate();

      if (data.activityAddress) {
        return data.activityAddress;
      } else {
        const wallet = await packer.getActivityWallet();
        return wallet.msg;
      }
    },
  });

  /* Fill Deposit Address from URL */
  const fillDepositAddress = async (url: string) => {
    const address = await mutation.mutateAsync(url);
    form.setValue("depositAddress", address);
    toast.success("Deposit Address filled successfully");
  };

  const generateWalletPrivateKey = () => {
    const wallet = ethers.Wallet.createRandom();
    form.setValue("privateKey", wallet.privateKey);
    toast.success("New wallet generated successfully");
  };

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
              <Input {...field} id="url" autoComplete="off" placeholder="URL" />
              {field.value && (
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

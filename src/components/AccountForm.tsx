import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import * as yup from "yup";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { TextArea } from "../components/TextArea";
import { getWalletAddressFromPrivateKey } from "../lib/utils";

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
              <p className="text-sm px-4 text-blue-500 text-center font-mono wrap-break-word">
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

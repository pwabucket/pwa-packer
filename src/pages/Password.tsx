import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { PasswordInput } from "../components/Input";
import * as yup from "yup";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { useAppStore } from "../store/useAppStore";
import {
  getLocalStorageKeyForAccountPrivateKey,
  getPrivateKey,
} from "../lib/utils";
import toast from "react-hot-toast";
import { encryption } from "../services/encryption";

/** Password Form Schema */
const PasswordFormSchema = yup
  .object({
    currentPassword: yup.string().required().label("Current Password"),
    newPassword: yup.string().required().label("New Password"),
  })
  .required();

/** Password Form Data */
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
}

const Password = () => {
  const password = useAppStore((state) => state.password);
  const setPassword = useAppStore((state) => state.setPassword);
  const accounts = useAppStore((state) => state.accounts);

  /** Form */
  const form = useForm({
    resolver: yupResolver(PasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const handleFormSubmit = async (data: PasswordFormData) => {
    const { currentPassword, newPassword } = data;

    /** Validate Current Password */
    if (currentPassword !== password) {
      form.setError("currentPassword", {
        type: "validate",
        message: "Current password is incorrect.",
      });
      return;
    }

    /** Re-encrypt All Accounts with New Password */
    for (const account of accounts) {
      const privateKey = await getPrivateKey(account.id, currentPassword);

      /* Encrypt Private Key */
      const encryptedPrivateKey = await encryption.encryptData({
        data: privateKey,
        password: newPassword,
      });

      /* Store encrypted private key in localStorage */
      localStorage.setItem(
        getLocalStorageKeyForAccountPrivateKey(account.id),
        JSON.stringify(encryptedPrivateKey)
      );
    }

    /** Update Password in Store */
    await setPassword(newPassword);

    /** Reset Form */
    form.reset();

    /* Show Success Toast */
    toast.success("Password changed successfully.");
  };

  return (
    <InnerPageLayout title="Password">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Current Password */}
          <Controller
            name="currentPassword"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  {...field}
                  id="currentPassword"
                  autoComplete="off"
                  placeholder="Current Password"
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* New Password */}
          <Controller
            name="newPassword"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  {...field}
                  id="newPassword"
                  autoComplete="off"
                  placeholder="New Password"
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Submit Button */}
          <Button type="submit">Change Password</Button>
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Password };

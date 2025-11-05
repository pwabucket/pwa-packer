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
import { useProgress } from "../hooks/useProgress";
import { Progress } from "../components/Progress";
import { MdSecurity, MdUpdate, MdLock, MdLockReset } from "react-icons/md";

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
  const { progress, resetProgress, incrementProgress } = useProgress();
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

    /** Reset Progress */
    resetProgress();

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

      /** Increment Progress */
      incrementProgress();
    }

    /** Update Password in Store */
    await setPassword(newPassword);

    /** Reset Form */
    form.reset();

    /* Show Success Toast */
    toast.success("Password changed successfully.");
  };

  return (
    <InnerPageLayout title="Password" className="gap-2">
      {/* Security Info Section */}
      <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
        <MdSecurity className="size-6 text-blue-400 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm text-blue-400">
            Security Update
          </h3>
          <p className="text-xs text-blue-300/80">
            Changing your password will re-encrypt all stored private keys with
            the new password.
          </p>
        </div>
      </div>

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
                <Label
                  htmlFor="currentPassword"
                  className="flex items-center gap-2"
                >
                  <MdLock className="size-4 text-neutral-400" />
                  Current Password
                </Label>
                <PasswordInput
                  {...field}
                  id="currentPassword"
                  autoComplete="off"
                  placeholder="Current Password"
                  disabled={form.formState.isSubmitting}
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
                <Label
                  htmlFor="newPassword"
                  className="flex items-center gap-2"
                >
                  <MdLockReset className="size-4 text-green-400" />
                  New Password
                </Label>
                <PasswordInput
                  {...field}
                  id="newPassword"
                  autoComplete="off"
                  placeholder="New Password"
                  disabled={form.formState.isSubmitting}
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <div className="flex items-center gap-2">
              <MdUpdate className="size-4" />
              <span>
                {form.formState.isSubmitting
                  ? "Updating..."
                  : "Update Password"}
              </span>
            </div>
          </Button>
        </form>
      </FormProvider>

      {/* Progress */}
      {form.formState.isSubmitting && (
        <Progress current={progress} max={accounts.length} />
      )}
    </InnerPageLayout>
  );
};

export { Password };

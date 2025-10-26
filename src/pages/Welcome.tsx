import { useState } from "react";
import AppIcon from "../assets/icon.svg";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { PasswordInput } from "../components/Input";
import * as yup from "yup";
import useAppStore from "../store/useAppStore";
import { useNavigate } from "react-router";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";

/** Welcome Page Component */
const Welcome = () => {
  const passwordHash = useAppStore((state) => state.passwordHash);
  const isNewUser = !passwordHash;

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center gap-4 p-4">
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <img src={AppIcon} alt="Packer" className="size-24 mx-auto" />
        <h1 className="text-center text-3xl font-bold">Packer</h1>

        <p className="text-center px-4 text-neutral-400">
          Your all-in-one solution for BSC Transactions <br /> With built-in
          Hash Maker.
        </p>

        {isNewUser ? (
          <NewUserPasswordCreation />
        ) : (
          <ExistingUserPasswordEntry />
        )}
      </div>
    </div>
  );
};

/** Existing User Password Entry Component */
const ExistingUserPasswordEntry = () => {
  const navigate = useNavigate();
  const verifyPassword = useAppStore((state) => state.verifyPassword);
  const resetApp = useAppStore((state) => state.resetApp);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: { password: string }) => {
    const isVerified = await verifyPassword(data.password);

    if (!isVerified) {
      alert("Incorrect Password. Please try again.");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <>
      <PasswordForm
        title="Enter your password"
        handleFormSubmit={handleFormSubmit}
      />

      {/* Divider */}
      <p className="text-center text-neutral-500">OR</p>

      {/* Reset Password Button */}
      <button
        onClick={() => resetApp()}
        className="text-red-200 hover:text-red-500 cursor-pointer"
      >
        Reset Packer
      </button>
    </>
  );
};

/** New User Password Creation Component */
const NewUserPasswordCreation = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const navigate = useNavigate();
  const setPassword = useAppStore((state) => state.setPassword);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: { password: string }) => {
    await setPassword(data.password);
    navigate("/dashboard", { replace: true });
  };

  return (
    <>
      {showPasswordForm ? (
        <PasswordForm
          title="Create a password"
          handleFormSubmit={handleFormSubmit}
        />
      ) : (
        <Button onClick={() => setShowPasswordForm((prev) => !prev)}>
          Get Started
        </Button>
      )}
    </>
  );
};

/** Password Form Schema */
const PasswordFormSchema = yup
  .object({
    password: yup.string().required().label("Password"),
  })
  .required();

/** Password Form Props */
interface PasswordFormProps {
  title: string;
  handleFormSubmit: (data: { password: string }) => void;
}

/** Password Form Component */
const PasswordForm = ({ title, handleFormSubmit }: PasswordFormProps) => {
  /** Form */
  const form = useForm({
    resolver: yupResolver(PasswordFormSchema),
    defaultValues: {
      password: "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        {/* Password */}
        <Controller
          name="password"
          render={({ field, fieldState }) => (
            <>
              <Label htmlFor="password">{title}</Label>

              <PasswordInput
                {...field}
                id="password"
                autoComplete="off"
                placeholder="Password"
              />

              <FormFieldError message={fieldState.error?.message} />
            </>
          )}
        />

        <Button type="submit">Continue</Button>
      </form>
    </FormProvider>
  );
};

export { Welcome };

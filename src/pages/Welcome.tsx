import { useCallback, useState } from "react";
import AppIcon from "../assets/icon.svg";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { PasswordInput } from "../components/Input";
import * as yup from "yup";
import { useAppStore } from "../store/useAppStore";
import { Link, useLocation, useNavigate } from "react-router";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import toast from "react-hot-toast";
import { MdOutlineRestore } from "react-icons/md";
import { SiGithub } from "react-icons/si";

/** Welcome Page Component */
const Welcome = () => {
  const passwordHash = useAppStore((state) => state.passwordHash);
  const isNewUser = !passwordHash;
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from?.pathname || "/dashboard";

  const onSuccessfulLogin = useCallback(() => {
    navigate(fromLocation, { replace: true });
  }, [fromLocation, navigate]);

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center gap-4 p-4">
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <img src={AppIcon} alt="Packer" className="size-24 mx-auto" />
        <h1 className="text-center text-5xl font-protest-guerrilla">Packer</h1>

        <p className="text-center px-4 text-sm text-neutral-400">
          Your all-in-one solution for BSC Transactions <br /> With built-in
          Hash Maker.
        </p>

        {isNewUser ? (
          <NewUserPasswordCreation onSuccessfulLogin={onSuccessfulLogin} />
        ) : (
          <ExistingUserPasswordEntry onSuccessfulLogin={onSuccessfulLogin} />
        )}

        <div className="flex flex-col items-center justify-center gap-2">
          {/* Repository URL */}
          <Link
            to={import.meta.env.VITE_APP_REPOSITORY_URL || "#"}
            target="_blank"
            className="text-neutral-500 hover:text-yellow-500 text-sm flex justify-center items-center gap-2"
          >
            <SiGithub className="size-4 inline-block" /> <span>GitHub</span>
          </Link>

          {/* Version Number */}
          <p className="text-center text-neutral-500 text-xs">
            v{import.meta.env.PACKAGE_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
};

/** Existing User Password Entry Component */
const ExistingUserPasswordEntry = ({
  onSuccessfulLogin,
}: {
  onSuccessfulLogin: () => void;
}) => {
  const verifyPassword = useAppStore((state) => state.verifyPassword);
  const resetApp = useAppStore((state) => state.resetApp);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: { password: string }) => {
    const isVerified = await verifyPassword(data.password);

    if (!isVerified) {
      toast.error("Incorrect Password. Please try again.");
      return;
    }
    onSuccessfulLogin();
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
const NewUserPasswordCreation = ({
  onSuccessfulLogin,
}: {
  onSuccessfulLogin: () => void;
}) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const setPassword = useAppStore((state) => state.setPassword);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: { password: string }) => {
    await setPassword(data.password);
    onSuccessfulLogin();
  };

  return (
    <>
      {showPasswordForm ? (
        <PasswordForm
          title="Create a password"
          handleFormSubmit={handleFormSubmit}
        />
      ) : (
        <>
          <Button onClick={() => setShowPasswordForm((prev) => !prev)}>
            Get Started
          </Button>

          <Link
            to="/restore"
            className="text-yellow-400 hover:underline text-center"
          >
            <MdOutlineRestore className="size-4 inline-block" /> Restore from
            Backup
          </Link>
        </>
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

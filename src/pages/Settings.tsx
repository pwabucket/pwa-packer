import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAppStore } from "../store/useAppStore";
import toast from "react-hot-toast";
import { MdSave } from "react-icons/md";
import type { ProviderType } from "../types";
import { Label } from "../components/Label";
import { Select } from "../components/Select";
import { FormFieldError } from "../components/FormFieldError";

/** Settings Form Schema */
const SettingsFormSchema = yup
  .object({
    provider: yup
      .string()
      .required()
      .oneOf(["leonardo", "dicaprio"])
      .label("Provider"),
  })
  .required();

/** Settings Form Data */
interface SettingsFormData {
  provider: ProviderType;
}

const Settings = () => {
  const provider = useAppStore((state) => state.provider);
  const setProvider = useAppStore((state) => state.setProvider);

  /** Form */
  const form = useForm({
    resolver: yupResolver(SettingsFormSchema),
    defaultValues: {
      provider: provider,
    },
  });

  const handleFormSubmit = async (data: SettingsFormData) => {
    setProvider(data.provider);

    /* Show Success Toast */
    toast.success("Settings changed successfully.");
  };

  return (
    <InnerPageLayout title="Settings" className="gap-2">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Provider */}
          <Controller
            name="provider"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Select id="provider" {...field}>
                  <Select.Option value="leonardo">Leonardo</Select.Option>
                  <Select.Option value="dicaprio">Dicaprio</Select.Option>
                </Select>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />
          {/* Submit Button */}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <div className="flex items-center gap-2">
              <MdSave className="size-4" />
              <span>
                {form.formState.isSubmitting
                  ? "Updating..."
                  : "Update Settings"}
              </span>
            </div>
          </Button>
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Settings };

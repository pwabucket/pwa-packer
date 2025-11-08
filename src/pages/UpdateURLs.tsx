import * as yup from "yup";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AccountsChooser } from "../components/AccountsChooser";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import toast from "react-hot-toast";
import { Label } from "../components/Label";
import { Input } from "../components/Input";
import { FormFieldError } from "../components/FormFieldError";
import { useAppStore } from "../store/useAppStore";

/** URLs Update Form Schema */
const UpdateURLsFormSchema = yup
  .object({
    url: yup.string().required().label("URL"),
  })
  .required();

/** URLs Update Form Data */
interface UpdateURLsFormData {
  url: string;
}

/** UpdateURLs Page Component */
const UpdateURLs = () => {
  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;
  const accounts = useAppStore((state) => state.accounts);
  const setAccounts = useAppStore((state) => state.setAccounts);

  /** Form */
  const form = useForm<UpdateURLsFormData>({
    resolver: yupResolver(UpdateURLsFormSchema),
    defaultValues: {
      url: "",
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: UpdateURLsFormData) => {
    /* UpdateURLs Accounts */
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    /* Get Origin from New URL */
    const origin = new URL(data.url).origin;

    /* Update Accounts */
    const updatedAccounts = accounts.map((account) => {
      if (selectedAccounts.includes(account) && account.url) {
        const oldURL = new URL(account.url);
        const newURL = new URL(
          oldURL.pathname + oldURL.search + oldURL.hash,
          origin
        );

        return {
          ...account,
          url: newURL.href,
        };
      }
      return account;
    });

    /* Set Updated Accounts to Store */
    setAccounts(updatedAccounts);

    /* Show Success Toast */
    toast.success(`Updated ${selectedAccounts.length} account(s) successfully`);

    /* Reset Form */
    form.reset();
  };

  return (
    <InnerPageLayout title="UpdateURLs" className="gap-2">
      {/* Description */}
      <p className="text-sm text-blue-300">
        Enter the new URL of one of the accounts to update the origin for all
        selected accounts.
      </p>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* URL */}
          <Controller
            name="url"
            render={({ field, fieldState }) => (
              <>
                <Label htmlFor="url">URL</Label>
                <Input
                  {...field}
                  id="url"
                  autoComplete="off"
                  placeholder="URL"
                />

                <FormFieldError message={fieldState.error?.message} />
              </>
            )}
          />

          {/* Submit Button */}
          <Button type="submit">Update URLs for Selected Accounts</Button>

          {/* Accounts Chooser */}
          <AccountsChooser {...accountsChooser} />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { UpdateURLs };

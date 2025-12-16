import * as yup from "yup";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AccountsChooser } from "../components/AccountsChooser";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import toast from "react-hot-toast";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import { useAppStore } from "../store/useAppStore";
import { useState } from "react";
import type { Account, ProviderType } from "../types";
import { PROVIDER_NAMES } from "../lib/providers";
import { Select } from "../components/Select";

interface UpdateProviderResult {
  account: Account;
  status: boolean;
}

/** Provider Update Form Schema */
const UpdateProviderFormSchema = yup
  .object({
    provider: yup
      .string()
      .required()
      .oneOf(Object.keys(PROVIDER_NAMES) as ProviderType[])
      .label("Provider"),
  })
  .required();

/** Provider Update Form Data */
interface UpdateProviderFormData {
  provider: ProviderType;
}

/** UpdateProvider Page Component */
const UpdateProvider = () => {
  const accounts = useAppStore((state) => state.accounts);
  const setAccounts = useAppStore((state) => state.setAccounts);

  const selector = useAccountsChooser();
  const { selectedAccounts } = selector;

  const [results, setResults] = useState<UpdateProviderResult[] | null>(null);

  /** Form */
  const form = useForm<UpdateProviderFormData>({
    resolver: yupResolver(UpdateProviderFormSchema),
    defaultValues: {
      provider: "default",
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: UpdateProviderFormData) => {
    /* UpdateProvider Accounts */
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    /* Clear Previous Results */
    setResults(null);

    /* Update Accounts */
    const updatedAccounts = accounts.map((account) => {
      if (selectedAccounts.includes(account)) {
        console.log(
          "Updating account:",
          account.id,
          "to provider:",
          data.provider
        );
        return {
          ...account,
          provider: data.provider,
        };
      }
      return account;
    });

    /* Set Updated Accounts to Store */
    setAccounts(updatedAccounts);

    /* Set Results */
    setResults(
      selectedAccounts.map((account) => ({
        account: updatedAccounts.find((a) => a.id === account.id)!,
        status: true,
      }))
    );

    /* Show Success Toast */
    toast.success(`Updated ${selectedAccounts.length} account(s) successfully`);

    /* Reset Form */
    form.reset();
  };

  return (
    <InnerPageLayout
      title="Update Provider"
      className="gap-2"
      showFooter={false}
    >
      {/* Description */}
      <p className="text-sm text-yellow-300 text-center">
        Choose a new provider for the selected accounts.
      </p>

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
                  {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
                    <Select.Option key={key} value={key}>
                      {name}
                    </Select.Option>
                  ))}
                </Select>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Submit Button */}
          <Button type="submit">Update Provider</Button>

          {/* Accounts Chooser */}
          <AccountsChooser {...selector} results={results || undefined} />
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { UpdateProvider };

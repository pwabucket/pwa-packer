import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { useValidationMutation } from "../hooks/useValidationMutation";
import { Progress } from "../components/Progress";
import { toast } from "react-hot-toast";
import { Dialog } from "radix-ui";
import { ValidationResults } from "../components/ValidationResults";
import { useState } from "react";
import { MdSearch } from "react-icons/md";

/** Validate Page Component */
const Validate = () => {
  const [showResults, setShowResults] = useState(false);
  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  const { mutation, target, progress } = useValidationMutation();

  const handleValidateClick = async () => {
    /* Validate Accounts */
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await mutation.mutateAsync({
      accounts: selectedAccounts,
    });
  };

  return (
    <InnerPageLayout title="Validate" className="gap-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <>
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Validation completed successfully!</p>
            <p className="text-blue-300">
              Active Accounts: ({mutation.data?.activeAccounts} /{" "}
              {mutation.data?.totalAccounts})
            </p>
            <p className="text-orange-300">
              Total Amount:{" "}
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(mutation.data?.totalAmount || 0)}{" "}
              USDT
            </p>
            <p className="text-lime-300">
              Available Balance:{" "}
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(mutation.data?.availableBalance || 0)}{" "}
              USDT
            </p>
          </div>

          {/* Validation Results Dialog */}
          <Dialog.Root open={showResults} onOpenChange={setShowResults}>
            <Dialog.Trigger asChild>
              <Button className="mx-auto">View Detailed Results</Button>
            </Dialog.Trigger>
            <ValidationResults results={mutation.data.results} />
          </Dialog.Root>
        </>
      )}

      {/* Validate Button */}
      {!mutation.isSuccess && (
        <>
          <p className="text-center text-neutral-400 text-sm">
            This will validate the selected accounts.
          </p>

          <Button disabled={mutation.isPending} onClick={handleValidateClick}>
            <MdSearch className="size-5" />
            {mutation.isPending ? "Validating..." : "Validate Accounts"}
          </Button>
        </>
      )}

      {/* Progress Bar */}
      {mutation.isPending && <Progress max={target} current={progress} />}

      {/* Accounts Chooser */}
      <AccountsChooser
        {...accountsChooser}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </InnerPageLayout>
  );
};

export { Validate };

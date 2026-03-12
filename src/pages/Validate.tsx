import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { Dialog } from "radix-ui";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { MdSearch } from "react-icons/md";
import { Progress } from "../components/Progress";
import { ValidationResults } from "../components/ValidationResults";
import { formatCurrency } from "../lib/utils";
import { toast } from "react-hot-toast";
import { useLocationToggle } from "@pwabucket/pwa-router";
import { usePendingActivity } from "../hooks/usePendingActivity";
import { useProviderAccountsChooser } from "../hooks/useProviderAccountsChooser";
import { useValidationMutation } from "../hooks/useValidationMutation";

/** Validate Page Component */
const Validate = () => {
  const [showResults, setShowResults] = useLocationToggle(
    "validate-results-dialog",
  );
  const selector = useProviderAccountsChooser();
  const { selectedAccounts } = selector;

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

  /** Prevent auto-logout when viewing results */
  usePendingActivity(showResults);

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
              Total Amount: {formatCurrency(mutation.data?.totalAmount || 0, 3)}{" "}
              USDT
            </p>
            <p className="text-lime-300">
              Available Balance:{" "}
              {formatCurrency(mutation.data?.availableBalance || 0, 3)} USDT
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
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </InnerPageLayout>
  );
};

export { Validate };

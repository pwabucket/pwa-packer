import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { useValidationMutation } from "../hooks/useValidationMutation";
import { Progress } from "../components/Progress";
import { toast } from "react-hot-toast";

/** Validate Page Component */
const Validate = () => {
  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  const { mutation, progress } = useValidationMutation();

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
      <p className="text-center text-neutral-400 text-sm">
        This will validate the selected accounts.
      </p>

      {mutation.isSuccess && (
        <p className="text-center text-green-400 text-sm">
          Validation completed successfully!
        </p>
      )}

      {/* Validate Button */}
      <Button disabled={mutation.isPending} onClick={handleValidateClick}>
        Validate Accounts
      </Button>

      {/* Progress Bar */}
      {mutation.isPending && (
        <Progress max={selectedAccounts.length} current={progress} />
      )}

      {/* Accounts Chooser */}
      <AccountsChooser {...accountsChooser} disabled={mutation.isPending} />
    </InnerPageLayout>
  );
};

export { Validate };

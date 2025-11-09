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

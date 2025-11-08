import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { Progress } from "../components/Progress";
import { toast } from "react-hot-toast";
import { usePackMutation } from "../hooks/usePackMutation";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";

/** Pack Page Component */
const Pack = () => {
  const accountsChooser = useAccountsChooser();
  const { selectedAccounts } = accountsChooser;

  const { mutation, progress } = usePackMutation();

  const handlePackClick = async () => {
    /* Pack Accounts */
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    /* Execute Pack Mutation */
    const { totalWithdrawn } = await mutation.mutateAsync({
      accounts: selectedAccounts,
    });

    /* Show Success Toast */
    toast.success(`Packing completed! Total withdrawn: ${totalWithdrawn} USDT`);
  };

  return (
    <InnerPageLayout title="Pack" className="gap-2">
      <p className="text-center text-neutral-400 text-sm">
        This will pack the selected accounts.
      </p>

      {mutation.isSuccess && (
        <p className="text-center text-green-400 text-sm">
          Packing completed successfully -{" "}
          {Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(mutation.data?.totalWithdrawn)}{" "}
          USDT
        </p>
      )}

      {/* Pack Button */}
      <Button disabled={mutation.isPending} onClick={handlePackClick}>
        <HiOutlineCurrencyDollar className="size-5" />
        {mutation.isPending ? "Packing..." : "Pack Selected Accounts"}
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

export { Pack };

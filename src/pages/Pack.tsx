import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { Progress } from "../components/Progress";
import { toast } from "react-hot-toast";
import { usePackMutation } from "../hooks/usePackMutation";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { Dialog } from "radix-ui";
import { PackResults } from "../components/PackResults";
import { useState } from "react";

/** Pack Page Component */
const Pack = () => {
  const [showResults, setShowResults] = useState(false);
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
    toast.success(
      `Packing completed! Total withdrawn: ${Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(totalWithdrawn)} USDT`
    );
  };

  return (
    <InnerPageLayout title="Pack" className="gap-2">
      {mutation.isSuccess && (
        <>
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Packing completed successfully!</p>
            <p className="text-blue-300">
              Accounts: ({mutation.data?.packedAccounts} /{" "}
              {mutation.data?.totalAccounts})
            </p>
            <p className="text-lime-300">
              Total Withdrawn:{" "}
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(mutation.data?.totalWithdrawn)}{" "}
              USDT
            </p>
          </div>

          {/* Pack Results Dialog */}
          <Dialog.Root open={showResults} onOpenChange={setShowResults}>
            <Dialog.Trigger asChild>
              <Button className="mx-auto">View Detailed Results</Button>
            </Dialog.Trigger>
            <PackResults results={mutation.data.results} />
          </Dialog.Root>
        </>
      )}

      {/* Pack Button */}
      {!mutation.isSuccess && (
        <>
          <p className="text-center text-neutral-400 text-sm">
            This will pack the selected accounts.
          </p>
          <Button disabled={mutation.isPending} onClick={handlePackClick}>
            <HiOutlineCurrencyDollar className="size-5" />
            {mutation.isPending ? "Packing..." : "Pack Selected Accounts"}
          </Button>
        </>
      )}

      {/* Progress Bar */}
      {mutation.isPending && (
        <Progress max={selectedAccounts.length} current={progress} />
      )}

      {/* Accounts Chooser */}
      <AccountsChooser
        {...accountsChooser}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </InnerPageLayout>
  );
};

export { Pack };

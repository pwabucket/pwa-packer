import { AccountsChooser } from "../components/AccountsChooser";
import { Button } from "../components/Button";
import { Progress } from "../components/Progress";
import { toast } from "react-hot-toast";
import { usePackMutation } from "../hooks/usePackMutation";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { Dialog } from "radix-ui";
import { PackResults } from "../components/PackResults";
import { useState } from "react";
import { Label } from "../components/Label";
import { Slider } from "../components/Slider";
import { usePendingActivity } from "../hooks/usePendingActivity";
import { formatCurrency } from "../lib/utils";
import useLocationToggle from "../hooks/useLocationToggle";
import type { useAccountsSelector } from "../hooks/useAccountsSelector";

interface PackFormProps {
  selector: ReturnType<typeof useAccountsSelector>;
}

/** Pack Page Component */
const PackForm = ({ selector }: PackFormProps) => {
  const [showResults, setShowResults] = useLocationToggle(
    "pack-results-dialog"
  );
  const [delay, setDelay] = useState(20);
  const { mutation, target, progress } = usePackMutation();

  const handlePackClick = async () => {
    /* Pack Accounts */
    if (selector.selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    /* Execute Pack Mutation */
    const { totalWithdrawn } = await mutation.mutateAsync({
      accounts: selector.selectedAccounts,
      delay,
    });

    /* Show Success Toast */
    toast.success(
      `Packing completed! Total withdrawn: ${formatCurrency(
        totalWithdrawn,
        3
      )} USDT`
    );
  };

  /** Prevent auto-logout when viewing results */
  usePendingActivity(showResults);

  return (
    <div className="flex flex-col gap-2">
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
              {formatCurrency(mutation.data?.totalWithdrawn, 3)} USDT
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

          {/* Delay */}
          <div className="flex flex-col gap-1">
            <Label className="text-center">
              Delay per transaction (seconds)
            </Label>
            <Slider
              min={0}
              max={60}
              step={5}
              value={[delay]}
              onValueChange={([value]) => setDelay(value)}
              disabled={mutation.isPending}
            />
            <p className="text-xs text-center text-neutral-400">
              {delay} seconds
            </p>
          </div>
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
    </div>
  );
};

export { PackForm };

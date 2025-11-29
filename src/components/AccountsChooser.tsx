import type { Account } from "../types";
import { AccountAddresses } from "./AccountAddresses";
import { AccountBalance } from "./AccountBalance";
import { LabelToggle } from "./LabelToggle";
import { cn } from "../lib/utils";
import { Toggle } from "./Toggle";
import {
  MdCancel,
  MdCheckCircle,
  MdInfo,
  MdOutlineAccountBalanceWallet,
  MdRemoveCircle,
} from "react-icons/md";
import { Dialog } from "radix-ui";
import useLocationToggle from "../hooks/useLocationToggle";
import { AccountDetailsDialog } from "./AccountDialog";

interface AccountsChooserResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
}

interface AccountsChooserProps {
  accounts: Account[];
  disabled?: boolean;
  allSelected?: boolean;
  selectedAccounts: Account[];
  toggleAccount: (account: Account, checked: boolean) => void;
  toggleAllAccounts: (checked: boolean) => void;
  results?: AccountsChooserResult[];
}

interface AccountItemProps {
  account: Account;
  checked: boolean;
  disabled?: boolean;
  toggleAccount: (account: Account, checked: boolean) => void;
  result?: AccountsChooserResult | null;
}

const AccountItem = ({
  account,
  checked,
  disabled,
  result,
  toggleAccount,
}: AccountItemProps) => {
  const [showAccountDetails, toggleShowAccountDetails] = useLocationToggle(
    `${account.id}-details`
  );

  return (
    <div
      className={cn(
        "bg-neutral-900",
        "flex items-center gap-1 p-1.5 rounded-full",
        "has-[input:disabled]:opacity-60"
      )}
    >
      <label className="flex items-center gap-2 cursor-pointer grow min-w-0 pl-1">
        {typeof result !== "undefined" ? (
          <span className="w-10 flex items-center justify-center">
            {result ? (
              result.status ? (
                <MdCheckCircle className="size-5 text-green-500 shrink-0" />
              ) : result.skipped ? (
                <MdRemoveCircle className="size-5 text-yellow-500 shrink-0" />
              ) : (
                <MdCancel className="size-5 text-red-500 shrink-0" />
              )
            ) : (
              <MdInfo className="size-5 text-neutral-500 shrink-0" />
            )}
          </span>
        ) : (
          <Toggle
            checked={checked}
            onChange={(ev) => toggleAccount(account, ev.target.checked)}
            disabled={disabled}
          />
        )}

        {/* Title and balance */}
        <div className="flex flex-col grow min-w-0">
          <span className="text-xs font-bold text-yellow-500">
            {account.title}
          </span>

          <AccountBalance account={account} />
        </div>

        {/* Addresses */}
        <AccountAddresses account={account} />
      </label>

      <Dialog.Root
        open={showAccountDetails}
        onOpenChange={toggleShowAccountDetails}
      >
        <Dialog.Trigger
          disabled={disabled}
          className={cn(
            "p-2 flex items-center justify-center cursor-pointer",
            "hover:bg-neutral-700 rounded-full",
            "text-neutral-500 hover:text-yellow-500",
            "transition-colors duration-200"
          )}
        >
          <MdOutlineAccountBalanceWallet className="size-5" />
        </Dialog.Trigger>

        <AccountDetailsDialog account={account} />
      </Dialog.Root>
    </div>
  );
};

const AccountsChooser = ({
  accounts,
  disabled,
  allSelected,
  selectedAccounts,
  results,
  toggleAccount,
  toggleAllAccounts,
}: AccountsChooserProps) => {
  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Account List Heading */}
      <h4 className="font-protest-guerrilla px-4 text-center text-lg">
        Accounts ({accounts.length})
      </h4>

      {!results && (
        <LabelToggle
          disabled={disabled}
          checked={allSelected}
          onChange={(ev) => toggleAllAccounts(ev.target.checked)}
        >
          Toggle Accounts
        </LabelToggle>
      )}

      <div className="flex flex-col gap-2">
        {accounts.map((account) => (
          <AccountItem
            key={account.id}
            account={account}
            checked={selectedAccounts.some((item) => item.id === account.id)}
            result={
              results
                ? results.find((res) => res.account.id === account.id) || null
                : undefined
            }
            toggleAccount={toggleAccount}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export { AccountsChooser };

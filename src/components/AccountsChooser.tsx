import { useAppStore } from "../store/useAppStore";
import type { Account } from "../types";
import { AccountAddresses } from "./AccountAddresses";
import { AccountBalance } from "./AccountBalance";
import { LabelToggle } from "./LabelToggle";
import { cn } from "../lib/utils";
import { Toggle } from "./Toggle";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { Dialog } from "radix-ui";
import useLocationToggle from "../hooks/useLocationToggle";
import { AccountDetailsDialog } from "./AccountDialog";

interface AccountsChooserProps {
  disabled?: boolean;
  allSelected?: boolean;
  selectedAccounts: Account[];
  toggleAccount: (account: Account, checked: boolean) => void;
  toggleAllAccounts: (checked: boolean) => void;
}

interface AccountItemProps {
  account: Account;
  checked: boolean;
  disabled?: boolean;
  toggleAccount: (account: Account, checked: boolean) => void;
}

const AccountItem = ({
  account,
  checked,
  disabled,
  toggleAccount,
}: AccountItemProps) => {
  const [showAccountDetails, toggleShowAccountDetails] = useLocationToggle(
    `${account.id}-details`
  );

  return (
    <div
      className={cn(
        "dark:bg-neutral-900",
        "flex items-center gap-2 p-1.5 rounded-full",
        "has-[input:disabled]:opacity-60"
      )}
    >
      <label className="flex items-center gap-2 cursor-pointer grow min-w-0 pl-1">
        <Toggle
          checked={checked}
          onChange={(ev) => toggleAccount(account, ev.target.checked)}
          disabled={disabled}
        />

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
  disabled,
  allSelected,
  selectedAccounts,
  toggleAccount,
  toggleAllAccounts,
}: AccountsChooserProps) => {
  const accounts = useAppStore((state) => state.accounts);

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Account List Heading */}
      <h4 className="font-protest-guerrilla px-4 text-center text-lg">
        Accounts ({accounts.length})
      </h4>
      <LabelToggle
        disabled={disabled}
        checked={allSelected}
        onChange={(ev) => toggleAllAccounts(ev.target.checked)}
      >
        Toggle Accounts
      </LabelToggle>

      <div className="flex flex-col gap-2">
        {accounts.map((account) => (
          <AccountItem
            key={account.id}
            account={account}
            checked={selectedAccounts.some((item) => item.id === account.id)}
            toggleAccount={toggleAccount}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export { AccountsChooser };

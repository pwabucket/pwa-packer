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
import { Dialog, Slot } from "radix-ui";
import { AccountDetailsDialog } from "./AccountDialog";
import { AccountsContext } from "../contexts/AccountsContext";
import { useAccountsToggle } from "../hooks/useAccountsToggle";
import { useId } from "react";
import { AccountWebview } from "./AccountWebview";

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

const AccountItemResult = ({
  result,
}: {
  result: AccountsChooserResult | null;
}) => {
  return (
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
  );
};

const AccountItemDetails = ({ account }: { account: Account }) => {
  return (
    <>
      {/* Title and balance */}
      <div className="flex flex-col grow min-w-0">
        <span className="text-xs font-bold text-yellow-500">
          {account.title}
        </span>

        <AccountBalance account={account} />
      </div>

      {/* Addresses */}
      <AccountAddresses account={account} />
    </>
  );
};

const AccountItemWrapper = (props: Slot.SlotProps) => {
  return (
    <Slot.Root
      {...props}
      className={cn(
        "flex items-center gap-2 cursor-pointer grow min-w-0 pl-1",
        "text-left",
        props.className
      )}
    />
  );
};

const AccountItem = ({
  account,
  checked,
  disabled,
  result,
  toggleAccount,
}: AccountItemProps) => {
  const [showAccountWebview, toggleShowAccountWebview] = useAccountsToggle(
    account,
    "webview"
  );

  const [showAccountDetails, toggleShowAccountDetails] = useAccountsToggle(
    account,
    "details"
  );

  return (
    <div
      className={cn(
        "bg-neutral-900",
        "hover:bg-neutral-800 cursor-pointer",
        "flex items-center gap-1 p-1.5 rounded-full",
        "has-[input:disabled]:opacity-60"
      )}
    >
      {typeof result !== "undefined" ? (
        <Dialog.Root
          open={showAccountWebview}
          onOpenChange={toggleShowAccountWebview}
        >
          <AccountItemWrapper>
            <Dialog.Trigger>
              <AccountItemResult result={result} />
              {/* Title and balance */}
              <AccountItemDetails account={account} />
            </Dialog.Trigger>
          </AccountItemWrapper>

          {/* Webview */}
          <AccountWebview account={account} />
        </Dialog.Root>
      ) : (
        <AccountItemWrapper>
          <label>
            {/* Toggle */}

            <Toggle
              checked={checked}
              onChange={(ev) => toggleAccount(account, ev.target.checked)}
              disabled={disabled}
            />

            {/* Title and balance */}
            <AccountItemDetails account={account} />
          </label>
        </AccountItemWrapper>
      )}

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
  const id = useId();

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
        <AccountsContext.Provider
          value={{ group: `accounts-chooser-${id}`, accounts }}
        >
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
        </AccountsContext.Provider>
      </div>
    </div>
  );
};

export { AccountsChooser };

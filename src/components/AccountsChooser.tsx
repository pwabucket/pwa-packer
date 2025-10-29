import { useAccountBalanceQuery } from "../hooks/useAccountBalanceQuery";
import { useAppStore } from "../store/useAppStore";
import type { Account } from "../types";
import { AccountBalance } from "./AccountBalance";
import { LabelToggle } from "./LabelToggle";

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
  const query = useAccountBalanceQuery(account.walletAddress);
  return (
    <LabelToggle
      key={account.id}
      className="flex justify-between items-center gap-2"
      checked={checked}
      onChange={(ev) => toggleAccount(account, ev.target.checked)}
      disabled={disabled}
    >
      {/* Title and balance */}
      <span className="flex flex-col">
        <span className="text-xs font-bold text-yellow-500">
          {account.title}
        </span>
        {query.isSuccess ? (
          <AccountBalance balance={query.data} />
        ) : (
          <AccountBalance.Placeholder />
        )}
      </span>

      {/* Addresses */}
      <span className="flex flex-col">
        {/* Wallet Address */}
        <span className="text-lime-300 text-xs">
          <span className="font-bold">W:</span>{" "}
          {account.walletAddress.slice(0, 6)}...
          {account.walletAddress.slice(-4)}
        </span>

        {/* Deposit Address */}
        <span className="text-orange-300 text-xs">
          <span className="font-bold">D:</span>{" "}
          {account.depositAddress.slice(0, 6)}...
          {account.depositAddress.slice(-4)}
        </span>
      </span>
    </LabelToggle>
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

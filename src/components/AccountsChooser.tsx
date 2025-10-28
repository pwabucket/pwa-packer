import { useAppStore } from "../store/useAppStore";
import type { Account } from "../types";
import { LabelToggle } from "./LabelToggle";

interface AccountsChooserProps {
  disabled?: boolean;
  allSelected?: boolean;
  selectedAccounts: Account[];
  toggleAccount: (account: Account, checked: boolean) => void;
  toggleAllAccounts: (checked: boolean) => void;
}

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
          <LabelToggle
            key={account.id}
            className="justify-between items-center gap-2"
            checked={selectedAccounts.some((item) => item.id === account.id)}
            onChange={(ev) => toggleAccount(account, ev.target.checked)}
            disabled={disabled}
          >
            {account.title}

            <span className="text-yellow-500 text-xs">
              {account.walletAddress.slice(0, 6)}...
              {account.walletAddress.slice(-4)}
            </span>
          </LabelToggle>
        ))}
      </div>
    </div>
  );
};

export { AccountsChooser };

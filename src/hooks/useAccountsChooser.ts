import { useCallback, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import type { Account } from "../types";

const useAccountsChooser = () => {
  const accounts = useAppStore((state) => state.accounts);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>(accounts);
  const allSelected = selectedAccounts.length === accounts.length;

  /* Toggle Account Selection */
  const toggleAccount = useCallback((account: Account, checked: boolean) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, account]);
    } else {
      setSelectedAccounts((prev) =>
        prev.filter((item) => item.id !== account.id)
      );
    }
  }, []);

  /* Toggle All Accounts Selection */
  const toggleAllAccounts = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedAccounts(accounts);
      } else {
        setSelectedAccounts([]);
      }
    },
    [accounts]
  );

  return {
    allSelected,
    selectedAccounts,
    toggleAccount,
    toggleAllAccounts,
  };
};

export { useAccountsChooser };

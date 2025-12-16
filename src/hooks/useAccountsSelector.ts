import { useCallback, useEffect, useState } from "react";
import type { Account } from "../types";

const useAccountsSelector = (accounts: Account[]) => {
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

  /** Reset selected accounts */
  useEffect(() => {
    setSelectedAccounts(accounts);
  }, [accounts, setSelectedAccounts]);

  return {
    accounts,
    allSelected,
    selectedAccounts,
    toggleAccount,
    toggleAllAccounts,
  };
};

export { useAccountsSelector };

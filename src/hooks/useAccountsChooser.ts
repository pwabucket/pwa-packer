import { useAccounts } from "./useAccounts";
import { useAccountsSelector } from "./useAccountsSelector";

const useAccountsChooser = () => {
  const accounts = useAccounts();

  return useAccountsSelector(accounts);
};

export { useAccountsChooser };

import { useAccountsSelector } from "./useAccountsSelector";
import { useProviderAccounts } from "./useProviderAccounts";

const useAccountsChooser = () => {
  const accounts = useProviderAccounts();

  return useAccountsSelector(accounts);
};

export { useAccountsChooser };

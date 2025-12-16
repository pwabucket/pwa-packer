import { useAccountsSelector } from "./useAccountsSelector";
import { useProviderAccounts } from "./useProviderAccounts";

const useProviderAccountsChooser = () => {
  const accounts = useProviderAccounts();

  return useAccountsSelector(accounts);
};

export { useProviderAccountsChooser };

import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";

const useProviderAccounts = () => {
  const provider = useAppStore((state) => state.provider);
  const accounts = useAppStore((state) => state.accounts);

  /** Filter Accounts by Provider */
  const providerAccounts = useMemo(() => {
    return accounts.filter(
      (account) => (account.provider || "default") === provider
    );
  }, [accounts, provider]);

  return providerAccounts;
};

export { useProviderAccounts };

import type { Account } from "../types";
import { useAccountsContext } from "./useAccountsContext";
import useLocationToggle from "./useLocationToggle";

const useAccountsToggle = (account: Account, toggleKey: string) => {
  const { group } = useAccountsContext();
  return useLocationToggle(`${group}-${account.id}-${toggleKey}`);
};

export { useAccountsToggle };

import { useAppStore } from "../store/useAppStore";
import { useAccountsSelector } from "./useAccountsSelector";

const useAccountsChooser = () => {
  const accounts = useAppStore((state) => state.accounts);

  return useAccountsSelector(accounts);
};

export { useAccountsChooser };

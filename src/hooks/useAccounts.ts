import { useAppStore } from "../store/useAppStore";

const useAccounts = () => {
  return useAppStore((state) => state.accounts);
};

export { useAccounts };

import { useAppStore } from "../store/useAppStore";

const usePassword = () => {
  return useAppStore((state) => state.password);
};

export { usePassword };

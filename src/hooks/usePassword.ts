import useAppStore from "../store/useAppStore";

export default function usePassword() {
  return useAppStore((state) => state.password);
}

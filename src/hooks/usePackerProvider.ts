import { DicaprioProvider } from "../providers/DicaprioProvider";
import { LeonardoProvider } from "../providers/LeonardoProvider";
import { useAppStore } from "../store/useAppStore";

const usePackerProvider = () => {
  const provider = useAppStore((state) => state.provider);

  return provider === "leonardo" ? LeonardoProvider : DicaprioProvider;
};

export { usePackerProvider };

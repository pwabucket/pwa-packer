import { useCallback } from "react";
import { DicaprioProvider } from "../providers/DicaprioProvider";
import { LeonardoProvider } from "../providers/LeonardoProvider";
import type { ProviderType } from "../types";

const usePackerProvider = () => {
  const getProvider = useCallback(
    (provider: ProviderType = "leonardo") =>
      provider === "leonardo" ? LeonardoProvider : DicaprioProvider,
    []
  );

  const createProvider = useCallback(
    (provider: ProviderType = "leonardo", url: string) => {
      const Provider = getProvider(provider);
      return new Provider(url);
    },
    [getProvider]
  );

  return { getProvider, createProvider };
};

export { usePackerProvider };

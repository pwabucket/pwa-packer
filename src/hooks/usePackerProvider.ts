import { useCallback } from "react";
import { LeonardoProvider } from "../providers/LeonardoProvider";
import type { ProviderType } from "../types";

const usePackerProvider = () => {
  const getProvider = useCallback(
    (_provider: ProviderType = "leonardo") => LeonardoProvider,
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

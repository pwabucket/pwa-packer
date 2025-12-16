import { useCallback } from "react";
import { LeonardoProvider } from "../providers/LeonardoProvider";
import type { ProviderType } from "../types";
import { DefaultProvider } from "../providers/DefaultProvider";

const usePackerProvider = () => {
  const getProvider = useCallback(
    (provider: ProviderType = "default") =>
      provider === "default" ? DefaultProvider : LeonardoProvider,
    []
  );

  const createProvider = useCallback(
    (provider: ProviderType = "default", url: string) => {
      const Provider = getProvider(provider);
      return new Provider(url);
    },
    [getProvider]
  );

  return { getProvider, createProvider };
};

export { usePackerProvider };

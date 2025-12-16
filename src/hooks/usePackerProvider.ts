import { useCallback } from "react";
import type { ProviderType } from "../types";
import { PROVIDERS } from "../lib/providers";

const usePackerProvider = () => {
  const getProvider = useCallback(
    (provider: ProviderType = "default") => PROVIDERS[provider],
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

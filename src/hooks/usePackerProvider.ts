import { useCallback } from "react";
import { LeonardoProvider } from "../providers/LeonardoProvider";
import type { ProviderType } from "../types";
import { DefaultProvider } from "../providers/DefaultProvider";
import { DaVinciProvider } from "../providers/DaVinciProvider";

const PROVIDERS = {
  default: DefaultProvider,
  leonardo: LeonardoProvider,
  davinci: DaVinciProvider,
};

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

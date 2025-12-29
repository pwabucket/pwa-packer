import { DaVinciProvider } from "../providers/DaVinciProvider";
import { DefaultProvider } from "../providers/DefaultProvider";
import { DjangoProvider } from "../providers/DjangoProvider";
import { LeonardoProvider } from "../providers/LeonardoProvider";
import type { ProviderType } from "../types";

export const PROVIDERS = {
  default: DefaultProvider,
  leonardo: LeonardoProvider,
  davinci: DaVinciProvider,
  django: DjangoProvider,
};

export const PROVIDER_NAMES: Record<ProviderType, string> = {
  default: "Default",
  leonardo: "Leonardo",
  davinci: "DaVinci",
  django: "Django",
};

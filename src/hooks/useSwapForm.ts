import * as yup from "yup";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** Swap Form Schema */
const SwapFormSchema = yup
  .object({
    direction: yup
      .string()
      .required()
      .oneOf(["BNB_TO_USDT", "USDT_TO_BNB"])
      .default("BNB_TO_USDT")
      .label("Direction"),
    amount: yup.string().required().label("Amount"),
    slippage: yup.string().required().default("1").label("Slippage"),
  })
  .required();

/** Swap Form Data */
interface SwapFormData {
  direction: "BNB_TO_USDT" | "USDT_TO_BNB";
  amount: string;
  slippage: string;
}

const useSwapForm = () => {
  /** Form */
  const form = useForm({
    resolver: yupResolver(SwapFormSchema),
    defaultValues: {
      direction: "BNB_TO_USDT" as const,
      amount: "",
      slippage: "1",
    },
  });

  return { form };
};

export { useSwapForm, SwapFormSchema };
export type { SwapFormData };

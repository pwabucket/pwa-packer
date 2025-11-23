import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

/** Refill Form Schema */
const RefillFormSchema = yup
  .object({
    token: yup
      .string()
      .required()
      .oneOf(["bnb", "usdt"])
      .default("bnb")
      .label("Token"),
    amount: yup.string().required().label("Amount"),
    greedy: yup.boolean().required().label("Greedy"),
  })
  .required();

/** Refill Form Data */
interface RefillFormData {
  token: "bnb" | "usdt";
  amount: string;
  greedy: boolean;
}

const useRefillForm = () => {
  /** Form */
  const form = useForm({
    resolver: yupResolver(RefillFormSchema),
    defaultValues: {
      token: "bnb" as const,
      amount: "",
      greedy: false,
    },
  });

  return { form };
};

export { useRefillForm, RefillFormSchema };
export type { RefillFormData };

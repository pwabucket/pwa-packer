import * as yup from "yup";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** Withdraw Form Schema */
const WithdrawFormSchema = yup
  .object({
    token: yup
      .string()
      .oneOf(["bnb", "usdt"])
      .required()
      .default("usdt")
      .label("Token"),
    amount: yup.string().label("Amount"),
    address: yup.string().required().label("Address"),
  })
  .required();

/** Withdraw Form Data */
interface WithdrawFormData {
  token: "bnb" | "usdt";
  address: string;
  amount?: string;
}

const useWithdrawalForm = () => {
  /** Form */
  const form = useForm({
    resolver: yupResolver(WithdrawFormSchema),
    defaultValues: {
      token: "usdt",
      address: "",
      amount: "",
    },
  });

  return { form };
};

export { useWithdrawalForm, WithdrawFormSchema };
export type { WithdrawFormData };

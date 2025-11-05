import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

/** Withdraw Form Schema */
const WithdrawFormSchema = yup
  .object({
    amount: yup.string().label("Amount"),
    address: yup.string().required().label("Address"),
  })
  .required();

/** Withdraw Form Data */
interface WithdrawFormData {
  address: string;
  amount?: string;
}

const useWithdrawalForm = () => {
  /** Form */
  const form = useForm({
    resolver: yupResolver(WithdrawFormSchema),
    defaultValues: {
      address: "",
      amount: "",
    },
  });

  return { form };
};

export { useWithdrawalForm, WithdrawFormSchema };
export type { WithdrawFormData };

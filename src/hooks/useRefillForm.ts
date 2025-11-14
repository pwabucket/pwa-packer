import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

/** Refill Form Schema */
const RefillFormSchema = yup
  .object({
    amount: yup.string().required().label("Amount"),
  })
  .required();

/** Refill Form Data */
interface RefillFormData {
  amount: string;
}

const useRefillForm = () => {
  /** Form */
  const form = useForm({
    resolver: yupResolver(RefillFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  return { form };
};

export { useRefillForm, RefillFormSchema };
export type { RefillFormData };

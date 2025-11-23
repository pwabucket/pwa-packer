import * as yup from "yup";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HEXADECIMAL_CHARS } from "../lib/utils";

/** Send Form Data Interface */
interface SendFormData {
  amount: string;
  difference: string;
  mode: "single" | "batch";
  delay: number;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
  validate: boolean;
}

/** Send Form Schema */
const SendFormSchema = yup
  .object({
    amount: yup.string().required().label("Amount"),
    difference: yup.string().required().label("Difference"),

    targetCharacters: yup
      .array()
      .required()
      .of(yup.string().oneOf(HEXADECIMAL_CHARS.split("")).required())
      .min(1)
      .label("Target Characters"),

    mode: yup
      .string()
      .required()
      .oneOf<SendFormData["mode"]>(["single", "batch"])
      .default("single")
      .label("Mode"),

    delay: yup
      .number()
      .required()
      .min(5)
      .max(60)
      .default(5)
      .label("Delay (seconds)"),

    gasLimit: yup
      .string()
      .required()
      .oneOf<SendFormData["gasLimit"]>(["average", "fast", "instant"])
      .default("fast")
      .label("Gas Fee"),

    validate: yup.boolean().required().label("Validate"),
  })
  .required();

const useSendForm = () => {
  /** Form */
  const form = useForm({
    defaultValues: {
      amount: "",
      difference: "5",
      mode: "single" as const,
      delay: 5 as const,
      gasLimit: "fast" as const,
      targetCharacters: ["a", "b", "c", "d", "e", "f"],
      validate: true,
    },
    resolver: yupResolver(SendFormSchema),
  });

  /* Field Array for Target Characters */
  const { append, remove } = useFieldArray({
    control: form.control,
    name: "targetCharacters" as never,
  });

  return { form, append, remove };
};

export { useSendForm, SendFormSchema };
export type { SendFormData };

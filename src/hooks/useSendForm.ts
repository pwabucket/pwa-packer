import * as yup from "yup";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HEXADECIMAL_CHARS } from "../lib/utils";

/** Send Form Data Interface */
interface SendFormData {
  address?: string | null;
  amount: string;
  difference: string;
  mode: "single" | "batch";
  delay: number;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
  validate: boolean;
  skipValidated: boolean;
}

/** Send Form Schema */
const SendFormSchema = yup
  .object({
    address: yup.string().label("Address"),
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
    skipValidated: yup.boolean().required().label("Skip Validated"),
  })
  .required();

const useSendForm = (defaultValues: Partial<SendFormData> = {}) => {
  /** Form */
  const form = useForm({
    defaultValues: {
      address: defaultValues.address || "",
      amount: defaultValues.amount || "",
      difference: defaultValues.difference || "0",
      mode: defaultValues.mode || ("single" as const),
      delay: defaultValues.delay || (5 as const),
      gasLimit: defaultValues.gasLimit || ("fast" as const),
      targetCharacters: defaultValues.targetCharacters || [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
      ],
      validate: defaultValues.validate || true,
      skipValidated: defaultValues.skipValidated || true,
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

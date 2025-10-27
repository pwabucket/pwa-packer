import { Label } from "../components/Label";
import { Input } from "../components/Input";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { usePassword } from "../hooks/usePassword";
import { useAppStore } from "../store/useAppStore";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { cn, getPrivateKey } from "../lib/utils";
import HashMaker from "../lib/HashMaker";
import * as yup from "yup";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormFieldError } from "../components/FormFieldError";
import { Select } from "../components/Select";
import { useMutation } from "@tanstack/react-query";

const HEXADECIMAL_CHARS = "0123456789abcdef";

/** Send Form Data Interface */
interface SendFormData {
  amount: string;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
}

/** Send Form Schema */
const SendFormSchema = yup
  .object({
    amount: yup.string().required().label("Amount"),

    targetCharacters: yup
      .array()
      .required()
      .of(yup.string().oneOf(HEXADECIMAL_CHARS.split("")).required())
      .default([])
      .label("Target Characters"),

    gasLimit: yup
      .string()
      .required()
      .oneOf<SendFormData["gasLimit"]>(["average", "fast", "instant"])
      .default("fast")
      .label("Gas Fee"),
  })
  .required();

/** Send Page Component */
const Send = () => {
  const accounts = useAppStore((state) => state.accounts);
  const password = usePassword();

  /** Form */
  const form = useForm({
    defaultValues: {
      amount: "",
      gasLimit: "fast" as const,
      targetCharacters: ["a", "b", "c", "d", "e", "f"],
    },
    resolver: yupResolver(SendFormSchema),
  });

  /* Field Array for Target Characters */
  const { append, remove } = useFieldArray({
    control: form.control,
    name: "targetCharacters" as never,
  });

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["sendFunds"],
    mutationFn: (data: SendFormData) => sendFunds(data),
  });

  /** Send Funds Function */
  const sendFunds = async (data: SendFormData) => {
    /* Validate Accounts */
    if (accounts.length === 0) {
      alert("No accounts available to send funds from.");
      return;
    }

    /* Validate Password */
    if (!password) {
      alert("Password is not set in memory.");
      return;
    }

    /* Validate Target Characters */
    if (data.targetCharacters.length === 0) {
      alert("Please select at least one target character.");
      return;
    }

    /* Create Provider */
    const provider = HashMaker.createProvider();

    /* Results Array */
    const results = [];

    /* Successful Sends Counter */
    let successfulSends = 0;

    /* Iterate Over Accounts and Send Funds */
    for (const account of accounts) {
      try {
        const privateKey = await getPrivateKey(account.id, password);
        const hashMaker = new HashMaker({ privateKey, provider });

        /* Receiver Address */
        const receiver = account.depositAddress;

        /* Select Random Target Character */
        const targetCharacter =
          data.targetCharacters[
            Math.floor(Math.random() * data.targetCharacters.length)
          ];

        /* Initialize Hash Maker */
        await hashMaker.initialize();

        /* Log Sending Info */
        console.log(
          `Sending $${data.amount} from account ${account.title} (${account.walletAddress}) to ${receiver} with targeting character ${targetCharacter}`
        );

        /* Generate Transaction */
        const result = await hashMaker.generateTransaction({
          amount: data.amount,
          gasLimit: data.gasLimit,
          broadcastIfFound: true,
          targetCharacter,
          receiver,
        });

        /* Log Result */
        console.log(result);

        /* Push Success Result */
        results.push({
          status: true,
          account,
          targetCharacter,
          result,
        });
        successfulSends++;
      } catch (error) {
        /* Log Error */
        console.error(`Failed to send from account ${account.id}:`, error);

        /* Push Failure Result */
        results.push({
          status: false,
          account,
          error,
        });
        continue;
      }
    }

    /* Show Summary Alert */
    alert(
      `Successfully sent from ${successfulSends}/${accounts.length} accounts.`
    );

    return results;
  };

  /** Handle Form Submit */
  const handleFormSubmit = async (data: SendFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <InnerPageLayout title="Send" className="gap-2">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4"
        >
          <p className="text-center text-blue-500">
            A transfer will be initiated from each account to their respective
            deposit addresses.
          </p>

          {/* Amount */}
          <Controller
            name="amount"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">
                  <img src={USDTIcon} className="size-4 inline-block" /> Amount
                  to Send
                </Label>
                <Input
                  {...field}
                  disabled={mutation.isPending}
                  id="amount"
                  autoComplete="off"
                  placeholder="Amount"
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Gas Limit */}
          <Controller
            name="gasLimit"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="gasLimit">Gas Limit</Label>
                <Select id="gasLimit" {...field} disabled={mutation.isPending}>
                  <Select.Option value="average">Average</Select.Option>
                  <Select.Option value="fast">Fast</Select.Option>
                  <Select.Option value="instant">Instant</Select.Option>
                </Select>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Target Character */}
          <Controller
            name="targetCharacters"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="target-character">
                  Target Character (HEX):
                </Label>

                <div className="grid grid-cols-4 gap-4">
                  {HEXADECIMAL_CHARS.split("").map((char) => (
                    <button
                      key={char}
                      type="button"
                      className={cn(
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "p-2 border rounded-md cursor-pointer",
                        "font-bold font-mono",
                        field.value.includes(char)
                          ? "border-yellow-500"
                          : "border-neutral-700"
                      )}
                      onClick={() =>
                        field.value.includes(char)
                          ? remove(field.value.indexOf(char))
                          : append(char)
                      }
                      disabled={mutation.isPending}
                    >
                      {char}
                    </button>
                  ))}
                </div>

                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="mt-4" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send Funds"}
          </Button>
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Send };

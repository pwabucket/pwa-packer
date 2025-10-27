import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Button } from "../components/Button";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Input } from "../components/Input";
import * as yup from "yup";
import { Label } from "../components/Label";
import { FormFieldError } from "../components/FormFieldError";
import useAppStore from "../store/useAppStore";
import { RPC, USDT_ABI, USDT_CONTRACT_ADDRESS } from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { getPrivateKey } from "../lib/utils";
import USDTIcon from "../assets/tether-usdt-logo.svg";

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

const Withdraw = () => {
  const password = useAppStore((state) => state.password);
  const accounts = useAppStore((state) => state.accounts);

  /** Form */
  const form = useForm({
    resolver: yupResolver(WithdrawFormSchema),
    defaultValues: {
      address: "",
      amount: "",
    },
  });

  const mutation = useMutation({
    mutationKey: ["gasSplit"],
    mutationFn: async (data: WithdrawFormData) => {
      /* Validate Password */
      if (!password) {
        alert("Password is not set in memory.");
        return;
      }

      /* Create Provider */
      const provider = new ethers.JsonRpcProvider(RPC);

      /* Create USDT Contract Instance */
      const token = new ethers.Contract(
        USDT_CONTRACT_ADDRESS,
        USDT_ABI,
        provider
      ) as ethers.Contract & {
        decimals: () => Promise<number>;
        symbol: () => Promise<string>;
        balanceOf: (address: string) => Promise<bigint>;
        transfer: (
          to: string,
          amount: bigint
        ) => Promise<ethers.ContractTransactionResponse>;
      };

      /* Fetch Token Decimals and Symbol */
      const [decimals, symbol] = await Promise.all([
        token.decimals(),
        token.symbol(),
      ]);

      /* Results Array */
      const results: {
        status: boolean;
        account: (typeof accounts)[number];
        result?: ethers.ContractTransactionReceipt | null;
        error?: unknown;
      }[] = [];

      /* Successful Sends Counter */
      let successfulSends = 0;

      /* Total Sent Value */
      let totalSentValue = 0;

      /* Iterate Over Accounts and Send Funds */
      await Promise.all(
        accounts.map(async (account) => {
          try {
            const privateKey = await getPrivateKey(account.id, password);
            const wallet = new ethers.Wallet(privateKey, provider);

            let amountToSend = data.amount;

            if (!amountToSend || amountToSend.trim() === "") {
              /* If amount is not specified, send the entire balance */
              const rawBal = await token.balanceOf(account.walletAddress);
              amountToSend = ethers.formatUnits(rawBal, decimals);

              /* Log Balance */
              console.log(
                `Balance of ${account.walletAddress}: ${amountToSend} ${symbol}`
              );
            }

            /* Receiver Address */
            const receiver = data.address;

            /* Log Withdrawal Info */
            console.log(
              `Withdrawing ${amountToSend} ${symbol} from ${account.title} (${account.walletAddress}) to ${receiver}`
            );

            /* Perform Transfer */
            const connectedToken = token.connect(wallet) as typeof token;
            const tx = await connectedToken.transfer(
              receiver,
              ethers.parseUnits(amountToSend, decimals)
            );

            /* Wait for Transaction to be Mined */
            const result = await tx.wait();

            /* Log Result */
            console.log(result);

            /* Push Success Result */
            results.push({
              status: true,
              account,
              result,
            });

            totalSentValue += parseFloat(amountToSend);
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
          }
        })
      );

      /* Show Summary Alert */
      alert(
        `Successfully sent $${totalSentValue} from ${successfulSends}/${accounts.length} accounts.`
      );

      return results;
    },
  });

  const handleFormSubmit = async (data: WithdrawFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <InnerPageLayout title="Withdraw Funds">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
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
                <p className="text-center text-xs text-blue-400">
                  Leave blank to send all available funds
                </p>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Address */}
          <Controller
            name="address"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Withdraw Address</Label>
                <Input
                  {...field}
                  id="address"
                  autoComplete="off"
                  placeholder="Address"
                  disabled={mutation.isPending}
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Processing..." : "Withdraw"}
          </Button>
        </form>
      </FormProvider>
    </InnerPageLayout>
  );
};

export { Withdraw };

import { useAppStore } from "../store/useAppStore";
import { RPC, usdtToken } from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { getPrivateKey } from "../lib/utils";
import type { Account } from "../types";

interface WithdrawMutationParams {
  accounts: Account[];
  amount?: string;
  address: string;
}

interface WithdrawalResult {
  status: boolean;
  account: Account;
  result?: ethers.ContractTransactionReceipt | null;
  error?: unknown;
}

const useWithdrawalMutation = () => {
  const password = useAppStore((state) => state.password)!;

  /** Form */

  const mutation = useMutation({
    mutationKey: ["withdrawal"],
    mutationFn: async (data: WithdrawMutationParams) => {
      /* Create Provider */
      const provider = new ethers.JsonRpcProvider(RPC);

      /* Fetch Token Decimals and Symbol */
      const [decimals, symbol] = await Promise.all([
        usdtToken.decimals(),
        usdtToken.symbol(),
      ]);

      /* Results Array */
      const results: WithdrawalResult[] = [];

      /* Successful Sends Counter */
      let successfulSends = 0;

      /* Total Sent Value */
      let totalSentValue = 0;

      /* Iterate Over Accounts and Send Funds */
      await Promise.all(
        data.accounts.map(async (account) => {
          try {
            const privateKey = await getPrivateKey(account.id, password);
            const wallet = new ethers.Wallet(privateKey, provider);

            let amountToSend = data.amount;

            if (!amountToSend || amountToSend.trim() === "") {
              /* If amount is not specified, send the entire balance */
              const rawBal = await usdtToken.balanceOf(account.walletAddress);
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
            const connectedToken = usdtToken.connect(
              wallet
            ) as typeof usdtToken;
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

      return { results, successfulSends, totalSentValue };
    },
  });

  return mutation;
};

export { useWithdrawalMutation };

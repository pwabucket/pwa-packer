import { useAppStore } from "../store/useAppStore";
import { USDT_DECIMALS } from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { getPrivateKey } from "../lib/utils";
import type { Account } from "../types";
import { useProgress } from "./useProgress";
import { WalletProvider } from "../lib/WalletProvider";

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
  const { progress, resetProgress, incrementProgress } = useProgress();
  const password = useAppStore((state) => state.password)!;

  /** Form */

  const mutation = useMutation({
    mutationKey: ["withdrawal"],
    mutationFn: async (data: WithdrawMutationParams) => {
      /* Reset Progress */
      resetProgress();

      /* Results Array */
      const results: WithdrawalResult[] = [];

      /* Successful Sends Counter */
      let successfulSends = 0;

      /* Total Sent Value */
      let totalSentValue = 0;

      /* Iterate Over Accounts and Send Funds */
      for (const account of data.accounts) {
        try {
          const walletProvider = new WalletProvider(account.walletAddress);
          const provider = walletProvider.getProvider();
          const usdtToken = walletProvider.getUsdtTokenContract();

          const privateKey = await getPrivateKey(account.id, password);
          const wallet = new ethers.Wallet(privateKey, provider);

          let amountToSend = data.amount;

          if (!amountToSend || amountToSend.trim() === "") {
            /* Fetch USDT Balance */
            const balance = await walletProvider.getUSDTBalance();

            /* If amount is not specified, send the entire balance */
            amountToSend = balance.toString();

            /* Log Balance */
            console.log(
              `Balance of ${account.walletAddress}: ${amountToSend} USDT`
            );
          }

          /* Receiver Address */
          const receiver = data.address;

          /* Log Withdrawal Info */
          console.log(
            `Withdrawing ${amountToSend} USDT from ${account.title} (${account.walletAddress}) to ${receiver}`
          );

          /* Perform Transfer */
          const connectedToken = usdtToken.connect(wallet) as typeof usdtToken;
          const tx = await connectedToken.transfer(
            receiver,
            ethers.parseUnits(amountToSend, USDT_DECIMALS)
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
        } finally {
          /* Increment Progress */
          incrementProgress();
        }
      }

      return { results, successfulSends, totalSentValue };
    },
  });

  return { mutation, progress };
};

export { useWithdrawalMutation };

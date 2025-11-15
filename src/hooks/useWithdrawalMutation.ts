import { useAppStore } from "../store/useAppStore";
import {
  BASE_GAS_PRICE,
  GAS_LIMITS_TRANSFER,
  USDT_DECIMALS,
} from "../lib/transaction";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { chunkArrayGenerator, getPrivateKey } from "../lib/utils";
import type { Account } from "../types";
import { useProgress } from "./useProgress";
import { WalletReader } from "../lib/WalletReader";

interface WithdrawMutationParams {
  accounts: Account[];
  amount?: string;
  address: string;
}

interface WithdrawalResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
  result?: ethers.ContractTransactionReceipt | null;
  error?: unknown;
}

const useWithdrawalMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const password = useAppStore((state) => state.password)!;

  /** Form */

  const mutation = useMutation({
    mutationKey: ["withdrawal"],
    mutationFn: async (data: WithdrawMutationParams) => {
      /* Reset Progress */
      resetProgress();

      /* Get Total Accounts */
      const totalAccounts = data.accounts.length;

      /* Successful Sends Counter */
      let successfulSends = 0;

      /* Total Sent Value */
      let totalSentValue = 0;

      const results: WithdrawalResult[] = [];

      /* Set Target for Progress */
      setTarget(totalAccounts);

      /* Iterate Over Accounts and Send Funds */
      for (const chunk of chunkArrayGenerator(data.accounts, 10)) {
        const chunkResults = await Promise.all<WithdrawalResult>(
          chunk.map(async (account) => {
            try {
              /* Create Wallet Provider */
              const reader = new WalletReader(account.walletAddress);

              /* Fetch USDT Balance */
              const balance = await reader.getUSDTBalance();

              /* Determine Amount to Send */
              let amountToSend = data.amount;

              if (!amountToSend || amountToSend.trim() === "") {
                /* If amount is not specified, send the entire balance */
                amountToSend = balance.toString();
                /* Log Balance */
                console.log(
                  `Balance of ${account.walletAddress}: ${amountToSend} USDT`
                );
              }

              /* Skip if Balance is Less Than Amount to Send */
              if (balance < parseFloat(amountToSend)) {
                return {
                  status: false,
                  skipped: true,
                  account,
                };
              }

              const provider = reader.getProvider();
              const usdtToken = reader.getUsdtTokenContract();

              const privateKey = await getPrivateKey(account.id, password);
              const wallet = new ethers.Wallet(privateKey, provider);

              /* Receiver Address */
              const receiver = data.address;

              /* Log Withdrawal Info */
              console.log(
                `Withdrawing ${amountToSend} USDT from ${account.title} (${account.walletAddress}) to ${receiver}`
              );

              const txGasPrice = BASE_GAS_PRICE;
              const txGasLimit = GAS_LIMITS_TRANSFER["fast"];

              /* Perform Transfer */
              const connectedToken = usdtToken.connect(
                wallet
              ) as typeof usdtToken;
              const tx = await connectedToken.transfer(
                receiver,
                ethers.parseUnits(amountToSend, USDT_DECIMALS),
                {
                  gasLimit: txGasLimit,
                  gasPrice: txGasPrice,
                }
              );

              /* Wait for Transaction to be Mined */
              const result = await tx.wait();

              /* Log Result */
              console.log(result);

              totalSentValue += parseFloat(amountToSend);
              successfulSends++;

              /* Push Success Result */
              return {
                status: true,
                account,
                result,
              };
            } catch (error) {
              /* Log Error */
              console.error(
                `Failed to send from account ${account.id}:`,
                error
              );

              /* Push Failure Result */
              return {
                status: false,
                account,
                error,
              };
            } finally {
              /* Increment Progress */
              incrementProgress();
            }
          })
        );

        /* Append Chunk Results */
        results.push(...chunkResults);
      }

      return { results, successfulSends, totalAccounts, totalSentValue };
    },
  });

  return { mutation, target, progress };
};

export { useWithdrawalMutation };

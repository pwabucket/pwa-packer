import { usePassword } from "./usePassword";
import {
  chunkArrayGenerator,
  delayForSeconds,
  getPrivateKey,
} from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type { Account, SendResult } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { WalletProvider } from "../lib/WalletProvider";

interface SendMutationData {
  accounts: Account[];
  amount: string;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
  validate: boolean;
}

const useSendMutation = () => {
  const { progress, resetProgress, incrementProgress } = useProgress();
  const password = usePassword()!;

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["sendFunds"],
    mutationFn: async (data: SendMutationData) => {
      /* Reset Progress */
      resetProgress();

      /* Iterate Over Accounts */
      const results: SendResult[] = [];

      /* Get Total Accounts */
      const totalAccounts = data.accounts.length;

      /* Total Amount Sent */
      let totalAmountSent = 0;

      /* Successful Sends Counter */
      let successfulSends = 0;

      /* Successful Validations Counter */
      let successfulValidations = 0;

      for (const chunk of chunkArrayGenerator(data.accounts, 10)) {
        const chunkResults = await Promise.all<SendResult>(
          chunk.map(async (account) => {
            let hashResult: HashResult | null = null;

            /* Receiver Address */
            const receiver = account.depositAddress;

            try {
              const walletProvider = new WalletProvider(account.walletAddress);
              const balance = await walletProvider.getUSDTBalance();

              if (balance < parseFloat(data.amount)) {
                return {
                  status: false,
                  skipped: true,
                  account,
                  receiver,
                  hashResult: null,
                };
              }

              const privateKey = await getPrivateKey(account.id, password);
              const hashMaker = new HashMaker({ privateKey });

              /* Initialize Hash Maker */
              await hashMaker.initialize();

              /* Log Sending Info */
              console.log(
                `Sending $${data.amount} from account ${account.title} (${
                  account.walletAddress
                }) to ${receiver} with targeting characters ${data.targetCharacters.join(
                  ", "
                )}`
              );

              /* Generate Transaction */
              hashResult = (await hashMaker.generateTransaction({
                amount: data.amount,
                gasLimit: data.gasLimit,
                targetCharacters: data.targetCharacters,
                receiver,
              })) as HashResult;

              /* Log Hash Result */
              console.log(
                `Hash Result: ${account.title} (${account.walletAddress})`,
                hashResult
              );

              /* Submit Transfer Transaction */
              const result = await hashMaker.submitTransferTransaction(
                hashResult
              );

              /* Log Submit Result */
              console.log(
                `Submit Result: ${account.title} (${account.walletAddress})`,
                result
              );

              /* Increment Successful Sends */
              successfulSends++;

              /* Accumulate Total Amount Sent */
              totalAmountSent += parseFloat(data.amount);

              /* Optional Validation */
              let validation = null;
              if (data.validate && account.url) {
                /* Delay for confirmation */
                await delayForSeconds(10);

                try {
                  const packer = new Packer(account.url);
                  await packer.initialize();
                  await packer.getTime();

                  /* Check Validation */
                  validation = await packer.checkActivity();

                  /* If still not validated, try refreshing */
                  if (!validation.activity) {
                    await delayForSeconds(5);
                    validation = await packer.checkActivity();
                  }

                  /* Increment Successful Validations */
                  if (validation.activity) {
                    successfulValidations++;
                  }
                } catch (error) {
                  /* Log Validation Error */
                  console.error(
                    `Validation failed for account ${account.id}:`,
                    error
                  );
                }
              }

              /* Push Result */
              return {
                status: true,
                account,
                hashResult,
                receiver,
                result,
                validation,
              };
            } catch (error: unknown) {
              /* Log Error */
              console.error(
                `Failed to send from account ${account.id}:`,
                error
              );

              /* Push Result */
              return {
                status: false,
                account,
                error,
                receiver,
                hashResult,
              };
            } finally {
              /* Increment Progress */
              incrementProgress();

              /* Delay to avoid rate limiting */
              await delayForSeconds(2);
            }
          })
        );

        /* Append Chunk Results */
        results.push(...chunkResults);
      }

      return {
        results,
        successfulSends,
        successfulValidations,
        totalAccounts,
        totalAmountSent,
      };
    },
  });

  return { mutation, progress };
};

export { useSendMutation };

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
import { WalletReader } from "../lib/WalletReader";

interface SendMutationData {
  accounts: Account[];
  amount: string;
  delay: number;
  mode: "single" | "batch";
  gasLimit: "average" | "fast" | "instant";
  targetCharacters: string[];
  validate: boolean;
}

const useSendMutation = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
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

      /* Set Target for Progress */
      setTarget(totalAccounts);

      /* Function to Execute Send for a Single Account */
      const execute = async (account: Account): Promise<SendResult> => {
        let hashResult: HashResult | null = null;

        /* Receiver Address */
        const receiver = account.depositAddress;

        try {
          const reader = new WalletReader(account.walletAddress);
          const balance = await reader.getUSDTBalance();

          /* Log Balance */
          console.log(
            `USDT Balance for account ${account.title} (${account.walletAddress}):`,
            balance
          );

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
          const hashMaker = new HashMaker({
            privateKey,
            provider: reader.getProvider(),
          });

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
          const result = await hashMaker.submitTransferTransaction(hashResult);

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
            await delayForSeconds(data.delay);

            try {
              const packer = new Packer(account.url);
              await packer.initialize();
              await packer.getTime();

              /* Check Validation */
              validation = await packer.checkActivity();

              /* If still not validated, try refreshing */
              if (!validation.activity) {
                await delayForSeconds(data.delay);
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
            `Failed to send from account ${account.title} (${account.walletAddress}):`,
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
        }
      };

      if (data.mode === "single") {
        for (const account of data.accounts) {
          const result = await execute(account);
          results.push(result);
        }
      } else {
        for (const chunk of chunkArrayGenerator(data.accounts, 10)) {
          const chunkResults = await Promise.all<SendResult>(
            chunk.map((account) => execute(account))
          );

          /* Append Chunk Results */
          results.push(...chunkResults);
        }
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

  return { mutation, progress, target };
};

export { useSendMutation };

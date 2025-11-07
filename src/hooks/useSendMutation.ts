import { usePassword } from "./usePassword";
import { delay, delayBetween, getPrivateKey } from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type { Account, SendResult } from "../types";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";

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

      const results: SendResult[] = [];

      /* Iterate Over Accounts */
      for (const account of data.accounts) {
        let hashResult: HashResult | null = null;

        /* Receiver Address */
        const receiver = account.depositAddress;

        try {
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
          const result = await hashMaker.submitTransferTransaction(hashResult);

          /* Log Submit Result */
          console.log(
            `Submit Result: ${account.title} (${account.walletAddress})`,
            result
          );

          /* Optional Validation */
          let validation = null;
          if (data.validate && account.url) {
            /* Delay for confirmation */
            await delay(10_000);

            try {
              const packer = new Packer(account.url);
              await packer.initialize();
              await packer.getTime();

              /* Check Validation */
              validation = await packer.checkActivity();

              /* If still not validated, try refreshing */
              if (!validation.activity) {
                await delay(5000);
                validation = await packer.refreshActivity();
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
          results.push({
            status: true,
            account,
            hashResult,
            receiver,
            result,
            validation,
          });
        } catch (error) {
          /* Log Error */
          console.error(`Failed to send from account ${account.id}:`, error);

          /* Push Result */
          results.push({
            status: false,
            account,
            error,
            receiver,
            hashResult,
          });
        } finally {
          /* Increment Progress */
          incrementProgress();

          /* Delay to avoid rate limiting */
          await delayBetween(2000, 5000);
        }
      }

      return results;
    },
  });

  return { mutation, progress };
};

export { useSendMutation };

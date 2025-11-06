import { usePassword } from "./usePassword";
import { getPrivateKey } from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type { Account, SendResult } from "../types";
import { useProgress } from "./useProgress";

interface SendMutationData {
  accounts: Account[];
  amount: string;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
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

      /* Process all accounts concurrently using Promise.all */
      const results = await Promise.all(
        data.accounts.map(async (account): Promise<SendResult> => {
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

            const result = await hashMaker.submitTransferTransaction(
              hashResult
            );

            /* Log Submit Result */
            console.log(
              `Submit Result: ${account.title} (${account.walletAddress})`,
              result
            );

            /* Increment Progress */
            incrementProgress();

            /* Return Success Result */
            return {
              status: true,
              account,
              hashResult,
              receiver,
              result,
            };
          } catch (error) {
            /* Increment Progress */
            incrementProgress();

            /* Log Error */
            console.error(`Failed to send from account ${account.id}:`, error);

            /* Return Failure Result */
            return {
              status: false,
              account,
              error,
              receiver,
              hashResult,
            };
          }
        })
      );

      return results;
    },
  });

  return { mutation, progress };
};

export { useSendMutation };

import { usePassword } from "./usePassword";
import { getPrivateKey } from "../lib/utils";
import HashMaker, { type HashResult } from "../lib/HashMaker";
import { useMutation } from "@tanstack/react-query";
import type { Account, SendResult } from "../types";

interface SendMutationData {
  accounts: Account[];
  amount: string;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
}

const useSendMutation = () => {
  const password = usePassword()!;

  /* Mutation for Sending Funds */
  const mutation = useMutation({
    mutationKey: ["sendFunds"],
    mutationFn: async (data: SendMutationData) => {
      /* Create Provider */
      const provider = HashMaker.createProvider();

      /* Process all accounts concurrently using Promise.all */
      const results = await Promise.all(
        data.accounts.map(async (account): Promise<SendResult> => {
          let hashResult: HashResult | null = null;
          /* Select Random Target Character */
          const targetCharacter =
            data.targetCharacters[
              Math.floor(Math.random() * data.targetCharacters.length)
            ];

          /* Receiver Address */
          const receiver = account.depositAddress;

          try {
            const privateKey = await getPrivateKey(account.id, password);
            const hashMaker = new HashMaker({ privateKey, provider });

            /* Initialize Hash Maker */
            await hashMaker.initialize();

            /* Log Sending Info */
            console.log(
              `Sending $${data.amount} from account ${account.title} (${account.walletAddress}) to ${receiver} with targeting character ${targetCharacter}`
            );

            /* Generate Transaction */
            hashResult = (await hashMaker.generateTransaction({
              amount: data.amount,
              gasLimit: data.gasLimit,
              targetCharacter,
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

            /* Return Success Result */
            return {
              status: true,
              account,
              targetCharacter,
              hashResult,
              receiver,
              result,
            };
          } catch (error) {
            /* Log Error */
            console.error(`Failed to send from account ${account.id}:`, error);

            /* Return Failure Result */
            return {
              status: false,
              account,
              error,
              receiver,
              hashResult,
              targetCharacter,
            };
          }
        })
      );

      return results;
    },
  });

  return mutation;
};

export { useSendMutation };

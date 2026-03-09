import { useAppStore } from "../store/useAppStore";
import { useMutation } from "@tanstack/react-query";
import { getPrivateKey } from "../lib/utils";
import type { Account } from "../types";
import SwapRouter, {
  type SwapDirection,
  type SwapResult,
} from "../lib/SwapRouter";

interface SwapMutationParams {
  account: Account;
  direction: SwapDirection;
  amount: string;
  slippage: string;
}

const useSwapMutation = () => {
  const password = useAppStore((state) => state.password)!;

  const mutation = useMutation({
    mutationFn: async ({
      account,
      direction,
      amount,
      slippage,
    }: SwapMutationParams): Promise<SwapResult> => {
      /* Get private key */
      const privateKey = await getPrivateKey(account.id, password);

      /* Create and initialize swap router */
      const swapRouter = new SwapRouter({ privateKey });
      await swapRouter.initialize();

      /* Convert slippage percentage to basis points (e.g. "1" → 100) */
      const slippageBps = Math.round(parseFloat(slippage) * 100);

      /* Execute the swap */
      const result = await swapRouter.swap({
        direction,
        amount,
        slippageBps,
      });

      return result;
    },
  });

  return { mutation };
};

export { useSwapMutation };

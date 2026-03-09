import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { getPrivateKey } from "../lib/utils";
import SwapRouter, {
  type SwapDirection,
  type SwapQuote,
} from "../lib/SwapRouter";
import type { Account } from "../types";

const useSwapQuote = ({
  account,
  direction,
  amount,
  slippage,
}: {
  account: Account | null;
  direction: SwapDirection;
  amount: string;
  slippage: string;
}) => {
  const password = useAppStore((state) => state.password)!;

  const query = useQuery<SwapQuote | null>({
    queryKey: ["swap-quote", account?.id, direction, amount, slippage],
    queryFn: async () => {
      if (!account || !amount || parseFloat(amount) <= 0) return null;

      const privateKey = await getPrivateKey(account.id, password);
      const swapRouter = new SwapRouter({ privateKey });
      await swapRouter.initialize();

      const slippageBps = Math.round(parseFloat(slippage || "1") * 100);

      return swapRouter.getQuote({
        direction,
        amount,
        slippageBps,
      });
    },
    enabled: !!account && !!amount && parseFloat(amount) > 0,
    refetchInterval: 15_000,
    retry: false,
    staleTime: 10_000,
  });

  return query;
};

export { useSwapQuote };

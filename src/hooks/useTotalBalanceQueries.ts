import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { useCallback } from "react";
import { fetchBalance } from "../lib/utils";

interface BalanceResult {
  usdtBalance: number;
  bnbBalance: number;
}

const useTotalBalanceQueries = () => {
  const accounts = useAppStore((state) => state.accounts);

  const combine = useCallback(
    (results: UseQueryResult<BalanceResult, Error>[]) => {
      return {
        query: results,
        data: results.map((result) => result.data),
        isPending: results.some((result) => result.isPending),
        isError: results.some((result) => result.isError),
        isSuccess: results.every((result) => result.isSuccess),
      };
    },
    []
  );

  const queries = useQueries({
    combine,
    queries: accounts.map((account) => ({
      queryKey: ["balance", account.walletAddress],
      queryFn: async () => fetchBalance(account.walletAddress),
    })),
  });

  return queries;
};

export { useTotalBalanceQueries };

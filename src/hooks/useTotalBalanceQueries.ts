import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchBalance } from "../lib/utils";
import { useIsAuthenticated } from "./useIsAuthenticated";
import type Decimal from "decimal.js";
import { useProviderAccounts } from "./useProviderAccounts";

interface BalanceResult {
  usdtBalance: Decimal;
  bnbBalance: Decimal;
}

const useTotalBalanceQueries = () => {
  /* Check authentication status */
  const authenticated = useIsAuthenticated();

  /* Get accounts from the store */
  const accounts = useProviderAccounts();

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
      enabled: Boolean(authenticated && account.walletAddress),
      queryKey: ["balance", account.walletAddress],
      queryFn: async () => fetchBalance(account.walletAddress),
      refetchInterval: 30_000, // Refetch every 30 seconds
    })),
  });

  return queries;
};

export { useTotalBalanceQueries };

import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "../lib/utils";
import { useIsAuthenticated } from "./useIsAuthenticated";

const useAccountBalanceQuery = (address: string) => {
  /* Check authentication status */
  const authenticated = useIsAuthenticated();

  return useQuery({
    enabled: Boolean(authenticated && address),
    queryKey: ["balance", address],
    queryFn: async () => fetchBalance(address),
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
};

export { useAccountBalanceQuery };

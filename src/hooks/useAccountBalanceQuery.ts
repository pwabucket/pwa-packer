import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "../lib/utils";

const useAccountBalanceQuery = (address: string) => {
  return useQuery({
    queryKey: ["balance", address],
    queryFn: async () => fetchBalance(address),
  });
};

export { useAccountBalanceQuery };

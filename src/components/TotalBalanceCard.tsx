import { useMemo } from "react";
import { useTotalBalanceQueries } from "../hooks/useTotalBalanceQueries";
import BNBIcon from "../assets/bnb-bnb-logo.svg";
import { MdOutlineRefresh } from "react-icons/md";
import { useQueryClient } from "@tanstack/react-query";
import { cn, truncateDecimals } from "../lib/utils";
const TotalBalanceCard = () => {
  const queryClient = useQueryClient();
  const queries = useTotalBalanceQueries();
  const totalBalance = useMemo(() => {
    if (!queries.isSuccess) return { usdt: 0, bnb: 0 };

    return queries.data.reduce(
      (total, balance) => {
        return balance
          ? {
              usdt: total.usdt + balance.usdtBalance,
              bnb: total.bnb + balance.bnbBalance,
            }
          : total;
      },
      {
        usdt: 0,
        bnb: 0,
      }
    );
  }, [queries]);

  const refetchAllBalances = () => {
    queryClient.resetQueries({ queryKey: ["balance"] });
  };

  return queries.isSuccess ? (
    <div className="flex flex-col gap-2">
      <p className="text-center flex items-center justify-center gap-2">
        {/* Spacer */}
        <span className="size-6 shrink-0" />

        {/* USDT Balance */}
        <span className="min-w-0 text-5xl font-bold font-protest-guerrilla">
          {Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          }).format(totalBalance.usdt)}
        </span>

        {/* Refresh Button */}
        <button
          onClick={refetchAllBalances}
          className={cn(
            "size-6 shrink-0 flex justify-center items-center",
            "rounded-full bg-sky-500 cursor-pointer"
          )}
        >
          <MdOutlineRefresh className="size-4" />
        </button>
      </p>
      <p className="text-center text-xs flex justify-center items-center gap-2 text-neutral-400">
        <img src={BNBIcon} alt="BNB" className="inline-block size-5" />
        {truncateDecimals(totalBalance.bnb, 8)} BNB
      </p>
    </div>
  ) : (
    <div className="text-5xl text-center font-protest-guerrilla">Loading.</div>
  );
};

export { TotalBalanceCard };

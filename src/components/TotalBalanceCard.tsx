import { cn, formatCurrency, truncateDecimals } from "../lib/utils";
import { useCallback, useMemo } from "react";

import BNBIcon from "../assets/bnb-bnb-logo.svg";
import Decimal from "decimal.js";
import { MdOutlineRefresh } from "react-icons/md";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { useQueryClient } from "@tanstack/react-query";
import { useTotalBalanceQueries } from "../hooks/useTotalBalanceQueries";

const ZERO_BALANCE = { usdt: new Decimal(0), bnb: new Decimal(0) };

const TotalBalanceCard = () => {
  const queryClient = useQueryClient();
  const { isSuccess, isError, isFetching, data } = useTotalBalanceQueries();

  const totalBalance = useMemo(() => {
    if (!isSuccess) return ZERO_BALANCE;

    return data.reduce(
      (total, balance) =>
        balance
          ? {
              usdt: total.usdt.plus(balance.usdtBalance),
              bnb: total.bnb.plus(balance.bnbBalance),
            }
          : total,
      { ...ZERO_BALANCE },
    );
  }, [isSuccess, data]);

  const refetchAllBalances = useCallback(() => {
    queryClient.resetQueries({ queryKey: ["balance"] });
  }, [queryClient]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-linear-to-br from-yellow-400 via-yellow-500 to-amber-600",
        "shadow-lg shadow-yellow-500/20",
        "text-black",
      )}
    >
      {/* Decorative Background Circles */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-4 -bottom-8 size-24 rounded-full bg-white/15" />

      {isSuccess ? (
        <div className="relative flex flex-col items-center gap-3">
          {/* Label */}
          <span className="text-xs font-medium uppercase tracking-widest text-black/70">
            Total Balance
          </span>

          {/* USDT Balance Row */}
          <div className="flex items-center gap-2">
            <img src={USDTIcon} alt="USDT" className="size-7 drop-shadow" />
            <span className="text-5xl font-bold font-protest-guerrilla tabular-nums drop-shadow-sm">
              {formatCurrency(totalBalance.usdt)}
            </span>

            {/* Refresh Button */}
            <button
              onClick={refetchAllBalances}
              disabled={isFetching}
              aria-label="Refresh balances"
              className={cn(
                "size-7 shrink-0 flex justify-center items-center text-white",
                "rounded-full bg-sky-600 backdrop-blur-sm cursor-pointer",
                "transition-all duration-200",
                "hover:bg-sky-500 hover:scale-110 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              )}
            >
              <MdOutlineRefresh
                className={cn("size-4", isFetching && "animate-spin")}
              />
            </button>
          </div>

          {/* BNB Balance */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/30">
            <img src={BNBIcon} alt="BNB" className="size-4" />
            <span className="text-xs font-medium tabular-nums text-black/70">
              {truncateDecimals(totalBalance.bnb, 8, true)} BNB
            </span>
          </div>
        </div>
      ) : isError ? (
        <div className="relative flex flex-col items-center gap-3 py-2">
          <p className="text-lg font-semibold">Failed to load balances</p>
          <button
            onClick={refetchAllBalances}
            aria-label="Retry loading balances"
            className={cn(
              "px-5 py-1.5 rounded-full text-sm font-medium",
              "bg-white/10 hover:bg-white/20 active:bg-white/25",
              "transition-colors duration-200 cursor-pointer",
            )}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-3 py-1">
          <span className="h-3 w-20 bg-white/10 rounded-full" />
          <div className="flex items-center gap-2 animate-pulse">
            <span className="size-7 rounded-full bg-white/10" />
            <span className="h-12 w-44 bg-white/10 rounded-lg" />
            <span className="size-7 rounded-full bg-white/10" />
          </div>
          <span className="h-6 w-28 bg-white/10 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export { TotalBalanceCard };

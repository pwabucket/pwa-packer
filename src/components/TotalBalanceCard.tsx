import { useMemo } from "react";
import { useTotalBalanceQueries } from "../hooks/useTotalBalanceQueries";
import BNBIcon from "../assets/bnb-bnb-logo.svg";
const TotalBalanceCard = () => {
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

  return queries.isSuccess ? (
    <div className="flex flex-col gap-2">
      <p className="text-5xl font-bold font-mono text-center">
        {Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(totalBalance.usdt)}
      </p>
      <p className="text-center text-sm">
        <img
          src={BNBIcon}
          alt="BNB"
          className="inline-block size-6 mr-2 mb-1"
        />
        {totalBalance.bnb.toFixed(8)} BNB
      </p>
    </div>
  ) : (
    <div className="text-5xl font-protest-guerrilla text-center">Loading.</div>
  );
};

export { TotalBalanceCard };

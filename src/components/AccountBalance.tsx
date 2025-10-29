import { cn, fetchBalance } from "../lib/utils";
import BNBIcon from "../assets/bnb-bnb-logo.svg";
import USDTIcon from "../assets/tether-usdt-logo.svg";

interface AccountBalanceProps extends React.ComponentProps<"span"> {
  balance: Awaited<ReturnType<typeof fetchBalance>>;
}

const AccountBalance = ({ balance, ...props }: AccountBalanceProps) => {
  return (
    <span
      {...props}
      className={cn("shrink-0 text-xs gap-2 flex", props.className)}
    >
      {/* USDT Balance */}
      <span>
        <img src={USDTIcon} alt="USDT" className="inline-block size-3 mr-1" />
        {balance.usdtBalance.toFixed(2)}
      </span>

      {/* BNB Balance */}
      <span>
        <img src={BNBIcon} alt="BNB" className="inline-block size-3 mr-1" />
        {balance.bnbBalance.toFixed(8)}
      </span>
    </span>
  );
};

const AccountBalancePlaceholder = (props: React.ComponentProps<"span">) => {
  return (
    <span
      {...props}
      className={cn(
        "shrink-0 text-xs gap-2 flex animate-pulse",
        props.className
      )}
    >
      {/* USDT Balance Placeholder */}
      <span className="size-10 h-3 bg-neutral-700 rounded-md inline-block mr-1" />

      {/* BNB Balance Placeholder */}
      <span className="size-10 h-3 bg-neutral-700 rounded-md inline-block mr-1" />
    </span>
  );
};

AccountBalance.Placeholder = AccountBalancePlaceholder;

export { AccountBalance };

import BNBIcon from "../assets/bnb-bnb-logo.svg";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { cn } from "../lib/utils";

interface TokenButtonProps extends React.ComponentProps<"button"> {
  token: "bnb" | "usdt";
  selected: boolean;
  onClick: () => void;
}

/** Token Selection Button Component */
const TokenButton = ({ token, selected, ...props }: TokenButtonProps) => {
  return (
    <button
      {...props}
      type="button"
      className={cn(
        "border-2 rounded-full p-2 cursor-pointer",
        "flex items-center justify-center gap-2",
        "hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed",
        selected ? "border-yellow-500" : "border-neutral-700"
      )}
    >
      {token === "bnb" ? (
        <img src={BNBIcon} className="size-4 inline-block" />
      ) : (
        <img src={USDTIcon} className="size-4 inline-block rounded-full" />
      )}
      <span>{token.toUpperCase()}</span>
    </button>
  );
};

export { TokenButton };

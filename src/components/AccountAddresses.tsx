import { cn, copyToClipboard, truncateAddress } from "../lib/utils";

import type { Account } from "../types";
import { MdOutlineContentCopy } from "react-icons/md";

interface AccountAddressesProps {
  account: Account;
  canCopy?: boolean;
}

interface AccountAddressItemProps extends React.ComponentPropsWithoutRef<"span"> {
  label: string;
  address: string;
  message?: string;
  canCopy?: boolean;
}

const AccountAddressItem = ({
  label,
  address,
  canCopy,
  message,
  ...props
}: AccountAddressItemProps) => {
  const handleCopy = () => {
    copyToClipboard(address, message || "Address copied to clipboard!");
  };

  return (
    <span
      {...props}
      onClick={canCopy ? handleCopy : undefined}
      className={cn(
        "text-xs flex items-center gap-1 truncate",
        canCopy && "cursor-pointer hover:underline",
        props.className,
      )}
    >
      <span className="font-bold">{label}:</span> {truncateAddress(address)}
      {canCopy && <MdOutlineContentCopy className="inline-block" />}
    </span>
  );
};

const AccountAddresses = ({ account, canCopy }: AccountAddressesProps) => {
  return (
    <span className="flex flex-col shrink-0">
      {/* Wallet Address */}
      {account.walletAddress && (
        <AccountAddressItem
          label="W"
          className="text-lime-300"
          address={account.walletAddress}
          canCopy={canCopy}
          message="Copied wallet address to clipboard!"
        />
      )}

      {/* Deposit Address */}
      {account.depositAddress && (
        <AccountAddressItem
          label="D"
          className="text-orange-300"
          address={account.depositAddress}
          canCopy={canCopy}
          message="Copied deposit address to clipboard!"
        />
      )}
    </span>
  );
};

export { AccountAddresses };

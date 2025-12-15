import { MdOutlineContentCopy } from "react-icons/md";
import { copyToClipboard, truncateAddress } from "../lib/utils";
import type { Account } from "../types";

interface AccountAddressesProps {
  account: Account;
  canCopy?: boolean;
}

const AccountAddressCopyButton = ({ address }: { address: string }) => {
  const handleCopy = () => {
    copyToClipboard(address);
  };

  return (
    <button onClick={handleCopy} className="text-xs cursor-pointer">
      <MdOutlineContentCopy className="inline-block" />
    </button>
  );
};

const AccountAddresses = ({ account, canCopy }: AccountAddressesProps) => {
  return (
    <span className="flex flex-col shrink-0">
      {/* Wallet Address */}
      <span className="text-lime-300 text-xs flex items-center gap-1 truncate">
        <span className="font-bold">W:</span>{" "}
        {truncateAddress(account.walletAddress)}
        {canCopy && (
          <>
            {" "}
            <AccountAddressCopyButton address={account.walletAddress} />
          </>
        )}
      </span>

      {/* Deposit Address */}
      <span className="text-orange-300 text-xs flex items-center gap-1 truncate">
        <span className="font-bold">D:</span>{" "}
        {truncateAddress(account.depositAddress || "")}
        {canCopy && (
          <>
            {" "}
            <AccountAddressCopyButton address={account.depositAddress || ""} />
          </>
        )}
      </span>
    </span>
  );
};

export { AccountAddresses };

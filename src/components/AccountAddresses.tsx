import type { Account } from "../types";

interface AccountAddressesProps {
  account: Account;
}

const AccountAddresses = ({ account }: AccountAddressesProps) => {
  return (
    <span className="flex flex-col shrink-0">
      {/* Wallet Address */}
      <span className="text-lime-300 text-xs">
        <span className="font-bold">W:</span>{" "}
        {account.walletAddress.slice(0, 6)}...
        {account.walletAddress.slice(-4)}
      </span>

      {/* Deposit Address */}
      <span className="text-orange-300 text-xs">
        <span className="font-bold">D:</span>{" "}
        {account.depositAddress.slice(0, 6)}...
        {account.depositAddress.slice(-4)}
      </span>
    </span>
  );
};

export { AccountAddresses };

import { useMemo } from "react";
import type { Account } from "../types";
import { cn, copyToClipboard, extractTgWebAppData } from "../lib/utils";
import { MdOutlineContentCopy } from "react-icons/md";

const InfoItem = ({
  title,
  value,
  className,
}: {
  title: string;
  value?: string;
  className?: string;
}) => {
  return (
    <div className="flex gap-2 p-4">
      <div className="flex flex-col grow min-w-0">
        <h4 className="text-xs text-neutral-400">{title}</h4>
        <p className={cn("break-all", className)}>{value || "N/A"}</p>
      </div>

      <button
        onClick={() => copyToClipboard(value || "")}
        className="text-xl text-neutral-500 hover:text-neutral-300 shrink-0 cursor-pointer"
        title={`Copy ${title}`}
      >
        <MdOutlineContentCopy />
      </button>
    </div>
  );
};

const AccountInfo = ({ account }: { account: Account }) => {
  const user = useMemo(() => {
    return extractTgWebAppData(account.url!)["initDataUnsafe"]["user"];
  }, [account.url]);

  return (
    <div className="flex flex-col divide-y divide-neutral-800 text-sm">
      <div className="flex gap-4 p-4">
        <img
          src={user?.photo_url as string}
          alt="User Avatar"
          className="size-10 rounded-full shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <h2 className="font-bold truncate text-yellow-500">
            {user?.first_name} {user?.last_name}
          </h2>
          {user?.username && (
            <p className="text-neutral-400 truncate">@{user.username}</p>
          )}
          <p className="text-purple-300">
            <button
              onClick={() => copyToClipboard(user?.id.toString() || "")}
              className="text-xs cursor-pointer"
            >
              ID: {user?.id} <MdOutlineContentCopy className="inline-block" />
            </button>
          </p>
        </div>
      </div>

      <InfoItem title="ID" value={`${user?.id}`} className="text-purple-300" />
      <InfoItem
        title="Username"
        value={user?.username && `@${user.username}`}
        className="text-indigo-300"
      />
      <InfoItem
        title="First Name"
        value={`${user?.first_name}`}
        className="text-neutral-300"
      />
      <InfoItem
        title="Last Name"
        value={`${user?.last_name}`}
        className="text-neutral-300"
      />

      <InfoItem
        title="Wallet Address"
        value={account.walletAddress}
        className="text-lime-300"
      />
      <InfoItem
        title="Deposit Address"
        value={account.depositAddress}
        className="text-orange-300"
      />
    </div>
  );
};

export { AccountInfo };

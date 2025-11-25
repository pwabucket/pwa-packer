import { useMemo } from "react";
import type { Account } from "../types";
import {
  cn,
  copyToClipboard,
  extractTgWebAppData,
  walletAddressLink,
} from "../lib/utils";
import {
  MdChevronRight,
  MdOutlineContentCopy,
  MdOutlineOpenInNew,
} from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { Packer } from "../lib/Packer";
import { Collapsible } from "radix-ui";

const InfoItem = ({
  title,
  value,
  className,
  href,
}: {
  title: string;
  value?: string;
  className?: string;
  href?: string;
}) => {
  return (
    <div className="flex gap-2 p-4">
      <div className="flex flex-col grow min-w-0">
        <h4 className="text-xs text-neutral-400">{title}</h4>
        <p className={cn("break-all", className)}>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {value || "N/A"}{" "}
              <MdOutlineOpenInNew className="inline-block size-3 opacity-30" />
            </a>
          ) : (
            value || "N/A"
          )}
        </p>
      </div>

      {/* Copy button */}
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

  const statusQuery = useQuery({
    queryKey: ["account-status", account.id],
    queryFn: async () => {
      const packer = new Packer(account.url!);
      await packer.initialize();
      const status = await packer.validate();
      return status;
    },
  });

  const status = useMemo(() => {
    if (!statusQuery.data) return null;
    const data = statusQuery.data.data;
    const results = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        return [formattedKey, value];
      })
    );

    return results;
  }, [statusQuery.data]);

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
        href={walletAddressLink(account.walletAddress)}
      />
      <InfoItem
        title="Deposit Address"
        value={account.depositAddress}
        className="text-orange-300"
        href={walletAddressLink(account.depositAddress)}
      />

      <InfoItem
        title="Account Status"
        value={statusQuery.data ? statusQuery.data.data.status : "Loading..."}
        className="text-teal-300"
      />

      <Collapsible.Root>
        <Collapsible.Trigger
          className={cn(
            "p-4 w-full text-left text-sm text-yellow-500",
            "hover:bg-neutral-800 cursor-pointer",
            "flex items-center gap-2 group"
          )}
        >
          <MdChevronRight
            className={cn(
              "size-5  group-data-[state=open]:rotate-90",
              "transition-transform"
            )}
          />
          View Detailed Status
        </Collapsible.Trigger>
        <Collapsible.Content className="flex flex-col divide-y divide-neutral-800 bg-neutral-950">
          {status ? (
            Object.entries(status).map(([key, value]) => (
              <InfoItem
                key={key}
                title={key}
                value={String(value)}
                className="text-rose-300"
                href={
                  key.includes("Address")
                    ? walletAddressLink(String(value))
                    : undefined
                }
              />
            ))
          ) : (
            <p className="p-4 text-sm text-neutral-500">Loading...</p>
          )}
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};

export { AccountInfo };

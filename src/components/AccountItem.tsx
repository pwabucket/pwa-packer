import { Link } from "react-router";
import type { Account } from "../types";
import { MdEditNote } from "react-icons/md";

import { Dialog } from "radix-ui";
import { HiOutlineEye } from "react-icons/hi2";
import { AccountDialog } from "../components/AccountDialog";
import { cn } from "../lib/utils";
import { useAccountBalanceQuery } from "../hooks/useAccountBalanceQuery";
import { AccountBalance } from "./AccountBalance";
import { Reorder, useDragControls } from "motion/react";

/** Single Account Item Component */
const AccountItem = ({ account }: { account: Account }) => {
  const query = useAccountBalanceQuery(account.walletAddress);
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={account}
      dragListener={false}
      dragControls={dragControls}
    >
      <Dialog.Root>
        <div
          className={cn(
            "group relative",
            "bg-neutral-900",
            "rounded-4xl overflow-hidden",
            "transition-all duration-200 ease-in-out"
          )}
        >
          {/* Main Content Area */}
          <div className="flex items-center p-3 gap-4">
            {/* Account Avatar / Reorder Handle */}
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className={cn(
                "size-12 rounded-full flex items-center justify-center shrink-0",
                "group-hover:scale-105 transition-transform duration-200",
                "touch-none select-none bg-transparent p-0 px-4",
                "bg-yellow-500 cursor-pointer"
              )}
            >
              <span className="font-bold text-black">
                {account.title.slice(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Account Info - Dialog Trigger */}
            <Dialog.Trigger className="grow text-left cursor-pointer group">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <h2 className="font-bold text-sm group-hover:text-yellow-500 transition-colors grow min-w-0 min-h-0">
                    {account.title}
                  </h2>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-lime-300 font-mono truncate">
                    Wallet: {account.walletAddress.slice(0, 6)}...
                    {account.walletAddress.slice(-4)}
                  </p>
                  <p className="text-xs text-orange-300 font-mono truncate">
                    Deposit: {account.depositAddress.slice(0, 6)}...
                    {account.depositAddress.slice(-4)}
                  </p>
                </div>

                {/* Balance Info */}
                {query.isSuccess ? (
                  <AccountBalance balance={query.data} />
                ) : (
                  <AccountBalance.Placeholder />
                )}
              </div>
            </Dialog.Trigger>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View Details Indicator */}
              <Dialog.Trigger
                className={cn(
                  "size-10 flex items-center justify-center cursor-pointer",
                  "hover:bg-neutral-700 rounded-full",
                  "text-neutral-400 hover:text-yellow-500",
                  "transition-colors duration-200"
                )}
              >
                <span className="sr-only">View {account.title} details</span>
                <HiOutlineEye className="size-5" />
              </Dialog.Trigger>

              {/* Edit Account Button */}
              <Link
                to={`/accounts/edit/${account.id}`}
                className={cn(
                  "size-10 flex items-center justify-center cursor-pointer",
                  "hover:bg-neutral-700 rounded-full",
                  "text-neutral-400 hover:text-blue-400",
                  "transition-colors duration-200"
                )}
              >
                <span className="sr-only">Edit {account.title}</span>
                <MdEditNote className="size-5" />
              </Link>
            </div>
          </div>

          {/* Subtle accent line */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-0.5",
              "invisible group-hover:visible",
              "bg-yellow-500/30"
            )}
          />
        </div>

        <AccountDialog account={account} />
      </Dialog.Root>
    </Reorder.Item>
  );
};

export { AccountItem };

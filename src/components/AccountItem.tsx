import type { Account } from "../types";
import { MdEditNote } from "react-icons/md";

import { Dialog } from "radix-ui";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import { AccountDialog } from "../components/AccountDialog";
import { cn } from "../lib/utils";
import { AccountBalance } from "./AccountBalance";
import { Reorder, useDragControls } from "motion/react";
import { useCallback, useState } from "react";
import { AccountWebview } from "./AccountWebview";
import { AccountAvatar } from "./AccountAvatar";
import toast from "react-hot-toast";
import { AccountEditDialog } from "./AccountEditDialog";

/** Single Account Item Component */
const AccountItem = ({ account }: { account: Account }) => {
  const dragControls = useDragControls();
  const [openURL, setOpenURL] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const launchURL = useCallback(() => {
    if (!account.url) {
      toast.error("No URL set for this account.");
      return;
    }

    setOpenURL(true);
  }, [account.url]);

  const closeURL = useCallback(() => {
    setOpenURL(false);
  }, []);

  return (
    <>
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
              <AccountAvatar
                account={account}
                onPointerDown={(event) => dragControls.start(event)}
              />

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

                  <AccountBalance account={account} />
                </div>
              </Dialog.Trigger>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Launch URL Button */}
                <button
                  onClick={launchURL}
                  className={cn(
                    "size-10 flex items-center justify-center cursor-pointer",
                    "hover:bg-neutral-700 rounded-full",
                    "text-neutral-400 hover:text-yellow-500",
                    "transition-colors duration-200"
                  )}
                >
                  <span className="sr-only">View {account.title} page</span>
                  <HiOutlineArrowUpRight className="size-5" />
                </button>

                {/* Edit Account Button */}
                <button
                  onClick={() => setShowEditForm(true)}
                  className={cn(
                    "size-10 flex items-center justify-center cursor-pointer",
                    "hover:bg-neutral-700 rounded-full",
                    "text-neutral-400 hover:text-blue-400",
                    "transition-colors duration-200"
                  )}
                >
                  <span className="sr-only">Edit {account.title}</span>
                  <MdEditNote className="size-5" />
                </button>
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

      {openURL && <AccountWebview account={account} close={closeURL} />}
      {showEditForm && (
        <AccountEditDialog
          account={account}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </>
  );
};

export { AccountItem };

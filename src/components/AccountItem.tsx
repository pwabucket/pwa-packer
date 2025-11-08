import type { Account } from "../types";
import { MdEditNote, MdOutlineAccountBalanceWallet } from "react-icons/md";

import { Dialog } from "radix-ui";
import { AccountDetailsDialog } from "../components/AccountDialog";
import { cn, truncateAddress } from "../lib/utils";
import { AccountBalance } from "./AccountBalance";
import { Reorder, useDragControls } from "motion/react";
import { useCallback } from "react";
import { AccountWebview } from "./AccountWebview";
import { AccountAvatar } from "./AccountAvatar";
import { AccountEditDialog } from "./AccountEditDialog";
import useLocationToggle from "../hooks/useLocationToggle";

const AccountActionButton = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn(
        "size-10 flex items-center justify-center cursor-pointer",
        "hover:bg-neutral-700 rounded-full",
        "text-neutral-400 hover:text-yellow-500",
        "transition-colors duration-200",
        props.className
      )}
    />
  );
};

/** Single Account Item Component */
const AccountItem = ({ account }: { account: Account }) => {
  const dragControls = useDragControls();

  const [showAccountWebview, toggleShowAccountWebview] = useLocationToggle(
    `${account.id}-webview`
  );
  const [showAccountDetails, toggleShowAccountDetails] = useLocationToggle(
    `${account.id}-details`
  );
  const [showEditForm, toggleShowEditForm] = useLocationToggle(
    `${account.id}-edit`
  );

  /* Launch Account Details Dialog */
  const launchAccountDetails = useCallback(() => {
    toggleShowAccountDetails(true);
  }, [toggleShowAccountDetails]);

  /* Close Account Details Dialog */
  const closeAccountDetails = useCallback(() => {
    toggleShowAccountDetails(false);
  }, [toggleShowAccountDetails]);

  return (
    <>
      <Reorder.Item
        value={account}
        dragListener={false}
        dragControls={dragControls}
      >
        <Dialog.Root
          open={showAccountWebview}
          onOpenChange={toggleShowAccountWebview}
        >
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
              <Dialog.Trigger className="grow min-w-0 text-left cursor-pointer group">
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <h2 className="font-bold text-sm text-yellow-500 transition-colors grow min-w-0 min-h-0">
                      {account.title}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-lime-300 font-mono truncate">
                      Wallet: {truncateAddress(account.walletAddress)}
                    </p>
                    <p className="text-xs text-orange-300 font-mono truncate">
                      Deposit: {truncateAddress(account.depositAddress)}
                    </p>
                  </div>

                  {/* Balance Info */}
                  <AccountBalance account={account} />
                </div>
              </Dialog.Trigger>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Account Details Button */}
                <AccountActionButton onClick={launchAccountDetails}>
                  <span className="sr-only">View {account.title} page</span>
                  <MdOutlineAccountBalanceWallet className="size-5" />
                </AccountActionButton>

                {/* Edit Account Button */}
                <AccountActionButton
                  onClick={() => toggleShowEditForm(true)}
                  className={cn("hover:text-blue-400")}
                >
                  <span className="sr-only">Edit {account.title}</span>
                  <MdEditNote className="size-5" />
                </AccountActionButton>
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

          <AccountWebview account={account} close={closeAccountDetails} />
        </Dialog.Root>
      </Reorder.Item>

      {showAccountDetails && (
        <Dialog.Root
          open={showAccountDetails}
          onOpenChange={closeAccountDetails}
        >
          <AccountDetailsDialog account={account} />
        </Dialog.Root>
      )}
      {showEditForm && (
        <AccountEditDialog
          account={account}
          onClose={() => toggleShowEditForm(false)}
        />
      )}
    </>
  );
};

export { AccountItem };

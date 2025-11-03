import { Dialog } from "radix-ui";
import type { Account } from "../types";
import { PopupDialog } from "./PopupDialog";
import { cn } from "../lib/utils";
import { HiOutlineXMark } from "react-icons/hi2";
import { AccountBalance } from "./AccountBalance";
import { AccountAddresses } from "./AccountAddresses";
import { AccountAvatar } from "./AccountAvatar";

interface AccountWebviewProps {
  account: Account;
  close: () => void;
}
const AccountWebview = ({ account, close }: AccountWebviewProps) => {
  return (
    <Dialog.Root open onOpenChange={close}>
      <PopupDialog className="p-0 h-full max-h-[720px] overflow-hidden gap-0">
        <div className="flex gap-2 items-center justify-center shrink-0 p-4">
          <div className="size-10 shrink-0">
            <AccountAvatar account={account} className="size-full" />
          </div>
          <div className="flex flex-col items-center justify-center grow min-w-0 min-h-0">
            <Dialog.Title className="font-bold text-sm text-center text-yellow-500 ">
              {account.title}
            </Dialog.Title>
            <AccountAddresses account={account} canCopy />
            <AccountBalance account={account} />
          </div>

          <div className="size-10 shrink-0">
            {/* Close URL Button */}
            <Dialog.Close
              title="Close URL"
              className={cn(
                "size-full text-neutral-400 hover:text-yellow-500 cursor-pointer",
                "flex justify-center items-center"
              )}
            >
              <HiOutlineXMark className="size-5" />
            </Dialog.Close>
          </div>
        </div>
        <iframe
          src={account.url}
          className="grow w-full bg-neutral-800/50"
          referrerPolicy="no-referrer"
        />
      </PopupDialog>
    </Dialog.Root>
  );
};

export { AccountWebview };

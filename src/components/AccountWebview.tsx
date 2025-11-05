import { Dialog, Tabs } from "radix-ui";
import type { Account } from "../types";
import { PopupDialog } from "./PopupDialog";
import { cn } from "../lib/utils";
import { HiOutlineXMark } from "react-icons/hi2";
import { AccountBalance } from "./AccountBalance";
import { AccountAddresses } from "./AccountAddresses";
import { AccountAvatar } from "./AccountAvatar";
import { useCallback, useState } from "react";
import { AccountDialogSendTab } from "./AccountDialogSendTab";
import { AccountDialogWithdrawTab } from "./AccountDialogWithdrawTab";
import { MdOutlineArrowBackIos } from "react-icons/md";

interface AccountWebviewProps {
  account: Account;
  close: () => void;
}

interface WebviewAreaProps {
  account: Account;
}

const WebviewArea = ({ account }: WebviewAreaProps) => {
  return (
    <div className="flex flex-col h-full">
      {account.url ? (
        <iframe
          src={account.url}
          className="grow w-full bg-neutral-800/50"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="grow flex justify-center items-center text-sm text-neutral-400">
          No URL Set
        </div>
      )}
    </div>
  );
};

const WebviewAsideTabTrigger = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "px-4 py-2",
        "text-sm font-medium cursor-pointer",
        "text-neutral-400 hover:text-yellow-500",
        "data-[state=active]:text-yellow-500 border-b-2 border-b-transparent",
        "data-[state=active]:border-b-yellow-500",
        "focus:outline-none focus:ring-0"
      )}
    >
      {title}
    </Tabs.Trigger>
  );
};

const WebviewAside = ({ account }: { account: Account }) => {
  return (
    <Tabs.Root
      defaultValue="send"
      className="flex flex-col size-full overflow-hidden"
    >
      <Tabs.List className="grid grid-cols-2 shrink-0">
        <WebviewAsideTabTrigger title="Send" value="send" />
        <WebviewAsideTabTrigger title="Withdraw" value="withdraw" />
      </Tabs.List>

      <div className="grow overflow-auto p-4">
        <Tabs.Content value="send">
          <AccountDialogSendTab account={account} />
        </Tabs.Content>

        <Tabs.Content value="withdraw">
          <AccountDialogWithdrawTab account={account} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
};

const AccountHeader = ({
  account,
  isOpened,
  toggleAside,
}: {
  account: Account;
  isOpened: boolean;
  toggleAside: () => void;
}) => {
  return (
    <div className="flex gap-2 items-center justify-center shrink-0 p-4">
      <div className="size-10 shrink-0">
        {isOpened ? (
          <button
            className={cn(
              "size-full bg-neutral-800 rounded-full",
              "flex justify-center items-center",
              "cursor-pointer hover:bg-neutral-700/80 transition-colors duration-200 ease-in-out"
            )}
            onClick={toggleAside}
          >
            <MdOutlineArrowBackIos className="size-5 text-yellow-500" />
          </button>
        ) : (
          <AccountAvatar
            account={account}
            className="size-full"
            onClick={toggleAside}
          />
        )}
      </div>
      <div className="flex flex-col items-center justify-center grow min-w-0 min-h-0">
        <Dialog.Title className="font-bold text-sm text-center text-yellow-500 ">
          {account.title}
        </Dialog.Title>
        <Dialog.Description className="sr-only">
          Panel for {account.title}
        </Dialog.Description>
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
  );
};

const AccountWebview = ({ account }: AccountWebviewProps) => {
  const [showAside, setShowAside] = useState(false);
  const toggleAside = useCallback(() => {
    setShowAside((prev) => !prev);
  }, []);

  return (
    <PopupDialog
      onInteractOutside={(ev) => ev.preventDefault()}
      className="p-0 h-full max-h-[768px] overflow-hidden gap-0"
    >
      <AccountHeader
        isOpened={showAside}
        account={account}
        toggleAside={toggleAside}
      />
      <div className="grow min-w-0 min-h-0 overflow-hidden">
        <div
          className={cn(
            "grid grid-cols-2 w-[200%] h-full",
            showAside ? "translate-x-[-50%]" : "translate-x-0",
            "transition-transform duration-500 ease-in-out"
          )}
        >
          <WebviewArea account={account} />
          <WebviewAside account={account} />
        </div>
      </div>
    </PopupDialog>
  );
};

export { AccountWebview };

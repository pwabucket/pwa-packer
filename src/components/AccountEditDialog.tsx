import { Dialog } from "radix-ui";
import type { Account } from "../types";
import { ExistingAccountForm } from "./ExistingAccountForm";
import { PopupDialog } from "./PopupDialog";
import { MdOutlineClose } from "react-icons/md";
import { cn } from "../lib/utils";

interface AccountEditDialogProps {
  account: Account;
  onClose: () => void;
}
const AccountEditDialog = ({ account, onClose }: AccountEditDialogProps) => {
  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <PopupDialog>
        <div className="flex items-center gap-4">
          <span className="size-8 shrink-0" />
          <Dialog.Title className="grow min-w-0 font-bold text-yellow-500 text-center">
            {account.title}
          </Dialog.Title>
          <Dialog.Close
            className={cn(
              "size-8 shrink-0 flex items-center justify-center",
              "rounded-full hover:bg-neutral-800 hover:text-red-500 cursor-pointer"
            )}
          >
            <MdOutlineClose className="size-6" />
          </Dialog.Close>
        </div>
        <Dialog.Description className="text-sm text-neutral-400 text-center">
          Edit the details of your account.
        </Dialog.Description>
        <ExistingAccountForm account={account} onUpdated={onClose} />
      </PopupDialog>
    </Dialog.Root>
  );
};

export { AccountEditDialog };

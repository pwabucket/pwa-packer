import { Dialog } from "radix-ui";
import { PopupDialog } from "./PopupDialog";
import { MdOutlineClose } from "react-icons/md";
import { cn } from "../lib/utils";
import { NewAccountForm } from "./NewAccountForm";

/** Props for NewAccountDialog Component */
interface NewAccountDialogProps {
  onClose: () => void;
}

/** New Account Dialog Component */
const NewAccountDialog = ({ onClose }: NewAccountDialogProps) => {
  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <PopupDialog>
        <div className="flex items-center gap-4">
          <span className="size-8 shrink-0" />
          <Dialog.Title className="grow min-w-0 font-bold text-yellow-500 text-center">
            New Account
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
          Create a new account to start managing your assets.
        </Dialog.Description>
        <NewAccountForm onCreated={onClose} />
      </PopupDialog>
    </Dialog.Root>
  );
};

export { NewAccountDialog };

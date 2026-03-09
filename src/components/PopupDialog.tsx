import { Dialog } from "radix-ui";
import { cn } from "../lib/utils";

interface PopupDialogProps extends Dialog.DialogContentProps {
  overlayClassName?: string;
  containerClassName?: string;
}

const PopupDialog = ({
  overlayClassName,
  containerClassName,
  ...props
}: PopupDialogProps) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "flex flex-col fixed inset-0 bg-black/50",
          "overflow-auto z-30",
          overlayClassName,
        )}
      >
        <div
          className={cn(
            "w-full max-w-md p-4 m-auto flex flex-col max-h-full",
            containerClassName,
          )}
        >
          <Dialog.Content
            onOpenAutoFocus={(ev) => ev.preventDefault()}
            {...props}
            className={cn(
              "bg-neutral-900 p-6 rounded-2xl w-full",
              "flex flex-col min-w-0 gap-2",
              props.className,
            )}
          />
        </div>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
};

export { PopupDialog };

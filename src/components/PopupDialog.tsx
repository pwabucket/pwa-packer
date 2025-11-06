import { Dialog } from "radix-ui";
import { cn } from "../lib/utils";

const PopupDialog = (props: Dialog.DialogContentProps) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 bg-black/50",
          "grid place-items-center",
          "overflow-auto p-4 z-50"
        )}
      >
        <Dialog.Content
          onOpenAutoFocus={(ev) => ev.preventDefault()}
          {...props}
          className={cn(
            "bg-neutral-900 p-6 rounded-2xl max-w-sm w-full",
            "flex flex-col min-w-0 gap-2",
            props.className
          )}
        />
      </Dialog.Overlay>
    </Dialog.Portal>
  );
};

export { PopupDialog };

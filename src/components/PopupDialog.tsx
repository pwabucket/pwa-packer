import { Dialog } from "radix-ui";
import { cn } from "../lib/utils";

const PopupDialog = (props: Dialog.DialogContentProps) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 bg-black/50",
          "grid place-items-center",
          "overflow-auto z-30",
        )}
      >
        <div className="max-w-md p-4">
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

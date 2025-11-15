import ParcelIcon from "../assets/parcel-icon.svg";
import { cn } from "../lib/utils";
import { PopupDialog } from "./PopupDialog";
import { Dialog } from "radix-ui";
import { HiOutlineXMark } from "react-icons/hi2";

/** Parcel URL from Environment Variables */
const PARCEL_URL = import.meta.env.VITE_PARCEL_URL;

interface ParcelDialogProps extends Dialog.DialogProps {
  path: string;
}

/** Parcel Dialog Component */
const ParcelDialog = ({ path, ...props }: ParcelDialogProps) => {
  return (
    <Dialog.Root {...props}>
      <PopupDialog className="p-0 h-full max-h-[768px] overflow-hidden gap-0 max-w-md">
        {/* Header */}
        <div className="flex gap-2 items-center justify-center shrink-0 p-2">
          <div className="size-10 shrink-0" />

          {/* Title */}
          <Dialog.Title className="flex items-center justify-center gap-2 grow min-w-0">
            <img src={ParcelIcon} className="size-6" />
            Parcel
          </Dialog.Title>

          {/* Hidden Description */}
          <Dialog.Description className="sr-only">
            Split Panel
          </Dialog.Description>

          {/* Close Button */}
          <div className="size-10 shrink-0">
            {/* Close Parcel */}
            <Dialog.Close
              title="Close Parcel"
              className={cn(
                "size-full text-neutral-400 hover:text-yellow-500 cursor-pointer",
                "flex justify-center items-center"
              )}
            >
              <HiOutlineXMark className="size-5" />
            </Dialog.Close>
          </div>
        </div>

        {/* Iframe */}
        <iframe
          src={new URL(path, PARCEL_URL).href}
          title="Parcel"
          className="border-0 grow"
        ></iframe>
      </PopupDialog>
    </Dialog.Root>
  );
};

export { ParcelDialog };

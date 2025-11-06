import type { SendResult } from "../types";
import { PopupDialog } from "../components/PopupDialog";
import { Dialog } from "radix-ui";
import { Button } from "../components/Button";
import { SendResultsAccordion } from "../components/SendResultsAccordion";
import { MdOutlineClose, MdReceiptLong } from "react-icons/md";
import { cn } from "../lib/utils";

/** Send Results Props Interface */
interface SendResultsProps {
  results: SendResult[];
}

/** Send Results Component */
const SendResults = ({ results }: SendResultsProps) => {
  return (
    <PopupDialog onInteractOutside={(e) => e.preventDefault()}>
      <div className="flex items-center gap-4">
        <span className="size-10 shrink-0" />
        <Dialog.Title className="grow min-w-0 font-bold text-yellow-500 text-center">
          <MdReceiptLong className="inline-block mr-2" /> Send Results
        </Dialog.Title>
        <Dialog.Close
          className={cn(
            "size-10 shrink-0 flex items-center justify-center",
            "rounded-full text-neutral-400",
            "hover:bg-neutral-800 hover:text-red-500 cursor-pointer"
          )}
        >
          <MdOutlineClose className="size-6" />
        </Dialog.Close>
      </div>

      <Dialog.Description className="text-neutral-400 text-sm text-center">
        Click each item to view detailed information about the send results.
      </Dialog.Description>

      {/* Send Results Accordion */}
      <SendResultsAccordion results={results} />

      {/* Close Button */}
      <Dialog.Close asChild>
        <Button className="my-2">Close</Button>
      </Dialog.Close>
    </PopupDialog>
  );
};

export { SendResults };

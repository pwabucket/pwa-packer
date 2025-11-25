import type { SendResult } from "../types";
import { PopupDialog } from "../components/PopupDialog";
import { Dialog } from "radix-ui";
import { Button } from "../components/Button";
import { SendResultsAccordion } from "../components/SendResultsAccordion";
import { MdDownload, MdOutlineClose, MdReceiptLong } from "react-icons/md";
import { cn, downloadJsonFile } from "../lib/utils";

/** Send Results Props Interface */
interface SendResultsProps {
  results: SendResult[];
}

/** Send Results Component */
const SendResults = ({ results }: SendResultsProps) => {
  /** Download Results as JSON File */
  const downloadResults = () => {
    downloadJsonFile("send-results", results);
  };

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

      <Button className="mx-auto" onClick={downloadResults}>
        <MdDownload className="size-4" /> Download Results JSON
      </Button>

      <div className="flex flex-col overflow-auto max-h-96 px-2 -mx-2">
        {/* Send Results Accordion */}
        <SendResultsAccordion results={results} />
      </div>

      {/* Close Button */}
      <Dialog.Close asChild>
        <Button className="my-2">Close</Button>
      </Dialog.Close>
    </PopupDialog>
  );
};

export { SendResults };

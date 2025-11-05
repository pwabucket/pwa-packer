import type { SendResult } from "../types";
import { PopupDialog } from "../components/PopupDialog";
import { Dialog } from "radix-ui";
import { Button } from "../components/Button";
import { SendResultsAccordion } from "../components/SendResultsAccordion";
import { MdReceiptLong } from "react-icons/md";

/** Send Results Props Interface */
interface SendResultsProps {
  results: SendResult[];
}

/** Send Results Component */
const SendResults = ({ results }: SendResultsProps) => {
  return (
    <PopupDialog onInteractOutside={(e) => e.preventDefault()}>
      <Dialog.Title className="text-xl text-center text-yellow-500">
        <MdReceiptLong className="inline-block mr-2" /> Send Results
      </Dialog.Title>
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

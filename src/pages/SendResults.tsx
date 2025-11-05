import type { SendResult } from "../types";
import { PopupDialog } from "../components/PopupDialog";
import { Dialog } from "radix-ui";
import { Button } from "../components/Button";
import { SendResultsAccordion } from "../components/SendResultsAccordion";

/** Send Results Props Interface */
interface SendResultsProps {
  results: SendResult[];
}

/** Send Results Component */
const SendResults = ({ results }: SendResultsProps) => {
  return (
    <PopupDialog onInteractOutside={(e) => e.preventDefault()}>
      <Dialog.Title className="text-2xl text-center text-yellow-500">
        Results
      </Dialog.Title>
      <Dialog.Description className="text-center text-sm text-neutral-400">
        Summary of send operations:
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

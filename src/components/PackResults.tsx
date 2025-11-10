import { PopupDialog } from "./PopupDialog";
import { Dialog } from "radix-ui";
import { Button } from "./Button";
import { MdCheckCircle, MdOutlineClose, MdRemoveCircle } from "react-icons/md";
import { cn } from "../lib/utils";
import type { PackResult } from "../types";
import { AccountAvatar } from "./AccountAvatar";
import { AccountBalance } from "./AccountBalance";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";

/** Pack Results Props Interface */
interface PackResultsProps {
  results: PackResult[];
}

/** Pack Results Component */
const PackResults = ({ results }: PackResultsProps) => {
  return (
    <PopupDialog onInteractOutside={(e) => e.preventDefault()}>
      <div className="flex items-center gap-4">
        <span className="size-10 shrink-0" />
        <div className="grow min-w-0">
          <Dialog.Title className=" font-bold text-yellow-500 text-center">
            <HiOutlineCurrencyDollar className="inline-block mr-2" /> Pack
            Results
          </Dialog.Title>

          <Dialog.Description className="text-neutral-400 text-sm text-center">
            Here are the results of the packing process.
          </Dialog.Description>
        </div>
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

      <div className="flex flex-col gap-2 overflow-auto max-h-96 px-2 -mx-2">
        {results.map((result, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-neutral-800 rounded-xl p-2"
          >
            {/* Avatar */}
            <AccountAvatar account={result.account} className="size-10" />

            {/* Title and Balance */}
            <div className="grow min-w-0">
              <h2
                className={cn(
                  "font-bold text-sm flex items-baseline",
                  "text-yellow-500"
                )}
              >
                {result.account.title}
              </h2>
              <AccountBalance account={result.account} />
            </div>

            {/* Deposit Details */}
            <p className="flex flex-col shrink-0">
              {/* Available Amount */}
              <span className="text-lime-300 text-xs flex items-center gap-1 truncate flex-row-reverse">
                <span className="font-bold">OUT:</span> $
                {Number(result.amount || 0).toFixed?.(2)}
              </span>
            </p>

            {/* Status Icon */}
            <span className="shrink-0">
              {result.status ? (
                result.skipped ? (
                  <MdRemoveCircle className="size-6 text-yellow-500" />
                ) : (
                  <MdCheckCircle className="size-6 text-lime-400" />
                )
              ) : (
                <MdOutlineClose className="size-6 text-red-500" />
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Close Button */}
      <Dialog.Close asChild>
        <Button className="my-2">Close</Button>
      </Dialog.Close>
    </PopupDialog>
  );
};

export { PackResults };

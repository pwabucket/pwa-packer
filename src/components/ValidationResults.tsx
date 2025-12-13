import { PopupDialog } from "./PopupDialog";
import { Dialog } from "radix-ui";
import { Button } from "./Button";
import {
  MdCheckCircle,
  MdOutlineClose,
  MdOutlineSearch,
  MdRemoveCircle,
} from "react-icons/md";
import { cn, formatCurrency } from "../lib/utils";
import { AccountAvatar } from "./AccountAvatar";
import { AccountBalance } from "./AccountBalance";
import Decimal from "decimal.js";
import type { ValidationResult } from "../types";

/** Validation Results Props Interface */
interface ValidationResultsProps {
  results: ValidationResult[];
}

/** Validation Results Component */
const ValidationResults = ({ results }: ValidationResultsProps) => {
  return (
    <PopupDialog onInteractOutside={(e) => e.preventDefault()}>
      <div className="flex items-center gap-4">
        <span className="size-10 shrink-0" />
        <div className="grow min-w-0">
          <Dialog.Title className="font-bold text-yellow-500 text-center">
            <MdOutlineSearch className="inline-block mr-2" /> Validation Results
          </Dialog.Title>
          <Dialog.Description className="text-neutral-400 text-sm text-center">
            Here are the results of the account validation process.
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
              {/* Deposited Amount */}
              <span className="text-orange-300 text-xs flex items-center gap-1 truncate flex-row-reverse">
                <span className="font-bold">IN:</span>{" "}
                {formatCurrency(new Decimal(result.activity?.amount || 0))}
              </span>{" "}
              {/* Available Amount */}
              <span className="text-lime-300 text-xs flex items-center gap-1 truncate flex-row-reverse">
                <span className="font-bold">AV:</span>{" "}
                {formatCurrency(new Decimal(result.activity?.balance || 0))}
              </span>
            </p>

            {/* Status Icon */}
            <span className="shrink-0">
              {result.status ? (
                result.activity?.participating ? (
                  <MdCheckCircle className="size-6 text-lime-400" />
                ) : (
                  <MdRemoveCircle className="size-6 text-yellow-500" />
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

export { ValidationResults };

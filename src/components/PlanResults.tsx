import { MdCheckCircle, MdOutlineClose } from "react-icons/md";
import { cn, formatCurrency } from "../lib/utils";
import type { PlanResult, PlanValidationResult } from "../types";
import { AccountAvatar } from "./AccountAvatar";
import { AccountBalance } from "./AccountBalance";

const PlanResults = ({
  results,
}: {
  results: (PlanResult | PlanValidationResult)[];
}) => {
  return (
    <div className="flex flex-col gap-2">
      {results.map((result, index) => (
        <div
          key={index}
          className="flex items-center gap-2 bg-neutral-800 rounded-full p-2"
        >
          {/* Avatar */}
          <AccountAvatar account={result.account} className="size-8" />

          {/* Title and Balance */}
          <div className="grow min-w-0">
            <h2
              className={cn(
                "font-bold text-xs flex items-baseline",
                "text-yellow-500"
              )}
            >
              {result.account.title}
            </h2>
            <AccountBalance account={result.account} />
          </div>

          {/* Details */}
          <p className="flex flex-col shrink-0">
            {/* Streak */}
            <span className="text-orange-300 text-xs flex items-center gap-1 truncate flex-row-reverse">
              <span className="font-bold">Streak</span> {result.streak}
            </span>{" "}
            {/* Amount */}
            <span className="text-lime-300 text-xs flex items-center gap-1 truncate flex-row-reverse">
              {formatCurrency(result.amount)}
              {"activity" in result && result.activity ? (
                <> / {formatCurrency(Number(result.activity.amount))}</>
              ) : null}
            </span>
          </p>

          {/* Status Icon */}
          {"validation" in result ? (
            <span className="shrink-0">
              {result.validation ? (
                <MdCheckCircle className="size-6 text-lime-400" />
              ) : (
                <MdOutlineClose className="size-6 text-red-500" />
              )}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export { PlanResults };

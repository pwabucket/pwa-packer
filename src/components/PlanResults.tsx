import { MdCheckCircle, MdOutlineClose } from "react-icons/md";
import { cn, formatCurrency } from "../lib/utils";
import type { PlanResult, PlanValidationResult } from "../types";
import { AccountAvatar } from "./AccountAvatar";
import { AccountBalance } from "./AccountBalance";
import { Dialog } from "radix-ui";
import { AccountWebview } from "./AccountWebview";
import useLocationToggle from "../hooks/useLocationToggle";

const PlanResultItem = ({
  result,
  validated,
  disabled,
}: {
  disabled?: boolean;
  validated?: boolean;
  result: PlanResult | PlanValidationResult;
}) => {
  const [showAccountWebview, toggleShowAccountWebview] = useLocationToggle(
    `${result.account.id}-webview`
  );

  return (
    <Dialog.Root
      open={showAccountWebview}
      onOpenChange={toggleShowAccountWebview}
      key={result.account.id}
    >
      <Dialog.Trigger
        disabled={disabled}
        className={cn(
          "flex items-center gap-2",
          "bg-neutral-900",
          "hover:bg-neutral-800",
          "rounded-full p-2 cursor-pointer",
          "disabled:opacity-50 disabled:pointer-events-none"
        )}
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
        <p className="shrink-0 text-xs">
          {/* Amount */}
          {validated ? (
            <span className="text-blue-300">
              {formatCurrency(Number(result.activity.activity?.amount || 0))} /{" "}
            </span>
          ) : null}
          <span className="text-lime-300">{formatCurrency(result.amount)}</span>
        </p>

        {/* Streak */}
        <span
          className={cn(
            "shrink-0 flex items-center justify-center font-bold",
            "text-xs bg-neutral-700 size-4 rounded-full",
            result.activity.streak > 1
              ? "text-red-400"
              : result.activity.streak > 0
              ? "text-yellow-400"
              : "text-green-400"
          )}
        >
          {result.activity.streak}
        </span>

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
      </Dialog.Trigger>

      <AccountWebview account={result.account} enableSwitcher={false} />
    </Dialog.Root>
  );
};

const PlanResults = ({
  validated = false,
  disabled,
  results,
}: {
  validated?: boolean;
  disabled?: boolean;
  results: (PlanResult | PlanValidationResult)[];
}) => {
  return (
    <div className={cn("flex flex-col gap-2")}>
      {results.map((result) => (
        <PlanResultItem
          key={result.account.id}
          result={result}
          validated={validated}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export { PlanResults };

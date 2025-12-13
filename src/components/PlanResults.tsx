import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { cn, formatCurrency } from "../lib/utils";
import type { PlanResult, PlanValidationResult } from "../types";
import { AccountAvatar } from "./AccountAvatar";
import { AccountBalance } from "./AccountBalance";
import { Dialog } from "radix-ui";
import { AccountWebview } from "./AccountWebview";
import { AccountsContext } from "../contexts/AccountsContext";
import { useMemo } from "react";
import { AccountAddresses } from "./AccountAddresses";
import { AccountDetailsDialog } from "./AccountDialog";
import { useAccountsToggle } from "../hooks/useAccountsToggle";
import Decimal from "decimal.js";

const PlanResultItem = ({
  result,
  validated,
  disabled,
}: {
  disabled?: boolean;
  validated?: boolean;
  result: PlanResult | PlanValidationResult;
}) => {
  const [showAccountWebview, toggleShowAccountWebview] = useAccountsToggle(
    result.account,
    "webview"
  );

  const [showAccountDetails, toggleShowAccountDetails] = useAccountsToggle(
    result.account,
    "details"
  );

  return (
    <div
      className={cn(
        "text-left",
        "flex items-center p-2",
        "bg-neutral-900",
        "hover:bg-neutral-800",
        "rounded-4xl cursor-pointer",
        "has-[button:disabled]:opacity-50 has-[button:disabled]:pointer-events-none"
      )}
    >
      {/* Webview Dialog */}
      <Dialog.Root
        open={showAccountWebview}
        onOpenChange={toggleShowAccountWebview}
        key={result.account.id}
      >
        <Dialog.Trigger
          disabled={disabled}
          className={cn(
            "cursor-pointer text-left",
            "p-1 flex grow min-w-0 gap-2 items-center"
          )}
        >
          {/* Avatar */}
          <AccountAvatar account={result.account} />

          {/* Account Info */}
          <div className="flex flex-col gap-0.5 grow min-w-0">
            <h2 className="font-bold text-sm text-yellow-500 truncate">
              {result.account.title}
            </h2>

            {/* Account Addresses */}
            <AccountAddresses account={result.account} />

            {/* Balance Info */}
            <AccountBalance account={result.account} />
          </div>

          {/* Details */}
          <div className="flex shrink-0 gap-2 items-center">
            <div className="font-bold shrink-0 text-xs flex flex-col items-end">
              {/* Validation Status */}
              {validated && "validation" in result ? (
                <span
                  className={cn(
                    result.validation ? "text-green-400" : "text-red-400"
                  )}
                >
                  {result.validation ? "Success" : "Failed"}
                </span>
              ) : null}

              {/* Amount */}
              <p>
                {validated ? (
                  <span className="text-blue-300">
                    {formatCurrency(
                      new Decimal(result.activity.activity?.amount || 0)
                    )}{" "}
                    /{" "}
                  </span>
                ) : null}
                <span className="text-fuchsia-300">
                  {formatCurrency(result.amount)}
                </span>
              </p>

              {/* Activity Balance */}
              {validated ? (
                <p>
                  <span className="text-lime-400">
                    {formatCurrency(
                      new Decimal(result.activity.activity?.balance || 0)
                    )}
                  </span>
                </p>
              ) : null}
            </div>

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
          </div>
        </Dialog.Trigger>
        <AccountWebview account={result.account} />
      </Dialog.Root>

      {/* Account Wallet Details */}
      <Dialog.Root
        open={showAccountDetails}
        onOpenChange={toggleShowAccountDetails}
      >
        <Dialog.Trigger
          disabled={disabled}
          className={cn(
            "shrink-0",
            "p-2 flex items-center justify-center cursor-pointer",
            "hover:bg-neutral-700 rounded-full",
            "text-neutral-500 hover:text-yellow-500",
            "transition-colors duration-200"
          )}
        >
          <MdOutlineAccountBalanceWallet className="size-5" />
        </Dialog.Trigger>

        <AccountDetailsDialog account={result.account} />
      </Dialog.Root>
    </div>
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
  const accounts = useMemo(() => results.map((r) => r.account), [results]);
  return (
    <div className={cn("flex flex-col gap-2")}>
      <AccountsContext.Provider
        value={{
          group: "plan-results",
          accounts,
        }}
      >
        {results.map((result) => (
          <PlanResultItem
            key={result.account.id}
            result={result}
            validated={validated}
            disabled={disabled}
          />
        ))}
      </AccountsContext.Provider>
    </div>
  );
};

export { PlanResults };

import { useQuery } from "@tanstack/react-query";
import type { Account } from "../types";
import { MdOutlineOpenInNew } from "react-icons/md";
import { cn, formatCurrency, transactionHashLink } from "../lib/utils";
import { format } from "date-fns";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import Decimal from "decimal.js";
import { usePackerProvider } from "../hooks/usePackerProvider";
const AccountDialogHistoryTab = ({ account }: { account: Account }) => {
  const Packer = usePackerProvider();

  /* Check authentication status */
  const authenticated = useIsAuthenticated();

  /* Query for withdrawal activity list */
  const query = useQuery({
    enabled: Boolean(authenticated && account.url),
    queryKey: ["withdraw-activity-list", account.id],
    queryFn: async () => {
      const packer = new Packer(account.url!);
      await packer.initialize();
      const result = await packer.getWithdrawalHistory();
      return result;
    },
  });

  return query.data ? (
    <div className="flex flex-col divide-y divide-neutral-700">
      {query.data.map((item) => (
        <div key={item.id} className="p-2 flex gap-2 items-center">
          <div className="grow min-w-0 flex flex-col gap-1">
            {/* Amount */}
            <p
              className={cn(
                "font-bold text-sm",
                item.status === "success" ? "text-lime-400" : "text-orange-400"
              )}
            >
              {formatCurrency(new Decimal(item.amount))}
            </p>

            {/* Status */}
            <p
              className={cn(
                "text-xs",
                item.status === "success" ? "text-green-400" : "text-orange-400"
              )}
            >
              {item.status === "success" ? "Completed" : "Pending"}
            </p>

            {/* Created Date */}
            <p className="text-xs text-neutral-400">
              {format(new Date(item.date), "PPpp")}
            </p>
          </div>

          {/* Open explorer */}
          <div className="size-10 flex items-center justify-center">
            {item.hash && (
              <a
                href={transactionHashLink(item.hash)}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Blockchain Explorer"
                className="text-neutral-400 hover:text-neutral-200"
              >
                <MdOutlineOpenInNew className="size-5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-center text-neutral-400 text-sm">Loading...</p>
  );
};

export { AccountDialogHistoryTab };

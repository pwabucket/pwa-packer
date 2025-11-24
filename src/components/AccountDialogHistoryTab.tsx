import { useQuery } from "@tanstack/react-query";
import { Packer } from "../lib/Packer";
import type { Account } from "../types";
import { MdOutlineOpenInNew } from "react-icons/md";
import { cn } from "../lib/utils";
import { format } from "date-fns";
const AccountDialogHistoryTab = ({ account }: { account: Account }) => {
  const query = useQuery({
    enabled: Boolean(account.url),
    queryKey: ["withdraw-activity-list", account.id],
    queryFn: async () => {
      const packer = new Packer(account.url!);
      await packer.initialize();
      const data = await packer.getWithdrawActivityList();
      return data;
    },
  });

  const activities: {
    ["id"]: number;
    ["status"]: number;
    ["tp"]: string;
    ["create_time"]: string;
    ["hashId"]: string | null;
  }[] = query.data?.data?.list || [];

  console.log("Activities:", activities);

  return query.data ? (
    <div className="flex flex-col divide-y divide-neutral-700">
      {activities.map((activity) => (
        <div key={activity.id} className="p-2 flex gap-2 items-center">
          <div className="grow min-w-0 flex flex-col gap-1">
            {/* Amount */}
            <p
              className={cn(
                "font-bold text-sm",
                activity.status === 3 ? "text-lime-400" : "text-orange-400"
              )}
            >
              {Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(activity.tp))}
            </p>

            {/* Status */}
            <p
              className={cn(
                "text-xs",
                activity.status === 3 ? "text-green-400" : "text-orange-400"
              )}
            >
              {activity.status === 3 ? "Completed" : "Pending"}
            </p>

            {/* Created Time */}
            <p className="text-xs text-neutral-400">
              {format(new Date(activity.create_time + "-05:00"), "PPpp")}
            </p>
          </div>

          {/* Open explorer */}
          <div className="size-10 flex items-center justify-center">
            {activity.hashId && (
              <a
                href={`https://bscscan.com/tx/${activity.hashId}`}
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

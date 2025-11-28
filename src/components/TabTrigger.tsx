import { Tabs } from "radix-ui";
import { cn } from "../lib/utils";

const TabTrigger = ({ title, value }: { title: string; value: string }) => {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "px-4 py-2 truncate",
        "text-sm font-medium cursor-pointer",
        "text-neutral-400 hover:text-yellow-500",
        "data-[state=active]:text-yellow-500 border-b-2 border-b-transparent",
        "data-[state=active]:border-b-yellow-500",
        "focus:outline-none focus:ring-0"
      )}
    >
      {title}
    </Tabs.Trigger>
  );
};

export { TabTrigger };

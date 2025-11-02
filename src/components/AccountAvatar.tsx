import { cn } from "../lib/utils";
import type { Account } from "../types";

interface AccountAvatarProps extends React.ComponentProps<"div"> {
  account: Account;
}

const AccountAvatar = ({ account, ...props }: AccountAvatarProps) => (
  <div
    {...props}
    className={cn(
      "size-12 rounded-full flex items-center justify-center shrink-0",
      "group-hover:scale-105 transition-transform duration-200",
      "touch-none select-none bg-transparent p-0 px-4",
      "bg-yellow-500 cursor-pointer",
      props.className
    )}
  >
    <span className="font-bold text-black">
      {account.title.slice(0, 2).toUpperCase()}
    </span>
  </div>
);
export { AccountAvatar };

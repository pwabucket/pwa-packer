import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useLocation, useNavigate } from "react-router";
import { useAppStore } from "../store/useAppStore";
import type { Account } from "../types";
import { cn } from "../lib/utils";

const AccountSwitcherButton = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn(
        "size-10 shrink-0 rounded-full",
        "flex items-center justify-center gap-2",
        "border border-neutral-700 cursor-pointer",
        "hover:bg-yellow-500 hover:text-black transition-colors"
      )}
    />
  );
};

const AccountSwitcher = ({
  account,
  switchKey,
}: {
  account: Account;
  switchKey: string;
}) => {
  const navigate = useNavigate();
  const accounts = useAppStore((state) => state.accounts);
  const location = useLocation();

  const switchAccount = (direction: "next" | "previous") => {
    const currentIndex = accounts.findIndex((a) => a.id === account.id);
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % accounts.length
        : (currentIndex - 1 + accounts.length) % accounts.length;
    const newAccount = accounts[newIndex];

    const newState = {
      ...location.state,
      [`${newAccount.id}-${switchKey}`]: true,
    };
    delete newState[`${account.id}-${switchKey}`];

    navigate(location, {
      state: newState,
      replace: true,
    });
  };

  return (
    <div className="flex gap-2 items-center justify-center shrink-0 p-2">
      <AccountSwitcherButton onClick={() => switchAccount("previous")}>
        <MdChevronLeft className="size-6" />
      </AccountSwitcherButton>

      <AccountSwitcherButton onClick={() => switchAccount("next")}>
        <MdChevronRight className="size-6" />
      </AccountSwitcherButton>
    </div>
  );
};

export { AccountSwitcher };

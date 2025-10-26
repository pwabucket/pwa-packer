import { Link, useNavigate, type LinkProps } from "react-router";
import useAppStore from "../store/useAppStore";
import AppIcon from "../assets/icon.svg";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import type { Account } from "../types";
import { MdEditNote, MdOutlineLocalGasStation } from "react-icons/md";

import { Dialog } from "radix-ui";
import {
  HiOutlineArrowDownLeft,
  HiOutlineArrowUpRight,
  HiOutlinePlus,
} from "react-icons/hi2";
import { AccountDialog } from "../components/AccountDialog";
import { cn } from "../lib/utils";

/** Single Account Item Component */
const AccountItem = ({ account }: { account: Account }) => {
  return (
    <Dialog.Root>
      <div
        className={cn(
          "flex items-center px-2 gap-2",
          "bg-neutral-900 rounded-full"
        )}
      >
        {/* Account Title / Dialog Trigger */}
        <Dialog.Trigger className="grow p-4 text-left cursor-pointer hover:text-yellow-500">
          <h2 className="font-bold">{account.title}</h2>
        </Dialog.Trigger>

        {/* Edit Account Button */}
        <Link
          to={`/accounts/edit/${account.id}`}
          className={cn(
            "size-10 flex items-center justify-center cursor-pointer",
            "hover:bg-neutral-800 rounded-full shrink-0"
          )}
        >
          <span className="sr-only">Edit {account.title}</span>
          <MdEditNote className="size-6 text-neutral-400" />
        </Link>
      </div>

      <AccountDialog account={account} />
    </Dialog.Root>
  );
};

/** Action Button Props Interface */
interface ActionButtonProps extends LinkProps {
  icon: React.ReactNode;
  label?: string;
}

/** Action Button Component */
const ActionButton = ({ icon, label, ...props }: ActionButtonProps) => (
  <Link
    {...props}
    className="flex flex-col justify-center items-center shrink-0 gap-1"
  >
    <span
      className={cn(
        "size-12 shrink-0 rounded-full",
        "flex items-center justify-center gap-2",
        "bg-neutral-800 hover:bg-neutral-700"
      )}
    >
      {icon}
    </span>

    <span className="text-xs shrink-0 text-center text-neutral-400">
      {label}
    </span>
  </Link>
);

/** Dashboard Page Component */
const Dashboard = () => {
  const accounts = useAppStore((state) => state.accounts);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-dvh">
      <AppHeader
        middleContent={
          <h1
            className={cn(
              "grow min-w-0 min-h-0",
              "font-protest-guerrilla text-2xl",
              "flex justify-center items-center gap-2"
            )}
          >
            <img src={AppIcon} alt="Packer" className="size-6" />
            Packer
          </h1>
        }
        rightContent={
          <AppHeader.Button onClick={() => navigate("/accounts/new")}>
            <HiOutlinePlus className="size-6 text-neutral-400" />
          </AppHeader.Button>
        }
      />

      {/* Main content area */}
      <MainContainer className="gap-4">
        <div className="flex justify-center items-center gap-6">
          {/* Withdraw */}
          <ActionButton
            to="/withdraw"
            label="Withdraw"
            icon={<HiOutlineArrowDownLeft className="size-5" />}
          />

          {/* Send Action Button */}
          <ActionButton
            to="/send"
            label="Send"
            icon={<HiOutlineArrowUpRight className="size-5" />}
          />

          {/* Gas */}
          <ActionButton
            to="/gas"
            label="Gas"
            icon={<MdOutlineLocalGasStation className="size-5" />}
          />
        </div>

        {/* Account List */}
        <div className="flex flex-col gap-2">
          {accounts.length === 0 ? (
            <p className="text-center text-neutral-400 px-4">
              No accounts available. Please create one.
            </p>
          ) : (
            accounts.map((account) => (
              <AccountItem key={account.id} account={account} />
            ))
          )}
        </div>
      </MainContainer>
    </div>
  );
};

export { Dashboard };

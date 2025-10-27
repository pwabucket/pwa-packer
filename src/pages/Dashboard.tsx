import { Link, useNavigate, type LinkProps } from "react-router";
import useAppStore from "../store/useAppStore";
import AppIcon from "../assets/icon.svg";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import { MdOutlineLocalGasStation } from "react-icons/md";

import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { AccountItem } from "../components/AccountItem";
import { Button } from "../components/Button";

/** Action Button Props Interface */
interface ActionButtonProps extends LinkProps {
  icon: React.ReactNode;
  label?: string;
}

/** Action Button Component */
const ActionButton = ({ icon, label, ...props }: ActionButtonProps) => (
  <Link
    {...props}
    className="flex flex-col justify-center items-center shrink-0 gap-1 group"
  >
    <span
      className={cn(
        "size-14 shrink-0 rounded-full",
        "flex items-center justify-center gap-2",
        "border border-neutral-700",
        "hover:bg-yellow-500 hover:text-black transition-colors"
      )}
    >
      {icon}
    </span>

    <span
      className={cn(
        "text-xs shrink-0 text-center transition-colors",
        "text-neutral-400 group-hover:text-yellow-500"
      )}
    >
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

        {/* Account List Heading */}
        <h4 className="font-protest-guerrilla px-4 text-center text-lg">
          Your Accounts ({accounts.length})
        </h4>

        {/* New Account Button */}
        <Button onClick={() => navigate("/accounts/new")}>New Account</Button>

        {/* Account List */}
        <div className="flex flex-col gap-2">
          {accounts.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 px-4">
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

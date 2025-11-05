import { Link } from "react-router";
import { useAppStore } from "../store/useAppStore";
import AppIcon from "../assets/icon.svg";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import { MdOutlineLocalGasStation, MdOutlineMenu } from "react-icons/md";

import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { AccountItem } from "../components/AccountItem";
import { Button } from "../components/Button";
import { TotalBalanceCard } from "../components/TotalBalanceCard";
import { Reorder } from "motion/react";
import { Dialog } from "radix-ui";
import { ActionButton } from "../components/ActionButton";
import { ExtraUtilsDialog } from "../components/ExtraUtilsDialog";
import { NewAccountDialog } from "../components/NewAccountDialog";
import useLocationToggle from "../hooks/useLocationToggle";

/** Dashboard Page Component */
const Dashboard = () => {
  const accounts = useAppStore((state) => state.accounts);
  const setAccounts = useAppStore((state) => state.setAccounts);

  const [showNewAccountDialog, setShowNewAccountDialog] =
    useLocationToggle("new-account-dialog");

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
        <TotalBalanceCard />

        <div className="flex justify-center items-center gap-6">
          {/* Withdraw */}
          <ActionButton
            asChild
            label="Withdraw"
            icon={<HiOutlineArrowDownLeft className="size-5" />}
          >
            <Link to="/withdraw" />
          </ActionButton>

          {/* Send Action Button */}
          <ActionButton
            asChild
            label="Send"
            icon={<HiOutlineArrowUpRight className="size-5" />}
          >
            <Link to="/send" />
          </ActionButton>

          {/* Gas */}
          <ActionButton
            asChild
            label="Gas"
            icon={<MdOutlineLocalGasStation className="size-5" />}
          >
            <Link to="/gas" />
          </ActionButton>

          <Dialog.Root>
            <ActionButton
              icon={<MdOutlineMenu className="size-5" />}
              label="More"
              asChild
            >
              <Dialog.Trigger />
            </ActionButton>
            <ExtraUtilsDialog />
          </Dialog.Root>
        </div>

        {/* Account List Heading */}
        <h4 className="font-protest-guerrilla px-4 text-center text-lg">
          Your Accounts ({accounts.length})
        </h4>

        {/* New Account Button */}
        <Button onClick={() => setShowNewAccountDialog(true)}>
          New Account
        </Button>

        {showNewAccountDialog && (
          <NewAccountDialog onClose={() => setShowNewAccountDialog(false)} />
        )}

        {/* Account List */}
        <div className="flex flex-col gap-2">
          {accounts.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 px-4">
              No accounts available. Please create one.
            </p>
          ) : (
            <Reorder.Group
              values={accounts}
              onReorder={(newOrder) => setAccounts(newOrder)}
              className="flex flex-col gap-2"
            >
              {accounts.map((account) => (
                <AccountItem key={account.id} account={account} />
              ))}
            </Reorder.Group>
          )}
        </div>
      </MainContainer>
    </div>
  );
};

export { Dashboard };

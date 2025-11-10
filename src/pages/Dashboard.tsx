import { Link } from "react-router";
import { useAppStore } from "../store/useAppStore";
import AppIcon from "../assets/icon.svg";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import {
  MdOutlinePushPin,
  MdPushPin,
  MdOutlineMenu,
  MdPersonAdd,
  MdCallSplit,
  MdOutlineSearch,
  MdOutlineClose,
} from "react-icons/md";

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
import { useMemo, useState } from "react";
import { Input } from "../components/Input";

/** Dashboard Page Component */
const Dashboard = () => {
  const accounts = useAppStore((state) => state.accounts);
  const setAccounts = useAppStore((state) => state.setAccounts);

  const [showNewAccountDialog, setShowNewAccountDialog] =
    useLocationToggle("new-account-dialog");

  const dashboardStyle = useAppStore((state) => state.dashboardStyle);
  const setDashboardStyle = useAppStore((state) => state.setDashboardStyle);

  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAccounts = useMemo(() => {
    return search
      ? accounts.filter(
          (account) =>
            account.title.toLowerCase().includes(search.toLowerCase()) ||
            account.walletAddress
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            account.depositAddress.toLowerCase().includes(search.toLowerCase())
        )
      : accounts;
  }, [accounts, search]);

  return (
    <div className="flex flex-col min-h-dvh">
      <AppHeader
        leftContent={
          <AppHeader.Button
            onClick={() =>
              setDashboardStyle(
                dashboardStyle === "normal" ? "sticky" : "normal"
              )
            }
          >
            {dashboardStyle === "normal" ? (
              <MdOutlinePushPin className="size-6" />
            ) : (
              <MdPushPin className="size-6" />
            )}
          </AppHeader.Button>
        }
        middleContent={
          showSearch ? (
            <Input
              type="search"
              placeholder="Search accounts..."
              className="w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          ) : (
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
          )
        }
        rightContent={
          <AppHeader.Button onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? (
              <MdOutlineClose className="size-6" />
            ) : (
              <MdOutlineSearch className="size-6" />
            )}
          </AppHeader.Button>
        }
      />

      <div
        className={cn(
          "bg-neutral-950",
          dashboardStyle === "sticky" ? "sticky top-12 z-10" : ""
        )}
      >
        <MainContainer className="gap-4">
          {/* Total Balance */}
          <TotalBalanceCard />

          <div className="flex justify-center items-center gap-4">
            {/* Send Action Button */}
            <ActionButton
              asChild
              label="Send"
              icon={<HiOutlineArrowUpRight className="size-5" />}
            >
              <Link to="/send" />
            </ActionButton>

            {/* Withdraw */}
            <ActionButton
              asChild
              label="Withdraw"
              icon={<HiOutlineArrowDownLeft className="size-5" />}
            >
              <Link to="/withdraw" />
            </ActionButton>

            {/* Split */}
            <ActionButton
              asChild
              label="Split"
              icon={<MdCallSplit className="size-5" />}
            >
              <Link to="/split" />
            </ActionButton>

            {/* More Tools */}
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

          {/* New Account Button */}
          <Button onClick={() => setShowNewAccountDialog(true)}>
            <div className="flex items-center gap-2">
              <MdPersonAdd className="size-4" />
              <span>New Account</span>
            </div>
          </Button>

          {showNewAccountDialog && (
            <NewAccountDialog onClose={() => setShowNewAccountDialog(false)} />
          )}

          {/* Account List Heading */}
          <h4 className="font-protest-guerrilla px-4 text-center">
            Accounts ({accounts.length})
          </h4>
        </MainContainer>
      </div>
      {/* Main content area */}
      <MainContainer className="gap-4" wrapperClassName="pt-0">
        {/* Account List */}
        <div className="flex flex-col gap-2">
          {accounts.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 px-4">
              No accounts available. Please create one.
            </p>
          ) : (
            <Reorder.Group
              values={accounts}
              onReorder={(newOrder) => !search && setAccounts(newOrder)}
              className="flex flex-col gap-2"
            >
              {filteredAccounts.map((account) => (
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

import { Link, useNavigate } from "react-router";
import useAppStore from "../store/useAppStore";
import AppIcon from "../assets/icon.svg";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import type { Account } from "../types";
import { MdEditNote } from "react-icons/md";

import { Dialog } from "radix-ui";
import { HiOutlinePlus } from "react-icons/hi2";
import { AccountDialog } from "../components/AccountDialog";
import { cn } from "../lib/utils";

/** Single Account Item Component */
const AccountItem = ({ account }: { account: Account }) => {
  return (
    <Dialog.Root>
      <div className="flex items-center px-2 gap-2 bg-neutral-900 rounded-full ">
        {/* Account Title / Dialog Trigger */}
        <Dialog.Trigger className="grow p-4 text-left cursor-pointer">
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

/** Dashboard Page Component */
const Dashboard = () => {
  const accounts = useAppStore((state) => state.accounts);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-dvh">
      <AppHeader
        middleContent={
          <h1 className="text-center font-bold grow min-w-0 min-h-0">
            <img
              src={AppIcon}
              alt="Packer"
              className="size-6 inline-block mr-2"
            />
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
      <MainContainer>
        <div className="flex flex-col gap-2">
          {accounts.length === 0 ? (
            <p>No accounts available. Please create one.</p>
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

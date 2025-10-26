import { useNavigate } from "react-router";
import useAppStore from "../store/useAppStore";
import AppIcon from "../assets/icon.svg";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import type { Account } from "../types";

import { Dialog } from "radix-ui";
import { HiOutlinePlus } from "react-icons/hi2";
const AccountItem = ({ account }: { account: Account }) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="p-4 bg-neutral-900 rounded-full text-left cursor-pointer">
        <h2 className="font-bold">{account.title}</h2>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 grid place-items-center">
          <Dialog.Content className="bg-neutral-900 p-6 rounded-md max-w-sm w-full">
            <Dialog.Title className="text-xl font-bold mb-4">
              {account.title} Details
            </Dialog.Title>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-lime-500 truncate">
                  Wallet Address: {account.walletAddress}
                </p>
                <p className="text-sm text-blue-500 truncate">
                  Deposit Address: {account.depositAddress}
                </p>
              </div>
              <Dialog.Close className="mt-4 px-4 py-2 bg-neutral-800 rounded-md hover:bg-neutral-700">
                Close
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

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

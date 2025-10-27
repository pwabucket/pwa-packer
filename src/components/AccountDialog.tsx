import type { Account } from "../types";

import { Dialog } from "radix-ui";
import { Button } from "./Button";
import { cn, copyToClipboard, getPrivateKey } from "../lib/utils";
import { useState } from "react";
import { HiOutlineClipboard, HiOutlineEye } from "react-icons/hi2";
import { usePassword } from "../hooks/usePassword";

/** Account Information Props */
interface AccountInfoProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  valueClassName?: string;
  rightContent?: React.ReactNode;
}

/** Account Information Component */
const AccountInfo = ({
  title,
  value,
  icon,
  valueClassName,
  rightContent,
}: AccountInfoProps) => (
  <div className="flex gap-4 p-4 bg-neutral-800 rounded-xl font-mono">
    {/* Icon */}
    <span className="shrink-0">{icon}</span>

    {/* Title & Value */}
    <div className="flex flex-col gap-1 grow min-w-0 min-h-0">
      {/* Title */}
      <h2 className="text-neutral-400 font-bold text-xs uppercase">{title}</h2>

      {/* Value */}
      <p className={cn("font-bold wrap-break-word text-sm", valueClassName)}>
        {value}
      </p>
    </div>

    {/* Right Content */}
    <div className="shrink-0">{rightContent}</div>
  </div>
);

/** Account Dialog Component */
const AccountDialog = ({ account }: { account: Account }) => {
  const password = usePassword();
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const revealPrivateKey = async () => {
    if (!password) {
      alert("Password not set.");
      return;
    }

    /* Get decrypted private key */
    const decryptedPrivateKey = await getPrivateKey(account.id, password);

    /* Set decrypted private key to state */
    setPrivateKey(decryptedPrivateKey);
  };

  /* Copy Private Key to Clipboard */
  const copyPrivateKeyToClipboard = () => {
    if (privateKey) {
      copyToClipboard(privateKey);
      alert("Private key copied to clipboard.");
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 bg-black/50",
          "grid place-items-center",
          "overflow-auto p-4 z-50"
        )}
      >
        <Dialog.Content
          className={cn(
            "bg-neutral-900 p-6 rounded-2xl max-w-sm w-full",
            "flex flex-col min-w-0 min-h-0 gap-2"
          )}
        >
          {/* Account Title */}
          <Dialog.Title className="text-2xl text-center text-yellow-500">
            {account.title}
          </Dialog.Title>

          {/* Account Description */}
          <Dialog.Description className="text-center text-sm text-neutral-400">
            Here is your account information.
          </Dialog.Description>

          {/* Account Information */}
          <div className="flex flex-col gap-2">
            {/* Wallet Address */}
            <AccountInfo
              title="Wallet Address"
              value={account.walletAddress}
              icon={<>💰</>}
              valueClassName="text-lime-300"
            />

            {/* Deposit Address */}
            <AccountInfo
              title="Deposit Address"
              value={account.depositAddress}
              icon={<span>🏦</span>}
              valueClassName="text-orange-300"
            />

            {/* Private Key */}
            <AccountInfo
              title="Private Key"
              value={privateKey || "********"}
              icon={<span>🔑</span>}
              valueClassName="text-red-300"
              rightContent={
                <button
                  onClick={
                    privateKey ? copyPrivateKeyToClipboard : revealPrivateKey
                  }
                  className={cn(
                    "text-sm text-neutral-400",
                    "hover:text-neutral-300 cursor-pointer"
                  )}
                >
                  {privateKey ? (
                    <HiOutlineClipboard className="size-5" />
                  ) : (
                    <HiOutlineEye className="size-5" />
                  )}
                </button>
              }
            />
          </div>

          {/* Close Button */}
          <Dialog.Close asChild>
            <Button className="my-2">Close</Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
};

export { AccountDialog };

import type { Account } from "../types";

import { Dialog } from "radix-ui";
import { Button } from "./Button";
import { cn, getPrivateKey } from "../lib/utils";
import { useState } from "react";
import { HiOutlineEye } from "react-icons/hi2";
import { usePassword } from "../hooks/usePassword";
import { PopupDialog } from "./PopupDialog";
import toast from "react-hot-toast";
import { ItemInfo } from "./ItemInfo";
import { AccountProfile } from "./AccountProfile";

interface AccountDialogProps {
  account: Account;
}

/** Account Dialog Component */
const AccountDialog = ({ account }: AccountDialogProps) => {
  const password = usePassword();
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const revealPrivateKey = async () => {
    if (!password) {
      toast.error("Password not set.");
      return;
    }

    /* Get decrypted private key */
    const decryptedPrivateKey = await getPrivateKey(account.id, password);

    /* Set decrypted private key to state */
    setPrivateKey(decryptedPrivateKey);
  };

  return (
    <PopupDialog>
      {/* Account Title */}
      <Dialog.Title className="text-xl font-bold text-center text-yellow-500 grow min-w-0 min-h-0">
        {account.title}
      </Dialog.Title>

      {account.url ? <AccountProfile url={account.url} /> : null}

      {/* Account Description */}
      <Dialog.Description className="text-center text-sm text-neutral-400">
        Here is your account information.
      </Dialog.Description>

      {/* Account Information */}
      <div className="flex flex-col gap-2">
        {/* Wallet Address */}
        <ItemInfo
          title="Wallet Address"
          value={account.walletAddress}
          icon={<>💰</>}
          valueClassName="text-lime-300"
        />

        {/* Deposit Address */}
        <ItemInfo
          title="Deposit Address"
          value={account.depositAddress}
          icon={<span>🏦</span>}
          valueClassName="text-orange-300"
        />

        {/* Private Key */}
        <ItemInfo
          title="Private Key"
          value={privateKey || "********"}
          icon={<span>🔑</span>}
          valueClassName="text-red-300"
          canCopy={!!privateKey}
          rightContent={
            !privateKey && (
              <button
                onClick={revealPrivateKey}
                className={cn(
                  "text-sm text-neutral-400",
                  "hover:text-neutral-300 cursor-pointer"
                )}
              >
                <HiOutlineEye className="size-5" />
              </button>
            )
          }
        />
      </div>

      {/* Close Button */}
      <Dialog.Close asChild>
        <Button className="my-2">Close</Button>
      </Dialog.Close>
    </PopupDialog>
  );
};

export { AccountDialog };

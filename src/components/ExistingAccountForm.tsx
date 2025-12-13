import { AccountForm, type AccountFormData } from "../components/AccountForm";
import { useAppStore } from "../store/useAppStore";
import {
  getLocalStorageKeyForAccountPrivateKey,
  getPrivateKey,
  getWalletAddressFromPrivateKey,
} from "../lib/utils";
import type { Account } from "../types";
import { usePassword } from "../hooks/usePassword";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { encryption } from "../services/encryption";
import { MdDelete, MdHourglassEmpty, MdWarning } from "react-icons/md";

interface ExistingAccountFormProps {
  account: Account;
  onUpdated?: (account: Account) => void;
  onDeleted?: (accountId: string) => void;
}

/** Existing Account Form Component */
const ExistingAccountForm = ({
  account,
  onUpdated,
  onDeleted,
}: ExistingAccountFormProps) => {
  const password = usePassword();
  const updateAccount = useAppStore((state) => state.updateAccount);
  const removeAccount = useAppStore((state) => state.removeAccount);

  const [privateKey, setPrivateKey] = useState("");

  /** Fetch and Decrypt Private Key on Mount */
  useEffect(() => {
    const fetchPrivateKey = async () => {
      if (!account) return;
      if (!password) {
        throw new Error("Password is not set in memory.");
      }

      /* Decrypt Private Key */
      const decryptedPrivateKey = await getPrivateKey(account.id, password);

      /* Set Private Key to State */
      setPrivateKey(decryptedPrivateKey);
    };

    fetchPrivateKey();
  }, [account, password]);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: AccountFormData) => {
    /* Update Account Object */
    const updatedAccount: Account = {
      id: account.id,
      title: data.title,
      provider: data.provider,
      url: data.url,
      depositAddress: data.depositAddress,
      walletAddress: getWalletAddressFromPrivateKey(data.privateKey),
    };

    if (!password) {
      throw new Error("Password is not set in memory.");
    }

    /* Encrypt Private Key */
    const encryptedPrivateKey = await encryption.encryptData({
      data: data.privateKey,
      password,
    });

    /* Store encrypted private key in localStorage */
    localStorage.setItem(
      getLocalStorageKeyForAccountPrivateKey(updatedAccount.id),
      JSON.stringify(encryptedPrivateKey)
    );

    /* Update Account in Store */
    updateAccount(updatedAccount);

    /* Show Success Toast */
    toast.success("Account updated successfully!");

    /* Invoke onUpdated callback if provided */
    if (onUpdated) {
      onUpdated(updatedAccount);
    }
  };

  const handleDelete = () => {
    /* Remove Account from Store */
    removeAccount(account.id);

    /* Invoke onDeleted callback if provided */
    if (onDeleted) {
      onDeleted(account.id);
    }
  };

  return (
    <>
      {privateKey ? (
        <>
          {/* Account Form */}
          <AccountForm
            initialValues={{
              title: account.title,
              provider: account.provider,
              url: account.url,
              depositAddress: account.depositAddress,
              privateKey,
            }}
            handleFormSubmit={handleFormSubmit}
          />

          {/* Divider */}
          <p className="my-2 text-neutral-400 text-center">OR</p>

          {/* Danger Zone */}
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <MdWarning className="size-5 text-red-400" />
              <h3 className="font-semibold text-red-400">Danger Zone</h3>
            </div>
            <p className="text-sm text-red-300/80 mb-3">
              This action cannot be undone. This will permanently delete the
              account and all associated data.
            </p>

            {/* Delete Account Button */}
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 text-red-200 hover:text-red-500 cursor-pointer transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 w-full"
            >
              <MdDelete className="size-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 py-8">
          <MdHourglassEmpty className="size-5 text-neutral-400 animate-spin" />
          <p className="text-center text-neutral-400">
            Loading account data...
          </p>
        </div>
      )}
    </>
  );
};

export { ExistingAccountForm };

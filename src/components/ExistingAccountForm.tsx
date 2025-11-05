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
              url: account.url,
              depositAddress: account.depositAddress,
              privateKey,
            }}
            handleFormSubmit={handleFormSubmit}
          />

          {/* Divider */}
          <p className="my-2 text-neutral-400 text-center">OR</p>

          {/* Delete Account Button */}
          <button
            onClick={handleDelete}
            className="text-red-200 hover:text-red-500 cursor-pointer"
          >
            Delete Account
          </button>
        </>
      ) : (
        <p className="text-center text-neutral-400">Loading...</p>
      )}
    </>
  );
};

export { ExistingAccountForm };

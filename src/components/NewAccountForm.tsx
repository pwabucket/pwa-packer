import { AccountForm, type AccountFormData } from "../components/AccountForm";
import { useAppStore } from "../store/useAppStore";
import {
  getLocalStorageKeyForAccountPrivateKey,
  getWalletAddressFromPrivateKey,
  uuid,
} from "../lib/utils";
import type { Account } from "../types";
import { usePassword } from "../hooks/usePassword";
import Encrypter from "../lib/Encrypter";
import toast from "react-hot-toast";

interface NewAccountFormProps {
  onCreated?: (account: Account) => void;
}

/** New Account Form Component */
const NewAccountForm = ({ onCreated }: NewAccountFormProps) => {
  const password = usePassword();
  const addAccount = useAppStore((state) => state.addAccount);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: AccountFormData) => {
    /* Create Account Object */
    const newAccount: Account = {
      id: uuid(),
      title: data.title,
      url: data.url,
      depositAddress: data.depositAddress,
      walletAddress: getWalletAddressFromPrivateKey(data.privateKey),
    };

    if (!password) {
      throw new Error("Password is not set in memory.");
    }

    /* Encrypt Private Key */
    const encryptedPrivateKey = await Encrypter.encryptData({
      data: data.privateKey,
      password,
    });

    /* Store encrypted private key in localStorage */
    localStorage.setItem(
      getLocalStorageKeyForAccountPrivateKey(newAccount.id),
      JSON.stringify(encryptedPrivateKey)
    );

    /* Add Account to Store */
    addAccount(newAccount);

    /* Show Success Toast */
    toast.success("Account created successfully!");

    /* Invoke onCreated callback if provided */
    if (onCreated) {
      onCreated(newAccount);
    }
  };

  return <AccountForm handleFormSubmit={handleFormSubmit} />;
};

export { NewAccountForm };

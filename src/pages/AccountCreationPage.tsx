import { InnerPageLayout } from "../layouts/InnerPageLayout";

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
import { useNavigateBack } from "../hooks/useNavigateBack";

/** Account Creation Page Component */
const AccountCreationPage = () => {
  const navigateBack = useNavigateBack();
  const password = usePassword();
  const addAccount = useAppStore((state) => state.addAccount);

  /** Handle Form Submit */
  const handleFormSubmit = async (data: AccountFormData) => {
    /* Create Account Object */
    const newAccount: Account = {
      id: uuid(),
      title: data.title,
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

    /* Navigate Back */
    navigateBack();
  };

  return (
    <InnerPageLayout title="Create Account">
      <AccountForm handleFormSubmit={handleFormSubmit} />
    </InnerPageLayout>
  );
};

export { AccountCreationPage };

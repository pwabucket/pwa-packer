import { InnerPageLayout } from "../layouts/InnerPageLayout";

import { AccountForm, type AccountFormData } from "../components/AccountForm";
import useAppStore from "../store/useAppStore";
import {
  getLocalStorageKeyForAccountPrivateKey,
  getPrivateKey,
  getWalletAddressFromPrivateKey,
} from "../lib/utils";
import type { Account } from "../types";
import usePassword from "../hooks/usePassword";
import Encrypter from "../lib/Encrypter";
import { useNavigateBack } from "../hooks/useNavigateBack";
import { Navigate, useParams } from "react-router";
import { useEffect, useState } from "react";

/** Account Edit Page Component */
const AccountEditPage = () => {
  const params = useParams();
  const accountId = params.accountId;

  const accounts = useAppStore((state) => state.accounts);
  const account = accounts.find((acc) => acc.id === accountId);

  const password = usePassword();
  const navigateBack = useNavigateBack();
  const updateAccount = useAppStore((state) => state.updateAccount);

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

  if (!account) {
    return <Navigate to="/dashboard" replace />;
  }

  /** Handle Form Submit */
  const handleFormSubmit = async (data: AccountFormData) => {
    /* Update Account Object */
    const updatedAccount: Account = {
      id: account.id,
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
      getLocalStorageKeyForAccountPrivateKey(updatedAccount.id),
      JSON.stringify(encryptedPrivateKey)
    );

    /* Update Account in Store */
    updateAccount(updatedAccount);

    /* Navigate Back */
    navigateBack();
  };

  return (
    <InnerPageLayout title="Create Account">
      {privateKey ? (
        <AccountForm
          initialValues={{
            title: account.title,
            depositAddress: account.depositAddress,
            privateKey,
          }}
          handleFormSubmit={handleFormSubmit}
        />
      ) : (
        <p className="text-center text-neutral-400">Loading...</p>
      )}
    </InnerPageLayout>
  );
};

export { AccountEditPage };

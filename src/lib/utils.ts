import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import copy from "copy-to-clipboard";
import { Wallet } from "ethers/wallet";
import Encrypter, { type EncryptionResult } from "./Encrypter";
import { provider, USDT_DECIMALS, usdtToken } from "./transaction";
import { ethers } from "ethers";

export { v4 as uuid } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function copyToClipboard(content: string) {
  copy(content);
}

export function getWalletAddressFromPrivateKey(privateKey: string) {
  if (!privateKey || privateKey.length === 0) return "";
  try {
    const wallet = new Wallet(privateKey);
    return wallet.address;
  } catch {
    return "";
  }
}

export function getLocalStorageKeyForAccountPrivateKey(accountId: string) {
  return `packer-pk:${accountId}`;
}

export async function getPrivateKey(accountId: string, password: string) {
  /* Get encrypted private key from localStorage */
  const encryptedPrivateKeyString = localStorage.getItem(
    getLocalStorageKeyForAccountPrivateKey(accountId)
  );

  if (!encryptedPrivateKeyString) {
    throw new Error("Encrypted private key not found in localStorage.");
  }

  /* Parse encrypted data */
  const encryptedData = JSON.parse(
    encryptedPrivateKeyString
  ) as EncryptionResult;

  /* Decrypt private key */
  const decryptedPrivateKey = await Encrypter.decryptData({
    ...encryptedData,
    password,
  });

  return decryptedPrivateKey as string;
}

export async function fetchBalance(address: string) {
  const usdtBalance = await usdtToken.balanceOf(address);
  const bnbBalance = await provider.getBalance(address);
  return {
    usdtBalance: Number(ethers.formatUnits(usdtBalance, USDT_DECIMALS)),
    bnbBalance: Number(ethers.formatEther(bnbBalance)),
  };
}

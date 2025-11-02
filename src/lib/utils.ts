import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import copy from "copy-to-clipboard";
import { Wallet } from "ethers/wallet";
import Encrypter, { type EncryptionResult } from "./Encrypter";
import { provider, USDT_DECIMALS, usdtToken } from "./transaction";
import { ethers } from "ethers";
import toast from "react-hot-toast";

export { v4 as uuid } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function copyToClipboard(content: string) {
  copy(content);
  toast.success("Copied to clipboard!");
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

/** Extract Telegram WebAppData */
export function extractTgWebAppData(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const initData = params.get("tgWebAppData");
  const initDataUnsafe = getInitDataUnsafe(initData as string);

  return {
    platform: params.get("tgWebAppPlatform"),
    version: params.get("tgWebAppVersion"),
    initData,
    initDataUnsafe,
  };
}

export function extractInitDataUnsafe(initData: string) {
  return getInitDataUnsafe(initData);
}

/** Get Init Data Unsafe */
export function getInitDataUnsafe(initData: string) {
  const params = new URLSearchParams(initData);
  const data: {
    [key: string]: unknown;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
    };
  } = {};

  for (const [key, value] of params.entries()) {
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value;
    }
  }

  return data;
}

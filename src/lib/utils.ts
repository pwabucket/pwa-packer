import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import copy from "copy-to-clipboard";
import { Wallet } from "ethers/wallet";
import { type EncryptionResult } from "./Encrypter";
import toast from "react-hot-toast";
import { useAppStore } from "../store/useAppStore";
import type { BackupData } from "../types";
import { encryption } from "../services/encryption";
import { WalletReader } from "./WalletReader";

export { v4 as uuid } from "uuid";

export const HEXADECIMAL_CHARS = "0123456789abcdef";

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
  const decryptedPrivateKey = await encryption.decryptData({
    ...encryptedData,
    password,
  });

  return decryptedPrivateKey as string;
}

export async function fetchBalance(address: string) {
  const reader = new WalletReader(address);

  const [usdtBalance, bnbBalance] = await Promise.all([
    reader.getUSDTBalance(),
    reader.getBNBBalance(),
  ]);

  return {
    usdtBalance,
    bnbBalance,
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

export function getBackupData() {
  const { accounts, passwordHash } = useAppStore.getState();

  const backupData: BackupData = {
    version: import.meta.env.PACKAGE_VERSION || "unknown",
    timestamp: new Date().toISOString(),
    data: {
      accounts,
      passwordHash,
      privateKeys: accounts.map((account) => ({
        accountId: account.id,
        privateKey: localStorage.getItem(
          getLocalStorageKeyForAccountPrivateKey(account.id)
        ),
      })),
    },
  };
  return backupData;
}

export async function createAndDownloadBackup() {
  const backupData = getBackupData();
  const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(backupBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `packer_backup_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackupData(data: BackupData["data"]) {
  const { accounts, passwordHash, privateKeys } = data;
  const { resetApp, setAccounts, setPasswordHash } = useAppStore.getState();

  /* Reset current app data */
  resetApp();

  /* Set accounts */
  setAccounts(accounts);

  /* Set password hash */
  setPasswordHash(passwordHash);

  /* Store private keys in localStorage */
  privateKeys.forEach(({ accountId, privateKey }) => {
    if (privateKey) {
      localStorage.setItem(
        getLocalStorageKeyForAccountPrivateKey(accountId),
        privateKey
      );
    }
  });
}

export function truncateAddress(address: string, length = 6) {
  return `${address.slice(0, length)}...${address.slice(-4)}`;
}

/**
 * Truncate a number to a specified number of decimal places without rounding
 * @param value - The number to truncate
 * @param decimals - Number of decimal places (default: 8)
 * @returns Truncated number as string (avoids scientific notation)
 */
export function truncateDecimals(value: number, decimals: number = 8): string {
  const multiplier = Math.pow(10, decimals);
  const truncated = Math.trunc(value * multiplier) / multiplier;

  /* Use toFixed to avoid scientific notation */
  return truncated.toFixed(decimals);
}

/** Delay Options */
interface DelayOptions {
  precised?: boolean;
  signal?: AbortSignal;
}

export function delay(
  length: number,
  { precised = false, signal }: DelayOptions = {}
) {
  return new Promise((resolve, reject) => {
    const duration = precised
      ? length
      : (length * (Math.floor(Math.random() * 50) + 100)) / 100;

    const timeoutId = setTimeout(() => resolve(true), duration);

    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(new Error("Aborted"));
    });
  });
}

export function delayForSeconds(length: number, options?: DelayOptions) {
  return delay(length * 1000, options);
}

export function delayForMinutes(length: number, options?: DelayOptions) {
  return delay(length * 60 * 1000, options);
}

export function* chunkArrayGenerator<T>(arr: T[], size: number) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

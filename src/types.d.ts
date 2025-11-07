import type { HashResult } from "./lib/HashMaker";

export interface Account {
  id: string;
  title: string;
  depositAddress: string;
  walletAddress: string;
  url?: string;
}

export interface SendResult {
  status: boolean;
  account: Account;
  hashResult: HashResult | null;
  receiver: string;
  result?: {
    receipt: TransactionReceipt | null;
    signedRawTx: string;
    txHash: string;
  };
  error?: unknown;
  validation?: {
    activity: boolean;
  };
}

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    accounts: Account[];
    passwordHash: string | null;
    privateKeys: {
      accountId: string;
      privateKey: string | null;
    }[];
  };
}

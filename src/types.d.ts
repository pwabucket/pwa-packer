import type { HashResult } from "./lib/HashMaker";

export interface Account {
  id: string;
  title: string;
  depositAddress: string;
  walletAddress: string;
}

export interface SendResult {
  status: boolean;
  account: Account;
  targetCharacter: string;
  hashResult: HashResult | null;
  receiver: string;
  result?: {
    receipt: TransactionReceipt | null;
    signedRawTx: string;
    txHash: string;
  };
  error?: unknown;
}

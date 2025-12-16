import type Decimal from "decimal.js";
import type { HashResult } from "../lib/HashMaker";
import type { Account } from "./core";

export interface SendStats {
  totalAccounts: number;
  successfulSends: number;
  successfulValidations: number;
  totalAmountSent: Decimal;
}

export interface SendResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
  receiver: string;
  balance?: Decimal;
  amount: Decimal;
  amountNeeded: Decimal;
  hashResult?: HashResult | null;
  validation?: ValidationResult | null;
  error?: unknown;
}

export interface SendConfig {
  amount: string;
  difference: string;
  mode: "single" | "batch";
  delay: number;
  targetCharacters: string[];
  gasLimit: "average" | "fast" | "instant";
  allowLesserAmount: boolean;
  refill: boolean;
  validate: boolean;
  skipValidated: boolean;
}

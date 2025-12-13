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

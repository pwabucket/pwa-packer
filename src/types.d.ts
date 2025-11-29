import type Decimal from "decimal.js";
import type { HashResult } from "./lib/HashMaker";

export interface Account {
  id: string;
  title: string;
  depositAddress: string;
  walletAddress: string;
  url?: string;
}

export interface SendStats {
  totalAccounts: number;
  successfulSends: number;
  successfulValidations: number;
  totalAmountSent: Decimal;
}

export interface ValidationResult {
  activity: boolean;
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

export interface Activity {
  activity: boolean;
  amount: number;
  activityBalance: number;
}

export interface PackResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
  amount?: Decimal.Value;
  error?: unknown;
  activity?: Activity;
  withdrawActivity?: unknown;
  response?: unknown;
}

export interface PlanAccountStatus {
  status: boolean;
  account: Account;
  activity: {
    activity: Activity | null;
    streak: number;
  };
}

export interface PlanResult extends PlanAccountStatus {
  amount: Decimal.Value;
}

export interface PlanValidationResult extends PlanResult {
  validation: boolean;
}

export interface PlanStats {
  totalAmount: Decimal.Value;
  totalAccounts: number;
  firstActivity: number;
  secondActivity: number;
  consistentActivity: number;
}

export interface PlanParameters {
  total: string;
  maximum: string;
}

export interface PlanFileContent {
  week: Date;
  parameters: PlanParameters;
  results: PlanResult[];
  stats: PlanStats;
}

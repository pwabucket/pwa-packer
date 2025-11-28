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
  totalAmountSent: number;
}

export interface ValidationResult {
  activity: boolean;
}

export interface SendResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
  receiver: string;
  balance?: number;
  amount: number;
  amountNeeded: number;
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
  amount?: number;
  error?: unknown;
  activity?: Activity;
  withdrawActivity?: unknown;
  response?: unknown;
}

export interface PlanAccountStatus {
  status: boolean;
  skipped: boolean;
  account: Account;
  streak: number;
}

export interface PlanResult extends PlanAccountStatus {
  amount: number;
}

export interface PlanValidationResult extends PlanResult {
  validation: boolean;
  activity: Activity | null;
}

export interface PlanStats {
  totalAccounts: number;
  totalAmount: number;
  firstActivity: number;
  secondActivity: number;
}

export interface PlanParameters {
  total: string;
  minimum: string;
  maximum: string;
}

export interface PlanFileContent {
  week: Date;
  parameters: PlanParameters;
  results: PlanResult[];
  stats: PlanStats;
}

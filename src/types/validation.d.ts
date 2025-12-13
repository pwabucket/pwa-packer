import type Decimal from "decimal.js";
import type { Account, ParticipationResult } from ".";

export interface ValidationMutationParams {
  accounts: Account[];
  delay?: number;
}

export interface ValidationResult {
  status: boolean;
  account: Account;
  activity?: ParticipationResult;
  error?: unknown;
}

export interface ValidationStats {
  totalAccounts: number;
  activeAccounts: number;
  totalAmount: Decimal;
  availableBalance: Decimal;
}

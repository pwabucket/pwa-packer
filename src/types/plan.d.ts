import type Decimal from "decimal.js";
import type { Account } from "./core";
import type { ParticipationResult } from "./packer";

export interface PlanAccountStatus {
  status: boolean;
  account: Account;
  activity: {
    activity: ParticipationResult | null;
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
  firstActivityCount: number;
  secondActivityCount: number;
  consistentActivityCount: number;
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

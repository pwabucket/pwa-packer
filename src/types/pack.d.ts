import type Decimal from "decimal.js";
import type { Account } from "./core";
import type { ParticipationResult, WithdrawalInfo } from "./packer";

export interface PackResult {
  status: boolean;
  skipped?: boolean;
  account: Account;
  amount?: Decimal.Value;
  error?: unknown;
  activity?: ParticipationResult;
  withdrawalInfo?: WithdrawalInfo;
  response?: unknown;
}

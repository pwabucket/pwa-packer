import type Decimal from "decimal.js";

export type WithdrawalStatus = "success" | "pending" | "failed";

export type ProviderType = "leonardo" | "dicaprio";

export interface ParticipationResult {
  participating: boolean;
  amount: Decimal.Value;
  balance: Decimal.Value;
}

export interface WithdrawalHistory {
  id: number | string;
  date: Date;
  amount: Decimal.Value;
  status: WithdrawalStatus;
  hash: string | null;
}

export interface WithdrawalInfo {
  address: string;
  balance: Decimal.Value;
}

export interface WithdrawalResult {
  status: WithdrawalStatus;
  error?: string;
}

export interface PackerProviderInstance {
  initialize(): Promise<void>;
  getDepositAddress(): Promise<string>;
  getAccountStatus(): Promise<number>;
  getWithdrawalHistory(): Promise<WithdrawalHistory[]>;
  getWithdrawalInfo(): Promise<WithdrawalInfo>;
  processWithdrawal(address: string): Promise<WithdrawalResult>;
  getAccountInfo(): Promise<Record<string, unknown>>;
  getParticipation(): Promise<ParticipationResult>;
  confirmParticipation(): Promise<ParticipationResult>;
}

export interface PackerProvider {
  new (url: string): PackerProviderInstance;
  getPageUrl(page: string, url: string): string;
}

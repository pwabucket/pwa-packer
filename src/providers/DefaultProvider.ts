import type {
  PackerProviderInstance,
  ParticipationResult,
  WithdrawalInfo,
  WithdrawalResult,
} from "../types";
import { BaseProvider } from "./BaseProvider";

class DefaultProvider extends BaseProvider implements PackerProviderInstance {
  /* Minimum Deposit Amount */
  static MINIMUM_DEPOSIT_AMOUNT = 1;

  async initialize(): Promise<void> {
    return;
  }

  async getDepositAddress(): Promise<string> {
    return "";
  }

  async confirmDepositAddress(address: string): Promise<string> {
    return address;
  }

  async getAccountStatus(): Promise<number> {
    return 1;
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    return {};
  }

  async getParticipation(): Promise<ParticipationResult> {
    return {
      participating: false,
      amount: 0,
      balance: 0,
    };
  }

  async confirmParticipation(): Promise<ParticipationResult> {
    return {
      participating: true,
      amount: 0,
      balance: 0,
    };
  }

  async getWithdrawalHistory() {
    return [];
  }

  async getWithdrawalInfo(): Promise<WithdrawalInfo> {
    return {
      address: "",
      balance: 0,
    };
  }

  async processWithdrawal(_address: string): Promise<WithdrawalResult> {
    return { status: "success" };
  }

  static getPageUrl(_page: string, url: string): string {
    return url;
  }
}

export { DefaultProvider };

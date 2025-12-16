import type {
  PackerProviderInstance,
  ParticipationResult,
  WithdrawalInfo,
  WithdrawalResult,
} from "../types";
import { BaseTelegramProvider } from "./BaseTelegramProvider";

class DaVinciProvider
  extends BaseTelegramProvider
  implements PackerProviderInstance
{
  async initialize(): Promise<void> {
    return;
  }

  getUser() {
    return this.api
      .get(`/api/user?id=${this.getUserId()}`)
      .then((res) => res.data);
  }

  generateDepositAddress() {
    return this.api
      .post(`/api/deposit`, {
        depositType: 1,
        initData: this.getInitData(),
      })
      .then((res) => res.data);
  }

  getGeneratedDepositAddress() {
    return this.api
      .get(`/api/deposit?id=${this.getUserId()}&type=1`)
      .then((res) => res.data);
  }

  async getDepositAddress(): Promise<string> {
    const { deposit } = await this.getGeneratedDepositAddress();
    if (deposit) {
      return deposit.address;
    } else {
      const { deposit } = await this.generateDepositAddress();
      return deposit.address;
    }
  }

  async confirmDepositAddress(_address: string): Promise<string> {
    return this.getDepositAddress();
  }

  async getAccountStatus(): Promise<number> {
    const { user } = await this.getUser();
    return user.isBlocked ? 0 : 1;
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    const { user } = await this.getUser();
    return user;
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

export { DaVinciProvider };

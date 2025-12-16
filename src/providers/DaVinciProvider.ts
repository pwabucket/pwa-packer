import Decimal from "decimal.js";
import type {
  PackerProviderInstance,
  ParticipationResult,
  WithdrawalHistory,
  WithdrawalInfo,
  WithdrawalResult,
} from "../types";
import { BaseTelegramProvider } from "./BaseTelegramProvider";

class DaVinciProvider
  extends BaseTelegramProvider
  implements PackerProviderInstance
{
  /* Minimum Deposit Amount */
  static MINIMUM_DEPOSIT_AMOUNT = 30;

  async initialize(): Promise<void> {
    return;
  }

  getUser() {
    return this.api
      .get(`/api/user?id=${this.getUserId()}`)
      .then((res) => res.data);
  }

  initiateWithdrawal(wallet: string) {
    return this.api
      .post(`/api/withdraw`, {
        initData: this.getInitData(),
        amount: null,
        type: 3,
        wallet,
      })
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

  getParticipationHistory() {
    return this.api
      .get(`/api/history-30-in-48?userId=${this.getUserId()}&page=1&limit=10`)
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
    const { ["depositHistory30in48"]: list } =
      await this.getParticipationHistory();
    const current = list.find((item: any) => item.status === "pending");

    if (current) {
      return {
        participating: true,
        amount: new Decimal(current.amount),
        balance: new Decimal(0),
      };
    }

    return {
      participating: false,
      amount: 0,
      balance: 0,
    };
  }

  async confirmParticipation(): Promise<ParticipationResult> {
    const { deposit } = await this.getGeneratedDepositAddress();
    if (deposit && deposit.txHash && deposit.tracked) {
      return {
        participating: true,
        amount: new Decimal(deposit.amount),
        balance: new Decimal(0),
      };
    }

    return {
      participating: false,
      amount: new Decimal(0),
      balance: new Decimal(0),
    };
  }

  async getWithdrawalHistory(): Promise<WithdrawalHistory[]> {
    const result = await this.getParticipationHistory();
    const list: {
      id: number;
      userId: number;
      amount: string;
      txHash: string | null;
      status: "pending" | "claimed" | "failed";
      claimedAt: string | null;
      createdAt: string;
    }[] = result.depositHistory30in48;

    return list
      .filter((item) => item.status !== "pending")
      .map(
        (item): WithdrawalHistory => ({
          id: item.id,
          date: new Date(item.createdAt),
          amount: new Decimal(item.amount),
          status:
            item.status === "claimed"
              ? "success"
              : item.status === "pending"
              ? "pending"
              : "failed",
          hash: item.txHash || null,
        })
      );
  }

  async getWithdrawalInfo(): Promise<WithdrawalInfo> {
    const { user } = await this.getUser();
    return {
      address: user.withdrawalAddress || "",
      balance: new Decimal(user.availableBalance || 0),
    };
  }

  async processWithdrawal(address: string): Promise<WithdrawalResult> {
    await this.initiateWithdrawal(address);
    return { status: "success" };
  }

  static getPageUrl(_page: string, url: string): string {
    return url;
  }
}

export { DaVinciProvider };

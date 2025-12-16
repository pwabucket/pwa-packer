import Decimal from "decimal.js";
import type {
  PackerProviderInstance,
  ParticipationResult,
  WithdrawalHistory,
  WithdrawalInfo,
  WithdrawalResult,
} from "../types";
import { BaseTelegramProvider } from "./BaseTelegramProvider";
import { addWeeks, isAfter, startOfWeek, setHours } from "date-fns";

class DaVinciProvider
  extends BaseTelegramProvider
  implements PackerProviderInstance
{
  /* Minimum Deposit Amount */
  static MINIMUM_DEPOSIT_AMOUNT = 30;

  /* Week Starts On (0 = Sunday, 1 = Monday) */
  static WEEK_STARTS_ON: 0 | 1 = 0;

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
      let balance = new Decimal(0);
      const weekStart = startOfWeek(new Date(current.createdAt), {
        weekStartsOn: DaVinciProvider.WEEK_STARTS_ON,
      });

      /* Calculate availability date */
      const utcDate = new Date();
      utcDate.setUTCHours(16);
      const availableAt = setHours(addWeeks(weekStart, 1), utcDate.getHours());

      /* Log dates for debugging */
      console.log({ weekStart, availableAt });

      if (isAfter(new Date(), availableAt)) {
        balance = new Decimal(current.amount).times(new Decimal("1.3"));
      }

      return {
        participating: true,
        amount: new Decimal(current.amount),
        balance,
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

    return this.getParticipation();
  }

  async getWithdrawalHistory(): Promise<WithdrawalHistory[]> {
    const result = await this.getParticipationHistory();
    const list: {
      id: number;
      userId: number;
      amount: string;
      txHash: string | null;
      status: "pending" | "confirmed" | "failed";
      claimedAt: string | null;
      createdAt: string;
    }[] = result.depositHistory30in48;

    return list.map(
      (item): WithdrawalHistory => ({
        id: item.id,
        date: new Date(item.createdAt),
        amount: new Decimal(item.amount),
        status:
          item.status === "confirmed"
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
    const activity = await this.getParticipation();

    if (activity.participating) {
      return {
        address: user.withdrawalAddress || "",
        balance: activity.balance,
      };
    }
    return {
      address: user.withdrawalAddress || "",
      balance: new Decimal(0),
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

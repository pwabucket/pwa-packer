import type { ParticipationResult } from "../types";
import { LeonardoProvider } from "./LeonardoProvider";

class DjangoProvider extends LeonardoProvider {
  static ACTIVITY_PAGE = "#/Promote";

  async validate() {
    const data = await super.validate();
    const userInfo = data.userInfo;

    delete userInfo["interestList"];

    return { data: userInfo };
  }

  async getParticipation(): Promise<ParticipationResult> {
    /* Get Current Activity Status */
    const result = await this.getCurrentActivity();

    return {
      participating: result.status === 0,
      amount: result.totalAmount,
      balance: 0,
    };
  }

  getWithdrawalHistory(): Promise<never[]> {
    return Promise.resolve([]);
  }

  getWithdrawalInfo() {
    return Promise.resolve({
      address: "",
      balance: 0,
    });
  }

  async refreshActivity() {
    const response = await super.refreshActivity();

    return {
      activity: response.msg === "success",
    };
  }
}

export { DjangoProvider };

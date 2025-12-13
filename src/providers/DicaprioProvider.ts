import type {
  PackerProviderInstance,
  ParticipationResult,
  WithdrawalHistory,
  WithdrawalInfo,
  WithdrawalResult,
} from "../types";
import { BaseProvider } from "./BaseProvider";
import md5 from "md5";

class DicaprioProvider extends BaseProvider implements PackerProviderInstance {
  /* Minimum Deposit Amount */
  static MINIMUM_DEPOSIT_AMOUNT = 10;

  constructor(url: string) {
    super(url);

    /* Configure AuthSign Interceptor */
    this.configureAuthSignInterceptor();
  }

  /* Configure AuthSign Interceptor */
  configureAuthSignInterceptor() {
    this.api.interceptors.request.use((config) => {
      config.params = this.getNonce(config.params || {});
      config.headers["AUTHSIGN"] = this.getAuthSign(config.params);
      return config;
    });
  }

  /* Get Nonce Parameters */
  getNonce(params: Record<string, unknown>) {
    return {
      ...params,
      ["nonce_str"]: Math.ceil(9999 * Math.random()),
      ["time_stamp"]: Date.now().toString().substring(0, 10),
    };
  }

  /* Get AuthSign */
  getAuthSign(data: Record<string, unknown>): string {
    /* Sort the keys */
    const keys = Object.keys(data).sort();

    /**
     * Construct the sign string in the format KEY=VALUE
     */
    let signString = "";
    for (const key of keys) {
      signString += `${key.toUpperCase()}=${data[key]}`;
    }

    /* Hash using MD5 with the fixed suffix */
    return md5(signString + "d93047a4d6fe6111");
  }

  /* Make a request */
  request(path: string, data: unknown) {
    return this.api.get(`${path}`, { params: data });
  }

  /* Initialize with Token */
  async initialize(): Promise<void> {
    /* Get token */
    const response = await this.request("/api/machine/tgLogin", {
      tgData: this.getInitData(),
    }).then((res) => res.data.data);

    /* Set Token */
    this.api.defaults.headers.common["token"] = response.token;
  }

  async getDetail() {
    return this.api
      .get("/api/machine/getMemberDetail")
      .then((res) => res.data.data);
  }

  async getConfig() {
    return this.api.get("/api/machine/getConfig").then((res) => res.data.data);
  }

  async getDepositAddress(): Promise<string> {
    return "";
  }

  async getAccountStatus(): Promise<number> {
    return 1;
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    return this.getDetail();
  }

  async getParticipation(): Promise<ParticipationResult> {
    return {
      amount: 0,
      balance: 0,
      participating: false,
    };
  }

  async confirmParticipation(): Promise<ParticipationResult> {
    return this.getParticipation();
  }

  async getWithdrawalHistory(): Promise<WithdrawalHistory[]> {
    return [];
  }

  async getWithdrawalInfo(): Promise<WithdrawalInfo> {
    return {
      balance: 0,
      address: "",
    };
  }

  async processWithdrawal(address: string): Promise<WithdrawalResult> {
    console.log("Withdrawal address:", address);
    return { status: "failed" };
  }

  static getPageUrl(page: string, url: string): string {
    const urlObj = new URL(url);
    switch (page) {
      case "activity":
        urlObj.hash = "#/pages/earn/index";
        break;
      case "withdrawals":
        urlObj.hash = "#/pages/index/withdrawal?type=2";
        break;
      default:
        urlObj.hash = "";
    }
    return urlObj.toString();
  }
}

export { DicaprioProvider };

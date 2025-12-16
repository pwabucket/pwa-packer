import type {
  PackerProviderInstance,
  ParticipationResult,
  WithdrawalHistory,
  WithdrawalInfo,
  WithdrawalResult,
} from "../types";
import { BaseTelegramProvider } from "./BaseTelegramProvider";

class LeonardoProvider
  extends BaseTelegramProvider
  implements PackerProviderInstance
{
  /* Minimum Deposit Amount */
  static MINIMUM_DEPOSIT_AMOUNT = 1;

  /* Week Starts On (0 = Sunday, 1 = Monday) */
  static WEEK_STARTS_ON: 0 | 1 = 1;

  /* Static Map to Cache Custom Code per Origin */
  static customCodeMap = new Map<string, string>();

  /* Static Map to Track Ongoing Initialization per Origin */
  static initializationPromises = new Map<string, Promise<void>>();

  constructor(url: string) {
    super(url);

    /* Authorization Header */
    this.api.defaults.headers.common["Authorization"] =
      this.telegramWebApp.initData || "";
  }

  async initialize() {
    const origin = this.url.origin;

    /* Check if Custom Code is Cached */
    if (LeonardoProvider.customCodeMap.has(origin)) {
      this.api.defaults.headers.common["custom"] =
        LeonardoProvider.customCodeMap.get(origin) || "";
      return;
    }

    /* Check if Initialization is Already in Progress for This Origin */
    if (LeonardoProvider.initializationPromises.has(origin)) {
      /* Wait for Ongoing Initialization to Complete */
      await LeonardoProvider.initializationPromises.get(origin);
      /* Set Header from Cache After Waiting */
      this.api.defaults.headers.common["custom"] =
        LeonardoProvider.customCodeMap.get(origin) || "";
      return;
    }

    /* Create New Initialization Promise */
    const initPromise = (async () => {
      try {
        /* Fetch HTML Content */
        const html = await this.api.get(this.url.href).then((res) => res.data);

        /* Parse HTML */
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        /* Find Script Tag with type="module" and src containing "index" */
        const scriptTag = [...doc.scripts].find(
          (s) => s.type === "module" && s.getAttribute("src")?.includes("index")
        );

        if (scriptTag) {
          /* Construct Script URL */
          const scriptUrl = new URL(
            scriptTag.getAttribute("src") || "",
            origin
          );

          /* Fetch Script Content */
          const scriptContent = await this.api
            .get(scriptUrl.href)
            .then((res) => res.data);

          /* Extract Custom Header from Script Content */
          const customHeader = scriptContent.match(
            /headers\.custom\s*=\s*["']([^"']+)["']/
          );

          /* Set Custom Header if Found */
          if (customHeader && customHeader[1]) {
            /* Set Custom Header in Axios Instance */
            this.api.defaults.headers.common["custom"] = customHeader[1];

            /* Debug Log */
            console.log("Custom Header Set:", customHeader[1]);

            /* Cache Custom Header */
            LeonardoProvider.customCodeMap.set(origin, customHeader[1]);
          }
        }
      } finally {
        /* Remove Promise from Map After Completion */
        LeonardoProvider.initializationPromises.delete(origin);
      }
    })();

    /* Store Promise in Map */
    LeonardoProvider.initializationPromises.set(origin, initPromise);

    /* Wait for Initialization to Complete */
    await initPromise;
  }

  /* Validate User */
  validate() {
    return this.api
      .post("/api/validate", {
        tgInfo: {
          ["invite"]: 0,
          ["language_code"]: "",
          ["initData"]: this.getInitData(),
          ["id"]: this.getUserId(),
        },
      })
      .then((res) => res.data.data);
  }

  /* Get Server Time */
  getTime() {
    return this.api.get("/api/time").then((res) => res.data.data);
  }

  /* Get Telegram ID as String */
  getTgId() {
    return this.getUserId()?.toString() || "";
  }

  /* Get Activity Data */
  getCurrentActivity() {
    return this.api
      .post("/api/activity", {
        ["tg_id"]: this.getTgId(),
        ["status"]: 1,
      })
      .then((res) => res.data.data);
  }

  /* Refresh Activity Data */
  refreshActivity() {
    return this.api
      .post("/api/depositActivity", {
        ["tg_id"]: this.getTgId(),
      })
      .then((res) => res.data.data);
  }

  /* Get Activity Wallet */
  generateActivityWallet() {
    return this.api
      .post("/api/generatedActivityWallet", {
        ["tg_id"]: this.getTgId(),
      })
      .then((res) => res.data.data);
  }

  /* Get Deposit Wallet */
  getGeneratedWallet() {
    return this.api
      .post("/api/generated", {
        ["tg_id"]: this.getTgId(),
      })
      .then((res) => res.data.data);
  }

  /* Get Withdraw Activity */
  getWithdrawActivity() {
    return this.api
      .get(`/api/withdrawActivity?tg_id=${this.getTgId()}`)
      .then((res) => res.data.data);
  }

  /* Get Withdraw Activity List */
  getWithdrawActivityList() {
    return this.api
      .post("/api/withdrawActivityList", {
        ["tg_id"]: this.getTgId(),
      })
      .then((res) => res.data.data);
  }

  /* Withdraw Activity */
  withdrawActivity(withdrawalAddress: string) {
    return this.api
      .post("/api/withdrawActivity", {
        ["tgInfo"]: this.getInitData(),
        ["tg_id"]: this.getTgId(),
        ["withdrawalAddress"]: withdrawalAddress,
      })
      .then((res) => res.data.data);
  }

  async getDepositAddress(): Promise<string> {
    const activity = await this.getCurrentActivity();

    if (activity.activityAddress) {
      return activity.activityAddress;
    } else {
      const wallet = await this.generateActivityWallet();
      return wallet.msg;
    }
  }

  async confirmDepositAddress(_address: string): Promise<string> {
    return this.getDepositAddress();
  }

  async getAccountStatus(): Promise<number> {
    const result = await this.validate();
    return result.data.status;
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    const result = await this.validate();
    return result.data;
  }

  async getParticipation(): Promise<ParticipationResult> {
    /* Get Current Activity Status */
    const result = await this.getCurrentActivity();

    return {
      participating: result.activity,
      amount: result.amount,
      balance: result.activityBalance,
    };
  }

  async confirmParticipation(): Promise<ParticipationResult> {
    /* Get Current Activity Status */
    const activity = await this.getParticipation();

    /* If Not Participated, Refresh Activity */
    if (!activity.participating) {
      const refresh = await this.refreshActivity();

      /* If Now Participated, Get Updated Activity */
      if (refresh.activity) {
        return await this.getParticipation();
      }
    }

    return activity;
  }

  async getWithdrawalHistory() {
    const result = await this.getWithdrawActivityList();

    /* Extract activities from data */
    const activities: {
      ["id"]: number;
      ["status"]: number;
      ["tp"]: string;
      ["create_time"]: string;
      ["hashId"]: string | null;
    }[] = result?.data?.list || [];

    return activities.map((item): WithdrawalHistory => {
      return {
        id: item["id"],
        date: new Date(item["create_time"] + "-05:00"),
        amount: item["tp"],
        status: item["status"] === 3 ? "success" : "pending",
        hash: item["hashId"],
      };
    });
  }

  async getWithdrawalInfo(): Promise<WithdrawalInfo> {
    const result = await this.getWithdrawActivity();
    const data = result?.data;

    return {
      balance: data?.activityBalance || 0,
      address: data?.withdrawalAddress || "",
    };
  }

  async processWithdrawal(address: string): Promise<WithdrawalResult> {
    /* Perform withdrawal */
    const response = await this.withdrawActivity(address);

    /* Validate response */
    if (response.code !== 200) {
      return { status: "failed", error: response.msg };
    } else {
      return { status: "success" };
    }
  }

  static getPageUrl(page: string, url: string): string {
    const urlObj = new URL(url);
    switch (page) {
      case "activity":
        urlObj.hash = "#/Activity";
        break;
      case "withdrawals":
        urlObj.hash = "#/Withdrawal";
        break;
      default:
        urlObj.hash = "";
    }
    return urlObj.toString();
  }
}

export { LeonardoProvider };

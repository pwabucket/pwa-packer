import axios, { type AxiosInstance } from "axios";
import { extractTgWebAppData } from "./utils";

interface InitDataUnsafe {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    allows_write_to_pm?: boolean;
    photo_url?: string;
  };
  auth_date?: number;
  signature?: string;
  hash?: string;
  [key: string]: unknown;
}

interface TelegramWebAppData {
  platform: string | null;
  version: string | null;
  initData: string | null;
  initDataUnsafe: InitDataUnsafe | null;
}

class Packer {
  private url: URL;
  protected api: AxiosInstance;
  protected telegramWebApp: TelegramWebAppData;

  /* Static Map to Cache Custom Code per Origin */
  static customCodeMap = new Map<string, string>();

  constructor(url: string) {
    /* Parse URL */
    this.url = new URL(url);

    /* Telegram WebApp Data */
    this.telegramWebApp = extractTgWebAppData(url);

    /* Axios Instance */
    this.api = axios.create({
      baseURL: this.url.origin,
    });

    /* Authorization Header */
    this.api.defaults.headers.common["Authorization"] =
      this.telegramWebApp.initData || "";

    /* Request Interceptor */
    this.api.interceptors.request.use((config) => {
      /* If No Llama URL is Set, Return Original Config */
      if (!import.meta.env.VITE_LLAMA_URL) {
        return config;
      }

      /* Llama URL from Environment Variables */
      const llamaURL = new URL(import.meta.env.VITE_LLAMA_URL);

      /* Set Original URL as Query Parameter */
      llamaURL.searchParams.set(
        "url",
        new URL(config.url || "", config.baseURL).href
      );

      /* Update Config URL to Llama URL */
      config.url = llamaURL.href;

      return config;
    });
  }

  async initialize() {
    /* Check if Custom Code is Cached */
    if (Packer.customCodeMap.has(this.url.origin)) {
      this.api.defaults.headers.common["custom"] =
        Packer.customCodeMap.get(this.url.origin) || "";
      return;
    }

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
        this.url.origin
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
        Packer.customCodeMap.set(this.url.origin, customHeader[1]);
      }
    }
  }

  /* Validate User */
  validate() {
    return this.api
      .post("/api/validate", {
        tgInfo: {
          ["invite"]: 0,
          ["language_code"]: "",
          ["initData"]: this.telegramWebApp.initData || "",
          ["id"]: this.getUserId(),
        },
      })
      .then((res) => res.data.data);
  }

  /* Get Server Time */
  getTime() {
    return this.api.get("/api/time").then((res) => res.data.data);
  }

  /* Get User ID */
  getUserId() {
    return this.telegramWebApp.initDataUnsafe?.user?.id || null;
  }

  /* Get Activity Data */
  getActivity() {
    return this.api
      .post("/api/activity", {
        ["tg_id"]: this.getUserId()?.toString() || "",
        ["status"]: 1,
      })
      .then((res) => res.data.data);
  }

  /* Refresh Activity Data */
  refreshActivity() {
    return this.api
      .post("/api/depositActivity", {
        ["tg_id"]: this.getUserId()?.toString() || "",
      })
      .then((res) => res.data.data);
  }

  /* Get Activity Wallet */
  getActivityWallet() {
    return this.api
      .post("/api/generatedActivityWallet", {
        ["tg_id"]: this.getUserId()?.toString() || "",
      })
      .then((res) => res.data.data);
  }

  /* Check and Refresh Activity if Not Participated */
  async checkActivity() {
    const status = await this.getActivity();
    if (!status.activity) {
      return await this.refreshActivity();
    }

    return status;
  }
}

export { Packer };

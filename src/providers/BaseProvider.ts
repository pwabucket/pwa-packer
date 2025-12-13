import axios, { type AxiosInstance } from "axios";
import { extractTgWebAppData } from "../lib/utils";

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

abstract class BaseProvider {
  protected url: URL;
  protected api: AxiosInstance;
  protected telegramWebApp: TelegramWebAppData;

  constructor(url: string) {
    /* Parse URL */
    this.url = new URL(url);

    /* Telegram WebApp Data */
    this.telegramWebApp = extractTgWebAppData(url);

    /* Axios Instance */
    this.api = axios.create({
      baseURL: this.url.origin,
    });

    /* Configure Llama Interceptor */
    this.configureLlamaInterceptor();
  }

  /* Get User ID */
  getUserId() {
    return this.telegramWebApp.initDataUnsafe?.user?.id || null;
  }

  /* Get Init Data */
  getInitData() {
    return this.telegramWebApp.initData || "";
  }

  configureLlamaInterceptor() {
    /* Request Interceptor */
    this.api.interceptors.request.use((config) => {
      /* If No Llama URL is Set, Return Original Config */
      if (!import.meta.env.VITE_LLAMA_URL) {
        return config;
      }

      /** Construct full URL */
      const baseURL = config.baseURL || this.url.origin;
      const fullURL = new URL(config.url || "", baseURL);
      for (const [key, value] of Object.entries(config.params || {})) {
        fullURL.searchParams.append(key, String(value));
      }

      /* Llama URL from Environment Variables */
      const llamaURL = new URL(import.meta.env.VITE_LLAMA_URL);

      /* Set Original URL as Query Parameter */
      llamaURL.searchParams.set("url", fullURL.href);

      /* Update Config URL to Llama URL */
      config.url = llamaURL.href;
      config.baseURL = undefined;
      delete config.params;

      return config;
    });
  }
}

export { BaseProvider };

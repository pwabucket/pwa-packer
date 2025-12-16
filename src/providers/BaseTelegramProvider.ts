import { extractTgWebAppData } from "../lib/utils";
import type { TelegramWebAppData } from "../types";
import { BaseProvider } from "./BaseProvider";

abstract class BaseTelegramProvider extends BaseProvider {
  protected telegramWebApp: TelegramWebAppData;

  constructor(url: string) {
    super(url);

    /* Telegram WebApp Data */
    this.telegramWebApp = extractTgWebAppData(url);
  }

  /* Get User ID */
  getUserId() {
    return this.telegramWebApp.initDataUnsafe?.user?.id || null;
  }

  /* Get Init Data */
  getInitData() {
    return this.telegramWebApp.initData || "";
  }
}

export { BaseTelegramProvider };

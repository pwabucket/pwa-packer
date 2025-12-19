import axios, { type AxiosInstance } from "axios";

abstract class BaseProvider {
  protected url: URL;
  protected force: boolean;
  protected api: AxiosInstance;

  constructor(url: string, force: boolean = false) {
    /* Parse URL */
    this.url = new URL(url);

    /* Force Flag */
    this.force = force;

    if (this.force) {
      console.warn("Force flag is enabled for this provider instance.");
    }

    /* Axios Instance */
    this.api = axios.create({
      baseURL: this.url.origin,
    });

    /* Configure Llama Interceptor */
    this.configureLlamaInterceptor();
  }

  /* Configure Llama Interceptor */
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

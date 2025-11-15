/** Whether to Use Iframe for Parcel */
const USE_IFRAME_FOR_PARCEL =
  import.meta.env.VITE_USE_IFRAME_FOR_PARCEL === "true";

/** Parcel URL from Environment Variables */
const PARCEL_URL = import.meta.env.VITE_PARCEL_URL;

interface LaunchParcelOptions {
  path: string;
  enableIframe: (show: boolean) => void;
  onReady: (event: MessageEvent) => void;
}

/** Launch Parcel Function */
export function launchParcel({
  path,
  enableIframe,
  onReady,
}: LaunchParcelOptions) {
  /** Handle Parcel Ready Message */
  function handleParcelReady(event: MessageEvent) {
    if (event.origin !== new URL(PARCEL_URL).origin) return;
    if (event.data === "ready") {
      onReady(event);

      window.removeEventListener("message", handleParcelReady);
    }
  }

  /** Listen for Parcel Ready Message */
  window.addEventListener("message", handleParcelReady);

  /* Open Parcel in New Window or Iframe */
  if (USE_IFRAME_FOR_PARCEL) {
    enableIframe(true);
  } else {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      const link = document.createElement("a");
      link.href = new URL(path, PARCEL_URL).href;
      link.target = "_blank";
      link.rel = "opener";
      link.click();
    } else {
      window.open(
        new URL(path, PARCEL_URL).href,
        "_blank",
        "popup,width=400,height=768"
      );
    }
  }
}

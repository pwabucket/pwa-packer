import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { registerSW } from "virtual:pwa-register";

import ReactGA from "react-ga4";

ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);

/** Register Service Worker */
registerSW({ immediate: true });

/** React Query Client */
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

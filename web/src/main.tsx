import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "./router";
import { AnalyticsConsent } from "./components/analytics-consent";
import { PwaControls } from "./components/pwa-controls";
import { initializeAnalytics } from "./lib/analytics";
import { defaultSeo, setPageSeo } from "./lib/seo";
import "katex/dist/katex.min.css";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // The API client already performs one fast retry for safe requests.
      // Avoid a second retry layer that makes an unavailable service feel slow.
      retry: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

setPageSeo(defaultSeo);
initializeAnalytics();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <AnalyticsConsent />
      <PwaControls />
    </QueryClientProvider>
  </React.StrictMode>,
);

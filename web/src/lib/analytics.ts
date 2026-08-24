const CONSENT_KEY = "uhd.optional-analytics-consent";
const CLARITY_SCRIPT_ID = "uhd-clarity";
let posthogClient: (typeof import("posthog-js"))["default"] | null = null;
let posthogStarting: Promise<void> | null = null;
let lastPageViewPath: string | null = null;

export type AnalyticsConsent = "accepted" | "declined" | null;

function configured(value: string | undefined) {
  return Boolean(value && value.trim());
}

export function analyticsIsConfigured() {
  return configured(import.meta.env.VITE_POSTHOG_KEY) || configured(import.meta.env.VITE_CLARITY_PROJECT_ID);
}

export function getAnalyticsConsent(): AnalyticsConsent {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

function rememberConsent(consent: Exclude<AnalyticsConsent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // The app remains usable when privacy settings block local storage.
  }
}

function startClarity() {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim();
  if (!projectId || document.getElementById(CLARITY_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = CLARITY_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  document.head.append(script);
}

async function startPostHog() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (!apiKey || posthogClient) return;
  if (posthogStarting) return posthogStarting;

  posthogStarting = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(apiKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      opt_out_capturing_by_default: true,
    });
    posthog.opt_in_capturing();
    posthogClient = posthog;
    lastPageViewPath = window.location.pathname;
    posthog.capture("page_viewed", { pathname: lastPageViewPath });
  }).finally(() => {
    posthogStarting = null;
  });
  return posthogStarting;
}

export async function enableAnalytics() {
  rememberConsent("accepted");
  await startPostHog();
  startClarity();
  captureAnalyticsEvent("analytics_consent_granted");
}

export function declineAnalytics() {
  rememberConsent("declined");
  posthogClient?.opt_out_capturing();
}

export function initializeAnalytics() {
  if (getAnalyticsConsent() === "accepted") {
    void startPostHog();
    startClarity();
  }
}

export function captureAnalyticsEvent(name: string, properties: Record<string, string | number | boolean> = {}) {
  if (getAnalyticsConsent() !== "accepted") return;
  posthogClient?.capture(name, properties);
}

export function capturePageView(pathname: string) {
  if (lastPageViewPath === pathname) return;
  lastPageViewPath = pathname;
  captureAnalyticsEvent("page_viewed", { pathname });
}

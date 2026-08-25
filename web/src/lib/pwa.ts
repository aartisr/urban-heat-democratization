export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export const PWA_DISMISS_KEY = "uhd.pwa.install-dismissed-until";
export const PWA_DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export function canUsePwa(): boolean {
  return import.meta.env.PROD && "serviceWorker" in navigator;
}

export function isInstalledPwa(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function needsManualInstallGuide(): boolean {
  const appleMobile = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  return appleMobile && !isInstalledPwa();
}

export function shouldOfferInstall(): boolean {
  const dismissedUntil = Number(window.localStorage.getItem(PWA_DISMISS_KEY) ?? "0");
  return !isInstalledPwa() && dismissedUntil < Date.now();
}

export function dismissInstallOffer() {
  window.localStorage.setItem(PWA_DISMISS_KEY, String(Date.now() + PWA_DISMISS_DURATION_MS));
}

import { useEffect, useRef, useState } from "react";

import {
  canUsePwa,
  dismissInstallOffer,
  type InstallPromptEvent,
  needsManualInstallGuide,
  shouldOfferInstall,
} from "../lib/pwa";

export function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const reloadAfterUpdate = useRef(false);

  useEffect(() => {
    if (!canUsePwa()) return;

    if (shouldOfferInstall() && needsManualInstallGuide()) setShowManualInstall(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (shouldOfferInstall()) setInstallPrompt(event as InstallPromptEvent);
    };
    const onAppInstalled = () => setInstallPrompt(null);
    const onControllerChange = () => {
      if (reloadAfterUpdate.current) window.location.reload();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
      const announceWaitingWorker = () => {
        if (registration.waiting) setUpdateRegistration(registration);
      };
      registration.addEventListener("updatefound", () => {
        registration.installing?.addEventListener("statechange", () => {
          if (registration.installing?.state === "installed" && navigator.serviceWorker.controller) announceWaitingWorker();
        });
      });
      announceWaitingWorker();
    }).catch(() => {
      // Installation remains optional; an unavailable worker must never block the app.
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome !== "accepted") dismissInstallOffer();
    setInstallPrompt(null);
    setShowManualInstall(false);
  };

  const dismissInstall = () => {
    dismissInstallOffer();
    setInstallPrompt(null);
    setShowManualInstall(false);
  };

  const applyUpdate = () => {
    if (!updateRegistration?.waiting) return;
    reloadAfterUpdate.current = true;
    updateRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (!installPrompt && !showManualInstall && !updateRegistration) return null;

  return (
    <aside className="pwa-controls" aria-live="polite" aria-label="App installation and update options">
      {updateRegistration ? (
        <div className="pwa-controls-card pwa-controls-card-update">
          <div><strong>A newer version is ready.</strong><span>Refresh when you are ready to use it.</span></div>
          <div className="pwa-controls-actions"><button type="button" className="button-link" onClick={applyUpdate}>Update now</button><button type="button" className="button-link secondary" onClick={() => setUpdateRegistration(null)}>Later</button></div>
        </div>
      ) : null}
      {installPrompt ? (
        <div className="pwa-controls-card">
          <div><strong>Install this workspace</strong><span>Keep Urban Heat Democratization one tap away.</span></div>
          <div className="pwa-controls-actions"><button type="button" className="button-link" onClick={() => void install()}>Install</button><button type="button" className="button-link secondary" onClick={dismissInstall}>Not now</button></div>
        </div>
      ) : null}
      {showManualInstall && !installPrompt ? (
        <div className="pwa-controls-card">
          <div><strong>Install this workspace</strong><span>On iPhone or iPad, use Share, then choose “Add to Home Screen.”</span></div>
          <div className="pwa-controls-actions"><button type="button" className="button-link secondary" onClick={dismissInstall}>Not now</button></div>
        </div>
      ) : null}
    </aside>
  );
}

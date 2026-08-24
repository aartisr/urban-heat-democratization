import { useEffect, useState } from "react";

import {
  analyticsIsConfigured,
  declineAnalytics,
  enableAnalytics,
  getAnalyticsConsent,
} from "../lib/analytics";

export function AnalyticsConsent() {
  const [consent, setConsent] = useState(() => getAnalyticsConsent());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "uhd.optional-analytics-consent") {
        setConsent(getAnalyticsConsent());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!analyticsIsConfigured() || consent) return null;

  return (
    <aside className="analytics-consent" aria-label="Optional analytics choice">
      <div>
        <p className="analytics-consent-kicker">Your choice</p>
        <p>Help us improve this public-interest workspace with optional, privacy-conscious usage analytics. We do not use these tools to identify you or record the research choices you make.</p>
      </div>
      <div className="analytics-consent-actions">
        <button className="button button-secondary" type="button" onClick={() => { declineAnalytics(); setConsent("declined"); }}>
          No thanks
        </button>
        <button className="button button-primary" type="button" onClick={() => { void enableAnalytics(); setConsent("accepted"); }}>
          Help improve it
        </button>
      </div>
    </aside>
  );
}

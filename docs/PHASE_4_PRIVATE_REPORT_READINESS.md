# Phase 4: Address-Confirmed Private Report Readiness

## Status

**Not enabled.** The app has no live geocoding provider and does not accept or
transmit an address. The browser-only report-preparation flow is available to
help people identify what they can investigate while the required safeguards
are completed.

The canonical phase status and all remaining release gates live in
[Address-Level Spectral Urbanism Advice](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md#current-delivery-status-and-what-remains).

## Non-negotiable provider contract

Any provider selected for address confirmation must satisfy all of the
following before an integration is enabled:

1. **Purpose limitation:** use the address only to fulfill the immediately
   requested report; prohibit advertising, profiling, sale, secondary use, and
   model training.
2. **Ephemeral handling:** geocode in memory; do not place raw addresses,
   coordinates, or provider responses in application logs, analytics, URLs,
   exports, error reports, or durable queues.
3. **Rounding before analysis display:** show only the approved coarse cell or
   neighborhood geometry; never show a precise residential point by default.
4. **Clear consent:** disclose the provider, purpose, exact data sent, retention
   behavior, and withdrawal / deletion mechanism immediately before lookup.
5. **Security review:** verify server-side redaction, access control, rate
   limits, abuse controls, dependency posture, and incident response.
6. **Independent review:** obtain privacy, accessibility, and pilot-partner
   approval before enabling any production provider.

These requirements reflect the sensitivity of precise geolocation and the need
for informed consent, minimization, and a retention program. See the
[FTC geolocation privacy guidance](https://www.ftc.gov/news-events/news/press-releases/2014/06/ftc-testifies-geolocation-privacy),
[FTC InMarket order](https://www.ftc.gov/news-events/news/press-releases/2024/05/ftc-finalizes-order-inmarket-prohibiting-it-selling-or-sharing-precise-location-data),
and [NIST privacy engineering guidance](https://www.nist.gov/publications/introduction-privacy-engineering-and-risk-management-federal-information-systems).

## Required report response contract

```json
{
  "display_geometry": "rounded cell or neighborhood only",
  "geocoding": {"provider": "approved provider id", "precision": "address-confirmed"},
  "site_facts": {"control": "self | shared | none", "project_interest": "shade | roof | route | none"},
  "evidence": {"layers": [], "provenance_version": "..."},
  "spectral": {"status": "available | not_available", "reason": "..."},
  "limits": ["not a health-risk assessment", "not a property certification"]
}
```

No raw address, precise coordinate, or unrounded geometry belongs in this
response or in a saved report.

## Enablement checklist

- [ ] Provider selected and contract reviewed
- [ ] Consent copy, withdrawal, and deletion path approved
- [ ] Request / log-redaction tests pass
- [ ] Rate-limit and abuse review passes
- [ ] Independent privacy and accessibility review passes
- [ ] Boston pilot steward approves the use case
- [ ] Address-placement perturbation and sensitivity tests pass
- [ ] Public incident, rollback, and sunset process is ready

Until every item is complete, the UI must say **“Address-confirmed report not
available yet”** and offer the browser-only preparation path instead.

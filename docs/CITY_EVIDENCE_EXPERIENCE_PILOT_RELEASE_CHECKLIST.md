# City Evidence Experience: Pilot Release Checklist

> Use this checklist before enabling the redesigned city experience for a
> production audience. It does not replace scientific review or user research.

## Code and deployment

- [x] Production build passes under Node 22 (verified 2026-09-26).
- [x] Local Chromium interaction suite passes (11 passed; the live-backend
      map test is intentionally skipped without `E2E_LIVE_BACKEND=1`); repeat
      against the preview deployment.
- [ ] Preview every supported city state: bundled-validated, bundled-partial,
      upload-first, and processing.
- [ ] Direct URLs preserve the selected view:
      `/cities/:citySlug?view=read`, `explore`, and `audit`.
- [ ] Browser Back/Forward preserves selected view and does not create an
      unexpected map selection.
- [ ] Vercel preview and production use the public registry configuration;
      corporate registry credentials are never committed or configured as a
      production dependency.
- [x] Shared application CSS meets its 220 KiB budget. Current result: 219.7
      KiB after city-route CSS splitting (verified 2026-09-26).

## Evidence and claims

- [ ] A method/data owner approves the headline, source, date, scale, and
      limitation for each bundled city.
- [ ] Partial, upload-first, and processing cities show readiness/onboarding
      language rather than a fabricated local finding.
- [ ] Every guided step visibly states an important limitation.
- [ ] Audit’s evidence ledger has a clear row or honest unavailable-state for
      each supported layer.
- [ ] Scenario handoff language remains a bounded planning aid, not a forecast
      or policy recommendation.

## Accessibility and responsive review

- [x] Keyboard-visible controls are implemented for Read / Explore / Audit,
      guided steps, Atlas entry, and Audit disclosures; complete manual
      keyboard-only verification.
      Atlas entry, and Audit disclosures.
- [ ] Focus is visible at all viewport widths and never obscured by sticky UI.
- [ ] At 320 CSS pixels and 400% zoom, content reflows without a page-level
      horizontal scroll; the evidence table becomes labelled stacked rows.
- [x] Reduced-motion styling removes non-essential city-navigation animation;
      complete manual verification.
- [ ] The Atlas has an equivalent text/table route for its priority findings.
- [ ] Semantic status labels supplement every evidence colour.

## Privacy-safe measurement

- [ ] Optional analytics consent has been reviewed by the deployment owner.
- [ ] Before consent, no analytics provider request is sent.
- [ ] After consent, the only city-experience event properties are `view` or
      `step`; inspect browser network requests to confirm no city, selected
      area, address, scenario, or identity data are transmitted.
- [ ] PostHog/Clarity retention, access, masking, and privacy notice are
      approved before enabling their environment variables.

## Research and launch decision

- [ ] Complete two moderated usability rounds using
      [the research protocol](CITY_EVIDENCE_EXPERIENCE_RESEARCH_PROTOCOL.md).
- [ ] Resolve every critical/high comprehension finding, especially any
      interpretation of a derived priority as a forecast or decision.
- [ ] Record product-owner, method-owner, and accessibility-owner approval.
- [ ] Begin with a preview or limited pilot, monitor the documented aggregate
      events, and schedule a review of support questions and misunderstandings.

## Rollback

Keep the previous deployment available in the hosting provider. If the pilot
creates a material comprehension or accessibility issue, roll back the
deployment and preserve the research finding in the issue/release record.

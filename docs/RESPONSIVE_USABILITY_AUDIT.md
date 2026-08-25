# Responsive and Usability Audit

> Reviewed: 2026-08-25. This is an engineering audit, not a substitute for
> moderated usability research or accessibility conformance testing.

## What was checked

- All registered application routes in `web/src/router.tsx`.
- Shared shell, breakpoint, container-query, focus-visible, touch-target, and
  reduced-motion rules in `web/src/styles.css`.
- Existing narrow-phone landing and mobile-atlas Playwright smoke coverage.
- Type-check/build, unit tests, and token-contrast checks.

## Route coverage

| Route | Responsive design approach | Cognitive-load posture |
| --- | --- | --- |
| `/` | Responsive hero and adaptive navigation | Primary path first; secondary context is progressive. |
| `/cities` | Collapsible shell and single-column onboarding at constrained widths | Browse and onboarding remain distinct tasks. |
| `/cities/$cityId` | Container-query atlas plus focused mobile map flow | Map details are progressive; map is primary on small screens. |
| `/scenarios` | Responsive scenario grids and adaptive data visualizations | Planning choices are grouped by workflow stage. |
| `/modes` | Breakpoint-aware mode cards | One persona/mode choice at a time. |
| `/exports` | Responsive form and table shells | Export details retain horizontal scroll rather than clipping. |
| `/runs` and `/runs/$runId` | Shared panel and table responsiveness | Execution state and detail are separated. |
| `/robustness` | One experiment flow; optional provenance, formulas, and data table | Run → result → optional explanation. |
| `/address-plan` | Browser-only location boundary; single-column action cards on smaller screens | Scope and privacy are visible before action. |
| `/contact` | Responsive content grids | Contact paths are grouped by purpose. |

## Verified automated checks

- Frontend unit tests: passing.
- Production type-check and build: passing.
- Design-token contrast checks: passing.
- Isolated Playwright smoke checks: passing for narrow-phone landing, mobile
  map-first flow, full-page atlas behavior, scenario defaults, and city-detail
  journey.

## CSS ownership

`web/src/styles.css` is reserved for shared tokens, shell, components, and
cross-route responsive rules. The interactive Robustness Lab owns its local
styles in `web/src/routes/robustness.css`; the route imports that stylesheet
with its component, so its presentation code is isolated and can be split from
the initial application CSS bundle.

## Honest limits and remaining validation

No automated suite can truthfully certify “10/10 usability” or “zero cognitive
overload.” The next validation should include keyboard-only and screen-reader
passes, current-browser/device matrix checks, and short moderated task tests
with people who did not build the product. The stylesheet is also marginally
over its current performance budget and should be reduced or route-split before
claiming a clean performance gate.

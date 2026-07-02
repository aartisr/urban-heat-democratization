# Screenshot Gallery

This gallery captures real UI renders from the running app using Playwright automation.

Capture source:

- test runner: `web/tests/e2e/gallery.spec.ts`
- generation command: `cd web && npx playwright test tests/e2e/gallery.spec.ts`

## Home

![Home page](./screenshots/home.png)

## Cities

![Cities page](./screenshots/cities.png)

## City Detail (Boston)

![City detail page](./screenshots/city-detail.png)

## Scenarios

![Scenarios page](./screenshots/scenarios.png)

## Notes

- Screenshots are generated from mocked API responses in the gallery spec, so the UI state is deterministic for docs and CI.
- Refresh this gallery whenever major UX changes land.

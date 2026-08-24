# Optional analytics setup

Urban Heat Democratization can use **PostHog** and **Microsoft Clarity** to understand whether people can navigate the public workspace. Both integrations are disabled until configured and a visitor explicitly chooses to help improve the site.

## What is collected

The app sends only the explicit `page_viewed` event to PostHog, with the route pathname. Autocapture, page-leave capture, session recording, and user identification are disabled. Microsoft Clarity loads only after consent; do not use Clarity Identify API or custom tags to send names, email addresses, addresses, health information, uploaded files, or scenario inputs.

Review provider settings before launch. Keep Clarity's masking safeguards on, set the retention and access controls that match the project policy, and ensure the privacy notice accurately describes these optional providers and their purposes.

## Configure production

Create a PostHog project and a Microsoft Clarity project for the production domain, then set these build-time variables in the hosting provider:

```text
VITE_POSTHOG_KEY=phc_…
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_CLARITY_PROJECT_ID=your-clarity-project-id
```

Use the appropriate regional/self-hosted PostHog host when applicable. `VITE_` values are intentionally visible to the browser; never put a PostHog personal API key, a Microsoft account credential, or any other secret in them.

Leave either variable unset to disable that provider. Local development stays analytics-free unless a developer adds those values to an uncommitted `web/.env.local` file.

## Verify after deploy

1. Open the deployed site in a fresh private window.
2. Confirm no request goes to PostHog or `clarity.ms` before choosing **Help improve it**.
3. Accept optional analytics and confirm one `page_viewed` event in PostHog and Clarity’s installation signal/dashboard.
4. Navigate between pages; confirm pathnames are present but no city-selection, scenario, form, or personally identifying values are sent.
5. Decline in another fresh session; confirm the providers do not load.

Microsoft says each Clarity project has its own tracking code and recommends confirming setup through its dashboard or requests to `clarity.ms/collect`. PostHog's JavaScript SDK supports explicit events and asynchronous loading; this implementation deliberately avoids its automatic interaction capture and session replay.

## Operating rules

- Treat analytics as product-learning data, not research evidence or a measure of public need.
- Restrict dashboard access to people who need it, and review it periodically.
- Do not join analytics data to personal or neighborhood-level sensitive datasets.
- Review the privacy notice, consent language, retention settings, and applicable legal requirements with the organization responsible for deployment before enabling production collection.
- If adding new events, document the exact event name, properties, purpose, retention, and owner here before shipping it.

## References

- [Microsoft Clarity setup and installation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup)
- [Microsoft Clarity data, consent, and privacy documentation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/)
- [PostHog JavaScript SDK](https://posthog.com/docs/libraries/js)

# IndexNow publishing

This folder is the URL source of truth for IndexNow notifications.

`indexnow.config.json` deliberately separates the canonical application and
GitHub Pages into different host batches. IndexNow verifies ownership per host
and does not accept a URL from one host in a batch for another.

## One-time deployment check

After deploying both sites, confirm that the same key is served at both URLs:

```text
https://urban-heat.ai-aarti.com/UHD-INDEXNOW-2026-AARTI-7F3C9D2E5B8A1C4D.txt
https://aartisr.github.io/urban-heat-democratization/UHD-INDEXNOW-2026-AARTI-7F3C9D2E5B8A1C4D.txt
```

Each response must be plain text containing exactly the key. The GitHub Pages
key lives under the project-site path and therefore can authorize only URLs
under that same path, which is exactly this repository's Pages site. The key is
a public ownership-verification token, so it is intentionally committed.

## Submit changed pages

Preview the exact host batches without making a network request:

```bash
node scripts/submit-indexnow.mjs
```

Send the batches after the matching deployment is live:

```bash
node scripts/submit-indexnow.mjs --submit
```

Only submit URLs that were added, updated, or deleted. A `200` means the
endpoint received the notification; it does not promise indexing or ranking.

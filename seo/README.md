# Discovery publishing workflow

`discovery-pages.json` is the source of truth for every intentionally public,
indexable canonical route and GitHub Pages guide. Each entry needs a truthful
title, description, and path. Set `lastmod` only when that specific page has a
verifiable significant change; the sitemap omits it otherwise. Canonical entries also
name their corresponding React route source so the refresh script can catch a
missing route before deployment. Each app route also has a unique `summary`
that appears in the HTML before JavaScript loads, alongside a visible author
byline and links to methods and the citation record.

Run this after adding or materially changing a public page:

```bash
cd web
npm run discovery:refresh
npm run discovery:check
```

The refresh regenerates only machine-readable discovery artifacts:

- canonical XML sitemap;
- `llms.txt` and `ai.txt` research briefs;
- `seo-manifest.json` Schema.org graph;
- Atom feed; and
- separate, host-correct IndexNow URL lists for the canonical application and
  GitHub Pages companion.

The production web build also creates route-specific HTML for every canonical
application page. Each entry point provides a distinct title, description,
canonical URL, social preview, visible author credit, and Schema.org citation
before the interactive app loads. Check a built deep page in `web/dist` when
changing this pipeline.

It deliberately does not submit IndexNow. Submit only after the corresponding
deployment is publicly reachable:

```bash
cd web
npm run indexnow -- --submit
```

These files improve accurate discovery by search engines and answer systems;
they cannot guarantee ranking, indexing, inclusion in AI answers, or outcomes.

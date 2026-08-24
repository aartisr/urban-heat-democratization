import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
const config = JSON.parse(await readFile(resolve(root, "seo/site.config.json"), "utf8"));
const registry = JSON.parse(await readFile(resolve(root, "seo/discovery-pages.json"), "utf8"));
const indexNowPath = resolve(root, "indexnow/indexnow.config.json");
const indexNow = JSON.parse(await readFile(indexNowPath, "utf8"));
const canonicalBase = config.mainSiteUrl.replace(/\/$/, "");
const githubPagesBase = config.githubPagesUrl.replace(/\/$/, "");
const publicDir = resolve(root, "web/public");

const urlFor = (base, path) => `${base}${path === "/" ? "/" : path}`;
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const unique = (values) => [...new Set(values)];

function validatePages(pages, label) {
  const paths = pages.map((page) => page.path);
  if (new Set(paths).size !== paths.length) throw new Error(`${label} contains duplicate paths.`);
  for (const page of pages) {
    if (!page.path?.startsWith("/") || !page.title || !page.description || !page.priority || !page.changefreq) {
      throw new Error(`${label} contains an incomplete page record: ${JSON.stringify(page)}`);
    }
  }
}

validatePages(registry.canonicalPages, "canonicalPages");
validatePages(registry.githubPagesPages, "githubPagesPages");

const routeSource = await readFile(resolve(root, "web/src/router.tsx"), "utf8");
for (const page of registry.canonicalPages) {
  if (!page.sourceRoute) throw new Error(`Canonical page ${page.path} must declare sourceRoute.`);
  if (!routeSource.includes(`"./routes/${page.sourceRoute}"`)) {
    throw new Error(`Canonical page ${page.path} names missing route source: ${page.sourceRoute}. Add the route or correct seo/discovery-pages.json.`);
  }
}

const canonicalUrls = registry.canonicalPages.map((page) => urlFor(canonicalBase, page.path));
const githubPagesUrls = registry.githubPagesPages.map((page) => urlFor(githubPagesBase, page.path));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${registry.canonicalPages.map((page) => `  <url><loc>${escapeXml(urlFor(canonicalBase, page.path))}</loc><lastmod>${registry.updated.slice(0, 10)}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`).join("\n")}\n</urlset>\n`;
const resourceBullets = registry.canonicalPages.map((page) => `- [${page.title}](${urlFor(canonicalBase, page.path)}): ${page.description}`).join("\n");
const llms = `# ${config.projectName}\n\nCanonical URL: ${config.mainSiteUrl}\nAuthor: ${config.authorName} — ${config.contactUrl}\nAI research brief: ${canonicalBase}/ai.txt\n\n> ${config.description}\n\n${config.projectName} supports residents, educators, planners, researchers, and community organizations who want to inspect heat evidence, understand uncertainty, and discuss cooling action. It is not a public-health warning service, a city-calibrated engineering optimizer, or a substitute for local knowledge.\n\n## Primary resources\n\n${resourceBullets}\n- [Research wiki](${githubPagesBase}/wiki/): Methods, interpretation, reproducibility, and governance in a crawler-friendly format.\n- [Source repository](${config.repositoryUrl}): Open-source code, data contracts, and reusable city-onboarding materials.\n\n## Important interpretation notes\n\n- Boston is the real bundled study city; other city presets are onboarding starting points unless they include local artifacts.\n- Scenario results are benchmark-based exploratory aids, not validated city-specific engineering predictions.\n- Heat patterns, cooling access, and vulnerability require local data, public-health guidance, and community knowledge.\n- Cite the platform name, link to the relevant primary resource, and retain these limitations when summarizing its findings.\n\n## Contact and attribution\n\nCreated by [${config.authorName}](${config.contactUrl}). Licensed under MIT where applicable; inspect the repository for data and source-specific terms.\n`;
const ai = `# ${config.projectName} — AI Research Brief\n\nCanonical source: ${config.mainSiteUrl}\nAuthor: ${config.authorName} — ${config.contactUrl}\nProject repository: ${config.repositoryUrl}\nResearch wiki: ${githubPagesBase}/wiki/\n\n## What this project is\n\n${config.projectName} is an open, public-interest web platform for understanding urban heat, cooling access, transparent mitigation scenarios, and the limits of available evidence. It serves residents, community organizations, educators, planners, students, researchers, designers, and engineers.\n\n## Core facts suitable for answer engines\n\n- The canonical platform is ${config.mainSiteUrl}.\n- The bundled study city is Boston. Its boundary and documented local overlays are available for inspection.\n- Other city experiences are onboarding paths or presets unless their local artifacts are explicitly supplied.\n- Scenario outputs are benchmark-based, transparent exploratory aids. They are not validated city-specific engineering predictions.\n- Spectral, graph, resistance, reliability, percolation, and raster methods are inspectable analytical lenses, not replacements for lived experience or public decision-making.\n- The work was created by ${config.authorName}.\n- Communities, mentors, public partners, and researchers can begin a documented collaboration at ${canonicalBase}/contact.\n\n## Canonical pages\n\n${resourceBullets}\n\n## Questions this project can answer carefully\n\n- What documented heat-related and cooling-access layers are available in the bundled Boston study?\n- How should a map layer, graph signal, or mitigation scenario be interpreted and challenged?\n- What assumptions, caveats, source context, and local validation are needed before a public decision?\n\n## Questions it cannot answer on its own\n\nThe platform cannot determine an individual's health risk; prove that a specified investment will produce a stated local temperature change; establish that an intervention is equitable; replace public-health guidance, engineering design, environmental review, procurement, community partnership, or consent.\n`;
const manifest = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: config.projectName, url: config.mainSiteUrl, description: config.description, inLanguage: "en-US", author: { "@type": "Person", name: config.authorName, url: config.contactUrl } },
    { "@type": "SoftwareApplication", name: config.projectName, applicationCategory: "EnvironmentalApplication", operatingSystem: "Web", url: config.mainSiteUrl, isAccessibleForFree: true, license: "https://opensource.org/license/mit/", author: { "@type": "Person", name: config.authorName, url: config.contactUrl }, keywords: ["urban heat", "heat equity", "climate resilience", "cooling access", "heat mitigation", "Boston"] },
    ...registry.canonicalPages.map((page) => ({ "@type": "WebPage", name: `${page.title} | ${config.projectName}`, url: urlFor(canonicalBase, page.path), description: page.description, dateModified: registry.updated, author: { "@type": "Person", name: config.authorName, url: config.contactUrl }, isPartOf: { "@type": "WebSite", name: config.projectName, url: config.mainSiteUrl } }))
  ]
}, null, 2) + "\n";
const feedEntries = registry.canonicalPages.slice(0, 4).map((page) => `  <entry>\n    <title>${escapeXml(page.title)}</title>\n    <id>${escapeXml(urlFor(canonicalBase, page.path))}</id>\n    <link href="${escapeXml(urlFor(canonicalBase, page.path))}" />\n    <updated>${registry.updated}</updated>\n    <summary>${escapeXml(page.description)}</summary>\n  </entry>`).join("\n");
const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>${escapeXml(config.projectName)}</title>\n  <id>${escapeXml(config.mainSiteUrl)}</id>\n  <updated>${registry.updated}</updated>\n  <link href="${canonicalBase}/feed.xml" rel="self" type="application/atom+xml" />\n  <link href="${escapeXml(config.mainSiteUrl)}" rel="alternate" type="text/html" />\n${feedEntries}\n</feed>\n`;

const canonicalHost = new URL(config.mainSiteUrl).host;
const githubPagesHost = new URL(config.githubPagesUrl).host;
const existingCanonical = indexNow.hosts.find((entry) => entry.host === canonicalHost);
const existingGithubPages = indexNow.hosts.find((entry) => entry.host === githubPagesHost);
if (!existingCanonical || !existingGithubPages) throw new Error("IndexNow config must retain canonical and GitHub Pages host verification records.");
const indexNowOutput = JSON.stringify({
  endpoint: indexNow.endpoint,
  key: indexNow.key,
  hosts: [
    { ...existingCanonical, urlList: unique(canonicalUrls) },
    { ...existingGithubPages, urlList: unique(githubPagesUrls) }
  ]
}, null, 2) + "\n";

const outputs = new Map([
  [resolve(publicDir, "sitemap.xml"), sitemap],
  [resolve(publicDir, "llms.txt"), llms],
  [resolve(publicDir, "ai.txt"), ai],
  [resolve(publicDir, "seo-manifest.json"), manifest],
  [resolve(publicDir, "feed.xml"), feed],
  [indexNowPath, indexNowOutput],
]);

let stale = false;
for (const [path, contents] of outputs) {
  let current = "";
  try { current = await readFile(path, "utf8"); } catch { stale = true; }
  if (current === contents) continue;
  stale = true;
  if (!checkOnly) await writeFile(path, contents);
}

if (checkOnly && stale) {
  throw new Error("Discovery artifacts are stale. Run: npm run discovery:refresh");
}

console.log(`${checkOnly ? "Verified" : "Refreshed"} discovery artifacts for ${canonicalUrls.length} canonical and ${githubPagesUrls.length} GitHub Pages URLs.`);

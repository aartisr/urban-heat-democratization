import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(await readFile(resolve(root, "seo/site.config.json"), "utf8"));
const out = resolve(root, "site");
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const main = config.mainSiteUrl.replace(/\/$/, "") + "/";
const pages = config.githubPagesUrl.replace(/\/$/, "") + "/";
const schema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `${config.projectName} Field Guide`,
  description: config.description,
  url: pages,
  about: ["Urban heat", "Heat equity", "Climate resilience"],
  author: { "@type": "Person", name: config.authorName },
  isPartOf: { "@type": "WebSite", name: config.projectName, url: main },
});

await mkdir(out, { recursive: true });
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(resolve(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${pages}sitemap.xml\n`);
await writeFile(resolve(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${pages}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url></urlset>\n`);
await writeFile(resolve(out, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(config.projectName)} Field Guide | Open urban heat evidence</title>
<meta name="description" content="${esc(config.description)} Learn the questions, methods, and resources behind equitable heat action.">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${pages}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(config.projectName)} Field Guide"><meta property="og:description" content="Open resources for understanding urban heat and equitable cooling action."><meta property="og:url" content="${pages}">
<script type="application/ld+json">${schema.replaceAll("<", "\\u003c")}</script>
<style>body{margin:0;background:#f6f8f7;color:#142327;font:17px/1.65 system-ui,sans-serif}main{max-width:850px;margin:auto;padding:5rem 1.5rem}h1{font-size:clamp(2.4rem,7vw,4.8rem);line-height:1.03;margin:.3rem 0 1rem}h2{margin-top:2.6rem;line-height:1.2}a{color:#075e73;font-weight:650}.tag{color:#075e73;font-weight:750;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}.cta{display:inline-block;background:#075e73;color:#fff!important;padding:.8rem 1.1rem;border-radius:.5rem;text-decoration:none;margin:.4rem .5rem .4rem 0}.card{background:#fff;padding:1.4rem 1.6rem;border-radius:.8rem;margin:1rem 0;border:1px solid #dbe5e2}footer{margin-top:3rem;border-top:1px solid #dbe5e2;padding-top:1.5rem;font-size:.92rem}</style></head>
<body><main><p class="tag">Open climate knowledge</p><h1>Heat evidence belongs in public.</h1><p>${esc(config.description)} This field guide gives residents, educators, planners, and researchers a clear starting point—while keeping the limits of the evidence visible.</p><p><a class="cta" href="${main}">Explore the main platform</a><a class="cta" href="${config.repositoryUrl}">Read the open repository</a></p>
<h2>Start with useful questions</h2><div class="card"><strong>Where is heat concentrated?</strong><br>Heat is shaped by surface materials, shade, vegetation, buildings, and the surrounding urban form. A map is an invitation to investigate, not a final verdict.</div><div class="card"><strong>Who can reach relief?</strong><br>Cooling access, public space, housing, transit, and historical investment shape whether a hot day becomes a health emergency.</div><div class="card"><strong>What action is plausible?</strong><br>Compare shade, cooling, and other mitigation options transparently, with costs and assumptions made clear before commitments are made.</div>
<h2>Use evidence responsibly</h2><p>The platform distinguishes local observations, planning proxies, and exploratory scenarios. It supports public conversation and local validation; it does not replace public-health guidance, engineering assessment, or community knowledge.</p>
<h2>Explore further</h2><ul><li><a href="${main}cities/boston">Boston urban heat study</a></li><li><a href="${main}scenarios">Transparent mitigation scenarios</a></li><li><a href="${config.repositoryUrl}/tree/main/docs/wiki">Urban Heat Democratization Wiki: full field guide</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/01-the-case-for-democratization.md">Why urban heat must be democratized</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/02-platform-and-workflows.md">Platform and workflows</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/03-science-and-interpretation.md">Science and interpretation</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/04-evidence-and-responsible-use.md">Evidence and responsible use</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/05-city-onboarding-and-partnership.md">City onboarding and partnership</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/06-roadmap-governance-and-contribution.md">Roadmap, governance, and contribution</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/07-technical-reference.md">Technical reference</a></li><li><a href="${config.repositoryUrl}/blob/main/docs/wiki/GLOSSARY.md">Urban heat glossary</a></li><li><a href="${config.repositoryUrl}">Source code and reusable city-onboarding materials</a></li></ul>
<footer>Maintained by <a href="${config.contactUrl}">${esc(config.authorName)}</a>. This companion page intentionally links to the primary platform and open documentation; it is not a substitute for either.</footer></main></body></html>`);
console.log(`Generated GitHub Pages companion in ${out}`);

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(await readFile(resolve(root, "seo/site.config.json"), "utf8"));
const registry = JSON.parse(await readFile(resolve(root, "seo/discovery-pages.json"), "utf8"));
const pagesBase = config.githubPagesUrl.replace(/\/$/, "");
const mainBase = config.mainSiteUrl.replace(/\/$/, "");
const expectedPath = (path) => path === "/" ? resolve(root, "site/index.html") : resolve(root, "site", path.replace(/^\//, ""), "index.html");
const pageUrl = (path) => `${pagesBase}${path}`;

for (const page of registry.githubPagesPages) {
  const output = await readFile(expectedPath(page.path), "utf8");
  const url = pageUrl(page.path);
  const required = [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:url" content="${url}">`,
    `href="${mainBase}/"`,
    `href="${config.repositoryUrl}`,
    "CITATION.cff",
  ];
  for (const fragment of required) {
    if (!output.includes(fragment)) throw new Error(`${page.path} is missing discoverability or backlink fragment: ${fragment}`);
  }
}

console.log(`Verified canonical URLs and primary backlinks for ${registry.githubPagesPages.length} GitHub Pages documents.`);

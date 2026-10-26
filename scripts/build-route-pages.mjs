import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "web/dist");
const config = JSON.parse(await readFile(resolve(root, "seo/site.config.json"), "utf8"));
const registry = JSON.parse(await readFile(resolve(root, "seo/discovery-pages.json"), "utf8"));
const template = await readFile(resolve(dist, "index.html"), "utf8");
const base = config.mainSiteUrl.replace(/\/$/, "");
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const schemaJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

function setMeta(html, key, value) {
  const selector = key.startsWith("og:") ? "property" : "name";
  const pattern = new RegExp(`<meta ${selector}="${key}" content="[^"]*" \\/>`);
  const tag = `<meta ${selector}="${key}" content="${escapeHtml(value)}" />`;
  if (!pattern.test(html)) throw new Error(`Missing ${key} metadata in built index.html`);
  return html.replace(pattern, tag);
}

for (const page of registry.canonicalPages.filter((item) => item.path !== "/")) {
  const url = `${base}${page.path}`;
  const title = `${page.title} | ${config.projectName}`;
  const description = `${page.description} By ${config.authorName}.`;
  const author = { "@type": "Person", "@id": `${base}/#author`, name: config.authorName, url: config.contactUrl };
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      author,
      { "@type": "WebSite", "@id": `${base}/#website`, name: config.projectName, url: config.mainSiteUrl, author: { "@id": author["@id"] } },
      { "@type": "WebPage", "@id": `${url}#webpage`, name: title, description, url, inLanguage: "en-US", dateModified: registry.updated, author: { "@id": author["@id"] }, creator: { "@id": author["@id"] }, isPartOf: { "@id": `${base}/#website` }, citation: `${config.repositoryUrl}/blob/main/CITATION.cff` },
    ],
  };
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  for (const [key, value] of Object.entries({
    description,
    "og:title": title,
    "og:description": description,
    "og:url": url,
    "twitter:title": title,
    "twitter:description": description,
  })) html = setMeta(html, key, value);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  html = html.replace(/<script id="page-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="page-schema" type="application/ld+json">${schemaJson(schema)}</script>`);
  const related = registry.canonicalPages.filter((item) => item.path !== page.path).slice(0, 4);
  const fallback = `<main><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p><p>Created by <a href="${escapeHtml(config.contactUrl)}">${escapeHtml(config.authorName)}</a>. Explore the interactive page with JavaScript enabled.</p><p>Source and citation: <a href="${escapeHtml(config.repositoryUrl)}/blob/main/CITATION.cff">CITATION.cff</a>. Review methods and evidence limits before citing a finding.</p><nav aria-label="Related pages"><ul>${related.map((item) => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.title)}</a></li>`).join("")}</ul></nav></main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, "");
  const destination = resolve(dist, page.path.slice(1), "index.html");
  await mkdir(resolve(destination, ".."), { recursive: true });
  await writeFile(destination, html);
}

console.log(`Built ${registry.canonicalPages.length - 1} route-specific HTML entry points.`);

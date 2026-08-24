type SeoPage = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

const siteUrl = (import.meta.env.VITE_SITE_URL || "https://urban-heat.ai-aarti.com").replace(/\/$/, "");
const brand = "Urban Heat Democratization";

function upsertMeta(selector: string, attribute: "name" | "property", value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function setPageSeo({ title, description, path = "/", keywords = [] }: SeoPage) {
  const url = new URL(path, `${siteUrl}/`).toString();
  document.title = title;
  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertMeta('meta[property="og:title"]', "property", "og:title", title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", url);
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  if (keywords.length) upsertMeta('meta[name="keywords"]', "name", "keywords", keywords.join(", "));

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

export const defaultSeo = {
  title: `${brand} | Open urban heat planning`,
  description: "An open, public-interest platform for understanding urban heat, cooling access, and transparent mitigation scenarios.",
  keywords: ["urban heat", "heat equity", "climate resilience", "cooling access", "heat mitigation"],
};

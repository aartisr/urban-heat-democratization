import { access, copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative, dirname, extname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "docs/wiki");
const output = process.argv[2] && resolve(process.argv[2]);
if (!output) throw new Error("Usage: node scripts/render-github-wiki.mjs <wiki-checkout-directory>");
const repo = "https://github.com/aartisr/urban-heat-democratization";
const wiki = `${repo}/wiki`;
const author = "Aarti S Ravikumar";
const pages = [
  ["Home", "Home"],
  ["01-the-case-for-democratization", "The case for democratization"],
  ["02-platform-and-workflows", "Platform and workflows"],
  ["03-science-and-interpretation", "Science and interpretation"],
  ["04-evidence-and-responsible-use", "Evidence and responsible use"],
  ["05-city-onboarding-and-partnership", "City onboarding and partnership"],
  ["06-roadmap-governance-and-contribution", "Roadmap and governance"],
  ["07-technical-reference", "Technical reference"],
  ["08-graph-theory-worked-example", "Graph theory worked example"],
  ["09-spectral-theory-contract", "Spectral theory contract"],
  ["10-repeatability-and-real-world-validation", "Repeatability and validation"],
  ["11-community-and-mentor-invitation", "Community and mentors"],
  ["12-civic-starter-guide", "Civic starter guide"],
  ["GLOSSARY", "Glossary"],
];

async function validateLinks(markdown, sourceFile) {
  for (const [, destination] of markdown.matchAll(/\]\(([^\s)]+)\)/g)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(destination)) continue;
    const target = resolve(dirname(sourceFile), decodeURIComponent(destination.split("#", 1)[0]));
    await access(target).catch(() => { throw new Error(`Missing wiki source link in ${relative(root, sourceFile)}: ${destination}`); });
  }
}

function rewriteLinks(markdown, sourceFile) {
  return markdown.replace(/(\]\()([^\s)]+)(\))/g, (whole, open, destination, close, offset) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(destination)) return whole;
    const [path, fragment = ""] = destination.split("#", 2);
    const target = resolve(dirname(sourceFile), decodeURIComponent(path));
    const inRepo = relative(root, target);
    if (inRepo.startsWith("..") || inRepo.startsWith("/")) throw new Error(`Link escapes repository: ${destination}`);
    const inWiki = relative(source, target);
    const suffix = fragment ? `#${fragment}` : "";
    if (inWiki === "README.md") return `${open}${wiki}/Home${suffix}${close}`;
    if (!inWiki.startsWith("..") && extname(inWiki) === ".md") {
      return `${open}${wiki}/${encodeURIComponent(inWiki.slice(0, -3))}${suffix}${close}`;
    }
    if (markdown[offset - 1] === "!") {
      return `${open}https://raw.githubusercontent.com/aartisr/urban-heat-democratization/main/${inRepo.split("/").map(encodeURIComponent).join("/")}${suffix}${close}`;
    }
    const view = path.endsWith("/") ? "tree" : "blob";
    return `${open}${repo}/${view}/main/${inRepo.split("/").map(encodeURIComponent).join("/")}${suffix}${close}`;
  });
}

await mkdir(output, { recursive: true });
for (const [slug] of pages) {
  const filename = slug === "Home" ? "README.md" : `${slug}.md`;
  const path = resolve(source, filename);
  const content = await readFile(path, "utf8");
  await validateLinks(content, path);
  await writeFile(resolve(output, `${slug}.md`), rewriteLinks(content, path));
}
await writeFile(resolve(output, "_Sidebar.md"), `## [Urban Heat Democratization](https://urban-heat.ai-aarti.com/)\n\n${pages.map(([slug, label]) => `- [${label}](${wiki}/${slug})`).join("\n")}\n\n---\n\n[Live platform](https://urban-heat.ai-aarti.com/) · [GitHub Pages field guide](https://aartisr.github.io/urban-heat-democratization/) · [Source and citation](${repo})\n`);
await writeFile(resolve(output, "_Footer.md"), `Authored by [${author}](https://ai-aarti.com/) · [Evidence and responsible use](${wiki}/04-evidence-and-responsible-use) · [Cite the project](${repo}/blob/main/CITATION.cff)\n`);
await mkdir(resolve(output, "assets"), { recursive: true });
for (const file of await readdir(resolve(source, "assets"))) {
  await copyFile(resolve(source, "assets", file), resolve(output, "assets", file));
}
console.log(`Rendered ${pages.length} wiki pages to ${output}`);

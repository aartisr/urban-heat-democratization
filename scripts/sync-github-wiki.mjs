import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const docsWikiDir = resolve(root, "docs/wiki");
const tmpWikiDir = "/tmp/wiki";
const mainSiteUrl = "https://urban-heat.ai-aarti.com/";

const headerCallout = `> 🌐 **Interactive Live Application:** Explore the live heat atlas, transparent mitigation scenarios, and GIS tools on the official platform: [urban-heat.ai-aarti.com](${mainSiteUrl}) | [Boston Study](${mainSiteUrl}cities/boston) | [Scenario Lab](${mainSiteUrl}scenarios) | [Solution Suite](${mainSiteUrl}solution-suite) | [Mitigation Lab](${mainSiteUrl}mitigation-lab)

`;

const footerCrosslinks = `

---

### Connect with the Living Platform

- 🗺️ **[Boston Urban Heat Atlas](${mainSiteUrl}cities/boston)** — Inspect satellite thermal layers, Cheeger cuts, and cooling equity overlays.
- 🧪 **[Mitigation Scenarios](${mainSiteUrl}scenarios)** — Model urban tree canopy, cool roofs, and pavements with cost constraints.
- 🛠️ **[Solution Suite & GIS Tools](${mainSiteUrl}solution-suite)** — Interactive Overpass OSM query builder, microclimate sensor validation, and federal grant generator.
- 🔬 **[Interactive Mitigation Lab](${mainSiteUrl}mitigation-lab)** — Real-time temperature response and cost-benefit trade-off exploration.
- 📈 **[Robustness & Science Lab](${mainSiteUrl}robustness)** — Inspect spectral graph conductance, Fiedler vectors, and percolation dynamics.
- 🤝 **[Collaborate on Heat Action](${mainSiteUrl}contact)** — Join research mentors, civic leaders, and community partners.
`;

const sidebarContent = `## [Urban Heat Democratization](${mainSiteUrl})
> *A public-interest workspace for local heat, cooling access, and climate action.*

### 🌐 Live Platform
- 🌍 **[Launch Main App](${mainSiteUrl})**
- 🗺️ **[Boston Study](${mainSiteUrl}cities/boston)**
- 🧪 **[Mitigation Scenarios](${mainSiteUrl}scenarios)**
- 🛠️ **[Solution Suite & GIS Tools](${mainSiteUrl}solution-suite)**
- 🔬 **[Mitigation Lab](${mainSiteUrl}mitigation-lab)**
- 📈 **[Robustness Lab](${mainSiteUrl}robustness)**
- 🤝 **[Contact & Collaborate](${mainSiteUrl}contact)**

---

### 📚 Field Guide & Wiki
- [Home](Home)
- [01 The Case for Democratization](01-the-case-for-democratization)
- [02 Platform & Workflows](02-platform-and-workflows)
- [03 Science & Interpretation](03-science-and-interpretation)
- [04 Evidence & Responsible Use](04-evidence-and-responsible-use)
- [05 City Onboarding](05-city-onboarding-and-partnership)
- [06 Roadmap & Governance](06-roadmap-governance-and-contribution)
- [07 Technical Reference](07-technical-reference)
- [08 Graph Theory Worked Example](08-graph-theory-worked-example)
- [09 Spectral Theory Contract](09-spectral-theory-contract)
- [10 Repeatability & Validation](10-repeatability-and-real-world-validation)
- [11 Community & Mentors](11-community-and-mentor-invitation)
- [12 Civic Starter Guide](12-civic-starter-guide)
- [Glossary](GLOSSARY)

---

### 🔗 Resources
- [GitHub Repository](https://github.com/aartisr/urban-heat-democratization)
- [GitHub Pages Companion](https://aartisr.github.io/urban-heat-democratization/)
- [Author: Aarti S Ravikumar](https://ai-aarti.com)
`;

const footerWikiContent = `---
<div align="center">
  <strong><a href="${mainSiteUrl}">Urban Heat Democratization</a></strong> · Canonical Platform: <a href="${mainSiteUrl}">urban-heat.ai-aarti.com</a> · Authored by <a href="https://ai-aarti.com">Aarti S Ravikumar</a>
</div>
`;

async function updateDocsWiki() {
  const entries = await readdir(docsWikiDir);
  for (const file of entries) {
    if (!file.endsWith(".md")) continue;
    const filePath = resolve(docsWikiDir, file);
    let content = await readFile(filePath, "utf8");

    // Check if header callout needs to be added
    if (!content.includes("Interactive Live Application")) {
      const firstH1End = content.indexOf("\n", content.indexOf("# "));
      if (firstH1End !== -1) {
        content = content.slice(0, firstH1End + 1) + "\n" + headerCallout + content.slice(firstH1End + 1);
      } else {
        content = headerCallout + content;
      }
    }

    // Check if footer crosslinks need to be added
    if (!content.includes("Connect with the Living Platform")) {
      content = content.trimEnd() + footerCrosslinks;
    }

    await writeFile(filePath, content, "utf8");
  }
  console.log(`Updated docs/wiki markdown files with cross-links.`);
}

async function syncTmpWiki() {
  try {
    const s = await stat(tmpWikiDir);
    if (!s.isDirectory()) return;
  } catch {
    console.log("No /tmp/wiki found. Skipping clone sync.");
    return;
  }

  // Copy updated docs/wiki files to /tmp/wiki
  const entries = await readdir(docsWikiDir);
  for (const file of entries) {
    const srcPath = resolve(docsWikiDir, file);
    const destPath = resolve(tmpWikiDir, file);
    const fileStat = await stat(srcPath);
    if (fileStat.isDirectory()) {
      await cp(srcPath, destPath, { recursive: true });
    } else if (file.endsWith(".md")) {
      let content = await readFile(srcPath, "utf8");
      await writeFile(destPath, content, "utf8");
    }
  }

  // Home.md in GitHub wiki mirrors README.md
  const readmeContent = await readFile(resolve(docsWikiDir, "README.md"), "utf8");
  await writeFile(resolve(tmpWikiDir, "Home.md"), readmeContent, "utf8");

  // Create _Sidebar.md and _Footer.md
  await writeFile(resolve(tmpWikiDir, "_Sidebar.md"), sidebarContent, "utf8");
  await writeFile(resolve(tmpWikiDir, "_Footer.md"), footerWikiContent, "utf8");

  // Git add and commit in /tmp/wiki
  try {
    execSync("git -C /tmp/wiki add .");
    const status = execSync("git -C /tmp/wiki status --porcelain").toString();
    if (status.trim()) {
      execSync('git -C /tmp/wiki -c user.name="Aarti S Ravikumar" -c user.email="aarti@ai-aarti.com" commit -m "feat(wiki): sync wiki docs with cross-links to canonical platform and navigation sidebar"');
      console.log("Successfully committed wiki changes to /tmp/wiki git repository.");
    } else {
      console.log("No changes to commit in /tmp/wiki.");
    }
  } catch (err) {
    console.warn("Git commit in /tmp/wiki warning:", err.message);
  }
}

await updateDocsWiki();
await syncTmpWiki();

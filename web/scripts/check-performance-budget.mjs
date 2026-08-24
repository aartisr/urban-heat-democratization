import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const assetsDirectory = new URL("../dist/assets/", import.meta.url);
const budgets = [
  { label: "application shell", pattern: /^index-.*\.js$/, maxBytes: 90 * 1024 },
  { label: "application CSS", pattern: /^index-.*\.css$/, maxBytes: 220 * 1024 },
  { label: "scenario route", pattern: /^scenarios-.*\.js$/, maxBytes: 430 * 1024 },
  { label: "hero image", pattern: /^urban-heat-hero-civic-atlas-.*\.jpg$/, maxBytes: 650 * 1024 },
  { label: "route images", pattern: /^route-.*\.jpg$/, maxBytes: 260 * 1024, expectedCount: 4 },
  // MapLibre is lazy-loaded only after a user opens the atlas.
  { label: "lazy map runtime", pattern: /^maplibre-core-.*\.js$/, maxBytes: 1_150 * 1024 },
];

const fileNames = await readdir(assetsDirectory);
const failures = [];

for (const budget of budgets) {
  const matchingFiles = fileNames.filter((candidate) => budget.pattern.test(candidate));
  if (!matchingFiles.length) {
    failures.push(`${budget.label}: no matching built asset`);
    continue;
  }
  if (budget.expectedCount != null && matchingFiles.length !== budget.expectedCount) {
    failures.push(`${budget.label}: expected ${budget.expectedCount} assets but found ${matchingFiles.length}`);
  }
  const sizes = await Promise.all(matchingFiles.map(async (fileName) => ({ fileName, size: (await stat(join(assetsDirectory.pathname, fileName))).size })));
  const oversized = sizes.filter((item) => item.size > budget.maxBytes);
  const sizeKiB = (sizes.reduce((sum, item) => sum + item.size, 0) / 1024).toFixed(1);
  const limitKiB = (budget.maxBytes / 1024).toFixed(0);
  if (oversized.length) {
    failures.push(`${budget.label}: ${oversized.map((item) => `${(item.size / 1024).toFixed(1)} KiB exceeds ${limitKiB} KiB (${item.fileName})`).join(", ")}`);
  } else {
    console.log(`✓ ${budget.label}: ${sizeKiB} KiB total; each ≤ ${limitKiB} KiB`);
  }
}

if (failures.length) {
  console.error("Performance budget failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

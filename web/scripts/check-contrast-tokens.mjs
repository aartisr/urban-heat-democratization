import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const stylesheet = await readFile(resolve(import.meta.dirname, "../src/styles.css"), "utf8");
const tokens = new Map([...stylesheet.matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(([, name, value]) => [name, value]));

function rgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  return rgb(hex).map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const checks = [
  ["--color-text-primary", "#ffffff", 7],
  ["--color-text-secondary", "#ffffff", 4.5],
  ["--color-text-tertiary", "#ffffff", 4.5],
  ["--color-link", "#ffffff", 4.5],
  ["--color-accent", "#ffffff", 4.5],
  ["--color-on-dark", "#062c3a", 7],
  ["--color-on-dark-muted", "#062c3a", 4.5],
  ["--color-status-observed", "#eaf7ee", 4.5],
  ["--color-status-derived", "#eaf4fb", 4.5],
  ["--color-status-estimated", "#fff6df", 4.5],
  ["--color-status-illustrative", "#f2f4f7", 4.5],
];

// Non-tokenized colours are reserved for a few intentional science accents.
// Keep them under test because they carry equations and primary disclosure
// controls on dark visual surfaces.
const literalChecks = [
  ["science formula ink", "#fff4be", "#071f33", 7],
  ["science disclosure label", "#fffbe6", "#082b3c", 7],
];

const failures = [];
for (const [token, background, minimum] of checks) {
  const foreground = tokens.get(token);
  if (!foreground) {
    failures.push(`${token} is missing`);
    continue;
  }
  const ratio = contrast(foreground, background);
  if (ratio < minimum) failures.push(`${token} on ${background}: ${ratio.toFixed(2)}:1 (needs ${minimum}:1)`);
  else console.log(`✓ ${token} on ${background}: ${ratio.toFixed(2)}:1`);
}

for (const [name, foreground, background, minimum] of literalChecks) {
  const ratio = contrast(foreground, background);
  if (ratio < minimum) failures.push(`${name} on ${background}: ${ratio.toFixed(2)}:1 (needs ${minimum}:1)`);
  else console.log(`✓ ${name} on ${background}: ${ratio.toFixed(2)}:1`);
}

if (failures.length) {
  console.error(`Contrast token check failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

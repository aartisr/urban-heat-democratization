import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "docs");
const destination = resolve(root, "web/public/journal");
const base = "DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL";
const check = process.argv.includes("--check");
let mismatch = false;

if (!check) await mkdir(destination, { recursive: true });
for (const extension of ["pdf", "docx", "md"]) {
  const from = await readFile(resolve(source, `${base}.${extension}`));
  const target = resolve(destination, `urban-heat-democratization.${extension}`);
  if (extension === "pdf") {
    // The repository PDF is emitted by ReportLab with plain page objects.
    // Count those objects so the public edition stays within its page budget.
    const pages = (from.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
    if (pages < 1 || pages > 10) {
      console.error(`Journal PDF must be 1–10 pages; found ${pages}.`);
      mismatch = true;
    } else {
      console.log(`Journal PDF: ${pages} pages (10-page maximum).`);
    }
  }
  if (check) {
    const current = await readFile(target).catch(() => null);
    if (!current?.equals(from)) {
      console.error(`Journal ${extension.toUpperCase()} download is missing or stale.`);
      mismatch = true;
    }
  } else {
    await writeFile(target, from);
  }
}
if (mismatch) process.exitCode = 1;
else console.log(check ? "Journal downloads match canonical manuscripts." : "Journal downloads synchronized.");

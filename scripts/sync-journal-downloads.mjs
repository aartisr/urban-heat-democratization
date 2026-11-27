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

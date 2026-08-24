import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const lockfilePath = fileURLToPath(new URL("../package-lock.json", import.meta.url));
const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
const publicRegistry = "https://registry.npmjs.org/";

const invalidEntries = Object.entries(lockfile.packages ?? {}).flatMap(([name, pkg]) => {
  if (!pkg?.resolved || pkg.resolved.startsWith(publicRegistry)) return [];
  return [`${name || "root"}: ${pkg.resolved}`];
});

if (invalidEntries.length > 0) {
  console.error("package-lock.json contains a non-public package source:");
  console.error(invalidEntries.join("\n"));
  process.exit(1);
}

console.log(`Lockfile registry check passed (${Object.keys(lockfile.packages ?? {}).length} packages).`);

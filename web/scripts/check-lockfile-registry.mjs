import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const publicRegistry = "https://registry.npmjs.org/";
const projectFiles = [
  fileURLToPath(new URL("../../package.json", import.meta.url)),
  fileURLToPath(new URL("../../package-lock.json", import.meta.url)),
  fileURLToPath(new URL("../package.json", import.meta.url)),
  fileURLToPath(new URL("../package-lock.json", import.meta.url)),
];

const privateSourcePattern = /(?:git\+|git@|ssh:|github\.com\/[^/]+\/[^/]+(?:\.git)?(?:#|$)|gitlab\.com\/|bitbucket\.org\/|file:|link:|workspace:)/i;

for (const filePath of projectFiles) {
  const file = JSON.parse(await readFile(filePath, "utf8"));
  const dependencies = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]
    .flatMap((field) => Object.entries(file[field] ?? {}));
  const privateDependencies = dependencies
    .filter(([, spec]) => typeof spec === "string" && privateSourcePattern.test(spec));

  if (privateDependencies.length > 0) {
    console.error(`${filePath} contains a non-public dependency source:`);
    console.error(privateDependencies.map(([name, spec]) => `${name}: ${spec}`).join("\n"));
    process.exit(1);
  }
}

const lockfilePaths = projectFiles.filter((filePath) => filePath.endsWith("package-lock.json"));
let packageCount = 0;

for (const lockfilePath of lockfilePaths) {
  const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
  const packages = lockfile.packages ?? {};
  packageCount += Object.keys(packages).length;

  const invalidEntries = Object.entries(packages).flatMap(([name, pkg]) => {
    if (!pkg?.resolved || pkg.resolved.startsWith(publicRegistry)) return [];
    return [`${name || "root"}: ${pkg.resolved}`];
  });

  if (invalidEntries.length > 0) {
    console.error(`${lockfilePath} contains a non-public package source:`);
    console.error(invalidEntries.join("\n"));
    process.exit(1);
  }

  const missingOptionalEntries = Object.entries(packages).flatMap(([name, pkg]) =>
    Object.keys(pkg?.optionalDependencies ?? {}).flatMap((dependency) =>
      packages[`node_modules/${dependency}`]
        ? []
        : [`${name || "root"} -> ${dependency}`]
    )
  );

  if (missingOptionalEntries.length > 0) {
    console.error(`${lockfilePath} is missing optional cross-platform packages:`);
    console.error(missingOptionalEntries.join("\n"));
    process.exit(1);
  }
}

console.log(`Public-registry dependency and lockfile checks passed (${packageCount} packages).`);

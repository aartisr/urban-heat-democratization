import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const configPath = resolve(root, "indexnow/indexnow.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const submit = process.argv.includes("--submit");

if (!/^[A-Za-z0-9-]{8,128}$/.test(config.key)) {
  throw new Error("IndexNow key must contain 8–128 letters, digits, or dashes.");
}

for (const batch of config.hosts) {
  if (!batch.host || !batch.keyLocation || !Array.isArray(batch.urlList) || !batch.urlList.length) {
    throw new Error("Each IndexNow host requires host, keyLocation, and a non-empty urlList.");
  }
  if (batch.urlList.length > 10_000) throw new Error(`${batch.host} exceeds the 10,000-URL IndexNow batch limit.`);

  for (const value of [...batch.urlList, batch.keyLocation]) {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.host !== batch.host) {
      throw new Error(`Every URL and keyLocation for ${batch.host} must use its exact HTTPS host: ${value}`);
    }
  }

  const payload = { host: batch.host, key: config.key, keyLocation: batch.keyLocation, urlList: batch.urlList };
  if (!submit) {
    console.log(`[dry run] ${batch.host}: ${batch.urlList.length} URLs`);
    console.log(JSON.stringify(payload, null, 2));
    continue;
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.text();
  console.log(`${batch.host}: ${response.status} ${response.statusText}${responseBody ? ` — ${responseBody}` : ""}`);
  if (!response.ok) process.exitCode = 1;
}

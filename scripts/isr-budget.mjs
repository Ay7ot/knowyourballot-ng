#!/usr/bin/env node
// Reports the ISR write units a full build would write. A unit is 8 KB of
// changed output (HTML plus the RSC payload). Run after `npm run build`.
//
//   npm run isr:budget
//   npm run isr:budget -- --max 100000
//
// Keep the number in the PR description so a route change that doubles the
// build's cache writes is visible before it ships.

import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const app = join(process.cwd(), ".next", "server", "app");
const UNIT = 8 * 1024;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith(".html") || entry.name.endsWith(".rsc")) out.push(path);
  }
  return out;
}

const files = await walk(app).catch(() => []);
if (files.length === 0) {
  console.error("No build output at .next/server/app. Run `npm run build` first.");
  process.exit(1);
}

const buckets = new Map();
for (const file of files) {
  const rel = relative(app, file);
  const parts = rel.split(/[\\/]/);
  const bucket = parts[0] === "state" && parts.length > 2 ? "lga" : parts[0];
  const row = buckets.get(bucket) ?? { pages: 0, bytes: 0 };
  row.bytes += (await stat(file)).size;
  if (file.endsWith(".html")) row.pages += 1;
  buckets.set(bucket, row);
}

let total = 0;
let pages = 0;
const rows = [...buckets.entries()]
  .map(([name, row]) => {
    const units = row.bytes / UNIT;
    total += units;
    pages += row.pages;
    return { name, pages: row.pages, units };
  })
  .sort((a, b) => b.units - a.units);

console.log("ISR write budget (8 KB units, HTML + RSC)");
for (const row of rows) {
  console.log(
    `${row.name.padEnd(14)} ${String(row.pages).padStart(6)} pages ${Math.round(row.units).toLocaleString().padStart(12)} units`,
  );
}
console.log(
  `${"total".padEnd(14)} ${String(pages).padStart(6)} pages ${Math.round(total).toLocaleString().padStart(12)} units`,
);

const maxIndex = process.argv.indexOf("--max");
const max = maxIndex === -1 ? null : Number(process.argv[maxIndex + 1]);
if (max !== null && Number.isFinite(max) && total > max) {
  console.error(`ISR budget exceeded: ${Math.round(total).toLocaleString()} > ${max.toLocaleString()} units`);
  process.exit(1);
}

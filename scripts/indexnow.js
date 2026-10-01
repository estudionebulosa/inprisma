#!/usr/bin/env node
/**
 * P2 — post-publish indexing (PRD §04).
 *
 * After a deploy, notify search engines of new or updated canonical pages:
 *   1. IndexNow submit — pushes a URL list to the IndexNow API.
 *   2. Sitemap ping — pings Google and Bing with the sitemap URL.
 *
 * Dry-run by default; pass --submit to actually send requests. The site origin
 * comes from _data/admin.json; the IndexNow key from --key or $INDEXNOW_KEY.
 *
 * Usage:
 *   node scripts/indexnow.js                       # dry run
 *   node scripts/indexnow.js --submit --key=abc    # submit
 *   node scripts/indexnow.js --sitemap=https://example.com/sitemap.xml
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SITE_DIR = join(ROOT, "_site");
const admin = JSON.parse(readFileSync(join(ROOT, "_data/admin.json"), "utf8"));

const args = process.argv.slice(2);
const flagValue = (name) => {
  for (const a of args) {
    if (a === `--${name}`) return "";
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return undefined;
};
const SUBMIT = args.includes("--submit");
const KEY = flagValue("key") || process.env.INDEXNOW_KEY || "";
const SITEMAP =
  flagValue("sitemap") || `${String(admin.site.website).replace(/\/+$/, "")}/sitemap.xml`;

const origin = String(admin.site.website || "").replace(/\/+$/, "");
const host = origin.replace(/^[a-z]+:\/\//i, "");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const urls = walk(SITE_DIR)
  .filter(
    (p) =>
      !p.includes("/syndication/") &&
      !p.includes("/admin/") &&
      !p.endsWith("prd_news_site_optimization.html"),
  )
  .map((p) => {
    const rel = relative(SITE_DIR, p).replace(/\\/g, "/");
    if (rel === "index.html") return `${origin}/`;
    return `${origin}/${rel.replace(/index\.html$/, "")}`;
  })
  .sort();

console.log(`indexnow: ${urls.length} canonical URL(s), host ${host}`);
if (!SUBMIT) {
  console.log("dry run — pass --submit to send. URLs:");
  for (const u of urls) console.log(`  ${u}`);
  console.log(`  (sitemap ping: ${SITEMAP})`);
  process.exit(0);
}

if (!KEY) {
  console.error("error: --key or $INDEXNOW_KEY is required to submit.");
  process.exit(1);
}

// 1. IndexNow
const indexNowBody = {
  host,
  key: KEY,
  keyLocation: `${origin}/${KEY}.txt`,
  urlList: urls,
};
try {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowBody),
  });
  console.log(`indexnow submit: ${res.status} ${res.statusText}`);
} catch (err) {
  console.error(`indexnow submit failed: ${err.message}`);
}

// 2. Sitemap ping (best-effort)
for (const endpoint of [
  `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`,
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`,
]) {
  try {
    const res = await fetch(endpoint, { method: "GET" });
    console.log(`sitemap ping: ${res.status} ${new URL(endpoint).host}`);
  } catch (err) {
    console.error(`sitemap ping failed (${endpoint}): ${err.message}`);
  }
}

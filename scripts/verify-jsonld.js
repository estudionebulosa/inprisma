#!/usr/bin/env node
/**
 * CI gate 3 — verify the generated JSON-LD on every canonical page.
 *
 * For each built HTML file under _site/ (excluding syndication, which is a
 * content-only copy), extract every <script type="application/ld+json"> block,
 * parse it, and assert that the expected schema.org node types are present and
 * carry their required fields.
 *
 * Requires the build to have run first (`npm run build`).
 * Usage: node scripts/verify-jsonld.js
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SITE_DIR = join(ROOT, "_site");

if (!existsSync(SITE_DIR)) {
  console.error("error: _site/ not found. Run `npm run build` first.");
  process.exit(1);
}

// Required nodes and the properties we insist on for each. Article pages get
// the full graph; the home page only carries site-level nodes.
const ARTICLE_NODES = {
  Organization: ["name", "url"],
  WebSite: ["url", "name"],
  Person: ["name"],
  NewsArticle: ["headline", "datePublished", "dateModified", "author", "publisher"],
  BreadcrumbList: ["itemListElement"],
};

const SITE_NODES = {
  Organization: ["name", "url"],
  WebSite: ["url", "name"],
};

// The home page lives at the site root; everything else is an article page.
function requiredFor(rel) {
  return rel.endsWith("index.html") && !rel.includes("/guias/") && !rel.includes("/syndication/")
    ? SITE_NODES
    : ARTICLE_NODES;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

function extractBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(m[1].trim());
  return blocks;
}

const pages = walk(SITE_DIR).filter(
  (p) =>
    // Canonical content pages only: skip syndication copies, the CMS admin
    // shell, and static passthrough files (e.g. the PRD HTML) that never carry
    // JSON-LD.
    !p.includes("/syndication/") &&
    !p.includes("/admin/") &&
    !p.endsWith("prd_news_site_optimization.html"),
);
const problems = [];

for (const page of pages) {
  const rel = relative(ROOT, page);
  const blocks = extractBlocks(readFileSync(page, "utf8"));

  if (blocks.length === 0) {
    problems.push(`${rel}: no JSON-LD block found`);
    continue;
  }

  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (err) {
      problems.push(`${rel}: JSON-LD does not parse (${err.message})`);
      continue;
    }

    const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
    const byType = new Map();
    for (const node of graph) {
      const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
      for (const t of types) byType.set(t, node);
    }

    for (const [type, props] of Object.entries(requiredFor(rel))) {
      const node = byType.get(type);
      if (!node) {
        problems.push(`${rel}: missing JSON-LD node @type=${type}`);
        continue;
      }
      for (const prop of props) {
        if (node[prop] === undefined || node[prop] === "" ) {
          problems.push(`${rel}: ${type} missing required property "${prop}"`);
        }
      }
    }
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL ${p}`);
  console.error(`\njsonld: ${problems.length} problem(s) across ${pages.length} page(s)`);
  process.exit(1);
}

console.log(`jsonld: ok — ${pages.length} canonical page(s) validated`);

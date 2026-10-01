#!/usr/bin/env node
/**
 * CI gate 4 (part) — critical HTML size.
 *
 * The PRD targets "critical HTML < 10kb". For this static site the render
 * path is the entire document minus the JSON-LD <script type="application/ld+json">
 * blocks, which the browser neither executes nor renders. We measure that:
 *
 *   critical = html.length - sum(jsonld block lengths)
 *
 * Every canonical page (home + articles, excluding syndication and static
 * passthrough files) must stay under CRITICAL_HTML_BYTES.
 *
 * Requires the build to have run first. Usage:
 *   node scripts/check-html-size.js
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SITE_DIR = join(ROOT, "_site");
const CRITICAL_HTML_BYTES = 10 * 1024; // 10kb

if (!existsSync(SITE_DIR)) {
  console.error("error: _site/ not found. Run `npm run build` first.");
  process.exit(1);
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

const JSONLD_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;

const pages = walk(SITE_DIR).filter(
  (p) =>
    !p.includes("/syndication/") &&
    !p.includes("/admin/") &&
    !p.endsWith("prd_news_site_optimization.html"),
);

const problems = [];
let worst = 0;

for (const page of pages) {
  const rel = relative(ROOT, page);
  const html = readFileSync(page, "utf8");
  const jsonldBytes = [...html.matchAll(JSONLD_RE)].reduce(
    (sum, m) => sum + m[0].length,
    0,
  );
  const critical = html.length - jsonldBytes;
  worst = Math.max(worst, critical);

  if (critical > CRITICAL_HTML_BYTES) {
    problems.push(
      `${rel}: critical HTML ${critical} bytes (limit ${CRITICAL_HTML_BYTES})`,
    );
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL ${p}`);
  console.error(
    `\nhtml-size: ${problems.length} page(s) over ${CRITICAL_HTML_BYTES} bytes`,
  );
  process.exit(1);
}

console.log(
  `html-size: ok — ${pages.length} page(s), worst ${worst}/${CRITICAL_HTML_BYTES} bytes`,
);

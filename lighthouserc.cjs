/**
 * Lighthouse CI configuration (gate 4 — performance, gate 5 — accessibility).
 *
 * Collects every canonical page (home + articles), serving _site/ over HTTP via
 * scripts/serve-site.js. Lighthouse's accessibility category is computed by
 * axe-core, so it doubles as the WCAG 2.1/2.2 AA gate.
 *
 * Loaded by `lhci autorun --config lighthouserc.cjs`.
 */

const { readdirSync, statSync } = require("node:fs");
const { join, relative } = require("node:path");

const ROOT = __dirname;
const SITE_DIR = join(ROOT, "_site");
const PORT = process.env.PORT || 4173;
const BASE = `http://localhost:${PORT}`;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

// Canonical pages only: skip syndication copies and static passthrough files.
const urls = walk(SITE_DIR)
  .filter(
    (p) =>
      !p.includes(`${join("", "syndication")}`) &&
      !p.endsWith("prd_news_site_optimization.html"),
  )
  .map((p) => {
    const rel = relative(SITE_DIR, p).replace(/\\/g, "/");
    if (rel === "index.html") return `${BASE}/`;
    return `${BASE}/${rel.replace(/index\.html$/, "")}`;
  })
  .sort();

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: "node scripts/serve-site.js",
      startServerReadyPattern: "Listening",
      url: urls,
      settings: {
        // Static, zero-client-JS site: a single mobile emulation is enough.
        onlyCategories: ["performance", "accessibility"],
      },
    },
    assert: {
      assertions: {
        // Gate 4 — performance (PRD §01).
        "categories:performance": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 1200 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.001 }],

        // Gate 5 — accessibility (axe-core, WCAG 2.1/2.2 AA) (PRD §03).
        "categories:accessibility": ["error", { minScore: 1 }],

        // Informational only; not gating today.
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
  },
};

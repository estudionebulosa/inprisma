#!/usr/bin/env node
/**
 * CI gate 6 — link checker.
 *
 * Checks every built HTML page under _site/:
 *
 *   1. Internal links (root-relative or same-origin as site.website) must
 *      resolve to a file that exists in _site/.
 *   2. Anchors (fragment-only links) must point to an id in the same page.
 *   3. All links must be well-formed URLs.
 *
 * External links (different origin, or mailto:/tel:) are only *format*-checked
 * by default. Pass --external to additionally issue HEAD requests and verify
 * they respond. That mode is opt-in because it needs the network and can be
 * flaky in CI.
 *
 * Requires the build to have run first. Usage:
 *   node scripts/link-check.js
 *   node scripts/link-check.js --external
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, posix } from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SITE_DIR = join(ROOT, "_site");
const ADMIN = JSON.parse(readFileSync(join(ROOT, "_data/admin.json"), "utf8"));
const ORIGIN = String(ADMIN.site.website || "").replace(/\/+$/, "");

const checkExternal = process.argv.includes("--external");

if (!existsSync(SITE_DIR)) {
  console.error("error: _site/ not found. Run `npm run build` first.");
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Collect pages and their ids                                         */
/* ------------------------------------------------------------------ */

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

function idsIn(html) {
  const ids = new Set();
  const re = /\bid=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return ids;
}

function linksIn(html) {
  const links = [];
  const re = /<a\b[^>]*\bhref=["']([^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) links.push(m[1]);
  return links;
}

const pages = walk(SITE_DIR).map((path) => ({
  path,
  rel: relative(ROOT, path),
  html: readFileSync(path, "utf8"),
}));
for (const page of pages) page.ids = idsIn(page.html);

/* ------------------------------------------------------------------ */
/* Resolve a link against the output tree                              */
/* ------------------------------------------------------------------ */

// Map a site-absolute path (e.g. /guias/x/) to a file in _site/.
// Accepts /foo/, /foo/index.html, /foo, /foo.html and static files.
function resolveInternal(pathname) {
  const clean = pathname.split("?")[0].split("#")[0];
  const candidates = [];
  if (clean.endsWith("/")) {
    candidates.push(join(SITE_DIR, clean, "index.html"));
  } else {
    candidates.push(join(SITE_DIR, clean));
    candidates.push(join(SITE_DIR, `${clean}.html`));
    candidates.push(join(SITE_DIR, clean, "index.html"));
  }
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}

const problems = [];
const externalLinks = new Map(); // url -> [page rel]

for (const page of pages) {
  const isSyndication = page.rel.includes("/syndication/");
  for (const raw of linksIn(page.html)) {
    const href = raw.trim();

    if (href === "" || href.startsWith("#")) {
      // In-page anchor: must resolve to an id on the same page.
      const frag = href.slice(1);
      if (frag && !page.ids.has(frag)) {
        problems.push(`${page.rel}: broken anchor "${href}"`);
      }
      continue;
    }

    if (/^(mailto:|tel:)/i.test(href)) continue;

    // Absolute external URL?
    const abs = href.match(/^([a-z][a-z0-9+.-]*):\/\/([^/]+)(\/.*)?$/i);
    if (abs) {
      const [, scheme, host, rest] = abs;
      const sameOrigin = `${scheme}://${host}`.replace(/\/+$/, "") === ORIGIN;
      if (sameOrigin) {
        const pathname = rest || "/";
        const resolved = resolveInternal(pathname);
        // Internal links that point to real pages must exist. Syndication
        // copies legitimately link home to pages this repo may not build yet,
        // but canonical pages must never link to a missing target.
        if (!resolved && !isSyndication) {
          problems.push(`${page.rel}: internal link has no target — ${href}`);
        }
      } else {
        externalLinks.set(href, [...(externalLinks.get(href) || []), page.rel]);
      }
      continue;
    }

    // Root-relative internal link.
    if (href.startsWith("/")) {
      const resolved = resolveInternal(href);
      if (!resolved && !isSyndication) {
        problems.push(`${page.rel}: internal link has no target — ${href}`);
      }
      continue;
    }

    // Relative link (rare here): resolve against the page's directory.
    const dir = posix.dirname(page.rel.replace(/\\/g, "/"));
    const relTarget = join(SITE_DIR, dir, href.split("?")[0].split("#")[0]);
    if (!existsSync(relTarget) && !isSyndication) {
      problems.push(`${page.rel}: relative link has no target — ${href}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Optional: verify external links over the network                    */
/* ------------------------------------------------------------------ */

if (checkExternal) {
  const urls = [...externalLinks.keys()];
  console.log(`link-check: probing ${urls.length} external URL(s)…`);
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
        });
        return { url, status: res.status };
      } catch (err) {
        return { url, status: 0, error: err.message };
      }
    }),
  );
  for (const { url, status, error } of results) {
    const ok = status >= 200 && status < 400;
    if (!ok) {
      problems.push(
        `external link failed (${status || error}) — ${url} [${externalLinks.get(url).join(", ")}]`,
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL ${p}`);
  console.error(`\nlink-check: ${problems.length} problem(s) across ${pages.length} page(s)`);
  process.exit(1);
}

console.log(
  `link-check: ok — ${pages.length} page(s), ${externalLinks.size} external link(s)` +
    (checkExternal ? " (probed)" : " (format only)"),
);

#!/usr/bin/env node
/**
 * Zero-dependency static file server for the built site.
 *
 * Serves _site/ so Lighthouse (gate 4) and axe/pa11y (gate 5) can run against a
 * real HTTP origin instead of the filesystem. Used by:
 *   - lighthouserc.js (startServerCommand)
 *   - scripts/check-a11y.js
 *
 * Usage:
 *   node scripts/serve-site.js            # defaults to port 4173
 *   PORT=8080 node scripts/serve-site.js
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SITE_DIR = join(ROOT, "_site");
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const rel = pathname === "/" ? "/index.html" : pathname;
  // Resolve directory URLs to their index.html.
  const withIndex = rel.endsWith("/") ? `${rel}index.html` : rel;
  const candidate = normalize(withIndex).replace(/^([/\\])+/, "");
  const full = join(SITE_DIR, candidate);
  return existsSync(full) ? full : join(SITE_DIR, candidate, "index.html");
}

const server = createServer(async (req, res) => {
  try {
    const file = resolvePath(req.url || "/");
    if (!existsSync(file)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const [info, body] = await Promise.all([stat(file), readFile(file)]);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// Allow graceful shutdown when started as a background process.
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));

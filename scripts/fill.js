#!/usr/bin/env node
/**
 * P2 — automated filler.
 *
 * Reads the field contract and a source draft, then derives as much article
 * front matter as it can with a confidence score. Fields below the confidence
 * threshold are "escalated" — queued for a human to complete in the CMS (P1).
 *
 * The filler is deliberately rule-based today (no API key needed). It fills the
 * mechanical fields — slug, author, revision, dates, excerpt, tags/keywords —
 * and escalates the editorial ones (hero/FAQ/sources/internal links/hooks/CTAs).
 * An LLM provider can later be dropped into deriveField() for the creative
 * fields without changing the contract or the report shape.
 *
 * Usage:
 *   node scripts/fill.js draft.md                # dry run, human report
 *   node scripts/fill.js draft.md --json         # machine-readable report
 *   node scripts/fill.js draft.md --write        # write draft to _drafts/
 *   node scripts/fill.js draft.md --threshold 0.6 --category guias
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load as loadYaml, dump as dumpYaml } from "js-yaml";
import { slugify, countWords, readingTime } from "./lib/content.js";
import { todayISO } from "./lib/content.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

const contract = JSON.parse(
  readFileSync(`${ROOT}_data/placeholders.json`, "utf8"),
);
const admin = JSON.parse(readFileSync(`${ROOT}_data/admin.json`, "utf8"));

/* ------------------------------------------------------------------ */
/* CLI args                                                            */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const positionals = args.filter((a) => !a.startsWith("-"));
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("-") ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

const sourcePath = positionals[0];
if (!sourcePath) {
  console.error(
    "usage: node scripts/fill.js <draft.md> [--threshold 0.7] [--category guias] [--write] [--json]",
  );
  process.exit(1);
}

const THRESHOLD = Number(flag("threshold", "0.7"));
const DEFAULT_CATEGORY = flag("category", "guias");
const AS_JSON = has("json");
const WRITE = has("write");
const DRAFTS_DIR = `${ROOT}_drafts/`;

/* ------------------------------------------------------------------ */
/* Source parsing                                                      */
/* ------------------------------------------------------------------ */

const raw = readFileSync(sourcePath, "utf8");
const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const existing = fmMatch ? loadYaml(fmMatch[1]) || {} : {};
const existingArticle = existing.article || {};
const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, "").trim();

const headingMatch = body.match(/^#\s+(.+)$/m);
const sourceTitle =
  existingArticle.title || (headingMatch ? headingMatch[1].trim() : null);

/* ------------------------------------------------------------------ */
/* Keyword / tag extraction                                            */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set(
  (
    "el la los las un una unos unas de del que y o u e en a por para con sin es son " +
    "se su sus al como mas más pero no si sí lo le me te nos este esta estos estas ese esa " +
    "eso aquel aquella aquello mi tu ella ellos ellas sobre cuando desde hasta entre porque " +
    "hay sido era fueron the of to and or in on for with a an is are it its as at by from " +
    "this that these those"
  ).split(/\s+/),
);

// Strip Markdown so derived text is plain and heading-only lines are dropped.
function plainText(text) {
  return String(text)
    .replace(/^#{1,6}\s+/gm, "") // headings → text
    .replace(/[*_`>]+/g, "") // emphasis, code, blockquotes
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links/images → label
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(text, max) {
  const counts = new Map();
  for (const rawWord of plainText(text).toLowerCase().split(/[^a-záéíóúüñ0-9]+/)) {
    const word = slugify(rawWord); // normalise accents before the stopword check
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([w]) => w);
}

function truncateExcerpt(text) {
  // First prose paragraph: drop heading lines, then take the opening sentence(s).
  const prose = String(text)
    .split("\n")
    .filter((line) => !/^\s*#{1,6}\s/.test(line))
    .join(" ");
  const sentence = plainText(prose);
  const cut = sentence.slice(0, 155);
  if (cut.length < 120) return cut;
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : 155)}.`;
}

/* ------------------------------------------------------------------ */
/* Field derivation                                                    */
/* ------------------------------------------------------------------ */

function derive(key) {
  const e = existingArticle;
  switch (key) {
    case "article.title":
      return sourceTitle
        ? { value: sourceTitle, confidence: 0.9, method: "provided" }
        : null;

    case "article.slug":
      if (e.slug) return { value: e.slug, confidence: 0.95, method: "provided" };
      return sourceTitle
        ? { value: slugify(sourceTitle), confidence: 0.9, method: "from-title" }
        : null;

    case "article.dek":
      return e.dek ? { value: e.dek, confidence: 0.9, method: "provided" } : null;

    case "article.category":
      return e.category
        ? { value: e.category, confidence: 0.9, method: "provided" }
        : { value: DEFAULT_CATEGORY, confidence: 0.5, method: "default" };

    case "article.tags": {
      if (e.tags) return { value: e.tags, confidence: 0.9, method: "provided" };
      const tags = extractKeywords(`${sourceTitle || ""} ${body}`, 5);
      return tags.length
        ? { value: tags, confidence: 0.6, method: "extracted" }
        : null;
    }

    case "article.author":
      return { value: admin.author.id, confidence: 0.9, method: "default-admin" };

    case "article.revision":
      return { value: e.revision || "1.0", confidence: 0.9, method: "default" };

    case "article.date":
      return { value: e.date || todayISO(), confidence: 0.7, method: "today" };

    case "article.updated":
      return { value: e.updated || todayISO(), confidence: 0.7, method: "today" };

    case "article.excerpt":
      if (e.excerpt) return { value: e.excerpt, confidence: 0.9, method: "provided" };
      return body
        ? { value: truncateExcerpt(body), confidence: 0.6, method: "first-sentence" }
        : null;

    case "article.keywords": {
      if (e.keywords) return { value: e.keywords, confidence: 0.9, method: "provided" };
      const kw = extractKeywords(`${sourceTitle || ""} ${body}`, 10);
      return kw.length ? { value: kw, confidence: 0.6, method: "extracted" } : null;
    }

    // Editorial / structural fields a human must supply.
    case "article.hero.image":
    case "article.faq":
    case "article.sources":
    case "article.internalLinks":
    case "article.hook":
    case "article.cta":
    case "article.platform.medium.kicker":
    case "article.platform.linkedin.framing":
    case "article.platform.substack.subject":
      return null;

    case "article.hero.alt":
      return sourceTitle
        ? { value: sourceTitle, confidence: 0.4, method: "from-title" }
        : null;

    case "article.shareCopy":
      return sourceTitle
        ? { value: sourceTitle, confidence: 0.3, method: "from-title" }
        : null;

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

const authorable = contract.fields.filter(
  (f) => f.scope === "article" && f.class !== "automated",
);

const filled = [];
const escalated = [];
const errors = [];

for (const field of authorable) {
  try {
    const result = derive(field.key);
    if (!result) {
      escalated.push({ key: field.key, reason: field.description });
    } else if (result.confidence >= THRESHOLD) {
      filled.push({ key: field.key, ...result });
    } else {
      escalated.push({
        key: field.key,
        reason: `confidence ${result.confidence.toFixed(2)} < ${THRESHOLD}`,
        suggestion: result.value,
        method: result.method,
      });
    }
  } catch (err) {
    errors.push({ key: field.key, error: err.message });
  }
}

const total = authorable.length;
const metrics = {
  total,
  filled: filled.length,
  escalated: escalated.length,
  errors: errors.length,
  fillRate: total ? filled.length / total : 0,
  escalationRate: total ? escalated.length / total : 0,
  errorRate: total ? errors.length / total : 0,
};

/* ------------------------------------------------------------------ */
/* Front matter (filled fields only)                                   */
/* ------------------------------------------------------------------ */

function setAt(obj, parts, value) {
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] || {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

const frontMatter = {};
for (const f of filled) {
  setAt(frontMatter, f.key.split(".").slice(1), f.value);
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

if (AS_JSON) {
  console.log(
    JSON.stringify({ metrics, filled, escalated, errors, frontMatter }, null, 2),
  );
} else {
  console.log(`Filler report for ${sourcePath}\n`);
  console.log("Filled:");
  for (const f of filled) {
    const shown = Array.isArray(f.value) ? f.value.join(", ") : f.value;
    console.log(
      `  ${f.key.padEnd(34)} ${String(shown).slice(0, 56)}  (${f.confidence.toFixed(2)}, ${f.method})`,
    );
  }
  console.log("\nEscalated (complete in the CMS):");
  for (const e of escalated) {
    const hint = e.suggestion ? ` — suggested: "${e.suggestion}"` : "";
    console.log(`  ${e.key.padEnd(34)} ${e.reason}${hint}`);
  }
  if (errors.length) {
    console.log("\nErrors:");
    for (const e of errors) console.log(`  ${e.key}: ${e.error}`);
  }
  console.log(
    `\nMetrics: ${filled.length}/${total} filled (${(metrics.fillRate * 100).toFixed(0)}%), ` +
      `${escalated.length} escalated, ${errors.length} errors`,
  );
  console.log(
    `Preview: ${countWords(raw)} words · ${readingTime(raw)} min read (computed at build)`,
  );
}

/* ------------------------------------------------------------------ */
/* Write a draft                                                       */
/* ------------------------------------------------------------------ */

if (WRITE) {
  const slug = frontMatter.slug || slugify(sourceTitle) || "draft";
  const target = `${DRAFTS_DIR}${slug}.md`;
  mkdirSync(DRAFTS_DIR, { recursive: true });
  const file = `---\n${dumpYaml({ article: frontMatter })}---\n\n${body}\n`;
  writeFileSync(target, file);
  if (!AS_JSON) console.log(`\nDraft written to ${target}`);
}

#!/usr/bin/env node
/**
 * Validate the content contract (CI gate 1) and the PRD content rules (gate 2).
 *
 * Checks:
 *   1. _data/admin.json against schema/admin.schema.json
 *   2. every content/articles/*.md front matter against schema/article.schema.json
 *   3. article.author references author.id
 *   4. content rules the schema cannot express (see checkContentRules)
 *
 * Fails closed: exits 1 if any article or the admin data is invalid.
 *
 * Usage:
 *   node scripts/validate.js            # human-readable
 *   node scripts/validate.js --json     # machine-readable for CI dashboards
 *
 * Prerequisite: node scripts/generate-schema.js
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { load as loadYaml } from "js-yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ARTICLES_DIR = join(ROOT, "content/articles");
const ADMIN_PATH = join(ROOT, "_data/admin.json");
const CONTRACT_PATH = join(ROOT, "_data/placeholders.json");
const ADMIN_SCHEMA = join(ROOT, "schema/admin.schema.json");
const ARTICLE_SCHEMA = join(ROOT, "schema/article.schema.json");

const asJson = process.argv.includes("--json");

/* ------------------------------------------------------------------ */
/* Ajv setup                                                           */
/* ------------------------------------------------------------------ */

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

// `uri-reference` is not in ajv-formats; accept absolute URLs or root-relative
// paths — exactly what the contract means by "uri-reference".
ajv.addFormat("uri-reference", {
  type: "string",
  validate: (value) =>
    value.length > 0 &&
    (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith("/")),
});

if (!existsSync(ADMIN_SCHEMA) || !existsSync(ARTICLE_SCHEMA)) {
  console.error(
    "error: schema not found. Run `node scripts/generate-schema.js` first.",
  );
  process.exit(1);
}

const validateAdmin = ajv.compile(JSON.parse(readFileSync(ADMIN_SCHEMA, "utf8")));
const validateArticle = ajv.compile(
  JSON.parse(readFileSync(ARTICLE_SCHEMA, "utf8")),
);

const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return loadYaml(match[1]);
}

function fieldRule(key) {
  return contract.fields.find((f) => f.key === key)?.validation || {};
}

function formatErrors(errors = [], prefix = "article") {
  return errors.map((e) => {
    // instancePath is like "/hero/alt" for the article schema.
    const parts = (e.instancePath || "")
      .split("/")
      .filter(Boolean)
      .filter((p) => p !== prefix); // drop the scope wrapper
    const prop = e.params?.missingProperty;
    const path = [...parts, prop].filter(Boolean).join(".");
    return `${prefix}.${path}: ${e.message}`.replace(/\.$/, "");
  });
}

/* ------------------------------------------------------------------ */
/* Content rules (gate 2) — beyond schema shape                        */
/* ------------------------------------------------------------------ */

function checkContentRules(meta, admin) {
  const problems = [];
  const article = meta.article || {};

  // article.author must reference an existing author.
  if (article.author && article.author !== admin.author.id) {
    problems.push(
      `article.author "${article.author}" does not match author.id "${admin.author.id}"`,
    );
  }

  // PRD §02: between 3 and 5 contextual internal links.
  const links = article.internalLinks || [];
  if (links.length < 3 || links.length > 5) {
    problems.push(
      `article.internalLinks must contain 3-5 entries (found ${links.length})`,
    );
  }

  // PRD §02: 3-5 internal links, no duplicates.
  const unique = new Set(links);
  if (unique.size !== links.length) {
    problems.push("article.internalLinks contains duplicates");
  }

  // Excerpt length is schema-enforced, but keep the PRD window explicit here
  // so the failure message names the gate.
  const excerpt = article.excerpt || "";
  const { minLength = 0, maxLength = Infinity } = fieldRule("article.excerpt");
  if (excerpt.length < minLength || excerpt.length > maxLength) {
    problems.push(
      `article.excerpt is ${excerpt.length} chars; PRD requires ${minLength}-${maxLength}`,
    );
  }

  // Dates must be real calendar dates and updated >= date.
  for (const key of ["date", "updated"]) {
    const value = article[key];
    if (value && Number.isNaN(new Date(value).getTime())) {
      problems.push(`article.${key} is not a valid date: ${value}`);
    }
  }
  if (
    article.date &&
    article.updated &&
    new Date(article.updated) < new Date(article.date) &&
    Number.isFinite(new Date(article.updated).getTime())
  ) {
    problems.push("article.updated is earlier than article.date");
  }

  return problems;
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

const results = [];
const admin = JSON.parse(readFileSync(ADMIN_PATH, "utf8"));

const adminValid = validateAdmin(admin);
results.push({
  file: "_data/admin.json",
  ok: adminValid,
  errors: adminValid ? [] : formatErrors(validateAdmin.errors, "admin"),
});

const files = existsSync(ARTICLES_DIR)
  ? readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"))
  : [];

for (const file of files.sort()) {
  const raw = readFileSync(join(ARTICLES_DIR, file), "utf8");
  const meta = parseFrontMatter(raw);

  if (!meta) {
    results.push({ file, ok: false, errors: ["no YAML front matter found"] });
    continue;
  }

  const valid = validateArticle(meta);
  const errors = valid ? [] : formatErrors(validateArticle.errors);
  const ruleProblems = valid ? checkContentRules(meta, admin) : [];
  results.push({
    file,
    ok: valid && ruleProblems.length === 0,
    errors: [...errors, ...ruleProblems],
  });
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const failed = results.filter((r) => !r.ok);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        ok: failed.length === 0,
        checked: results.length,
        failed: failed.length,
        results,
      },
      null,
      2,
    ),
  );
} else {
  for (const r of results) {
    if (r.ok) {
      console.log(`ok   ${r.file}`);
    } else {
      console.log(`FAIL ${r.file}`);
      for (const e of r.errors) console.log(`     - ${e}`);
    }
  }
  console.log(
    `\n${results.length - failed.length}/${results.length} passed` +
      (failed.length ? ` · ${failed.length} failed` : ""),
  );
}

process.exit(failed.length === 0 ? 0 : 1);

/**
 * Generate JSON Schemas from the field contract.
 *
 * Source of truth: _data/placeholders.json
 * Output:
 *   schema/placeholders.schema.json  — full contract, one $def per scope
 *   schema/article.schema.json       — per-article front matter (authorable fields)
 *   schema/admin.schema.json         — _data/admin.json (site / author / org)
 *
 * The generated files are git-ignored and rebuilt in CI (see .gitignore).
 * Run: node scripts/generate-schema.js
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const CONTRACT_PATH = new URL("_data/placeholders.json", ROOT);
const OUT_DIR = new URL("schema/", ROOT);

const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));

/* ------------------------------------------------------------------ */
/* Type mapping                                                        */
/* ------------------------------------------------------------------ */

// Maps the contract's friendly `type` to a JSON Schema fragment.
// `validation.items` (when present) overrides the default item schema.
function typeFragment(field) {
  const { type, validation = {} } = field;
  const items = validation.items || {};

  switch (type) {
    case "string":
    case "text":
      return { type: "string" };
    case "url":
    case "image":
      return { type: "string" };
    case "date":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "object":
      return { type: "object" };
    case "array<string>":
      return { type: "array", items: { type: "string", ...items } };
    case "array<url>":
      return { type: "array", items: { type: "string", ...items } };
    case "array<object>":
      return {
        type: "array",
        items: { type: "object", ...validation.items },
      };
    default:
      throw new Error(`Unmapped type "${type}" for field "${field.key}"`);
  }
}

// Copy the PRD validation rules into JSON Schema keywords, dropping the
// contract-only keys that Ajv does not understand.
function applyValidation(field, fragment) {
  const { validation = {} } = field;
  const {
    items: _items,          // already folded into the array fragment
    platformOverrides: _po, // platform-specific caps: enforced by validate.js
    ...keywords
  } = validation;

  const merged = { ...fragment, ...keywords };

  // `format: uri-reference` is not an Ajv built-in; validate.js registers it.
  return merged;
}

function fieldSchema(field) {
  return applyValidation(field, typeFragment(field));
}

/* ------------------------------------------------------------------ */
/* Scope → object schema                                               */
/* ------------------------------------------------------------------ */

// Nest dotted keys (article.hero.image) into a JSON Schema properties tree.
function nest(entries, depth = 0) {
  const properties = {};
  const required = [];

  // Group by first path segment.
  const groups = new Map();
  for (const { field, path } of entries) {
    const [head, ...rest] = path;
    if (!groups.has(head)) groups.set(head, { leaves: [], children: [] });
    if (rest.length === 0) groups.get(head).leaves.push(field);
    else groups.get(head).children.push({ field, path: rest });
  }

  for (const [head, group] of groups) {
    if (group.leaves.length > 0) {
      const field = group.leaves[0];
      properties[head] = fieldSchema(field);
      if (field.required) required.push(head);
    } else {
      const child = nest(group.children, depth + 1);
      properties[head] = {
        type: "object",
        properties: child.properties,
        additionalProperties: false,
      };
      if (child.required.length > 0) properties[head].required = child.required;
      // A nested object is required when it has at least one required child.
      properties[head]._requiredGroup = child.required;
    }
  }

  return { properties, required };
}

// Build an object schema for every field in the scope, with `stripPrefix`
// removed from the key. Computed fields are never authored, so they do not
// appear in any of these object schemas.
function objectSchemaForScope(scope, stripPrefix) {
  const entries = contract.fields
    .filter((f) => f.scope === scope)
    .map((field) => {
      const parts = field.key.split(".");
      if (parts[0] !== stripPrefix) {
        throw new Error(`Field ${field.key} does not start with ${stripPrefix}`);
      }
      return { field, path: parts.slice(1) };
    });

  const { properties, required } = nest(entries);
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

/* ------------------------------------------------------------------ */
/* Emit                                                                */
/* ------------------------------------------------------------------ */

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schema/placeholders.schema.json",
  title: "inprisma placeholder contract",
  description: contract.description,
  generatedFrom: "_data/placeholders.json",
  version: contract.version,
  $defs: {
    article: objectSchemaForScope("article", "article"),
    site: objectSchemaForScope("site", "site"),
    author: objectSchemaForScope("author", "author"),
    org: objectSchemaForScope("org", "org"),
  },
};

const adminSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schema/admin.schema.json",
  title: "inprisma admin.json",
  type: "object",
  properties: {
    site: { $ref: "#/$defs/site" },
    author: { $ref: "#/$defs/author" },
    org: { $ref: "#/$defs/org" },
  },
  required: ["site", "author", "org"],
  additionalProperties: false,
  $defs: schema.$defs,
};

const articleSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schema/article.schema.json",
  title: "inprisma article front matter",
  type: "object",
  properties: { article: { $ref: "#/$defs/article" } },
  required: ["article"],
  additionalProperties: true, // page-level Eleventy keys are allowed
  $defs: { article: schema.$defs.article },
};

// Strip the internal marker used only to propagate required nested objects.
function clean(node) {
  if (Array.isArray(node)) return node.map(clean);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "_requiredGroup") {
        if (v.length > 0) out.required = v;
        continue;
      }
      out[k] = clean(v);
    }
    return out;
  }
  return node;
}

mkdirSync(fileURLToPath(OUT_DIR), { recursive: true });

const writes = [
  ["placeholders.schema.json", schema],
  ["admin.schema.json", adminSchema],
  ["article.schema.json", articleSchema],
];

for (const [name, data] of writes) {
  const target = new URL(name, OUT_DIR);
  writeFileSync(target, `${JSON.stringify(clean(data), null, 2)}\n`);
  console.log(`schema: wrote ${name}`);
}

console.log(`schema: generated from ${contract.fields.length} contract fields`);

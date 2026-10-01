/**
 * Generate the CMS config from the field contract.
 *
 * Source of truth: _data/placeholders.json
 * Output:          config/cms.config.yml  (Sveltia CMS; Decap-compatible)
 *
 * The generated file is git-ignored and rebuilt in CI. Do not edit it by hand —
 * change the contract instead.
 *
 * Run: node scripts/generate-cms-config.js
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dump as dumpYaml } from "js-yaml";

const ROOT = new URL("../", import.meta.url);
const contract = JSON.parse(
  readFileSync(new URL("_data/placeholders.json", ROOT), "utf8"),
);

/* ------------------------------------------------------------------ */
/* Contract type → CMS widget                                          */
/* ------------------------------------------------------------------ */

const WIDGETS = {
  string: "string",
  text: "text",
  url: "string",
  image: "image",
  date: "datetime",
  number: "number",
  "array<string>": "list",
  "array<url>": "list",
  "array<object>": "list",
  object: "object",
};

function widgetFor(field) {
  const widget = WIDGETS[field.type];
  if (!widget) throw new Error(`No widget for type "${field.type}" (${field.key})`);
  return widget;
}

// A dotted key's final segment, e.g. article.hero.alt → alt.
function leaf(key) {
  return key.split(".").pop();
}

// Only authorable fields belong in the CMS: computed.* is derived at build time.
function authorableFields(scope) {
  return contract.fields.filter(
    (f) => f.scope === scope && f.class !== "automated",
  );
}

// Merge possible/computed settings from the contract into CMS field options.
function cmsField(field) {
  const name = leaf(field.key);
  const { validation = {} } = field;
  const out = {
    name,
    label: field.description || name,
    widget: widgetFor(field),
  };

  if (field.required) out.required = true;
  if (validation.minLength !== undefined) out.minlength = validation.minLength;
  if (validation.maxLength !== undefined) out.maxlength = validation.maxLength;
  if (validation.pattern) out.pattern = [validation.pattern, "Formato no válido"];
  if (validation.minItems !== undefined) out.min = validation.minItems;
  if (validation.maxItems !== undefined) out.max = validation.maxItems;
  if (field.type === "array<object>" && validation.items?.properties) {
    out.fields = Object.entries(validation.items.properties).map(
      ([prop, rule]) => ({
        name: prop,
        label: prop,
        widget: "string",
        ...(rule.maxLength ? { maxlength: rule.maxLength } : {}),
      }),
    );
  }

  return out;
}

// Build the nested field tree Decap/Sveltia expects from dotted keys.
function nestedFields(entries) {
  const groups = new Map();
  for (const { field, path } of entries) {
    const [head, ...rest] = path;
    if (!groups.has(head)) groups.set(head, { field: null, children: [] });
    if (rest.length === 0) groups.get(head).field = field;
    else groups.get(head).children.push({ field, path: rest });
  }

  const out = [];
  for (const [head, group] of groups) {
    if (group.field) {
      out.push(cmsField(group.field));
    } else {
      out.push({
        name: head,
        label: head,
        widget: "object",
        collapsed: true,
        fields: nestedFields(group.children),
      });
    }
  }
  return out;
}

function fieldsForScope(scope, stripPrefix) {
  const entries = authorableFields(scope).map((field) => {
    const parts = field.key.split(".");
    if (parts[0] !== stripPrefix) {
      throw new Error(`Field ${field.key} does not start with ${stripPrefix}`);
    }
    return { field, path: parts.slice(1) };
  });
  return nestedFields(entries);
}

// Split `article` fields into the collection's own fields (title, dek, …) and
// everything under the `platform` object, which the CMS renders as a nested
// object automatically through nestedFields().
const articleFields = fieldsForScope("article", "article");

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const config = {
  backend: {
    name: "git-gateway",
    branch: "main",
  },

  // Sveltia reads the same config as Decap. `editorial_workflow` enables the
  // draft → in review → published states required by Phase P1.
  local_backend: true,
  media_folder: "assets/uploads",
  public_folder: "/assets/uploads",
  editorial_workflow: true,

  collections: [
    {
      name: "articles",
      label: "Artículos",
      label_singular: "Artículo",
      folder: "content/articles",
      create: true,
      slug: "{{slug}}",
      extension: "md",
      format: "frontmatter",
      fields: articleFields,
    },
    {
      name: "settings",
      label: "Ajustes del sitio",
      files: [
        {
          name: "admin",
          label: "Administrador y organización",
          file: "_data/admin.json",
          fields: [
            { name: "site", label: "Sitio", widget: "object", fields: fieldsForScope("site", "site") },
            { name: "author", label: "Autor", widget: "object", fields: fieldsForScope("author", "author") },
            { name: "org", label: "Organización", widget: "object", fields: fieldsForScope("org", "org") },
          ],
        },
      ],
    },
  ],
};

const target = new URL("config/cms.config.yml", ROOT);
mkdirSync(fileURLToPath(new URL("config/", ROOT)), { recursive: true });
writeFileSync(
  target,
  `# GENERATED from _data/placeholders.json — do not edit by hand.\n` +
    `# Regenerate with: npm run generate\n\n` +
    dumpYaml(config, { lineWidth: 100, noRefs: true }),
);

console.log(
  `cms: wrote config/cms.config.yml (${articleFields.length} article fields, ` +
    `${authorableFields("site").length + authorableFields("author").length + authorableFields("org").length} settings fields)`,
);

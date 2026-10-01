/**
 * Generate the Sveltia CMS config from the field contract.
 *
 * Source of truth: _data/placeholders.json
 * Output:          admin/config.yml   (Sveltia CMS; Decap-compatible)
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

// Derive the `owner/repo` for the GitHub backend from package.json so a clone
// picks up its own repository automatically.
const pkg = JSON.parse(readFileSync(new URL("package.json", ROOT), "utf8"));
const repoUrl = pkg.repository?.url || "";
const repoMatch = repoUrl.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/i);
const repo = repoMatch ? repoMatch[1] : "your-org/your-repo";

/* ------------------------------------------------------------------ */
/* Contract type → CMS widget                                          */
/* ------------------------------------------------------------------ */

// Maps a contract type to a CMS widget plus any fixed widget options.
function widgetFor(field) {
  const { type } = field;
  switch (type) {
    case "string":
      return { widget: "string" };
    case "text":
      return { widget: "text" };
    case "url":
      return { widget: "string" };
    case "image":
      return { widget: "image" };
    case "date":
      // Date only (no time), matching front matter like `date: 2026-10-01`.
      return { widget: "datetime", format: "YYYY-MM-DD", time_format: false };
    case "number":
      return { widget: "number", value_type: "int" };
    case "array<string>":
      return { widget: "list", field: { widget: "string" } };
    case "array<url>":
      return { widget: "list", field: { widget: "string" } };
    case "array<object>":
      return { widget: "list", fields: [] };
    case "object":
      return { widget: "object" };
    default:
      throw new Error(`No widget for type "${type}" (${field.key})`);
  }
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

// Build the CMS field object for a single contract field.
function cmsField(field) {
  const name = leaf(field.key);
  const { validation = {} } = field;
  const out = {
    name,
    label: field.description || name,
    ...widgetFor(field),
  };

  if (field.required) out.required = true;
  if (validation.minLength !== undefined) out.minlength = validation.minLength;
  if (validation.maxLength !== undefined) out.maxlength = validation.maxLength;
  if (validation.pattern) out.pattern = [validation.pattern, "Formato no válido"];
  if (validation.minItems !== undefined) out.min = validation.minItems;
  if (validation.maxItems !== undefined) out.max = validation.maxItems;

  // Object items (faq, sources): turn each item property into a field.
  if (field.type === "array<object>" && validation.items?.properties) {
    out.fields = Object.entries(validation.items.properties).map(
      ([prop, rule]) => ({
        name: prop,
        label: prop,
        widget: prop === "url" ? "string" : "string",
        ...(rule.maxLength ? { maxlength: rule.maxLength } : {}),
      }),
    );
  }

  return out;
}

// Build the nested field tree Sveltia/Decap expects from dotted keys.
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

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Front matter is namespaced under `article:` and the Markdown body sits below
// it, so the article collection wraps the contract fields in an `article`
// object and appends a `body` markdown field.
const articleFields = [
  {
    name: "article",
    label: "Artículo",
    widget: "object",
    collapsed: false,
    fields: fieldsForScope("article", "article"),
  },
  {
    name: "body",
    label: "Contenido",
    widget: "markdown",
  },
];

const config = {
  backend: {
    name: "github",
    repo,
    // Merge each published entry as a single commit for a cleaner history.
    squash_merges: true,
  },

  // Draft → In Review → Ready: a pull request per entry; publishing merges it.
  publish_mode: "editorial_workflow",

  media_folder: "assets",
  public_folder: "/assets",

  collections: [
    {
      name: "articles",
      label: "Artículos",
      label_singular: "Artículo",
      folder: "content/articles",
      create: true,
      slug: "{{fields.article.slug}}",
      extension: "md",
      format: "frontmatter",
      fields: articleFields,
    },
    {
      name: "settings",
      label: "Ajustes del sitio",
      editor: { preview: false },
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

const header =
  `# GENERATED from _data/placeholders.json — do not edit by hand.\n` +
  `# Regenerate with: npm run generate\n` +
  `# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json\n\n`;

const target = new URL("admin/config.yml", ROOT);
mkdirSync(fileURLToPath(new URL("admin/", ROOT)), { recursive: true });
writeFileSync(target, header + dumpYaml(config, { lineWidth: 100, noRefs: true }));

const settingCount =
  authorableFields("site").length +
  authorableFields("author").length +
  authorableFields("org").length;

console.log(
  `cms: wrote admin/config.yml (backend github/${repo}, ` +
    `${articleFields.length} article fields incl. body, ${settingCount} settings fields)`,
);

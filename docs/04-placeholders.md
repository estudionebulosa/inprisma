# 04 — Placeholder taxonomy

Every field in [`_data/placeholders.json`](../_data/placeholders.json) has a
`class` that answers **who supplies it and whether it is automated**.

## Automation classes

| Class | Meaning | Examples |
|---|---|---|
| `automated` | Derived at build time; never authored by hand | slug, canonicalUrl, publishedISO, modifiedISO, readingTime, wordCount, ogImagePath, **all JSON-LD** |
| `repetitive-global` | Set once in `_data/admin.json`; identical for every article | site.name, site.website, author.bio, author.credentials, org.* |
| `repetitive-article` | Per-article front matter, validated | title, dek, tags[], category, excerpt, hero, faq[], sources[], internalLinks[] |
| `variable-manual` | Human, platform-tuned; minor variation is allowed | hook, cta, shareCopy, Medium kicker, LinkedIn framing, Substack subject |

## Namespaces

- `site.*` — site name, website, locale, logo, socials
- `author.*` — name, title, bio, credentials, sameAs
- `org.*` — organisation name, logo, sameAs
- `article.*` — title, dek, tags, category, excerpt, hero, faq, sources, keywords, internalLinks, and the platform-tuned fields
- `computed.*` — everything derived by `articles.11tydata.js`

## Field contract shape

```json
{
  "key": "article.title",
  "scope": "article",
  "class": "repetitive-article",
  "type": "string",
  "required": true,
  "auto": false,
  "variationAllowed": true,
  "platforms": ["medium", "linkedin", "substack"],
  "validation": { "minLength": 15, "maxLength": 60 },
  "description": "Headline. Used for <title>, og:title and JSON-LD headline."
}
```

### Field meanings

| Key | Meaning |
|---|---|
| `key` | Dotted path; the namespace prefix defines the scope |
| `scope` | `site` / `author` / `org` / `article` / `computed` |
| `class` | One of the four automation classes above |
| `type` | Maps to a JSON Schema type and a CMS widget (see `scripts/`) |
| `required` | Must be present |
| `auto` | Derived by the build (only `computed.*` today) |
| `variationAllowed` | Minor per-platform rewording is acceptable |
| `platforms` | Outputs that consume the field (`[]` = internal only) |
| `validation` | PRD rules: length, pattern, format, item caps |
| `description` | Human label; becomes the CMS field label |

## How the contract becomes artifacts

`scripts/generate-schema.js` maps `type` + `validation` to JSON Schema keywords
and emits `schema/{placeholders,admin,article}.schema.json`.
`scripts/generate-cms-config.js` maps the same fields to Sveltia/Decap widgets
and emits `config/cms.config.yml`. Neither artifact is edited by hand.

# 03 — Architecture

## Repository layout

```
package.json                       # build + gate scripts
eleventy.config.js                 # dirs, filters, global-data namespaces
_data/placeholders.json            # THE CONTRACT (source of truth)
_data/admin.json                   # site / author / org (exposed as three globals)
_data/platforms.json               # output targets: web, medium, linkedin, substack
content/articles/<slug>.md         # body + front matter
content/articles/articles.11tydata.js   # defaults, eleventyComputed, platform pagination
_includes/layouts/article.njk      # canonical web page (technical layer + content)
_includes/layouts/{medium,linkedin,substack}.njk   # syndication (content layer only)
_includes/partials/{meta,jsonld,social,byline,faq,sources,canonical-notice}.njk
config/cms.config.yml              # GENERATED from placeholders.json
schema/*.schema.json               # GENERATED from placeholders.json
scripts/                           # generate-schema, generate-cms-config, validate, verify-jsonld
docs/                              # this documentation
.github/workflows/ci.yml
```

## Data cascade

Eleventy's global data resolves in this order:

1. `_data/placeholders.json` — the contract (read by the scripts, not the build).
2. `_data/platforms.json` — drives the per-article pagination (`web`, `medium`,
   `linkedin`, `substack`).
3. `admin` sections exposed via `addGlobalData` as `site`, `author`, `org`.
4. Directory data in `articles.11tydata.js`: defaults + `eleventyComputed`.
5. Per-article front matter under the `article:` key.

Because Eleventy namespaces `_data/admin.json` as `admin`, `eleventy.config.js`
reads the file once and re-exposes its sections as `site`, `author` and `org`
through `addGlobalData`, matching the contract's `site.*` / `author.*` / `org.*`
keys.

## Two layers

| Layer | Applies to | Carries | PRD |
|---|---|---|---|
| **Technical** — JSON-LD, meta, OG/Twitter, canonical, sitemap, CWV | self-hosted site only | rendering + indexing | §01, §03, §04, §06 |
| **Content** — summary, Q&A headings, FAQ, E-E-A-T byline, hooks, CTAs, share copy | all four destinations | editorial structure | §02, §05 |

The canonical page is emitted by `article.njk`. The three syndication layouts are
produced from the same article via platform pagination, each writing to
`/syndication/<platform>/<slug>/`.

## Filters

`eleventy.config.js` registers four filters used by the templates:

- `readableDate` — localised human date.
- `jsonld` — pretty-printed JSON for the JSON-LD partial.
- `absoluteUrl` — resolve a possibly root-relative URL against the site origin.
- `hostname` — strip the protocol for display.

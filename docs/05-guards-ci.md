# 05 — Guards (CI)

Production gates fail **closed**: an article that violates the contract never
reaches a deploy.

## Gate status

| # | Gate | Implemented | Where |
|---|---|---|---|
| 0 | Contract reproducibility | ✅ | `npm run generate` |
| 1 | Schema validation (Ajv) | ✅ | `scripts/validate.js` |
| 2 | Content rules (PRD §02) | ✅ | `scripts/validate.js` |
| 3 | JSON-LD parses + required nodes | ✅ | `scripts/verify-jsonld.js` |
| 4 | Lighthouse CI (LCP, CLS, HTML size) | ✅ | `scripts/check-html-size.js` + `npm run check:lighthouse` |
| 5 | Accessibility (axe-core, WCAG 2.1/2.2 AA) | ✅ | Lighthouse's axe-core category (`check:lighthouse`) |
| 6 | Link checker | ✅ | `scripts/link-check.js` |
| 7 | Snapshot tests | ⏳ planned | needs a snapshot runner |

## Running the gates locally

```bash
npm run generate         # gate 0: contract → schema + CMS config
npm run validate         # gates 1-2 (add -- --json for machine output)
npm run build            # Eleventy
npm run verify:jsonld    # gate 3
npm run linkcheck        # gate 6 (add -- --external to probe external URLs)
npm run check:html-size  # gate 4a: critical HTML < 10kb (no browser needed)
npm run check:lighthouse # gates 4b + 5: LCP/CLS + accessibility (needs Chrome)
npm run check            # gates 0-3, 4a, 6 in order (no browser needed)
```

## What gate 1 checks

`_data/admin.json` and every `content/articles/*.md` front matter are validated
against the JSON Schema generated from the contract: types, required fields,
lengths, patterns, formats and item caps.

## What gate 2 adds

Rules the schema alone cannot express:

- `article.author` must reference an existing `author.id`.
- `article.internalLinks` must contain **3–5 unique** entries (PRD §02).
- `article.excerpt` must be **120–160** characters.
- `date` and `updated` must be real calendar dates, and `updated` must not
  precede `date`.

## What gate 3 checks

Every canonical page under `_site/` (syndication copies and static passthrough
files are skipped) must contain a JSON-LD block that parses and includes the
expected schema.org nodes with their required properties:

- **Article pages:** `Organization`, `WebSite`, `Person`, `NewsArticle`,
  `BreadcrumbList` (and `FAQPage` when the article defines `faq`).
- **Home page:** `Organization` and `WebSite`.

## What gate 6 checks

`scripts/link-check.js` walks every built HTML page:

- **Internal links** (root-relative, or same-origin as `site.website`) must
  resolve to a file that exists in `_site/`.
- **Anchors** (`#foo`) must point to an `id` on the same page.
- **External links** are format-checked by default; pass `--external` to also
  issue HEAD requests and verify they respond.

Stable URLs matter here: set `article.slug` so a title edit never breaks an
internal link.

## What gates 4–5 check

**Gate 4 — performance (PRD §01).** Two parts:

- `scripts/check-html-size.js` asserts every canonical page's *critical HTML*
  (the document minus the non-render-blocking JSON-LD `<script>` blocks) stays
  under **10kb**.
- `npm run check:lighthouse` runs Lighthouse CI against every canonical page and
  asserts `largest-contentful-paint ≤ 1200ms` and
  `cumulative-layout-shift ≤ 0.001`, with a performance category floor of 0.9.

**Gate 5 — accessibility (PRD §03).** The same Lighthouse run asserts an
accessibility category score of **1.0**. Lighthouse's accessibility audits are
computed by **axe-core** against WCAG 2.1/2.2 AA, which satisfies the
"axe/pa11y" gate with a single tool.

Both browser-based gates require Chrome. CI installs it via
`browser-actions/setup-chrome`; locally, install Chrome (or set `CHROME_PATH`)
before running `npm run check:lighthouse`.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs gates 0–6 on every
push to `main` and on every pull request, using Node 22.

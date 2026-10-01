# 06 — PRD mapping

Where each section of the news-site PRD
([`prd_news_site_optimization.html`](../prd_news_site_optimization.html)) lands
in this repository.

| PRD section | Where it lands |
|---|---|
| §01 Core Web Vitals | Lean layouts; CI gate 4 (planned); zero client JS in the article |
| §02 Content architecture | Front-matter rules; FAQ/sources/excerpt/internalLinks fields; **CI gate 2** |
| §03 Multi-engine SEO | `partials/meta.njk`, `partials/jsonld.njk`; **CI gate 3**; gate 5 (planned) |
| §04 Indexing tools | Phase P2 webhooks; `computed.sitemapLastmod` |
| §05 AEO / GEO | Answer-first excerpt; FAQ section; Speakable; E-E-A-T byline (`partials/byline.njk`) |
| §06 Social | `partials/social.njk`; `computed.ogImagePath` |
| §07 One platform vs. many | Outputs are content copies; the self-hosted site stays canonical (`partials/canonical-notice.njk`) |
| §08 Stack | Eleventy + Cloudflare Pages (target) + Git CMS + Cloudinary + Plausible |
| §09 Roadmap | Phases P0–P3 in [`PROJECT_PLAN.md`](../PROJECT_PLAN.md) |

## Content rules traceability

| Rule | PRD ref | Enforced by |
|---|---|---|
| Title ≤ 60 chars | §02 | contract `article.title.maxLength` → gate 1 |
| Description 120–160 chars | §02 | contract `article.excerpt` → gates 1 & 2 |
| ≥ 1 hero image with alt | §02 | contract `article.hero` (required) → gate 1 |
| 3–5 internal links | §02 | contract + gate 2 |
| FAQ emitted as `FAQPage` | §03, §05 | `articles.11tydata.js` + gate 3 |
| Person/Organization wired | §03, §05 | `articles.11tydata.js` + gate 3 |
| Canonical to home | §07 | `computed.canonicalUrl`, `partials/canonical-notice.njk` |

## Not yet enforced

Gates 4–7 (Lighthouse, accessibility, link checking, snapshots) are planned. The
rules they cover are currently encoded as template best practice, not as a hard
CI failure — see [`05-guards-ci.md`](05-guards-ci.md).

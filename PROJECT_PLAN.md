# inprisma — Project Plan & Roadmap

> Consolidated plan derived from the project brief (`docs/00-brief.md`) and
> `prd_news_site_optimization.html` (technical optimization layer).
> Status: Approved for build · Owner: Site Administrator · Last updated: 2026-10-01

---

## 1. Overview

A **template placeholder system** that turns a single, validated content source into
platform-ready articles for **Medium, LinkedIn and Substack**, while encoding the
technical and editorial rules defined in the news-site PRD (SEO, AEO/GEO, E-E-A-T,
social sharing, Core Web Vitals).

The **self-hosted site is canonical**. Medium, LinkedIn and Substack receive
syndicated copies that carry a canonical/attribution block pointing home.

The central bet: **the field contract is defined once and shared** by the manual
editor (Phase 1) and the automated pipeline (Phase 2), so automation and human
editing produce the *same artifact* rather than diverging.

---

## 2. Goals & non-goals

### Goals
- One validated data model → Medium / LinkedIn / Substack outputs.
- Automate the highest-error repetitive work: JSON-LD, meta tags, social tags, dates, slugs, revision.
- Encode PRD rules as **hard CI gates**, not style guidance.
- Make the field contract the shared interface between human editing and automation.
- Keep Git as the source of truth; outputs remain plain Markdown/HTML.

### Non-goals (for now)
- Building a custom WYSIWYG application (Phase 1 uses a schema-generated CMS form).
- Measuring CTR/CWV inside the authoring UI (measured in CI instead).
- Cloaking or per-search-engine versions — explicitly rejected by PRD §07, Option C.

---

## 3. Decisions locked

| Decision | Choice | Rationale |
|---|---|---|
| Source of truth | Markdown + front matter in Git; self-hosted site canonical | One auditable source; syndicated copies link home |
| Build | Eleventy 3.x (ESM), Node LTS | Data cascade = native placeholder system; zero client JS in article output |
| Field contract | `_data/placeholders.json` (human source) → generate JSON Schema | Single source of truth drives form, autocomplete and CI |
| Validation | Ajv + generated schema in CI; build fails closed | Turns PRD content rules into enforceable gates |
| Placeholder editor | Sveltia CMS, Decap-compatible `config.yml` (Decap fallback) | Form generated from same config; native draft→review→publish workflow |
| Markdown editor | CMS body field | Edits body only; no byte-fighting with other editors |
| HTML editor | `_includes/` layouts/partials, in-repo, dev-reviewed | Structural layer stays code-reviewed |
| `admin.json` shape | Namespaced: `site`, `author`, `org` | JSON-LD partials consume these directly |
| Host | Cloudflare Pages (PRD §08) + CMS OAuth worker; Netlify fallback | Edge TTFB target; fallback for auth edge cases |
| Metrics | Templates encode best practices; Lighthouse/CWV measured in CI | Avoids scope creep; still enforces PRD §01 |
| Delimiters | Nunjucks `{{ }}` / `{% %}`; `{% raw %}` for literal braces | Follows the chosen Eleventy convention |

---

## 4. Architecture

### 4.1 Repository layout

```
package.json                       # Eleventy 3.x build scripts
eleventy.config.js                 # dirs, filters, global-data namespaces, passthrough
_data/placeholders.json            # schema: key, scope, type, required, validation, auto, variationAllowed, platforms
_data/admin.json                   # site / author / org (one file; exposed as three globals)
_data/platforms.json               # output targets: web, medium, linkedin, substack
content/articles/<slug>.md         # body + front matter (per-article data)
content/articles/articles.11tydata.js     # defaults + eleventyComputed (slug, canonical, readingTime, revision, JSON-LD) + platform pagination
_includes/layouts/article.njk      # canonical web page (technical layer + content)
_includes/layouts/{medium,linkedin,substack}.njk   # syndication (content layer only)
_includes/partials/{meta,jsonld,social,byline,faq,sources,canonical-notice}.njk
admin/index.html                    # CMS shell (Sveltia CMS, committed)
admin/config.yml                    # GENERATED from placeholders.json (Sveltia/Decap)
schema/placeholders.schema.json     # GENERATED from placeholders.json
scripts/                           # generate-schema, generate-cms-config, validate, link-check, serve-site, check-html-size, verify-jsonld
docs/                              # 00-brief … 07-cms
.github/workflows/ci.yml
```

> Note: Eleventy namespaces data files by filename, so `_data/admin.json` would
> otherwise appear as the `admin` global. `eleventy.config.js` uses
> `addGlobalData` to expose its sections as `site`, `author` and `org`, matching
> the field contract. The canonical page is emitted by `article.njk`; the three
> syndication layouts are produced from the same article via platform pagination.

### 4.2 Two layers

| Layer | Applies to | Carries | PRD section |
|---|---|---|---|
| **Technical** (JSON-LD, meta, OG/Twitter, sitemap, IndexNow, CWV) | self-hosted site only | rendering + indexing | §01, §03, §04, §06 |
| **Content** (summary block, Q&A headings, FAQ, E-E-A-T byline, hooks, CTAs, share copy) | all four destinations | editorial structure | §02, §05 |

### 4.3 Placeholder namespaces

- `site.*` — site name, website, socials
- `author.*` — name, title, bio, credentials, sameAs
- `org.*` — organization name, logo, sameAs
- `article.*` — title, dek, tags, category, excerpt, hero, faq, sources, keywords
- `computed.*` — slug, canonicalUrl, publishedISO, modifiedISO, revision, readingTime, wordCount, ogImagePath, jsonld

---

## 5. Placeholder taxonomy

### 5.1 Automation matrix

| Class | Examples | Source | Auto? |
|---|---|---|---|
| Fully automated | slug, canonicalUrl, publishedISO, modifiedISO, revision, readingTime, wordCount, ogImagePath, sitemapLastmod, **all JSON-LD** | computed from other fields | Yes |
| Repetitive / site-global | site.name, site.website, site.social.*, org.*, author.defaultBio, author.credentials | `_data/admin.json` (set once) | Yes |
| Repetitive / per-article | title, dek, tags[], author, revision, date, updated, category, excerpt, heroImage+alt, faq[], sources[], keywords[] | front matter | Input, then validated |
| Minor variation allowed | hook/intro, cta, shareCopy, LinkedIn framing, Substack subject/preview, Medium kicker | human, platform-tuned | Manual |

### 5.2 Structural vs. variable

- **Structural** — block slots defined by the layout and controlled by config:
  `{{> meta }}`, `{{> jsonld }}`, `{{> social }}`, FAQ/sources loops. Not free text.
- **Variable** — injected scalars from the data cascade:
  `{{ site.name }}`, `{{ article.tags }}`, `{{ computed.readingTime }}`.

### 5.3 Field contract shape

Every entry in `_data/placeholders.json`:

```json
{
  "key": "article.title",
  "scope": "article",
  "type": "string",
  "required": true,
  "validation": { "maxLength": 60 },
  "auto": false,
  "variationAllowed": false,
  "platforms": ["medium", "linkedin", "substack"]
}
```

---

## 6. Production gates (CI — fail closed)

| # | Gate | Criterion | PRD ref |
|---|---|---|---|
| 1 | Schema validation | Every article passes Ajv against generated schema | — |
| 2 | Content rules | title ≤ 60; description 120–160; ≥1 hero alt; FAQ/sources where required; 3–5 internal links | §02 |
| 3 | JSON-LD | Parses; required `@type` fields present; Person/Organization wired | §03, §05 |
| 4 | Lighthouse CI | LCP < 1.2s; CLS 0; critical HTML < 10kb | §01 |
| 5 | Accessibility | axe/pa11y, WCAG 2.1 AA | §03 |
| 6 | Link checker | Internal + external links resolve | §02 |
| 7 | Snapshot tests | Rendered partials stable across the three layouts | — |

---

## 7. Roadmap

### Phase P0 — Contract (plain files, no runtime app)
**Goal:** define and prove the shared field contract.

**Tasks**
- [x] `_data/placeholders.json` — complete field schema.
- [x] `_data/admin.json` — namespaced `site` / `author` / `org` (exposed via `addGlobalData`).
- [x] `content/articles/example-article.md` — reference article with full front matter.
- [x] `articles.11tydata.js` — defaults + `eleventyComputed` (slug, canonical, readingTime, revision, JSON-LD assembly) + platform pagination.
- [x] Layouts: `article.njk` (canonical), `medium.njk`, `linkedin.njk`, `substack.njk`.
- [x] Partials: `meta.njk`, `jsonld.njk`, `social.njk`, `byline.njk`, `faq.njk`, `sources.njk`, `canonical-notice.njk`.
- [x] `eleventy.config.js` + `package.json` — build tooling, filters, global-data namespaces.
- [x] Generators: `scripts/generate-schema.js`, `scripts/generate-cms-config.js`.
- [x] Validator: `scripts/validate.js` (Ajv).
- [x] Link checker: `scripts/link-check.js` (gate 6).
- [x] Performance + accessibility: `scripts/check-html-size.js`, `scripts/serve-site.js`, `lighthouserc.cjs` (gates 4–5).
- [x] `docs/00-overview … 06-prd-mapping`.
- [x] `.github/workflows/ci.yml` — gates 1–6.

**Acceptance:** one example article renders cleanly through all three layouts; validator green; JSON-LD parses.
**Verified:** build emits the canonical page + 3 syndication variants; JSON-LD parses with 6 node types; platform fields (kicker/framing/subject) render.

**Estimate:** ~1–1.5 weeks.

---

### Phase P1 — Human-supervised editor
**Goal:** non-developers edit articles and publish via a generated form.

**Tasks**
- [x] CMS `config.yml` generated from `placeholders.json`.
- [x] Sveltia CMS wired to the repo; Decap fallback documented.
- [x] Editorial workflow: draft → in review → published.
- [x] Publish-time hook runs the CI gate set (gates 1–6; gate 7 pending).
- [x] Author onboarding doc.

**Acceptance:** a non-developer edits and publishes an article through the form without touching files; all gates pass; syndicated copies carry canonical block.
**Status:** CMS shell + generated config wired (`admin/index.html`, `admin/config.yml`); editorial workflow + GitHub backend; local workflow works without OAuth. Production OAuth (Sveltia CMS Authenticator on Cloudflare Workers) documented, deployment-specific.

**Estimate:** ~1 week.

---

### Phase P2 — Automated filler
**Goal:** automation produces the same front matter, escalating exceptions.

**Tasks**
- [x] Filler service reads `placeholders.json` and emits front matter.
- [x] Per-field autonomy keyed on confidence threshold (default 0.7).
- [x] Low-confidence fields queued to the P1 form for review.
- [x] Observability: fill rate, error rate, escalation rate.
- [x] PRD integrations: IndexNow submit, sitemap ping (`lastmod` already computed; sitemap.xml generation pending).
- [x] Automation runbook + rollback (in `docs/08-automation.md`).

**Acceptance:** ≥ target % fields auto-filled at threshold; remainder queued; staging run matches human output byte-for-byte on shared fields.
**Status:** `scripts/fill.js` (rule-based filler) + `scripts/indexnow.js` (post-publish indexing). Shared helpers extracted to `scripts/lib/content.js` so derived values match the build byte-for-byte. Creative fields escalate to the CMS; an LLM provider is a drop-in for `derive()`.

**Estimate:** ~2–3 weeks.

---

### Phase P3 — Continuous optimization (ongoing)
- [ ] CWV/Lighthouse alerting in production (PRD P0).
- [ ] Monthly schema audit; quarterly evergreen review (PRD §02).
- [ ] A/B testing of hooks/CTAs.
- [ ] Upgrade path note: if editorial volume outgrows Git-based CMS, migrate to Payload/Sanity while keeping the same field contract.

---

## 8. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| One template, three platforms | Underperformance | Shared data model, per-platform layout partials |
| Markdown round-tripping | Corrupted bodies | Three editors over three surfaces; Markdown is canonical |
| Delimiter collisions | Broken output | Nunjucks `{% raw %}`; validator flags unresolved tokens |
| Metrics scope creep | Blown timeline | Templates encode; CI measures |
| CMS lock-in | Migration cost | Decap-compatible `config.yml`; contract is portable |
| Two systems, one repo | Blurred scope | Technical vs. content layers separated in docs and folders |

---

## 9. PRD mapping

| PRD section | Where it lands |
|---|---|
| §01 Core Web Vitals | CI gate 4; lean layouts |
| §02 Content architecture | Front-matter rules; FAQ/sources/excerpt fields; CI gate 2 |
| §03 Multi-engine SEO | JSON-LD/meta partials; CI gates 3, 5 |
| §04 Indexing tools | Phase P2 webhooks; `lastmod` |
| §05 AEO/GEO | Answer-first structure, Speakable, `llms.txt`, bylines |
| §06 Social | `social.njk`; generated OG images |
| §07 One platform vs. many | Outputs are content copies; self-hosted stays canonical |
| §08 Stack | Eleventy + Cloudflare Pages + Git CMS + Cloudinary + Plausible |
| §09 Roadmap | Phases P0–P3 above |

---

## 10. Open items

1. ~~Confirm target auto-fill % and confidence threshold for Phase P2.~~ → Resolved: threshold **0.7** (configurable via `--threshold`); fill/escalation/error rates are reported per run, so the target is a tuning exercise, not a code change.
2. ~~Confirm OG-image generation provider.~~ → Resolved for now: local SVG placeholders (`assets/hero-*.svg`) keep the repo self-contained; Cloudinary (PRD §08) remains the production option when real images are needed.
3. Confirm `llms.txt` / `citations.txt` policy (PRD §05 permits AI crawlers by default) — still open; add to Phase P3.

# 08 — Automation (filler)

Phase P2: automation prepares article front matter from a source draft,
deriving every field it can with a confidence score and **escalating** the rest
to a human in the CMS (P1). The filler reads the same contract
(`_data/placeholders.json`) that drives the JSON Schema, the CMS form and the CI
gates, so human and machine produce the *same* artifact shape.

## The filler

```bash
npm run fill -- content/_drafts/idea.md              # dry run, human report
npm run fill -- content/_drafts/idea.md --json       # machine-readable report
npm run fill -- content/_drafts/idea.md --write      # write a draft to _drafts/
npm run fill -- content/_drafts/idea.md --threshold 0.6 --category guias
```

Input is a Markdown draft: an optional front-matter title, then the body. The
filler:

- **Fills** the mechanical fields — `slug` (from title), `author` (the admin),
  `revision` (`1.0`), `date`/`updated` (today), and any field already present in
  the draft — with high confidence.
- **Derives** `excerpt` (first prose sentence), `tags` and `keywords`
  (frequency extraction, stopword-filtered) at medium confidence.
- **Escalates** the editorial and structural fields it cannot derive — title
  (when absent), `dek`, `hero`, `faq`, `sources`, `internalLinks`, `hook`,
  `cta`, `shareCopy`, and the per-platform fields.

## Confidence and escalation

Every derivation carries a confidence score and a method. Fields below the
configured `--threshold` (default **0.7**) are **escalated**: they are listed in
the report with a reason and, where possible, a suggested value, so a human can
complete them in the CMS. The report also prints the fill / escalation / error
rates:

| Metric | Meaning |
|---|---|
| `fillRate` | derived fields above threshold ÷ authorable fields |
| `escalationRate` | fields queued for human review ÷ authorable fields |
| `errorRate` | derivations that threw ÷ authorable fields |

## Why the shared fields match byte-for-byte

The filler and the Eleventy build import the same helpers from
`scripts/lib/content.js` (`slugify`, `countWords`, `readingTime`, `toISO`). A
`slug` the filler derives from a title is therefore identical to the one the
build would derive, and reading time / word count are computed once, not twice.
This is the "staging run matches human output on shared fields" guarantee.

## An LLM provider is a drop-in

`scripts/fill.js` is deliberately rule-based (no API key). The creative fields
— title, dek, hook, CTA — are escalated today. To add an LLM, implement
`derive()` for those keys to call a provider and return `{ value, confidence }`;
the report shape, thresholding and escalation logic stay unchanged.

## Post-publish indexing (PRD §04)

After a deploy, notify search engines:

```bash
npm run build
npm run indexnow                          # dry run: lists the URLs
npm run indexnow -- --submit --key=XXXX    # IndexNow submit + sitemap ping
```

`scripts/indexnow.js` collects the canonical URLs from `_site/`, submits them to
the IndexNow API (key via `--key` or `$INDEXNOW_KEY`, key file at
`/<key>.txt`), and pings Google and Bing with the sitemap. It reads the origin
from `_data/admin.json`. The `computed.sitemapLastmod` field already feeds
`lastmod`; generating the actual `sitemap.xml` is a follow-up.

## Runbook

1. Drop a source draft in `content/_drafts/` (or pass any Markdown file).
2. `npm run fill -- <draft> --write` to prepare front matter.
3. Complete the escalated fields in the CMS (`/admin/`), where the editorial
   workflow opens a pull request.
4. CI gates 0–6 run on the PR; publish only when green.
5. After the deploy, run `npm run indexnow -- --submit`.

Rollback is Git-native: the CMS publishes by merging a PR, so reverting is a
`git revert` of that merge.

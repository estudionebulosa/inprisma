# ⚡ inprisma

**One contract. Four destinations. Zero metadata written by hand.**

> If you publish the same draft on four sites and it underperforms on all of them,
> the problem isn't your writing. It's that you don't have a contract.

<p>
  <img alt="Built with Eleventy" src="https://img.shields.io/badge/built%20with-Eleventy-1f425f?style=flat-square">
  <img alt="Status" src="https://img.shields.io/badge/status-building-brightgreen?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-TBD-lightgrey?style=flat-square">
</p>

---

## 🤯 The problem nobody talks about

Writing is the easy part. The hard part is making **the same article** win on Google,
get cited by an AI answer engine, render a perfect LinkedIn card, and land as a clean
Substack email — **without rewriting it four times**.

Do it by hand and you get the usual: forgotten meta tags, desynchronised dates,
broken schema, and nobody knows which version is canonical.

## ✅ The fix: one validated content contract

Define every field **once** in `_data/placeholders.json` — its type, whether it's
required, whether it's automatic, whether it varies per platform, and its rule.
Everything else is derived.

| Data class | Who supplies it | Automated? |
|---|---|---|
| **Derived** — slug, canonical, ISO dates, reading time, JSON-LD | the build step | ✅ yes |
| **Global** — name, title, website, socials | once, in `admin.json` | ✅ yes |
| **Per-article** — title, tags, author, revision, date | front matter | 🔒 validated |
| **Editorial** — hook, CTA, Substack subject | a human | ✍️ intentional |

## 🚀 Quick start

```bash
git clone https://github.com/estudionebulosa/inprisma && cd inprisma
npm install
npm run build      # → _site/ : the canonical page + 3 syndication variants
```

Then edit `_data/admin.json` with your details, write an article in
`content/articles/`, and let the build compute the schema, canonical URL, Open Graph
tags and dates for you.

## 🧰 What's inside

- 🧩 **Four outputs from one file** — web (canonical), Medium, LinkedIn, Substack.
- 🔍 **Automatic JSON-LD** — `NewsArticle`, `FAQPage`, `BreadcrumbList`, `Person`, `Organization`.
- 🏷️ **Full SEO + Open Graph** — absolute canonical, Twitter cards, per-platform tags.
- ⚡ **Eleventy speed** — zero client JavaScript in the article, full control of the critical HTML.
- 🖊️ **Sveltia CMS** — a generated form (`/admin/`) for non-developers, with a draft → review → publish workflow.
- 🧪 **A working example** that builds in seconds.

## 🎯 Why you should clone this today

Because **95% of optimization is identical for every engine** — speed, accessibility,
valuable content, credited authorship — and this repo ships that 95% as
infrastructure instead of good intentions.

You won't rewrite metadata. You won't break your schema. You won't argue about the
canonical. Adding a new platform stops being a project and becomes **one more template**.

## 🗺️ Roadmap

- [x] **P0 — Contract:** placeholder schema, data model, layouts, build
- [ ] **P0 — Guards:** schema generator, CMS-config generator, CI validator
- [ ] **P1 — Human-supervised editor:** generated form, draft → review → publish
- [ ] **P2 — Automation:** fill fields from sources, escalate only the uncertain ones
- [ ] **P3 — Continuous optimization:** CWV monitoring, A/B testing, evergreen review

See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the full plan, gates and acceptance criteria.

## 📚 Read the full story

**→ "Publica una vez, rinde en todas partes"** — the complete article on why one
contract beats four copies, and how to adopt it. *(link TBD)*

## 📄 License

TBD — decide before making the repository public.

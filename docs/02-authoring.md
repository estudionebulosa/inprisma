# 02 — Authoring an article

## Quick start

```bash
npm install
npm run check     # generate → validate → build → verify JSON-LD
```

`npm run check` is the same pipeline CI runs. If it passes locally, it passes in
CI.

## Adding an article

Create `content/articles/<anything>.md` with YAML front matter under an
`article:` key and a Markdown body:

```markdown
---
article:
  slug: mi-articulo
  title: "Un título de entre 15 y 60 caracteres"
  category: guias
  tags: [seo, aeo, eleventy]
  revision: "1.0"
  date: 2026-10-01
  excerpt: "Entre 120 y 160 caracteres que resumen el artículo y responden primero a la intención de búsqueda."
  hero:
    image: /assets/hero-ejemplo.jpg
    alt: "Descripción de la imagen de portada"
  internalLinks:
    - /guias/plantillas-multiplataforma/
    - /guias/core-web-vitals/
    - /guias/schema-json-ld/
---

Cuerpo del artículo en Markdown…
```

Set `slug` explicitly: the URL is derived from it, so internal links stay stable
even if you later rewrite the title. Without it, the slug falls back to a
slugified title and every link to that page can break on an edit.

Everything else — slug, canonical URL, ISO dates, reading time, word count,
JSON-LD — is computed in `content/articles/articles.11tydata.js`. **Never write a
`computed.*` field by hand.**

## Rules the validator enforces

| Field | Rule |
|---|---|
| `article.slug` | optional; lowercase, digits and hyphens. Set it to keep URLs stable |
| `article.title` | 15–60 characters |
| `article.excerpt` | 120–160 characters (PRD gate 2) |
| `article.category` | lowercase, digits and hyphens only (`^[a-z0-9-]+$`) |
| `article.tags` | 1–5 entries; LinkedIn caps at 3 |
| `article.revision` | `major.minor`, e.g. `1.0` |
| `article.hero.image` / `.alt` | required; alt 5–125 characters |
| `article.internalLinks` | 3–5 unique entries |
| `article.author` | must match `author.id` in `_data/admin.json` |
| `article.updated` | must not be earlier than `article.date` |

## Editing site-wide data

`_data/admin.json` holds everything that is identical for every article: site
name/logo/socials, author identity and credentials, and organisation details.
Edit it once; every article inherits it.

## Using the CMS (Phase P1)

A Sveltia/Decap form is generated from the same contract:

```bash
npm run generate   # writes config/cms.config.yml
```

The config groups `site` / `author` / `org` under **Ajustes del sitio** and
exposes the authorable `article.*` fields as the **Artículos** collection, with
draft → in review → published states enabled.

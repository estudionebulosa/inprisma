# 01 — Overview

**inprisma** turns a single validated content source into platform-ready articles
for the **web** (canonical), **Medium**, **LinkedIn** and **Substack**.

The central idea is a **field contract**: every placeholder is declared once in
[`_data/placeholders.json`](../_data/placeholders.json) — its type, whether it is
required, whether it is derived automatically, whether it allows per-platform
variation, and its validation rule. Everything downstream is generated from that
contract:

```
_data/placeholders.json  ──┬──► schema/*.schema.json     (JSON Schema, CI gate 1)
                            ├──► config/cms.config.yml   (Sveltia/Decap form)
                            └──► eleventy build          (web + 3 syndications)
```

## Principles

1. **One contract, many outputs.** A field is authored in exactly one place.
2. **Derive, don't duplicate.** Slug, canonical URL, ISO dates, reading time and
   all JSON-LD are computed at build time.
3. **Fail closed.** CI rejects any article that violates the contract or the
   PRD content rules.
4. **The self-hosted site is canonical.** Syndicated copies carry an attribution
   block pointing home.

## Document map

| Doc | Contents |
|---|---|
| [01-overview](01-overview.md) | this file |
| [02-authoring](02-authoring.md) | how to write and validate an article |
| [03-architecture](03-architecture.md) | directories, data cascade, layers |
| [04-placeholders](04-placeholders.md) | the field taxonomy |
| [05-guards-ci](05-guards-ci.md) | the CI gates and how to run them locally |
| [06-prd-mapping](06-prd-mapping.md) | where each PRD section lands |
| [07-cms](07-cms.md) | the Sveltia CMS editor, workflow and onboarding |

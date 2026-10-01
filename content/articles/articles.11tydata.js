/**
 * Directory data file for content/articles.
 *
 * Provides defaults and the `computed.*` placeholder values declared in
 * _data/placeholders.json. Everything in `eleventyComputed` is class
 * "automated": it must never be authored by hand in front matter.
 *
 * Convention: Eleventy 3.x, ESM.
 */

const WORDS_PER_MINUTE = 200;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function stripFrontMatter(raw = "") {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, "").trim();
}

function countWords(raw = "") {
  const body = stripFrontMatter(raw);
  return body ? body.split(/\s+/).length : 0;
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function originOf(site = {}) {
  return String(site.website || "").replace(/\/+$/, "");
}

function absolute(url, origin) {
  if (!url) return url;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function toISO(value, fallback) {
  const date = new Date(value || fallback || Date.now());
  return Number.isNaN(date.getTime())
    ? new Date(fallback || Date.now()).toISOString()
    : date.toISOString();
}

function resolveAuthor(data = {}) {
  const admin = data.author || {};
  const ref = data.article?.author;
  // Only the admin author exists today; `article.author` is validated against
  // author.id and defaults to it. A future _data/authors.json extends this.
  if (ref && ref !== admin.id) {
    return { ...admin, id: ref };
  }
  return admin;
}

// Self-contained derivations. Each computed field calls these directly so it
// stays independent of Eleventy's computed-resolution order.
const computeSlug = (data) =>
  slugify(data.article?.slug || data.article?.title || data.page?.fileSlug);

const computeCanonical = (data) =>
  `${originOf(data.site)}/${slugify(data.article?.category)}/${computeSlug(data)}/`;

/* ------------------------------------------------------------------ */
/* JSON-LD graph                                                       */
/* ------------------------------------------------------------------ */

function buildJsonLd(data = {}) {
  const site = data.site || {};
  const org = data.org || {};
  const article = data.article || {};
  const origin = originOf(site);
  const canon = computeCanonical(data);
  const author = resolveAuthor(data);
  const heroImage = absolute(article.hero?.image, origin);
  const published = toISO(article.date);
  const modified = toISO(article.updated, article.date);

  const orgId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const authorId = `${origin}/#author`;

  const graph = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: org.name,
      legalName: org.legalName,
      url: org.url || origin,
      logo: absolute(org.logo, origin),
      sameAs: org.sameAs || [],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: origin,
      name: site.name,
      inLanguage: site.locale,
      publisher: { "@id": orgId },
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/buscar/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Person",
      "@id": authorId,
      name: author.name,
      jobTitle: author.title,
      description: author.bio,
      email: author.email ? `mailto:${author.email}` : undefined,
      url: author.website,
      image: absolute(author.avatar, origin),
      knowsAbout: author.credentials || [],
      sameAs: author.sameAs || [],
      worksFor: { "@id": orgId },
    },
    {
      "@type": "NewsArticle",
      "@id": `${canon}#article`,
      isPartOf: { "@id": websiteId },
      mainEntityOfPage: canon,
      headline: article.title,
      description: article.excerpt,
      articleSection: article.category,
      keywords: (article.keywords || article.tags || []).join(", "),
      inLanguage: site.locale,
      datePublished: published,
      dateModified: modified,
      image: heroImage ? [heroImage] : undefined,
      author: { "@id": authorId },
      publisher: { "@id": orgId },
      url: canon,
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canon}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${origin}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: article.category,
          item: `${origin}/${slugify(article.category)}/`,
        },
        { "@type": "ListItem", position: 3, name: article.title, item: canon },
      ],
    },
  ];

  if (Array.isArray(article.faq) && article.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canon}#faq`,
      mainEntity: article.faq.map((entry) => ({
        "@type": "Question",
        name: entry.q,
        acceptedAnswer: { "@type": "Answer", text: entry.a },
      })),
    });
  }

  // Drop undefined properties so the emitted JSON stays clean.
  return JSON.parse(JSON.stringify({ "@context": "https://schema.org", "@graph": graph }));
}

/* ------------------------------------------------------------------ */
/* Directory data                                                      */
/* ------------------------------------------------------------------ */

export default {
  tags: ["articles"],
  // One output per platform: web (canonical) + the three syndication targets.
  pagination: {
    data: "platforms",
    size: 1,
    alias: "platform",
  },
  eleventyComputed: {
    "computed.slug": (data) => computeSlug(data),

    "computed.canonicalUrl": (data) => computeCanonical(data),

    "computed.publishedISO": (data) => toISO(data.article?.date),

    "computed.modifiedISO": (data) =>
      toISO(data.article?.updated, data.article?.date),

    "computed.wordCount": (data) => countWords(data.page?.rawInput),

    "computed.readingTime": (data) =>
      Math.max(1, Math.round(countWords(data.page?.rawInput) / WORDS_PER_MINUTE)),

    "computed.ogImagePath": (data) =>
      absolute(
        data.article?.hero?.image || `/og/${computeSlug(data)}.png`,
        originOf(data.site),
      ),

    "computed.sitemapLastmod": (data) =>
      toISO(data.article?.updated, data.article?.date),

    "computed.jsonld": (data) => buildJsonLd(data),

    // Platform selects the layout: the canonical web page, or a syndication layout.
    layout: (data) => `${data.platform === "web" ? "article" : data.platform}.njk`,
  },
  permalink: (data) =>
    data.platform === "web"
      ? `/${slugify(data.article?.category)}/${computeSlug(data)}/index.html`
      : `/syndication/${data.platform}/${computeSlug(data)}/index.html`,
};

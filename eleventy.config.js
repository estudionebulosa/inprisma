/**
 * Eleventy configuration (ESM).
 *
 * Directory layout:
 *   content/          input (pages + articles + directory data)
 *   _includes/        layouts and partials
 *   _data/            global data (admin, placeholders, platforms)
 *   _site/            build output (git-ignored)
 */

import { readFileSync } from "node:fs";

// Single admin file, exposed as three namespaces (site / author / org) to match
// _data/placeholders.json. Eleventy would otherwise namespace it as `admin`.
const admin = JSON.parse(
  readFileSync(new URL("./_data/admin.json", import.meta.url), "utf8"),
);

export default function (eleventyConfig) {
  eleventyConfig.addGlobalData("site", admin.site);
  eleventyConfig.addGlobalData("author", admin.author);
  eleventyConfig.addGlobalData("org", admin.org);

  /* -------------------------------------------------------------- */
  /* Filters                                                         */
  /* -------------------------------------------------------------- */

  // Human-readable date, localised. Falls back gracefully on bad input.
  eleventyConfig.addFilter("readableDate", (value, locale = "es-ES") => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  });

  // Pretty-printed JSON, used by the JSON-LD partial.
  eleventyConfig.addFilter("jsonld", (value) => JSON.stringify(value, null, 2));

  // Resolve a possibly root-relative URL against the site origin.
  eleventyConfig.addFilter("absoluteUrl", (path, base = "") => {
    if (!path) return "";
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path;
    return `${String(base).replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  });

  // Strip the protocol for display, e.g. canonical notices.
  eleventyConfig.addFilter("hostname", (url = "") =>
    String(url).replace(/^[a-z]+:\/\//i, "").replace(/\/+$/, ""),
  );

  /* -------------------------------------------------------------- */
  /* Passthrough                                                     */
  /* -------------------------------------------------------------- */

  eleventyConfig.addPassthroughCopy({ assets: "assets" });
  eleventyConfig.addPassthroughCopy({ "prd_news_site_optimization.html": "prd_news_site_optimization.html" });

  /* -------------------------------------------------------------- */
  /* Build config                                                    */
  /* -------------------------------------------------------------- */

  return {
    dir: {
      input: "content",
      output: "_site",
      includes: "../_includes",
      layouts: "../_includes/layouts",
      data: "../_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
}

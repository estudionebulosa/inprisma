/**
 * Shared content utilities.
 *
 * Used by both the Eleventy build (content/articles/articles.11tydata.js) and
 * the P2 filler (scripts/fill.js) so that derived values — slug, word count,
 * reading time — are identical wherever they are computed. This is what makes
 * the "staging run matches human output byte-for-byte on shared fields"
 * acceptance criterion hold: there is one implementation, not two.
 */

export const WORDS_PER_MINUTE = 200;

/** Strip YAML front matter so word counts reflect the body only. */
export function stripFrontMatter(raw = "") {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, "").trim();
}

/** Count words in a Markdown source (body only, front matter excluded). */
export function countWords(raw = "") {
  const body = stripFrontMatter(raw);
  return body ? body.split(/\s+/).length : 0;
}

/** Estimated reading time in minutes, minimum one. */
export function readingTime(raw = "") {
  return Math.max(1, Math.round(countWords(raw) / WORDS_PER_MINUTE));
}

/** Slugify a string: lower-case, strip accents, separators to hyphens. */
export function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalise a date to ISO 8601, falling back to `fallback` then `now`. */
export function toISO(value, fallback) {
  const date = new Date(value || fallback || Date.now());
  return Number.isNaN(date.getTime())
    ? new Date(fallback || Date.now()).toISOString()
    : date.toISOString();
}

/** Today's date as YYYY-MM-DD (local time). */
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

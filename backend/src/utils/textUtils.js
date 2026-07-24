/**
 * Text utilities – fuzzy keyword matching for the Job Filtering Agent.
 */

/**
 * Normalise a string: lowercase, collapse whitespace, strip punctuation.
 * @param {string} str
 * @returns {string}
 */
const normalise = (str) =>
  (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Returns true if `text` contains `query` or any meaningful word of `query`.
 *
 * Strategy (in order):
 *   1. Exact substring match   – "backend" in "senior backend engineer"
 *   2. Word-level match        – any word from query (≥ 3 chars) found in text
 *
 * Stopwords are excluded so common words like "and", "the" don't cause false positives.
 *
 * @param {string} text   – The haystack (job title, location, experience, etc.)
 * @param {string} query  – The user's preference string
 * @returns {boolean}
 */
const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'this', 'that', 'are', 'was',
  'have', 'has', 'not', 'but', 'all', 'can', 'will', 'may', 'any',
]);

const fuzzyMatch = (text, query) => {
  if (!query) return true; // No filter set → always passes
  if (!text) return false;

  const normText = normalise(text);
  const normQuery = normalise(query);

  // 1. Exact substring match
  if (normText.includes(normQuery)) return true;

  // 2. Word-level match – at least one meaningful query word appears in text
  const words = normQuery
    .split(' ')
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  return words.some((w) => normText.includes(w));
};

/**
 * Strips markdown code fences from an LLM response.
 * e.g. ```json\n[...]\n``` → [...]
 * @param {string} raw
 * @returns {string}
 */
const stripCodeFence = (raw) =>
  raw
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

/**
 * Safely parse JSON from an LLM response.
 * Returns `fallback` if parsing fails.
 * @param {string} raw
 * @param {*}      fallback
 * @returns {*}
 */
const safeJsonParse = (raw, fallback = null) => {
  try {
    return JSON.parse(stripCodeFence(raw));
  } catch {
    return fallback;
  }
};

module.exports = { normalise, fuzzyMatch, stripCodeFence, safeJsonParse };

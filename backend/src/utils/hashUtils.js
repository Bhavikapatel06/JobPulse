/**
 * ─────────────────────────────────────────────────────────────
 *  Hash Utilities – SHA256 chunk deduplication
 * ─────────────────────────────────────────────────────────────
 *  Generates deterministic SHA256 hashes for text blocks.
 *  Used by the Scraping Agent to skip chunks already sent
 *  to the AI, minimizing token consumption.
 */

const crypto = require('crypto');

/**
 * Generate a SHA256 hex hash of a string.
 * @param {string} text
 * @returns {string} 64-char hex string
 */
const sha256 = (text) =>
  crypto.createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * Deduplicate an array of text chunks by their SHA256 hash.
 * Returns only unseen chunks and their hashes.
 *
 * @param {string[]} chunks    – Raw text chunks
 * @param {Set<string>} seen   – Set of already-processed hashes (mutated in-place)
 * @returns {{ chunk: string, hash: string }[]}
 */
const deduplicateChunks = (chunks, seen = new Set()) => {
  const unique = [];
  for (const chunk of chunks) {
    const hash = sha256(chunk.trim());
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push({ chunk, hash });
    }
  }
  return unique;
};

module.exports = { sha256, deduplicateChunks };

/**
 * ─────────────────────────────────────────────────────────────
 *  Search Agent
 * ─────────────────────────────────────────────────────────────
 *  Discovers the official careers/jobs page URL for a company.
 *
 *  Credit-saving strategy:
 *    1. Check MongoDB for a cached careersUrl first.
 *    2. Only call the LLM if no URL is stored.
 *    3. Validate reachability before storing.
 *    4. Never re-call the LLM as long as the cached URL is reachable.
 */

const axios = require('axios');
const aiService = require('../services/aiService');
const CompanyJob = require('../models/CompanyJob');
const logger = require('../config/logger');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Checks whether a URL returns a 2xx/3xx response.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
const isReachable = async (url) => {
  try {
    const res = await axios.head(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
      maxRedirects: 5,
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
};

/**
 * Strips markdown / whitespace and validates URL format.
 * @param {string} raw
 * @returns {string|null}
 */
const extractUrl = (raw) => {
  const cleaned = raw
    .trim()
    .replace(/^```.*\n?/, '')
    .replace(/\n?```$/, '')
    .replace(/\s+/g, '')
    .trim();

  try {
    new URL(cleaned);
    return cleaned;
  } catch {
    const match = cleaned.match(/https?:\/\/[^\s"'<>]+/);
    return match ? match[0] : null;
  }
};

/**
 * Ask the LLM for the job listings page URL for a company.
 * @param {string} company
 * @returns {Promise<string|null>}
 */
const fetchUrlFromAI = async (company) => {
  const prompt =
    `What is the official job listings / search results page URL for "${company}"?\n` +
    `Requirements:\n` +
    `- Return ONLY the direct URL where job openings are listed.\n` +
    `- Prefer the job search results page (e.g. https://www.google.com/about/careers/applications/jobs/results).\n` +
    `- Must be on the company's own domain or ATS platform (Workday, Greenhouse, Lever).\n` +
    `- Valid, complete URL starting with https://.\n` +
    `- Return ONLY the URL. No explanation, no punctuation, nothing else.`;

  const raw = await aiService.generateText(prompt);
  logger.debug(`[SearchAgent] LLM raw response: ${raw}`);
  return extractUrl(raw);
};

/**
 * Get the official careers page URL for a company.
 * Reads from DB cache first; falls back to AI only when necessary.
 *
 * @param {string} company  – Company display name e.g. "Google"
 * @returns {Promise<string>} Verified careers page URL
 */
const findCareersUrl = async (company) => {
  const key = company.trim().toLowerCase();

  // ── 1. Check MongoDB cache ───────────────────────────────
  const existing = await CompanyJob.findOne({ company: key }).select('careersUrl');
  if (existing?.careersUrl) {
    const reachable = await isReachable(existing.careersUrl);
    if (reachable) {
      logger.info(`[SearchAgent] Reusing cached URL for "${company}": ${existing.careersUrl}`);
      return existing.careersUrl;
    }
    logger.warn(`[SearchAgent] Cached URL for "${company}" is no longer reachable. Refreshing via AI...`);
  }

  // ── 2. Call AI to discover URL ───────────────────────────
  logger.info(`[SearchAgent] No valid cached URL. Calling AI for: ${company}`);
  const url = await fetchUrlFromAI(company);

  if (!url) {
    throw new Error(`[SearchAgent] AI returned an invalid URL for "${company}"`);
  }

  logger.info(`[SearchAgent] LLM suggested URL: ${url}`);

  // ── 3. Validate reachability ─────────────────────────────
  let finalUrl = url;
  const reachable = await isReachable(url);

  if (!reachable) {
    logger.warn(`[SearchAgent] URL not reachable (${url}), trying common path variants...`);
    const domain = new URL(url).origin;
    const candidates = [
      `${domain}/careers/search`, `${domain}/careers/jobs`,
      `${domain}/careers`, `${domain}/jobs`,
      `${domain}/en/careers`,
    ];

    for (const candidate of candidates) {
      if (await isReachable(candidate)) {
        logger.info(`[SearchAgent] Fallback URL accepted: ${candidate}`);
        finalUrl = candidate;
        break;
      }
    }

    if (finalUrl === url) {
      logger.warn(`[SearchAgent] No reachable fallback. Proceeding with: ${url}`);
    }
  }

  // ── 4. Persist URL to DB cache ───────────────────────────
  await CompanyJob.findOneAndUpdate(
    { company: key },
    { $set: { careersUrl: finalUrl, companyDisplayName: company } },
    { upsert: true, new: true }
  );

  logger.info(`[SearchAgent] Careers URL cached for "${company}": ${finalUrl}`);
  return finalUrl;
};

module.exports = { findCareersUrl };

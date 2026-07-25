/**
 * ─────────────────────────────────────────────────────────────
 *  Verifier Agent
 * ─────────────────────────────────────────────────────────────
 *  Verifies, validates, and cleans job listings extracted by
 *  the Scraping Agent before saving to MongoDB.
 *
 *  Validation Rules:
 *    1. Title Verification: Rejects non-job UI items (e.g. "Sign In",
 *       "Search Jobs", "Home", "Apply Now", "Privacy Policy", empty titles).
 *    2. Link Verification: Ensures applyLink is a valid HTTP/HTTPS URL.
 *    3. Normalization: Cleans extra whitespace, HTML tags, normalizes fields.
 *    4. Deduplication: Ensures every verified job has a unique jobId.
 */

const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

// JUNK_TITLE_PATTERNS – UI navigation elements that are NOT real job titles
const JUNK_TITLE_PATTERNS = [
  /^sign in$/i,
  /^log in$/i,
  /^careers$/i,
  /^home$/i,
  /^jobs$/i,
  /^search$/i,
  /^search jobs$/i,
  /^apply$/i,
  /^apply now$/i,
  /^view all jobs$/i,
  /^see all jobs$/i,
  /^privacy policy$/i,
  /^terms of service$/i,
  /^skip to main content$/i,
  /^cookie settings$/i,
  /^about us$/i,
  /^contact us$/i,
  /^undefined$/i,
  /^null$/i,
];

/**
 * Check if a title string represents a valid job title vs UI junk.
 * @param {string} title
 * @returns {boolean}
 */
const isValidTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  const clean = title.trim();

  // Must be between 3 and 150 characters
  if (clean.length < 3 || clean.length > 150) return false;

  // Reject matches against known navigation junk patterns
  for (const pattern of JUNK_TITLE_PATTERNS) {
    if (pattern.test(clean)) return false;
  }

  return true;
};

const JUNK_LINK_EXTENSIONS = ['.mp4', '.mp3', '.wav', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.zip', '.tar', '.gz', '.woff', '.css', '.js'];

/**
 * Check if an applyLink string is a valid absolute URL.
 * @param {string} link
 * @returns {boolean}
 */
const isValidLink = (link) => {
  if (!link || typeof link !== 'string') return false;
  const clean = link.trim();

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return false;

  try {
    const parsed = new URL(clean);
    
    const lowerPath = parsed.pathname.toLowerCase();
    
    // Reject static media and assets
    for (const ext of JUNK_LINK_EXTENSIONS) {
      if (lowerPath.endsWith(ext)) return false;
    }
    
    // Reject generic search pages (often picked up by AI fallback by mistake)
    // If the path ends in /search or /jobs and lacks a job-specific identifier in query
    if (lowerPath.endsWith('/search') || lowerPath.endsWith('/jobs') || lowerPath.endsWith('/search-jobs')) {
      const hasJobId = parsed.searchParams.has('jobId') || parsed.searchParams.has('reqid') || parsed.searchParams.has('id') || parsed.searchParams.has('jid');
      if (!hasJobId) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Verify and clean a single raw job object.
 *
 * @param {object} rawJob      – Raw job object from scraper
 * @param {string} fallbackUrl – Default careers URL if applyLink is invalid
 * @returns {object|null}      – Clean verified job object or null if invalid
 */
const verifyJob = (rawJob, fallbackUrl = '') => {
  if (!rawJob || typeof rawJob !== 'object') return null;

  // 1. Verify Title
  const title = (rawJob.title || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  if (!isValidTitle(title)) {
    return null;
  }

  // 2. Verify Apply Link
  let applyLink = (rawJob.applyLink || '').trim();
  if (!isValidLink(applyLink)) {
    applyLink = isValidLink(fallbackUrl) ? fallbackUrl.trim() : '';
  }
  if (!applyLink) return null;

  // 3. Normalize fields
  const location = (rawJob.location || 'Not specified').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  const experience = (rawJob.experience || 'Not specified').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  const employmentType = (rawJob.employmentType || 'Not specified').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  const description = (rawJob.description || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().substring(0, 300);
  const postedDate = rawJob.postedDate || null;

  // 4. Compute unique jobId hash
  const titleKey = title.toLowerCase();
  const linkKey = applyLink.toLowerCase();
  const jobId = rawJob.jobId || sha256(`${titleKey}_${linkKey}`);

  return {
    jobId,
    title,
    location: location || 'Not specified',
    experience: experience || 'Not specified',
    employmentType: employmentType || 'Not specified',
    description,
    applyLink,
    postedDate,
  };
};

/**
 * Verify an array of job listings.
 * Filters out invalid jobs, cleans content, and deduplicates by jobId.
 *
 * @param {object[]} jobs       – Raw job objects
 * @param {string}   company    – Company name (for logging)
 * @param {string}   careersUrl – Fallback careers URL
 * @returns {object[]}          – Verified, clean, unique jobs
 */
const verifyAll = (jobs, company = '', careersUrl = '') => {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    logger.warn(`[VerifierAgent] ${company}: 0 raw jobs provided to verify`);
    return [];
  }

  const verifiedMap = new Map();
  let rejectedCount = 0;

  for (const raw of jobs) {
    const clean = verifyJob(raw, careersUrl);

    if (!clean) {
      rejectedCount++;
      continue;
    }

    if (!verifiedMap.has(clean.jobId)) {
      verifiedMap.set(clean.jobId, clean);
    }
  }

  const result = Array.from(verifiedMap.values());

  logger.info(
    `[VerifierAgent] ${company || 'Jobs'}: ${result.length} verified valid, ` +
    `${rejectedCount} rejected (junk/invalid)`
  );

  return result;
};

module.exports = {
  verifyJob,
  verifyAll,
  isValidTitle,
  isValidLink,
};

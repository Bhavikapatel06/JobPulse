/**
 * ─────────────────────────────────────────────────────────────
 *  Job Filtering Agent
 * ─────────────────────────────────────────────────────────────
 *  Filters a list of job objects against a user's preferences.
 *
 *  Matching rules:
 *    • desiredRole      – Required. Fuzzy-matched against job title.
 *    • filters.location – Optional. Fuzzy-matched against job location.
 *    • filters.experienceLevel – Optional. Fuzzy-matched against job experience.
 */

const { fuzzyMatch } = require('../utils/textUtils');
const logger = require('../config/logger');

/**
 * Filter an array of job objects by the user's preferences.
 *
 * @param {object[]} jobs    – Raw jobs from CompanyJob.jobs
 * @param {object}   user    – Mongoose User document
 * @param {string}   company – Company name (for logging)
 * @returns {object[]}       – Matched jobs (plain objects)
 */
const filter = (jobs, user, company) => {
  const { desiredRole, filters } = user;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    logger.info(`[FilteringAgent] No jobs to filter for ${company}`);
    return [];
  }

  const matched = jobs.filter((job) => {
    // ── Role match (mandatory) ──────────────────────────────
    if (!fuzzyMatch(job.title, desiredRole)) return false;

    // ── Location match (optional) ───────────────────────────
    if (filters?.location && filters.location.trim()) {
      if (!fuzzyMatch(job.location, filters.location)) return false;
    }

    // ── Experience level match (optional) ───────────────────
    if (filters?.experienceLevel && filters.experienceLevel.trim()) {
      if (!fuzzyMatch(job.experience, filters.experienceLevel)) return false;
    }

    return true;
  });

  logger.info(
    `[FilteringAgent] ${company}: ${matched.length}/${jobs.length} jobs match ` +
    `"${desiredRole}"` +
    (filters?.location ? ` in "${filters.location}"` : '') +
    (filters?.experienceLevel ? ` (${filters.experienceLevel})` : '')
  );

  return matched;
};

/**
 * Filter jobs for a user across multiple companies.
 * Returns results grouped by company.
 *
 * @param {Map<string, object[]>} companyJobsMap – { companyName → jobs[] }
 * @param {object}                user
 * @returns {{ company: string, jobs: object[] }[]}
 */
const filterAll = (companyJobsMap, user) => {
  const results = [];

  for (const [company, jobs] of Object.entries(companyJobsMap)) {
    const matched = filter(jobs, user, company);
    if (matched.length > 0) {
      results.push({ company, jobs: matched });
    }
  }

  return results;
};

module.exports = { filter, filterAll };

/**
 * ─────────────────────────────────────────────────────────────
 *  Company Data Checker Agent
 * ─────────────────────────────────────────────────────────────
 *  Global cache guard for per-company job data.
 *
 *  Credit-saving strategy:
 *    • Checks lastUpdated before every scrape attempt.
 *    • Uses an in-memory in-flight Set to prevent concurrent
 *      double-scrapes of the same company.
 *    • Returns stale data rather than failing if a refresh errors.
 *    • Re-scrapes automatically if 0 jobs are stored.
 */

const CompanyJob = require('../models/CompanyJob');
const searchAgent = require('./searchAgent');
const scrapingAgent = require('./scrapingAgent');
const { isOlderThan } = require('../utils/timeUtils');
const logger = require('../config/logger');

const FRESHNESS_HOURS = parseFloat(process.env.DATA_FRESHNESS_HOURS || '1');

// ── In-flight lock: prevents double-scraping the same company ─
const inFlight = new Set();

/**
 * Ensure fresh job data exists for a given company.
 * Reads from the shared CompanyJobs collection.
 *
 * @param {string} companyName  – Raw company name from user preferences
 * @returns {Promise<object>}   CompanyJob document
 */
const check = async (companyName) => {
  const key = companyName.trim().toLowerCase();
  logger.info(`[DataCheckerAgent] Checking data for: ${companyName}`);

  // ── 1. Lookup existing record ─────────────────────────────
  let record = await CompanyJob.findOne({ company: key });

  // ── 2. Determine if scrape is needed ─────────────────────
  const needsScrape =
    !record ||
    record.scrapeStatus === 'failed' ||
    (record.jobs?.length === 0) ||
    !record.lastUpdated ||
    isOlderThan(record.lastUpdated, FRESHNESS_HOURS);

  if (!needsScrape) {
    logger.info(
      `[DataCheckerAgent] Cache hit for "${companyName}" ` +
      `(${record.jobs.length} jobs, age: ${Math.round((Date.now() - record.lastUpdated) / 60000)}m)`
    );
    return record;
  }

  // ── 3. In-flight lock – skip if already being scraped ─────
  if (inFlight.has(key)) {
    logger.info(`[DataCheckerAgent] Scrape already in-flight for "${companyName}". Waiting for cached result...`);
    // Poll until in-flight completes (max 90s)
    const deadline = Date.now() + 90_000;
    while (inFlight.has(key) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
    }
    const updated = await CompanyJob.findOne({ company: key });
    return updated || record;
  }

  // ── 4. Explain why scrape is triggered ────────────────────
  let reason = 'never updated';
  if (record) {
    if (record.scrapeStatus === 'failed') reason = 'previous scrape failed';
    else if (!record.jobs?.length) reason = 'cached 0 jobs';
    else if (record.lastUpdated) {
      const ageHours = Math.round((Date.now() - new Date(record.lastUpdated).getTime()) / 3600000);
      reason = `stale (${ageHours}h old)`;
    }
  }
  logger.info(`[DataCheckerAgent] Starting live refresh for "${companyName}" (${reason})...`);

  inFlight.add(key);

  try {
    // ── 4a. Find careers URL (cached in DB) ──────────────────
    const careersUrl = await searchAgent.findCareersUrl(companyName);
    logger.info(`[DataCheckerAgent] Careers URL: ${careersUrl}`);

    // ── 4b. Mark as pending ───────────────────────────────────
    await CompanyJob.findOneAndUpdate(
      { company: key },
      { $set: { scrapeStatus: 'pending', companyDisplayName: companyName } },
      { upsert: true }
    );

    // ── 4c. Scrape jobs ───────────────────────────────────────
    const jobs = await scrapingAgent.scrape(companyName, careersUrl);

    // ── 4d. Persist to DB ─────────────────────────────────────
    record = await CompanyJob.findOneAndUpdate(
      { company: key },
      {
        $set: {
          companyDisplayName: companyName,
          careersUrl,
          jobs,
          lastUpdated: new Date(),
          scrapeStatus: 'success',
          lastError: null,
        },
      },
      { new: true, upsert: true }
    );

    logger.info(`[DataCheckerAgent] ✅ Saved ${jobs.length} jobs for "${companyName}"`);
    return record;

  } catch (err) {
    logger.error(`[DataCheckerAgent] ❌ Scrape failed for "${companyName}": ${err.message}`);

    await CompanyJob.findOneAndUpdate(
      { company: key },
      { $set: { scrapeStatus: 'failed', lastError: err.message } }
    );

    if (record?.jobs?.length) {
      logger.warn(`[DataCheckerAgent] Returning stale data for "${companyName}" (${record.jobs.length} jobs)`);
      return record;
    }

    throw new Error(`Failed to retrieve job data for "${companyName}": ${err.message}`);
  } finally {
    inFlight.delete(key);
  }
};

module.exports = { check };

/**
 * ─────────────────────────────────────────────────────────────
 *  Scheduler Agent
 * ─────────────────────────────────────────────────────────────
 *
 *  Company-centric two-phase pipeline:
 *
 *  Phase A — Company Refresh (runs every refresh interval)
 *    1. Find all distinct active companies across all users.
 *    2. For each company, ensure data is fresh (one scrape per interval).
 *    3. Each company is scraped at most once regardless of how many
 *       users follow it.
 *
 *  Phase B — User Reports (runs every minute)
 *    1. Check which users are due for notification right now.
 *    2. For each company: check MongoDB cache → auto-scrape if missing/stale.
 *    3. Filter jobs deterministically (0 AI tokens).
 *    4. Generate and dispatch a personalized report.
 */

const cron = require('node-cron');
const User = require('../models/User');
// CompanyJob reads are handled inside companyDataCheckerAgent
const { getCurrentHHMM } = require('../utils/timeUtils');
const companyDataCheckerAgent = require('./companyDataCheckerAgent');
const jobFilteringAgent = require('./jobFilteringAgent');
const reportGenerationAgent = require('./reportGenerationAgent');
const agnoClient = require('../services/agnoClient');
const notificationService = require('../notifications/notificationService');
const logger = require('../config/logger');

const REFRESH_INTERVAL_MINUTES = parseInt(process.env.REFRESH_INTERVAL_MINUTES || '60', 10);

// ─────────────────────────────────────────────────────────────
//  Phase A — Company-centric data refresh
// ─────────────────────────────────────────────────────────────

/**
 * Fetch and refresh job data for all distinct active companies.
 * Each company is processed sequentially and at most once.
 */
const refreshAllCompanies = async () => {
  logger.info('[Scheduler] 🔄  Starting company-centric data refresh...');

  // Get distinct companies from all active users (not per user)
  const companies = await User.distinct('companies', { active: true });
  const unique = [...new Set(companies.map((c) => c.trim().toLowerCase()))];

  logger.info(`[Scheduler] Found ${unique.length} distinct active companies: ${unique.join(', ')}`);

  let refreshed = 0, skipped = 0, failed = 0;

  for (const company of unique) {
    try {
      await companyDataCheckerAgent.check(company);
      refreshed++;
    } catch (err) {
      logger.error(`[Scheduler] Failed to refresh "${company}": ${err.message}`);
      failed++;
    }
  }

  logger.info(`[Scheduler] ✅ Refresh complete — refreshed: ${refreshed}, skipped (fresh): ${skipped}, failed: ${failed}`);
};

// ─────────────────────────────────────────────────────────────
//  Phase B — User report generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate a report for a single user.
 *
 * Follows this exact flow per company:
 *
 *   Check MongoDB
 *      │
 *      ├── Fresh → Filter Jobs directly
 *      │
 *      └── Missing / Expired
 *               │
 *               ▼
 *          SearchAgent (find/reuse careers URL)
 *               │
 *               ▼
 *          ScrapingAgent (JSON-LD → CSS → AI fallback)
 *               │
 *               ▼
 *          Save to CompanyJobs
 *               │
 *               ▼
 *          Filter Jobs
 *               │
 *               ▼
 *          ReportAgent
 *
 * A new company (e.g. Microsoft) is automatically searched
 * and scraped the first time any user requests it.
 *
 * @param {object} user – Mongoose User document
 */
const processUser = async (user) => {
  logger.info(
    `\n${'═'.repeat(60)}\n` +
    `[Scheduler] ▶  Processing user: ${user.name} <${user.email}>\n` +
    `              Companies: ${user.companies.join(', ')}\n` +
    `              Role: ${user.desiredRole}\n` +
    `${'═'.repeat(60)}`
  );

  const allFilteredJobs = [];

  for (const company of user.companies) {
    try {
      //
      // companyDataCheckerAgent.check() implements the full flow:
      //
      //   MongoDB fresh?  ──YES──▶ return cached jobs
      //       │
      //       NO (missing / expired / 0 jobs)
      //       │
      //       ▼
      //   SearchAgent  → find / reuse careersUrl
      //       ▼
      //   ScrapingAgent → JSON-LD → CSS selectors → AI fallback
      //       ▼
      //   Save to CompanyJobs (single shared copy for all users)
      //       ▼
      //   return fresh jobs
      //
      const record = await companyDataCheckerAgent.check(company);

      if (!record || !record.jobs?.length) {
        logger.warn(`[Scheduler] No jobs found for "${company}" – skipping`);
        continue;
      }

      // Convert Mongoose document to plain JS object to avoid Mongoose subdocument spread bug
      const plainRecord = record.toObject ? record.toObject() : record;
      const plainJobs = plainRecord.jobs || [];

      // Filter deterministically — 0 AI tokens
      const matched = jobFilteringAgent.filter(plainJobs, user, company);

      // Construct clean, flat job objects expected by ReportAgent
      const tagged = matched.map((job) => ({
        company: plainRecord.companyDisplayName || company,
        title: job.title || 'Untitled Position',
        location: job.location || 'Not specified',
        experience: job.experience || 'Not specified',
        employmentType: job.employmentType || 'Not specified',
        description: job.description || '',
        applyLink: job.applyLink || '',
        postedDate: job.postedDate || null,
      }));

      allFilteredJobs.push(...tagged);

    } catch (err) {
      logger.error(`[Scheduler] Error processing "${company}" for ${user.name}: ${err.message}`);
      // Continue to next company — never stop the whole report for one failure
    }
  }

  // ── Try Agno ReportAgent first; fall back to JS generator ───
  const agnoReport = await agnoClient.generateReport(user, allFilteredJobs);

  if (agnoReport) {
    // Print the Agno-generated Markdown report to terminal
    const divider = '─'.repeat(60);
    logger.info(
      `\n${divider}\n` +
      `[Agno ReportAgent] Report for ${user.name}:\n` +
      `${divider}\n${agnoReport}\n${divider}`
    );
    // Dispatch notifications using structured data from JS helper
    const reportData = reportGenerationAgent.generateReportData(user, allFilteredJobs);
    await notificationService.dispatch(user, reportData);
  } else {
    // Agno unavailable → use existing ANSI terminal report generator
    await reportGenerationAgent.generate(user, allFilteredJobs);
  }
};

// ─────────────────────────────────────────────────────────────
//  Cron setup
// ─────────────────────────────────────────────────────────────

/**
 * Start scheduler. Returns an object with stop() for clean shutdown.
 * Called once on server startup.
 */
const start = () => {
  // ── Cron A: Company refresh on configurable interval ───────
  const refreshExpression = `*/${REFRESH_INTERVAL_MINUTES} * * * *`;
  const refreshTask = cron.schedule(refreshExpression, async () => {
    try {
      await refreshAllCompanies();
    } catch (err) {
      logger.error(`[Scheduler] Company refresh error: ${err.message}`);
    }
  });

  // ── Cron B: User report dispatch every minute ───────────────
  const reportTask = cron.schedule('* * * * *', async () => {
    const currentTime = getCurrentHHMM();
    logger.info(`[Scheduler] ⏱  Tick at ${currentTime}`);

    try {
      const dueUsers = await User.find({ notifyTime: currentTime, active: true });

      if (dueUsers.length === 0) {
        logger.info(`[Scheduler] No users scheduled at ${currentTime}`);
        return;
      }

      logger.info(
        `[Scheduler] ${dueUsers.length} user(s) due at ${currentTime}: ` +
        dueUsers.map((u) => u.name).join(', ')
      );

      for (const user of dueUsers) {
        await processUser(user);
      }
    } catch (err) {
      logger.error(`[Scheduler] Fatal tick error: ${err.message}`);
    }
  });

  logger.info(
    `✅ Scheduler started\n` +
    `   📊 Company refresh: every ${REFRESH_INTERVAL_MINUTES} minute(s)\n` +
    `   📬 User reports   : every minute (per notifyTime)`
  );

  return {
    stop: () => {
      refreshTask.stop();
      reportTask.stop();
      logger.info('[Scheduler] Stopped.');
    },
  };
};

module.exports = { start, processUser, refreshAllCompanies };

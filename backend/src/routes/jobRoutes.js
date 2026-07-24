/**
 * Job routes – view and manage cached company job data.
 *
 * GET  /api/jobs              – List all cached company records
 * GET  /api/jobs/:company     – Get cached jobs for a specific company
 * POST /api/jobs/:company/refresh – Force a scrape refresh for a company
 */

const express = require('express');
const router = express.Router();
const CompanyJob = require('../models/CompanyJob');
const companyDataCheckerAgent = require('../agents/companyDataCheckerAgent');
const logger = require('../config/logger');

// ── GET /api/jobs ────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const records = await CompanyJob.find()
      .select('company companyDisplayName careersUrl scrapeStatus lastUpdated jobs')
      .sort({ lastUpdated: -1 });

    const summary = records.map((r) => ({
      company: r.companyDisplayName || r.company,
      careersUrl: r.careersUrl,
      jobCount: r.jobs?.length ?? 0,
      scrapeStatus: r.scrapeStatus,
      lastUpdated: r.lastUpdated,
    }));

    res.json({ success: true, count: summary.length, data: summary });
  } catch (err) {
    logger.error(`[JobRoutes] GET /api/jobs: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/jobs/:company ───────────────────────────────────

router.get('/:company', async (req, res) => {
  try {
    const key = req.params.company.toLowerCase().trim();
    const record = await CompanyJob.findOne({ company: key });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `No cached data found for company "${req.params.company}"`,
      });
    }

    res.json({
      success: true,
      data: {
        company: record.companyDisplayName || record.company,
        careersUrl: record.careersUrl,
        scrapeStatus: record.scrapeStatus,
        lastUpdated: record.lastUpdated,
        jobCount: record.jobs?.length ?? 0,
        jobs: record.jobs,
      },
    });
  } catch (err) {
    logger.error(`[JobRoutes] GET /api/jobs/${req.params.company}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/jobs/:company/refresh ──────────────────────────
// Forces an immediate scrape refresh, bypassing the 6-hour cache.

router.post('/:company/refresh', async (req, res) => {
  const companyName = req.params.company;
  logger.info(`[JobRoutes] Force refresh requested for: ${companyName}`);

  try {
    // Invalidate lastUpdated so the checker always re-scrapes
    await CompanyJob.findOneAndUpdate(
      { company: companyName.toLowerCase().trim() },
      { $set: { lastUpdated: null, scrapeStatus: 'pending' } }
    );

    // Run the checker in the background (don't block the response)
    companyDataCheckerAgent.check(companyName).catch((err) => {
      logger.error(`[JobRoutes] Refresh error for "${companyName}": ${err.message}`);
    });

    res.json({
      success: true,
      message: `Scrape refresh started for "${companyName}". ` +
               `Check /api/jobs/${companyName.toLowerCase()} for results.`,
    });
  } catch (err) {
    logger.error(`[JobRoutes] POST /api/jobs/${companyName}/refresh: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

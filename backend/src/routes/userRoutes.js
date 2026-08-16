/**
 * User routes – CRUD for user preferences + manual report trigger.
 *
 * POST   /api/users              – Create user
 * GET    /api/users              – List all users
 * GET    /api/users/:id          – Get single user
 * PUT    /api/users/:id          – Update user
 * DELETE /api/users/:id          – Delete user (hard) or deactivate (soft)
 * POST   /api/users/:id/trigger  – Manually trigger report for this user now
 */

const express = require('express');
const router = express.Router();
const userPreferenceAgent = require('../agents/userPreferenceAgent');
const schedulerAgent = require('../agents/schedulerAgent');
const logger = require('../config/logger');

// ── POST /api/users ──────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    if (Array.isArray(req.body.companyConfigs) && req.body.companyConfigs.length > 0) {
      if (!req.body.companies || req.body.companies.length === 0) {
        req.body.companies = req.body.companyConfigs.map(c => c.company);
      }
      if (!req.body.desiredRole && req.body.companyConfigs[0]?.role) {
        req.body.desiredRole = req.body.companyConfigs[0].role;
      }
    }
    const user = await userPreferenceAgent.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err) {
    logger.error(`[UserRoutes] POST /api/users: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── GET /api/users ───────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    // ?active=true|false filter
    const query = {};
    if (req.query.active !== undefined) {
      query.active = req.query.active === 'true';
    }

    const users = await userPreferenceAgent.getAllUsers(query);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    logger.error(`[UserRoutes] GET /api/users: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/users/:id ───────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const user = await userPreferenceAgent.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error(`[UserRoutes] GET /api/users/${req.params.id}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/:id ───────────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    if (Array.isArray(req.body.companyConfigs) && req.body.companyConfigs.length > 0) {
      req.body.companies = req.body.companyConfigs.map(c => c.company);
      if (!req.body.desiredRole && req.body.companyConfigs[0]?.role) {
        req.body.desiredRole = req.body.companyConfigs[0].role;
      }
    }
    const user = await userPreferenceAgent.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User updated', data: user });
  } catch (err) {
    logger.error(`[UserRoutes] PUT /api/users/${req.params.id}: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const hard = req.query.hard === 'true';
    const user = await userPreferenceAgent.deleteUser(req.params.id, hard);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const msg = hard ? 'User permanently deleted' : 'User deactivated';
    res.json({ success: true, message: msg });
  } catch (err) {
    logger.error(`[UserRoutes] DELETE /api/users/${req.params.id}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/users/:id/trigger ──────────────────────────────
// Manually fire the full report pipeline for a user right now.
// Useful for testing without waiting for the scheduled time.

router.post('/:id/trigger', async (req, res) => {
  try {
    const user = await userPreferenceAgent.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info(`[UserRoutes] Manual trigger for user: ${user.name}`);

    // Fire and return immediately; pipeline logs appear in terminal
    schedulerAgent.processUser(user).catch((err) => {
      logger.error(`[UserRoutes] Trigger pipeline error for ${user.name}: ${err.message}`);
    });

    res.json({
      success: true,
      message: `Report pipeline triggered for ${user.name}. Check the terminal for output.`,
    });
  } catch (err) {
    logger.error(`[UserRoutes] POST /api/users/${req.params.id}/trigger: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/users/:id/jobs ──────────────────────────────────
// Returns filtered jobs for this user from the cached CompanyJobs collection.
// Uses jobFilteringAgent — no scraping triggered, reads DB only.

router.get('/:id/jobs', async (req, res) => {
  try {
    const user = await userPreferenceAgent.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const CompanyJob = require('../models/CompanyJob');
    const jobFilteringAgent = require('../agents/jobFilteringAgent');

    const results = [];
    let totalJobs = 0;

    for (const companyName of user.companies) {
      const key = companyName.trim().toLowerCase();
      const record = await CompanyJob.findOne({ company: key });

      if (!record || !record.jobs?.length) {
        results.push({
          company: companyName,
          companyKey: key,
          careersUrl: record?.careersUrl || null,
          scrapeStatus: record?.scrapeStatus || 'pending',
          lastUpdated: record?.lastUpdated || null,
          jobCount: 0,
          matchedCount: 0,
          jobs: [],
        });
        continue;
      }

      const plainJobs = record.toObject ? record.toObject().jobs : record.jobs;
      const matched = jobFilteringAgent.filter(plainJobs, user, companyName);

      const tagged = matched.map((job) => ({
        company: record.companyDisplayName || companyName,
        title: job.title || 'Untitled Position',
        location: job.location || 'Not specified',
        experience: job.experience || 'Not specified',
        employmentType: job.employmentType || 'Not specified',
        description: job.description || '',
        applyLink: job.applyLink || '',
        postedDate: job.postedDate || null,
        jobId: job.jobId || null,
      }));

      totalJobs += tagged.length;

      results.push({
        company: record.companyDisplayName || companyName,
        companyKey: key,
        careersUrl: record.careersUrl || null,
        scrapeStatus: record.scrapeStatus,
        lastUpdated: record.lastUpdated,
        jobCount: plainJobs.length,
        matchedCount: tagged.length,
        jobs: tagged,
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        desiredRole: user.desiredRole,
        companies: user.companies,
        companyConfigs: user.companyConfigs || [],
        filters: user.filters,
        notifyTime: user.notifyTime,
        active: user.active,
      },
      summary: {
        totalMatched: totalJobs,
        companiesScanned: results.length,
        companiesWithMatches: results.filter((r) => r.matchedCount > 0).length,
      },
      results,
    });

  } catch (err) {
    logger.error(`[UserRoutes] GET /api/users/${req.params.id}/jobs: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


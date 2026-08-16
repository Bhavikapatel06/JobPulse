/**
 * Auth routes – simple email-based login (no passwords, internal tool).
 *
 * POST /api/auth/login   – lookup by email, return user + role
 * POST /api/auth/logout  – client-side only, but endpoint for completeness
 */

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const logger  = require('../config/logger');

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found for this email. Contact your admin.' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, error: 'Your account is deactivated. Contact an admin.' });
    }

    logger.info(`[Auth] Login: ${user.name} <${user.email}> (role: ${user.role || 'user'})`);

    res.json({
      success: true,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role || 'user',
        desiredRole: user.desiredRole,
        companies:   user.companies,
        filters:     user.filters,
        notifyTime:  user.notifyTime,
        active:      user.active,
      },
    });
  } catch (err) {
    logger.error(`[Auth] Login error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', (_req, res) => {
  // Session is localStorage-based on client; nothing to do server-side
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;

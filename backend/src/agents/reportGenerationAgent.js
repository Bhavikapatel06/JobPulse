/**
 * ─────────────────────────────────────────────────────────────
 *  Report Generation Agent
 * ─────────────────────────────────────────────────────────────
 *  Produces a rich, ANSI-coloured terminal report for a user.
 *
 *  Also exposes `generateReportData()` which returns a plain
 *  object – this is the contract that future Email / WhatsApp
 *  notification adapters will consume.
 */

const { getFormattedDateTime } = require('../utils/timeUtils');
const notificationService = require('../notifications/notificationService');
const logger = require('../config/logger');

// ─── ANSI helpers ────────────────────────────────────────────

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  red:     '\x1b[31m',
  white:   '\x1b[37m',
};

const c  = (color, text) => `${C[color]}${text}${C.reset}`;
const b  = (text) => `${C.bold}${text}${C.reset}`;
const dim = (text) => `${C.dim}${text}${C.reset}`;

const LINE        = '─'.repeat(72);
const DOUBLE_LINE = '═'.repeat(72);

// ─── Report builder ──────────────────────────────────────────

/**
 * Generates and prints a terminal report, then dispatches
 * to the notification service stub.
 *
 * @param {object}   user         – Mongoose User document
 * @param {object[]} filteredJobs – Jobs already filtered, each with a `company` field
 * @returns {Promise<object>}     Plain report data object
 */
const generate = async (user, filteredJobs) => {
  const timestamp = getFormattedDateTime();
  const lines = [];

  // ── Header ───────────────────────────────────────────────
  lines.push('');
  lines.push(c('cyan', `╔${DOUBLE_LINE}╗`));

  const headerTitle = `  📋  JobPulse – Job Report for ${user.name}`;
  lines.push(c('cyan', '║') + b(headerTitle.padEnd(72)) + c('cyan', '║'));

  const headerSub = `  🕐  Generated: ${timestamp}`;
  lines.push(c('cyan', '║') + dim(headerSub.padEnd(72)) + c('cyan', '║'));

  lines.push(c('cyan', `╚${DOUBLE_LINE}╝`));
  lines.push('');

  // ── Search summary ───────────────────────────────────────
  lines.push(`  🔍  ${b('Role:')} ${user.desiredRole}   ${b('|')}   ${b('Companies:')} ${user.companies.join(', ')}`);
  if (user.filters?.location) {
    lines.push(`  📍  ${b('Location filter:')} ${user.filters.location}`);
  }
  if (user.filters?.experienceLevel) {
    lines.push(`  🏆  ${b('Experience filter:')} ${user.filters.experienceLevel}`);
  }
  lines.push('');

  // ── No results ───────────────────────────────────────────
  if (!filteredJobs || filteredJobs.length === 0) {
    lines.push(c('yellow', '  ⚠️   No matching jobs found based on your preferences.'));
    lines.push(dim('  Tip: Try broadening your role keyword or removing location/experience filters.'));
    lines.push('');
    console.log(lines.join('\n'));
    logger.info(`[ReportAgent] Report for ${user.name}: 0 jobs found`);
    const reportData = generateReportData(user, []);
    await notificationService.dispatch(user, reportData);
    return reportData;
  }

  // ── Group jobs by company ────────────────────────────────
  const byCompany = {};
  for (const job of filteredJobs) {
    const key = job.company || 'Unknown';
    if (!byCompany[key]) byCompany[key] = [];
    byCompany[key].push(job);
  }

  let jobIndex = 1;
  for (const [company, jobs] of Object.entries(byCompany)) {
    // Company header
    lines.push(c('cyan', LINE));
    lines.push(
      `  ${c('yellow', '📌')}  ${b(c('yellow', company.toUpperCase()))}  ` +
      `${dim('•')}  ${c('green', `${jobs.length} matching job${jobs.length !== 1 ? 's' : ''}`)}`
    );
    lines.push(c('cyan', LINE));
    lines.push('');

    for (const job of jobs) {
      // Job entry
      lines.push(`  ${c('cyan', `[${jobIndex}]`)}  ${b(job.title)}`);
      lines.push(`       ${dim('📍')}  ${job.location || 'Location not specified'}`);

      if (job.experience && job.experience !== 'Not specified') {
        lines.push(`       ${dim('🏷️ ')}  Experience: ${job.experience}`);
      }

      if (job.description) {
        const desc =
          job.description.length > 140
            ? job.description.substring(0, 137) + '...'
            : job.description;
        lines.push(`       ${dim('📝')}  ${dim(desc)}`);
      }

      lines.push(`       ${c('blue', '🔗')}  ${c('blue', job.applyLink || 'N/A')}`);

      if (job.postedDate) {
        lines.push(`       ${dim('📅')}  Posted: ${dim(job.postedDate)}`);
      }

      lines.push('');
      jobIndex++;
    }
  }

  // ── Footer ───────────────────────────────────────────────
  const totalCompanies = Object.keys(byCompany).length;
  lines.push(c('cyan', LINE));
  lines.push(
    `  ${c('green', '✅')}  Report complete. ` +
    `Total: ${b(String(filteredJobs.length))} job${filteredJobs.length !== 1 ? 's' : ''} ` +
    `across ${b(String(totalCompanies))} compan${totalCompanies !== 1 ? 'ies' : 'y'}.`
  );
  lines.push(c('cyan', LINE));
  lines.push('');

  // Print to terminal
  console.log(lines.join('\n'));

  logger.info(
    `[ReportAgent] Report for ${user.name}: ${filteredJobs.length} job(s) across ${totalCompanies} company(ies)`
  );

  // Build structured data and dispatch to notification stub
  const reportData = generateReportData(user, filteredJobs);
  await notificationService.dispatch(user, reportData);
  return reportData;
};

// ─── Structured report data (for notifications) ──────────────

/**
 * Returns a plain object representing the report.
 * Future notification adapters (Email, WhatsApp) should consume this.
 *
 * @param {object}   user
 * @param {object[]} filteredJobs
 * @returns {object}
 */
const generateReportData = (user, filteredJobs) => {
  const byCompany = {};
  for (const job of filteredJobs) {
    const key = job.company || 'Unknown';
    if (!byCompany[key]) byCompany[key] = [];
    byCompany[key].push(job);
  }

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    preferences: {
      companies: user.companies,
      desiredRole: user.desiredRole,
      filters: user.filters,
    },
    summary: {
      totalJobs: filteredJobs.length,
      companiesCount: Object.keys(byCompany).length,
    },
    results: Object.entries(byCompany).map(([company, jobs]) => ({
      company,
      jobCount: jobs.length,
      jobs,
    })),
  };
};

module.exports = { generate, generateReportData };

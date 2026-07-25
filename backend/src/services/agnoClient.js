/**
 * ─────────────────────────────────────────────────────────────
 *  Agno Client
 * ─────────────────────────────────────────────────────────────
 *  Thin HTTP client that communicates with the Agno Python
 *  microservice (FastAPI + Uvicorn, default: http://localhost:8000).
 *
 *  Endpoints consumed:
 *    POST /verify  – VerifierAgent (rule-based, 0 tokens)
 *    POST /report  – ReportAgent   (Agno + Groq LLM)
 *
 *  Graceful Degradation:
 *    If the Agno service is unreachable, times out, or returns
 *    a non-2xx response, each method returns null.
 *    The caller must fall back to its existing JS implementation.
 *
 *  Adding future agents:
 *    1. Add a new method below (e.g. resumeMatch, careerAdvice).
 *    2. Call it from the appropriate Node.js agent.
 *    No other files need to change here.
 */

const axios = require('axios');
const logger = require('../config/logger');

const BASE_URL    = (process.env.AGNO_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT_MS  = parseInt(process.env.AGNO_TIMEOUT_MS || '30000', 10);
const HEALTH_TIMEOUT_MS = 5000;

// Single shared axios instance for connection pooling
const _client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Map Axios error to a human-readable reason string.
 * @param {Error} err
 * @returns {string}
 */
const _errorReason = (err) => {
  if (err.code === 'ECONNREFUSED') return 'Agno service not running';
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return 'Agno service timed out';
  return err.response?.data?.detail || err.message || 'unknown error';
};

// ─────────────────────────────────────────────────────────────
//  Health Check
// ─────────────────────────────────────────────────────────────

/**
 * Check whether the Agno service is reachable.
 * @returns {Promise<boolean>}
 */
const isHealthy = async () => {
  try {
    const res = await _client.get('/health', { timeout: HEALTH_TIMEOUT_MS });
    return res.data?.status === 'ok';
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────
//  VerifierAgent
// ─────────────────────────────────────────────────────────────

/**
 * Send raw scraped jobs to the Agno VerifierAgent for
 * rule-based validation, normalisation, and deduplication.
 *
 * Uses 0 LLM tokens — the Python service applies deterministic rules:
 *   • Reject junk titles (navigation items, empty strings)
 *   • Validate absolute HTTP/HTTPS apply links
 *   • Normalise location abbreviations and whitespace
 *   • Deduplicate by SHA-256(title + applyLink)
 *
 * @param {object[]} rawJobs    – Raw job objects from ScrapingAgent
 * @param {string}   company    – Company display name (for logging)
 * @param {string}   careersUrl – Fallback URL for invalid applyLinks
 * @returns {Promise<object[]|null>} Verified jobs, or null on failure
 */
const verify = async (rawJobs, company = '', careersUrl = '') => {
  try {
    logger.info(`[AgnoClient] → POST /verify  "${company}" (${rawJobs.length} raw jobs)`);

    const res = await _client.post('/verify', {
      raw_jobs:    rawJobs,
      company,
      careers_url: careersUrl,
    });

    const { verified_jobs, removed_count, duration_ms, reason_summary } = res.data;

    logger.info(
      `[AgnoClient] ✅ VerifierAgent: ${verified_jobs.length} verified, ` +
      `${removed_count} removed, ${duration_ms}ms — ${reason_summary}`
    );

    return verified_jobs;

  } catch (err) {
    logger.warn(
      `[AgnoClient] ⚠️  VerifierAgent unavailable for "${company}": ` +
      `${_errorReason(err)}. Falling back to JS verifier.`
    );
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
//  ReportAgent
// ─────────────────────────────────────────────────────────────

/**
 * Send pre-filtered jobs to the Agno ReportAgent to generate
 * a Markdown job report using Groq.
 *
 * The Agno service enforces a strict "never hallucinate" prompt.
 * Falls back to a plain-text summary if the LLM call fails.
 *
 * @param {object}   user         – User document (name, desiredRole, companies, filters)
 * @param {object[]} filteredJobs – Jobs already filtered by FilteringAgent, each with a `company` field
 * @returns {Promise<string|null>} Markdown report string, or null on failure
 */
const generateReport = async (user, filteredJobs) => {
  try {
    logger.info(
      `[AgnoClient] → POST /report  "${user.name}" (${filteredJobs.length} filtered jobs)`
    );

    const res = await _client.post('/report', {
      user: {
        name:        user.name,
        email:       user.email,
        desiredRole: user.desiredRole,
        companies:   user.companies,
        filters:     user.filters || {},
      },
      filtered_jobs: filteredJobs,
    });

    const { report, total_jobs, duration_ms } = res.data;

    logger.info(
      `[AgnoClient] ✅ ReportAgent: report for "${user.name}" ` +
      `(${total_jobs} jobs, ${duration_ms}ms)`
    );

    return report;

  } catch (err) {
    logger.warn(
      `[AgnoClient] ⚠️  ReportAgent unavailable for "${user.name}": ` +
      `${_errorReason(err)}. Falling back to JS report generator.`
    );
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
//  Future agent slots
// ─────────────────────────────────────────────────────────────
// To add ResumeMatchAgent:
//   const resumeMatch = async (resume, jobs) => { ... POST /resume-match ... };
//   module.exports = { ..., resumeMatch };

module.exports = { verify, generateReport, isHealthy };

/**
 * ATS Detector & Parser Registry
 *
 * Detects the ATS provider from the URL or HTML content,
 * then maps to the corresponding parser.
 *
 * Supported:
 *  - Greenhouse
 *  - Lever
 *  - Workday
 *  - Ashby
 *  - SmartRecruiters
 *  - BambooHR
 *  - Generic
 */

const greenhouseParser = require('./greenhouse');
const leverParser = require('./lever');
const workdayParser = require('./workday');
const ashbyParser = require('./ashby');
const smartrecruitersParser = require('./smartrecruiters');
const bamboohrParser = require('./bamboohr');
const genericParser = require('./generic');
const logger = require('../config/logger');

const PARSERS = {
  greenhouse:      { name: 'GreenhouseParser',      module: greenhouseParser },
  lever:           { name: 'LeverParser',           module: leverParser },
  workday:         { name: 'WorkdayParser',         module: workdayParser },
  ashby:           { name: 'AshbyParser',           module: ashbyParser },
  smartrecruiters: { name: 'SmartRecruitersParser', module: smartrecruitersParser },
  bamboohr:        { name: 'BambooHRParser',        module: bamboohrParser },
  generic:         { name: 'GenericParser',         module: genericParser },
};

/**
 * Detect ATS provider from URL patterns and HTML content
 * @param {string} url
 * @param {string} html
 * @returns {string} ATS key ('greenhouse' | 'lever' | 'workday' | 'ashby' | 'smartrecruiters' | 'bamboohr' | 'generic')
 */
const detectATS = (url = '', html = '') => {
  const lowerUrl = url.toLowerCase();
  const lowerHtml = (html || '').toLowerCase();

  // 1. URL pattern matching (highest confidence)
  if (lowerUrl.includes('greenhouse.io')) return 'greenhouse';
  if (lowerUrl.includes('lever.co')) return 'lever';
  if (lowerUrl.includes('myworkdayjobs.com') || lowerUrl.includes('workday.com')) return 'workday';
  if (lowerUrl.includes('ashbyhq.com')) return 'ashby';
  if (lowerUrl.includes('smartrecruiters.com')) return 'smartrecruiters';
  if (lowerUrl.includes('bamboohr.com')) return 'bamboohr';

  // 2. HTML fingerprint matching
  if (lowerHtml.includes('greenhouse.io') || lowerHtml.includes('grnhse')) return 'greenhouse';
  if (lowerHtml.includes('jobs.lever.co') || lowerHtml.includes('posting-btn-submit')) return 'lever';
  if (lowerHtml.includes('data-automation-id="jobfounddescription"') || lowerHtml.includes('workday')) return 'workday';
  if (lowerHtml.includes('ashby-job-posting') || lowerHtml.includes('ashbyhq')) return 'ashby';
  if (lowerHtml.includes('smartrecruiters') || lowerHtml.includes('smart-widget')) return 'smartrecruiters';
  if (lowerHtml.includes('bamboohr-ats') || lowerHtml.includes('bamboohr')) return 'bamboohr';

  return 'generic';
};

/**
 * Parse job listings using detected ATS parser
 * @param {string} html
 * @param {string} careersUrl
 * @returns {Promise<{ jobs: object[], ats: string, parserName: string }>}
 */
const parseJobs = async (html, careersUrl) => {
  const ats = detectATS(careersUrl, html);
  const parserObj = PARSERS[ats] || PARSERS.generic;

  logger.info(`[ScrapingAgent] ATS detected: ${ats}`);
  logger.info(`[ScrapingAgent] Parser used: ${parserObj.name}`);

  const jobs = await parserObj.module.parse(html, careersUrl);
  logger.info(`[ScrapingAgent] Number of jobs extracted: ${jobs.length}`);

  return { jobs, ats, parserName: parserObj.name };
};

module.exports = { detectATS, parseJobs, PARSERS };

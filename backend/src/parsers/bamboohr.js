/**
 * BambooHR ATS Parser
 * Supports BambooHR job boards (e.g. https://company.bamboohr.com/careers)
 */

const cheerio = require('cheerio');
const axios = require('axios');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

const getSubdomain = (careersUrl) => {
  try {
    const parsed = new URL(careersUrl);
    if (parsed.hostname.includes('bamboohr.com')) {
      return parsed.hostname.split('.')[0];
    }
  } catch {}
  return null;
};

const parseViaApi = async (subdomain, careersUrl) => {
  try {
    const apiUrl = `https://${subdomain}.bamboohr.com/careers/list`;
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const postings = res.data?.result;

    if (!Array.isArray(postings) || postings.length === 0) return [];

    const jobs = postings.map((p) => {
      const title = (p.jobOpeningName || p.title || '').trim();
      const jobId = p.id || p.jobOpeningId;
      const applyLink = `https://${subdomain}.bamboohr.com/careers/${jobId}`;
      const location = p.location?.city ? `${p.location.city}, ${p.location.state || p.location.country}` : 'Not specified';
      const department = p.departmentLabel || p.department || 'Not specified';
      const employmentType = p.employmentType || 'Full-time';

      return {
        jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
        title,
        location,
        department,
        experience: 'Not specified',
        employmentType,
        description: '',
        applyLink,
        postedDate: null,
      };
    });

    logger.info(`[BambooHRParser] API extracted ${jobs.length} job(s) for "${subdomain}"`);
    return jobs.filter((j) => j.title && j.title.length > 2);
  } catch (err) {
    logger.debug(`[BambooHRParser] API fetch failed for "${subdomain}": ${err.message}`);
    return [];
  }
};

const parseViaHtml = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const jobs = [];

  $('a[href*="/careers/"], .jss-res, [class*="Job"]').each((_, el) => {
    const $el = $(el);
    const title = $el.text().trim();
    if (!title || title.length < 2) return;

    const href = $el.attr('href');
    let applyLink = careersUrl;
    if (href) {
      try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
    }

    jobs.push({
      jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
      title,
      location: 'Not specified',
      department: 'Not specified',
      experience: 'Not specified',
      employmentType: 'Not specified',
      description: '',
      applyLink,
      postedDate: null,
    });
  });

  logger.info(`[BambooHRParser] DOM extracted ${jobs.length} job(s) from HTML`);
  return jobs;
};

const parse = async (html, careersUrl) => {
  const subdomain = getSubdomain(careersUrl);
  if (subdomain) {
    const apiJobs = await parseViaApi(subdomain, careersUrl);
    if (apiJobs.length > 0) return apiJobs;
  }
  return parseViaHtml(html, careersUrl);
};

module.exports = { parse };

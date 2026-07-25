/**
 * Ashby ATS Parser
 * Supports Ashby job boards (e.g. https://jobs.ashbyhq.com/linear)
 */

const cheerio = require('cheerio');
const axios = require('axios');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

const getCompanySlug = (careersUrl) => {
  try {
    const parsed = new URL(careersUrl);
    if (parsed.hostname.includes('ashbyhq.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
  } catch {}
  return null;
};

const parseViaApi = async (companySlug, careersUrl) => {
  try {
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`;
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const postings = res.data?.jobs;

    if (!Array.isArray(postings) || postings.length === 0) return [];

    const jobs = postings.map((p) => {
      const title = (p.title || '').trim();
      const applyLink = p.jobUrl || `${careersUrl}/${p.id}`;
      const location = p.location || p.locationName || 'Not specified';
      const department = p.department || 'Not specified';
      const employmentType = p.employmentType || 'Full-time';
      const postedDate = p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : null;

      return {
        jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
        title,
        location,
        department,
        experience: 'Not specified',
        employmentType,
        description: '',
        applyLink,
        postedDate,
      };
    });

    logger.info(`[AshbyParser] API extracted ${jobs.length} job(s) for "${companySlug}"`);
    return jobs.filter((j) => j.title && j.title.length > 2);
  } catch (err) {
    logger.debug(`[AshbyParser] API fetch failed for "${companySlug}": ${err.message}`);
    return [];
  }
};

const parseViaHtml = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const jobs = [];

  $('a[href*="/posting/"], a[class*="ashby"]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h3, h4, [class*="title"]').first().text().trim() || $el.text().trim();
    if (!title || title.length < 2) return;

    const href = $el.attr('href');
    let applyLink = careersUrl;
    if (href) {
      try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
    }

    const location = $el.find('[class*="location"]').text().trim() || 'Not specified';

    jobs.push({
      jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
      title,
      location,
      department: 'Not specified',
      experience: 'Not specified',
      employmentType: 'Not specified',
      description: '',
      applyLink,
      postedDate: null,
    });
  });

  logger.info(`[AshbyParser] DOM extracted ${jobs.length} job(s) from HTML`);
  return jobs;
};

const parse = async (html, careersUrl) => {
  const slug = getCompanySlug(careersUrl);
  if (slug) {
    const apiJobs = await parseViaApi(slug, careersUrl);
    if (apiJobs.length > 0) return apiJobs;
  }
  return parseViaHtml(html, careersUrl);
};

module.exports = { parse };

/**
 * Lever ATS Parser
 * Supports Lever job boards (e.g. https://jobs.lever.co/meesho)
 */

const cheerio = require('cheerio');
const axios = require('axios');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

/**
 * Extract company slug from Lever URL
 * e.g. https://jobs.lever.co/meesho -> meesho
 */
const getCompanySlug = (careersUrl) => {
  try {
    const parsed = new URL(careersUrl);
    if (parsed.hostname.includes('lever.co')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
  } catch {}
  return null;
};

/**
 * Lever API fetcher (0 AI tokens, returns rich JSON data)
 */
const parseViaApi = async (companySlug, careersUrl) => {
  try {
    const apiUrl = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const postings = res.data;

    if (!Array.isArray(postings) || postings.length === 0) return [];

    const jobs = postings.map((p) => {
      const title = (p.text || '').trim();
      const applyLink = p.hostedUrl || p.applyUrl || careersUrl;
      const location = p.categories?.location || p.workplaceType || 'Not specified';
      const department = p.categories?.team || p.categories?.department || 'Not specified';
      const employmentType = p.categories?.commitment || 'Full-time';
      const description = (p.descriptionPlain || p.description || '').substring(0, 300);
      const postedDate = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : null;

      return {
        jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
        title,
        location,
        department,
        experience: 'Not specified',
        employmentType,
        description,
        applyLink,
        postedDate,
      };
    });

    logger.info(`[LeverParser] API extracted ${jobs.length} job(s) for "${companySlug}"`);
    return jobs.filter((j) => j.title && j.title.length > 2);
  } catch (err) {
    logger.debug(`[LeverParser] API fetch failed for "${companySlug}": ${err.message}`);
    return [];
  }
};

/**
 * Lever HTML DOM parser (fallback if API is disabled/blocked)
 */
const parseViaHtml = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const jobs = [];

  $('.posting').each((_, el) => {
    const $el = $(el);

    const title =
      $el.find('h5[data-qa="posting-name"]').text().trim() ||
      $el.find('.posting-name, h5').first().text().trim();

    if (!title || title.length < 2) return;

    // Apply Link: look for a.posting-title or any link with href containing the job ID
    let href =
      $el.find('a.posting-title, a.posting-btn-submit, a[href]').first().attr('href');

    let applyLink = careersUrl;
    if (href) {
      try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
    }

    const location =
      $el.find('.location, .sort-by-location').text().trim() ||
      $el.find('.posting-categories').text().trim() ||
      'Not specified';

    const department =
      $el.find('.department, .sort-by-team').text().trim() || 'Not specified';

    const employmentType =
      $el.find('.commitment, .sort-by-commitment').text().trim() || 'Not specified';

    jobs.push({
      jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
      title,
      location: location || 'Not specified',
      department: department || 'Not specified',
      experience: 'Not specified',
      employmentType: employmentType || 'Not specified',
      description: '',
      applyLink,
      postedDate: null,
    });
  });

  logger.info(`[LeverParser] DOM extracted ${jobs.length} job(s) from HTML`);
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

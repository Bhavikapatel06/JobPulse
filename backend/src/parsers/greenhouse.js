/**
 * Greenhouse ATS Parser
 * Supports Greenhouse job boards (e.g. https://boards.greenhouse.io/figma)
 */

const cheerio = require('cheerio');
const axios = require('axios');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

const getCompanySlug = (careersUrl) => {
  try {
    const parsed = new URL(careersUrl);
    if (parsed.hostname.includes('greenhouse.io')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
  } catch {}
  return null;
};

const parseViaApi = async (companySlug, careersUrl) => {
  try {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs?content=true`;
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const postings = res.data?.jobs;

    if (!Array.isArray(postings) || postings.length === 0) return [];

    const jobs = postings.map((p) => {
      const title = (p.title || '').trim();
      const applyLink = p.absolute_url || careersUrl;
      const location = p.location?.name || 'Not specified';
      const department = p.departments?.[0]?.name || 'Not specified';
      const description = (p.content || '').replace(/<[^>]*>?/gm, '').substring(0, 300);
      const postedDate = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : null;

      return {
        jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
        title,
        location,
        department,
        experience: 'Not specified',
        employmentType: 'Full-time',
        description,
        applyLink,
        postedDate,
      };
    });

    logger.info(`[GreenhouseParser] API extracted ${jobs.length} job(s) for "${companySlug}"`);
    return jobs.filter((j) => j.title && j.title.length > 2);
  } catch (err) {
    logger.debug(`[GreenhouseParser] API fetch failed for "${companySlug}": ${err.message}`);
    return [];
  }
};

const parseViaHtml = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const jobs = [];

  $('.opening').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a').first();

    const title = $a.text().trim();
    if (!title || title.length < 2) return;

    const href = $a.attr('href');
    let applyLink = careersUrl;
    if (href) {
      try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
    }

    const location = $el.find('.location').text().trim() || 'Not specified';
    const department = $el.closest('section').find('h2, h3').first().text().trim() || 'Not specified';

    jobs.push({
      jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
      title,
      location,
      department,
      experience: 'Not specified',
      employmentType: 'Not specified',
      description: '',
      applyLink,
      postedDate: null,
    });
  });

  logger.info(`[GreenhouseParser] DOM extracted ${jobs.length} job(s) from HTML`);
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

/**
 * SmartRecruiters ATS Parser
 * Supports SmartRecruiters job boards (e.g. https://jobs.smartrecruiters.com/LVMH)
 */

const cheerio = require('cheerio');
const axios = require('axios');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

const getCompanySlug = (careersUrl) => {
  try {
    const parsed = new URL(careersUrl);
    if (parsed.hostname.includes('smartrecruiters.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
  } catch {}
  return null;
};

const parseViaApi = async (companySlug, careersUrl) => {
  try {
    const apiUrl = `https://api.smartrecruiters.com/v1/companies/${companySlug}/postings?limit=100`;
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const postings = res.data?.content;

    if (!Array.isArray(postings) || postings.length === 0) return [];

    const jobs = postings.map((p) => {
      const title = (p.name || '').trim();
      const applyLink = `https://jobs.smartrecruiters.com/${companySlug}/${p.id}`;
      const location = p.location?.city ? `${p.location.city}, ${p.location.country}` : (p.location?.region || 'Not specified');
      const department = p.department?.label || 'Not specified';
      const employmentType = p.typeOfEmployment?.label || 'Full-time';
      const postedDate = p.releasedDate ? new Date(p.releasedDate).toISOString().split('T')[0] : null;

      return {
        jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
        title,
        location,
        department,
        experience: p.experienceLevel?.label || 'Not specified',
        employmentType,
        description: '',
        applyLink,
        postedDate,
      };
    });

    logger.info(`[SmartRecruitersParser] API extracted ${jobs.length} job(s) for "${companySlug}"`);
    return jobs.filter((j) => j.title && j.title.length > 2);
  } catch (err) {
    logger.debug(`[SmartRecruitersParser] API fetch failed for "${companySlug}": ${err.message}`);
    return [];
  }
};

const parseViaHtml = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const jobs = [];

  $('.job-item, [class*="opening"], li[class*="job"]').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a').first();

    const title = $a.text().trim() || $el.find('h3, h4').first().text().trim();
    if (!title || title.length < 2) return;

    const href = $a.attr('href');
    let applyLink = careersUrl;
    if (href) {
      try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
    }

    const location = $el.find('.job-location, [class*="location"]').text().trim() || 'Not specified';

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

  logger.info(`[SmartRecruitersParser] DOM extracted ${jobs.length} job(s) from HTML`);
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

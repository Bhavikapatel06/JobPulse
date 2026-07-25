/**
 * Generic Parser
 * Phase 1: JSON-LD Schema.org JobPosting
 * Phase 2: Common generic CSS selectors
 */

const cheerio = require('cheerio');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

const extractFromJsonLd = (html, careersUrl) => {
  const jobs = [];
  try {
    const $ = cheerio.load(html);
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] !== 'JobPosting') continue;
          let applyLink = item.url || item.directApply?.url || careersUrl;
          if (applyLink && !applyLink.startsWith('http')) {
            try { applyLink = new URL(applyLink, careersUrl).href; } catch { applyLink = careersUrl; }
          }
          const title = (item.title || item.name || '').trim();
          if (!title) continue;
          jobs.push({
            jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
            title,
            location:
              item.jobLocation?.address?.addressLocality ||
              item.jobLocation?.address?.addressRegion ||
              item.jobLocation?.address?.addressCountry ||
              'Not specified',
            experience: item.experienceRequirements?.monthsOfExperience
              ? `${item.experienceRequirements.monthsOfExperience / 12} years`
              : item.experienceRequirements || 'Not specified',
            employmentType: item.employmentType || 'Not specified',
            description: (item.description || '').replace(/<[^>]*>?/gm, '').substring(0, 300),
            applyLink,
            postedDate: item.datePosted || null,
          });
        }
      } catch {}
    });
  } catch {}
  return jobs;
};

const extractFromGenericCss = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();

  const GENERIC_SELECTORS = [
    {
      root: 'li[class*="job"], div[class*="job-card"], article[class*="job"], [class*="career-card"], [class*="job-item"]',
      title: '[class*="title"], [class*="name"], h2, h3, h4',
      location: '[class*="location"], [class*="place"], [class*="city"]',
      applyLink: 'a[href]',
    },
  ];

  for (const sel of GENERIC_SELECTORS) {
    const roots = $(sel.root);
    if (roots.length === 0) continue;

    const jobs = [];
    roots.each((_, el) => {
      const $el = $(el);
      const title = sel.title
        ? $el.find(sel.title).first().text().trim()
        : $el.text().trim().split('\n')[0];

      if (!title || title.length < 3) return;

      const location = sel.location
        ? $el.find(sel.location).first().text().trim()
        : 'Not specified';

      let applyLink = careersUrl;
      const href = $el.find(sel.applyLink).first().attr('href');
      if (href) {
        try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
      }

      jobs.push({
        jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
        title,
        location: location || 'Not specified',
        experience: 'Not specified',
        employmentType: 'Not specified',
        description: '',
        applyLink,
        postedDate: null,
      });
    });

    if (jobs.length > 0) return jobs;
  }

  return [];
};

const parse = async (html, careersUrl) => {
  const jsonLd = extractFromJsonLd(html, careersUrl);
  if (jsonLd.length > 0) {
    logger.info(`[GenericParser] Extracted ${jsonLd.length} job(s) from JSON-LD`);
    return jsonLd;
  }

  const cssJobs = extractFromGenericCss(html, careersUrl);
  if (cssJobs.length > 0) {
    logger.info(`[GenericParser] Extracted ${cssJobs.length} job(s) from generic CSS`);
    return cssJobs;
  }

  return [];
};

module.exports = { parse };

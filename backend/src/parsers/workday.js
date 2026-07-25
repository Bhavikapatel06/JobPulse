/**
 * Workday ATS Parser
 * Supports Workday job sites (e.g. https://myworkdayjobs.com)
 */

const cheerio = require('cheerio');
const { sha256 } = require('../utils/hashUtils');
const logger = require('../config/logger');

const parse = async (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const jobs = [];

  $('[data-automation-id="jobFoundDescription"], li[class*="css-"], [data-automation-id="compositeHeader"]').each((_, el) => {
    const $el = $(el);

    const title =
      $el.find('[data-automation-id="jobTitle"], h3, a').first().text().trim() ||
      $el.find('a').first().text().trim();

    if (!title || title.length < 2) return;

    let href = $el.find('a[href]').first().attr('href');
    let applyLink = careersUrl;
    if (href) {
      try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
    }

    const location =
      $el.find('[data-automation-id="locations"], [class*="location"]').first().text().trim() ||
      'Not specified';

    const postedDate =
      $el.find('[data-automation-id="postedOn"]').first().text().trim() || null;

    jobs.push({
      jobId: sha256(`${title.toLowerCase()}_${applyLink.toLowerCase()}`),
      title,
      location,
      department: 'Not specified',
      experience: 'Not specified',
      employmentType: 'Not specified',
      description: '',
      applyLink,
      postedDate,
    });
  });

  logger.info(`[WorkdayParser] Extracted ${jobs.length} job(s) from Workday DOM`);
  return jobs;
};

module.exports = { parse };

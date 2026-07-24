/**
 * ─────────────────────────────────────────────────────────────
 *  Scraping Agent
 * ─────────────────────────────────────────────────────────────
 *
 *  Extraction priority (most → least AI credit usage):
 *
 *    Phase 1 — JSON-LD Schema.org JobPosting (0 tokens)
 *    Phase 2 — Common CSS Selector patterns  (0 tokens)
 *    Phase 3 — AI Fallback                   (minimal tokens)
 *              ↳ Only if Phase 1 & 2 both yield 0 jobs
 *              ↳ Text split into chunks ≤ 4000 chars
 *              ↳ Chunks deduplicated via SHA256 hash
 *              ↳ Chunks processed sequentially (never parallel)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const aiService = require('../services/aiService');
const { safeJsonParse } = require('../utils/textUtils');
const { sha256, deduplicateChunks } = require('../utils/hashUtils');
const logger = require('../config/logger');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const POLITE_DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || '2000', 10);
const AI_CHUNK_SIZE   = 4000;  // max chars per AI call
const AI_CHUNK_GAP_MS = 1500;  // gap between sequential AI calls

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
//  Phase 1: JSON-LD Extraction (0 tokens)
// ─────────────────────────────────────────────────────────────

/**
 * Parses Schema.org JobPosting objects from JSON-LD script tags.
 * Returns structured jobs immediately – no AI needed.
 */
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
          jobs.push({
            jobId: sha256(`${item.title || ''}${applyLink}`),
            title: (item.title || item.name || '').trim(),
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
      } catch { /* ignore individual script parse errors */ }
    });
  } catch { /* ignore outer parse errors */ }
  return jobs.filter((j) => j.title && j.title.length > 1);
};

// ─────────────────────────────────────────────────────────────
//  Phase 2: CSS Selector Extraction (0 tokens)
// ─────────────────────────────────────────────────────────────

// Known selector patterns for popular ATS and career platforms
const SELECTOR_SETS = [
  // Google Careers
  {
    root:        'li.lLd3Je, .sMn82b, [class*="job-card"]',
    title:       '.QJPWVe, h3, [class*="job-title"], [class*="title"]',
    location:    '.r0wTof, [class*="location"]',
    experience:  null,
    applyLink:   'a[href]',
  },
  // Greenhouse ATS
  {
    root:        '.opening',
    title:       'a',
    location:    '.location',
    experience:  null,
    applyLink:   'a',
  },
  // Lever ATS
  {
    root:        '.posting',
    title:       '.posting-name',
    location:    '.posting-categories .sort-by-location',
    experience:  null,
    applyLink:   '.posting-btn-submit, a[href*="apply"]',
  },
  // Workday
  {
    root:        '[data-automation-id="jobFoundDescription"], li[class*="css-"]',
    title:       '[data-automation-id="jobTitle"], h3',
    location:    '[data-automation-id="locations"]',
    experience:  null,
    applyLink:   'a[href]',
  },
  // Generic fallback selectors
  {
    root:        'li[class*="job"], div[class*="job-card"], article[class*="job"]',
    title:       '[class*="title"], [class*="name"], h2, h3',
    location:    '[class*="location"], [class*="place"]',
    experience:  '[class*="experience"], [class*="level"]',
    applyLink:   'a[href]',
  },
];

/**
 * Try each selector set in priority order. Returns jobs if any match.
 */
const extractFromSelectors = (html, careersUrl) => {
  const $ = cheerio.load(html);
  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();

  for (const sel of SELECTOR_SETS) {
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

      const experience = sel.experience
        ? $el.find(sel.experience).first().text().trim()
        : 'Not specified';

      let applyLink = careersUrl;
      if (sel.applyLink) {
        const href = $el.find(sel.applyLink).first().attr('href');
        if (href) {
          try { applyLink = new URL(href, origin || careersUrl).href; } catch { applyLink = href; }
        }
      }

      jobs.push({
        jobId:       sha256(`${title}${applyLink}`),
        title,
        location:    location || 'Not specified',
        experience:  experience || 'Not specified',
        employmentType: 'Not specified',
        description: '',
        applyLink,
        postedDate:  null,
      });
    });

    if (jobs.length > 0) {
      logger.info(`[ScrapingAgent] CSS selectors extracted ${jobs.length} job(s)`);
      return jobs;
    }
  }

  return [];
};

// ─────────────────────────────────────────────────────────────
//  Phase 3: AI Fallback (Minimal tokens, chunked & deduped)
// ─────────────────────────────────────────────────────────────

/**
 * Extract job card text elements from HTML, preserving embedded links.
 */
const extractJobCardsText = (html, careersUrl) => {
  const $ = cheerio.load(html);
  $('style, script, nav, header, footer, iframe, noscript, meta, svg, button').remove();

  const origin = (() => { try { return new URL(careersUrl).origin; } catch { return ''; } })();
  const cards = [];

  const selectors = [
    '[class*="job"]', '[class*="card"]', '[class*="listing"]',
    '[class*="result"]', 'article', 'li',
  ];

  $(selectors.join(', ')).each((_, el) => {
    const $el = $(el);
    let text = $el.text().replace(/\s+/g, ' ').trim();
    if (text.length < 20 || text.length > 2000) return;

    // Embed application link if present
    const $a = $el.find('a[href]').first();
    if ($a.length) {
      const href = $a.attr('href');
      if (href && !href.startsWith('javascript:')) {
        try { text += `\nApplication Link: ${new URL(href, origin || careersUrl).href}`; } catch { text += `\nApplication Link: ${href}`; }
      }
    }

    cards.push(text);
  });

  // Deduplicate by exact string
  const unique = [...new Set(cards)];

  if (unique.length > 0) {
    return unique.join('\n---\n');
  }

  // Fallback: full page links
  const links = [];
  $('a[href]').each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href');
    if (txt.length > 3 && href && !href.startsWith('javascript:')) {
      try { links.push(`"${txt}" → ${new URL(href, origin || careersUrl).href}`); } catch { links.push(`"${txt}" → ${href}`); }
    }
  });

  const body = $('body').text().replace(/\s+/g, ' ').trim();
  return `${body}\n\nExtracted Links:\n${links.slice(0, 60).join('\n')}`;
};

/**
 * Split text into chunks of ≤ maxChars, preferring natural break points.
 */
const splitIntoChunks = (text, maxChars = AI_CHUNK_SIZE) => {
  if (text.length <= maxChars) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) { chunks.push(remaining); break; }
    let pos = remaining.lastIndexOf('\n---', maxChars);
    if (pos < 1000) pos = remaining.lastIndexOf('\n', maxChars);
    if (pos < 500)  pos = maxChars;
    chunks.push(remaining.substring(0, pos).trim());
    remaining = remaining.substring(pos).trim();
  }
  return chunks;
};

/**
 * Parse job cards with AI. Chunks are deduped by SHA256.
 * Processed sequentially with polite delay.
 */
const parseWithAI = async (pageText, company, careersUrl) => {
  const rawChunks = splitIntoChunks(pageText, AI_CHUNK_SIZE);
  const seenHashes = new Set();
  const uniqueChunks = deduplicateChunks(rawChunks, seenHashes);

  logger.info(
    `[ScrapingAgent] AI fallback: ${rawChunks.length} chunks → ${uniqueChunks.length} unique after dedup`
  );

  const allJobs = [];

  for (let i = 0; i < uniqueChunks.length; i++) {
    const { chunk } = uniqueChunks[i];
    logger.info(`[ScrapingAgent] AI parsing chunk ${i + 1}/${uniqueChunks.length} (${chunk.length} chars)...`);

    const prompt =
      `You are an expert job listing extractor. Below is a text chunk from "${company}" careers page (${careersUrl}).\n\n` +
      `Extract every distinct job opening and return a raw JSON array.\n\n` +
      `Each object MUST have:\n` +
      `  "title"        : full job title (never "undefined" or empty)\n` +
      `  "location"     : location or "Not specified"\n` +
      `  "experience"   : experience requirement or "Not specified"\n` +
      `  "employmentType": e.g. "Full-time", "Contract", or "Not specified"\n` +
      `  "description"  : 1-2 sentence description or ""\n` +
      `  "applyLink"    : full direct application URL from the chunk, or "${careersUrl}"\n` +
      `  "postedDate"   : date string or null\n\n` +
      `Rules:\n` +
      `  - Return ONLY a raw JSON array: [{...}, ...]\n` +
      `  - If no jobs found in this chunk, return []\n` +
      `  - Never hallucinate jobs not present in the text\n\n` +
      `Text chunk:\n${chunk}`;

    try {
      const raw = await aiService.generateText(prompt);
      const jobs = safeJsonParse(raw, []);
      if (Array.isArray(jobs)) {
        for (const j of jobs) {
          if (!j?.title || j.title === 'undefined' || j.title.trim().length < 2) continue;
          let applyLink = j.applyLink || careersUrl;
          if (!applyLink.startsWith('http')) {
            try { applyLink = new URL(applyLink, careersUrl).href; } catch { applyLink = careersUrl; }
          }
          allJobs.push({
            jobId:         sha256(`${j.title.trim()}${applyLink}`),
            title:         j.title.trim(),
            location:      j.location || 'Not specified',
            experience:    j.experience || 'Not specified',
            employmentType:j.employmentType || 'Not specified',
            description:   j.description || '',
            applyLink,
            postedDate:    j.postedDate || null,
          });
        }
      }
    } catch (err) {
      logger.error(`[ScrapingAgent] Chunk ${i + 1} AI error: ${err.message}`);
    }

    // Polite sequential delay between AI calls
    if (i < uniqueChunks.length - 1) await sleep(AI_CHUNK_GAP_MS);
  }

  // Deduplicate merged results by jobId
  const jobMap = new Map();
  for (const job of allJobs) {
    if (!jobMap.has(job.jobId)) jobMap.set(job.jobId, job);
  }

  const result = Array.from(jobMap.values());
  logger.info(`[ScrapingAgent] AI extracted ${result.length} unique job(s) after deduplication`);
  return result;
};

// ─────────────────────────────────────────────────────────────
//  HTTP Fetchers
// ─────────────────────────────────────────────────────────────

const fetchWithAxios = async (url) => {
  const res = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    timeout: 30000,
    maxRedirects: 5,
  });
  return res.data;
};

const fetchWithPuppeteer = async (url) => {
  logger.info(`[ScrapingAgent] Launching Puppeteer for: ${url}`);
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(3000);
    const html = await page.content();
    logger.info(`[ScrapingAgent] Puppeteer fetched ${html.length} chars`);
    return html;
  } finally {
    await browser.close();
  }
};

/**
 * Deduplicate jobs array strictly by title + applyLink / jobId.
 */
const deduplicateJobs = (jobs) => {
  if (!Array.isArray(jobs)) return [];
  const map = new Map();
  for (const job of jobs) {
    if (!job || !job.title || job.title.trim().length < 2) continue;
    const titleKey = job.title.toLowerCase().trim();
    const linkKey = (job.applyLink || '').toLowerCase().trim();
    const key = job.jobId || sha256(`${titleKey}_${linkKey}`);
    if (!map.has(key)) {
      map.set(key, { ...job, jobId: key, title: job.title.trim() });
    }
  }
  return Array.from(map.values());
};

/**
 * Direct REST API fetcher for Microsoft Careers (0 AI tokens, 0.3s runtime).
 * Directly queries Microsoft's Eightfold API endpoint for live postings.
 */
const fetchMicrosoftApiJobs = async () => {
  try {
    const res = await axios.get(
      'https://apply.careers.microsoft.com/api/pcsx/search?domain=microsoft.com&query=&location=&start=0',
      {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000,
      }
    );
    const positions = res.data?.data?.positions || [];
    if (!Array.isArray(positions) || positions.length === 0) return [];

    const jobs = positions.map((p) => {
      const title = (p.name || 'Software Engineer').trim();
      const displayId = String(p.displayJobId || p.id || Math.random());
      const location = p.locations?.[0] || p.standardizedLocations?.[0] || 'Not specified';
      const applyLink = `https://jobs.careers.microsoft.com/global/en/job/${displayId}`;
      const postedDate = p.postedTs ? new Date(p.postedTs * 1000).toISOString().split('T')[0] : null;

      return {
        jobId: sha256(`microsoft_${displayId}_${title}`),
        title,
        location,
        experience: 'Not specified',
        employmentType: 'Full-time',
        description: `${title} at Microsoft (${location})`,
        applyLink,
        postedDate,
      };
    });

    logger.info(`[ScrapingAgent] ✅ Microsoft API extracted ${jobs.length} direct job(s)`);
    return jobs;
  } catch (err) {
    logger.warn(`[ScrapingAgent] Microsoft API fetch failed: ${err.message}`);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
//  Main Entry Point
// ─────────────────────────────────────────────────────────────

/**
 * Scrape all job listings from a company's careers page.
 * Uses the cheapest available method first.
 *
 * @param {string} company     – Display name e.g. "Google"
 * @param {string} careersUrl  – Official careers page URL
 * @returns {Promise<object[]>} Array of validated job objects
 */
const scrape = async (company, careersUrl) => {
  logger.info(`[ScrapingAgent] Starting scrape: ${company} → ${careersUrl}`);
  await sleep(POLITE_DELAY_MS);

  // ── Specialized Fast API Path for Microsoft ───────────────
  const isMicrosoft = company.toLowerCase().includes('microsoft') || careersUrl.includes('microsoft.com');
  if (isMicrosoft) {
    const msJobs = await fetchMicrosoftApiJobs();
    if (msJobs.length > 0) {
      return deduplicateJobs(msJobs);
    }
  }

  let html;
  let usedPuppeteer = false;

  // ── Fetch HTML ────────────────────────────────────────────
  try {
    html = await fetchWithAxios(careersUrl);
    logger.info(`[ScrapingAgent] axios fetched ${html.length} chars`);
  } catch (err) {
    logger.warn(`[ScrapingAgent] axios failed: ${err.message}. Falling back to Puppeteer...`);
    html = await fetchWithPuppeteer(careersUrl);
    usedPuppeteer = true;
  }

  // ── Phase 1: JSON-LD (0 tokens) ───────────────────────────
  const jsonLdJobs = extractFromJsonLd(html, careersUrl);
  if (jsonLdJobs.length > 0) {
    logger.info(`[ScrapingAgent] ✅ Phase 1 (JSON-LD) succeeded: ${jsonLdJobs.length} job(s)`);
    return deduplicateJobs(jsonLdJobs);
  }
  logger.info('[ScrapingAgent] Phase 1 (JSON-LD) returned 0 jobs. Trying Phase 2 (CSS selectors)...');

  // ── Phase 2: CSS Selectors (0 tokens) ─────────────────────
  const selectorJobs = extractFromSelectors(html, careersUrl);
  if (selectorJobs.length > 0) {
    logger.info(`[ScrapingAgent] ✅ Phase 2 (CSS selectors) succeeded: ${selectorJobs.length} job(s)`);
    return deduplicateJobs(selectorJobs);
  }
  logger.info('[ScrapingAgent] Phase 2 (CSS selectors) returned 0 jobs. Falling back to Puppeteer + AI...');

  // ── Puppeteer if not already used ─────────────────────────
  if (!usedPuppeteer) {
    html = await fetchWithPuppeteer(careersUrl);

    // Re-try JSON-LD and selectors with Puppeteer-rendered HTML
    const jsonLdRetry = extractFromJsonLd(html, careersUrl);
    if (jsonLdRetry.length > 0) {
      logger.info(`[ScrapingAgent] ✅ Phase 1 (JSON-LD + Puppeteer) succeeded: ${jsonLdRetry.length} job(s)`);
      return deduplicateJobs(jsonLdRetry);
    }

    const selectorRetry = extractFromSelectors(html, careersUrl);
    if (selectorRetry.length > 0) {
      logger.info(`[ScrapingAgent] ✅ Phase 2 (CSS + Puppeteer) succeeded: ${selectorRetry.length} job(s)`);
      return deduplicateJobs(selectorRetry);
    }
  }

  // ── Phase 3: AI Fallback (minimal tokens) ─────────────────
  logger.info('[ScrapingAgent] Phase 3 (AI fallback) activated...');
  const pageText = extractJobCardsText(html, careersUrl);
  const aiJobs = await parseWithAI(pageText, company, careersUrl);
  return deduplicateJobs(aiJobs);
};

module.exports = { scrape };

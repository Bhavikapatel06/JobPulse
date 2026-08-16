// ── Admin: Companies & Scraping Fleet (Emoji-free) ───────────
import { API }     from '../../api/client.js';
import { Toast }   from '../../components/Toast.js';
import { helpers } from '../../utils/helpers.js';
import { Icons }   from '../../utils/icons.js';

export function JobsPage() {
  const el = document.createElement('div');
  el.className = 'page active';
  el.id = 'page-jobs';

  el.innerHTML = `
    <div class="flex items-center justify-between" style="margin-bottom:20px">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px">Company Scraping Fleet</h2>
        <p style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Cached inventory extracted directly from primary company career endpoints</p>
      </div>
      <div class="flex items-center gap-2">
        <span id="cos-count-badge"></span>
        <button class="btn btn-outline btn-sm" id="btn-force-refresh-all">
          ${Icons.refresh(13)} Refresh All Scrapers
        </button>
      </div>
    </div>

    <!-- Companies Explorer Container -->
    <div id="company-accordion-container">
      <div style="padding:32px;text-align:center;color:var(--text-muted)">Loading scraping fleet inventory…</div>
    </div>`;

  async function loadInventory() {
    const container = el.querySelector('#company-accordion-container');
    try {
      const data      = await API.getJobs();
      const companies = data.data || [];

      el.querySelector('#cos-count-badge').innerHTML = `
        <span class="badge badge-slate">${companies.length} Companies</span>`;

      if (!companies.length) {
        container.innerHTML = `
          <div class="card" style="padding:36px;text-align:center;color:var(--text-muted)">
            <div style="font-size:14px;font-weight:600;color:#fff">No Companies in Database</div>
            <div style="font-size:12px;margin-top:2px">Trigger a candidate's pipeline to initiate first scrape.</div>
          </div>`;
        return;
      }

      container.innerHTML = companies.map(c => renderCompanyPanel(c)).join('');

      // Accordion toggle
      container.querySelectorAll('.card-header-clickable').forEach(header => {
        header.addEventListener('click', (e) => {
          if (e.target.closest('.btn')) return;
          const panel = header.closest('.jobs-panel');
          const isExpanded = panel.classList.contains('expanded');
          container.querySelectorAll('.jobs-panel').forEach(p => p.classList.remove('expanded'));
          if (!isExpanded) {
            panel.classList.add('expanded');
            const body = panel.querySelector('.jobs-panel-body');
            const companyName = panel.dataset.company;
            if (!body.dataset.loaded) loadCompanyJobs(body, companyName);
          }
        });
      });

      // Individual Refresh
      container.querySelectorAll('[data-action="refresh-single"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const comp = btn.dataset.company;
          btn.classList.add('loading');
          btn.textContent = '…';
          try {
            await API.refreshCompany(comp);
            Toast.success('Scraper Started', `Extracting listings for ${comp}...`);
          } catch (err) {
            Toast.error('Scrape Error', err.message);
          } finally {
            btn.classList.remove('loading');
            btn.innerHTML = `${Icons.refresh(12)} Scrape`;
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger);padding:20px">Failed to load scraping inventory: ${err.message}</div>`;
      Toast.error('Load Failed', err.message);
    }
  }

  function renderCompanyPanel(c) {
    const abbrev = (c.company || '?').slice(0, 2).toUpperCase();
    const statusBadge = helpers.statusBadge(c.scrapeStatus);

    return `
      <div class="jobs-panel card" style="margin-bottom:12px" data-company="${c.company}">
        <div class="card-header card-header-clickable" style="cursor:pointer">
          <div class="flex items-center gap-3">
            <div class="brand-icon" style="width:32px;height:32px;font-size:11px;font-weight:700">
              ${abbrev}
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#fff">${c.company}</div>
              <div style="font-size:11.5px;color:var(--text-muted);font-family:monospace">${c.careersUrl || 'Configured endpoint'}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${statusBadge}
            <span class="badge ${c.jobCount > 0 ? 'badge-blue' : 'badge-slate'}">${c.jobCount} Jobs</span>
            <span style="font-size:11.5px;color:var(--text-light)">${helpers.timeAgo(c.lastUpdated)}</span>
            <button class="btn btn-outline btn-sm" data-action="refresh-single" data-company="${c.company}">
              ${Icons.refresh(12)} Scrape
            </button>
            <span class="jobs-panel-chevron">${Icons.chevronDown(14)}</span>
          </div>
        </div>
        <div class="jobs-panel-body" data-company="${c.company}">
          <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12.5px">Loading listings…</div>
        </div>
      </div>`;
  }

  async function loadCompanyJobs(bodyEl, company) {
    bodyEl.dataset.loaded = '1';
    try {
      const data = await API.getJobsByCompany(company);
      const jobs = data.data?.jobs || [];

      if (!jobs.length) {
        bodyEl.innerHTML = `
          <div style="padding:24px;text-align:center;color:var(--text-muted)">
            <div style="font-size:13px;font-weight:500;color:#fff">No listings currently in database</div>
            <div style="font-size:11.5px;margin-top:2px">Click "Scrape" to run live extraction agent.</div>
          </div>`;
        return;
      }

      bodyEl.innerHTML = `
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
          ${jobs.map(j => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm)">
              <div>
                <div style="font-size:13.5px;font-weight:600;color:#fff">${j.title}</div>
                <div class="flex items-center gap-2" style="margin-top:4px">
                  ${j.location && j.location !== 'Not specified' ? `<span class="badge badge-slate" style="font-size:10.5px">${Icons.mapPin(10)} ${j.location}</span>` : ''}
                  ${j.employmentType && j.employmentType !== 'Not specified' ? `<span class="badge badge-slate" style="font-size:10.5px">${j.employmentType}</span>` : ''}
                  ${j.experience && j.experience !== 'Not specified' ? `<span class="badge badge-slate" style="font-size:10.5px">${j.experience}</span>` : ''}
                </div>
              </div>
              <div>
                ${j.applyLink ? `
                  <a href="${j.applyLink}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="font-size:12px">
                    Apply ${Icons.externalLink(11)}
                  </a>` : '<span style="font-size:11.5px;color:var(--text-light)">No URL</span>'}
              </div>
            </div>`).join('')}
        </div>`;
    } catch (err) {
      bodyEl.innerHTML = `<div style="padding:16px;color:var(--danger);font-size:12.5px">Error loading jobs: ${err.message}</div>`;
    }
  }

  el.querySelector('#btn-force-refresh-all').addEventListener('click', async () => {
    Toast.info('Batch Dispatched', 'Triggering scrapers for all tracked companies...');
    try {
      const data = await API.getJobs();
      for (const c of (data.data || [])) {
        await API.refreshCompany(c.company).catch(() => {});
      }
      Toast.success('Batch Queued', 'Scrapers running in background.');
    } catch (err) {
      Toast.error('Batch Error', err.message);
    }
  });

  loadInventory();
  return el;
}

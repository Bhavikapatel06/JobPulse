// ── Candidate Portal: Streamlined Company-Based Job Explorer ───
import { API }     from '../../api/client.js';
import { Auth }    from '../../auth/auth.js';
import { Toast }   from '../../components/Toast.js';
import { Icons }   from '../../utils/icons.js';

export function MyJobsPage() {
  let session = Auth.get();
  const el    = document.createElement('div');
  el.className = 'page active';
  el.id       = 'page-my-jobs';

  el.innerHTML = `
    <!-- ── View 1: Tracked Companies Hub ────────────────────────── -->
    <div id="view-companies-list">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 style="font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.4px">
            Tracked Companies
          </h1>
          <p style="font-size:13.5px;color:var(--text-muted);margin-top:2px">
            Select a company to view matching job opportunities
          </p>
        </div>

        <button class="btn btn-primary btn-sm" id="btn-add-company-modal" style="padding:7px 15px;font-size:13.5px">
          ${Icons.plus(13)} Add Company
        </button>
      </div>

      <!-- Companies List Container -->
      <div id="companies-table-container">
        <div style="padding:36px;text-align:center;color:var(--text-muted);font-size:14px">
          Loading tracked employers…
        </div>
      </div>
    </div>

    <!-- ── View 2: Single Company Opportunities ─────────────────── -->
    <div id="view-company-detail" style="display:none">
      <!-- Breadcrumb & Header -->
      <div style="margin-bottom:20px">
        <button class="btn btn-ghost btn-sm" id="btn-back-to-companies" style="font-size:13px;padding:4px 8px;margin-bottom:8px;color:var(--text-muted)">
          ← Back to Tracked Companies
        </button>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <h1 style="font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.4px" id="detail-company-title">
              Company Opportunities
            </h1>
            <p style="font-size:14px;color:var(--text-muted);margin-top:3px" id="detail-company-sub">
              <span id="detail-company-role" style="color:var(--text);font-weight:500">Software Engineer</span> · Alert at <span style="color:#fff;font-weight:500" id="detail-company-time">09:00</span>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-outline btn-sm" id="btn-edit-current-time" style="font-size:13px;padding:7px 14px">
              ${Icons.clock(13)} Edit Time
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Search Bar -->
      <div class="filter-toolbar" style="margin-bottom:18px">
        <div class="search-input-wrap" style="max-width:340px;width:100%">
          <span class="search-input-icon">${Icons.search(14)}</span>
          <input
            type="text"
            id="company-job-search"
            class="form-input search-input"
            placeholder="Search title, location, stack…"
            style="font-size:13.5px;padding:7px 12px 7px 34px"
          />
        </div>
        <div style="font-size:13px;color:var(--text-muted)" id="company-jobs-count-label">
          Showing available jobs
        </div>
      </div>

      <!-- Jobs Feed for Current Company -->
      <div id="company-jobs-feed-container">
        <!-- Filled dynamically -->
      </div>
    </div>

    <!-- ── Add Company Modal ────────────────────────────────────── -->
    <div class="overlay" id="company-modal-overlay"></div>
    <div class="modal" id="company-config-modal" style="max-width:440px">
      <div class="modal-header">
        <div class="modal-title" id="modal-company-title">${Icons.building(14)} Add Target Company</div>
        <button class="btn btn-ghost btn-sm" id="btn-close-company-modal" style="color:var(--text-light)">${Icons.x(14)}</button>
      </div>
      <form id="company-config-form">
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
          <input type="hidden" id="form-edit-index" value="-1" />
          
          <div class="form-group">
            <label class="form-label">Company Name *</label>
            <input type="text" id="form-company-name" class="form-input" required placeholder="e.g. Google, Microsoft, PhonePe" style="font-size:14px" />
          </div>

          <div style="font-size:11.5px;color:var(--text-light);margin-top:-6px;margin-bottom:4px">Popular options:</div>
          <div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:4px" id="suggested-badges-box">
            <span class="badge badge-slate" style="cursor:pointer;font-size:12px;padding:3px 8px" data-val="PhonePe">PhonePe</span>
            <span class="badge badge-slate" style="cursor:pointer;font-size:12px;padding:3px 8px" data-val="Google">Google</span>
            <span class="badge badge-slate" style="cursor:pointer;font-size:12px;padding:3px 8px" data-val="Microsoft">Microsoft</span>
            <span class="badge badge-slate" style="cursor:pointer;font-size:12px;padding:3px 8px" data-val="Meesho">Meesho</span>
            <span class="badge badge-slate" style="cursor:pointer;font-size:12px;padding:3px 8px" data-val="Amazon">Amazon</span>
          </div>

          <div class="form-group">
            <label class="form-label">Target Role *</label>
            <input type="text" id="form-company-role" class="form-input" required placeholder="e.g. Software Engineer" style="font-size:14px" />
          </div>

          <div class="form-group">
            <label class="form-label">Notification / Trigger Time (24-hr HH:MM) *</label>
            <input type="text" id="form-company-time" class="form-input" required pattern="^([01]\\d|2[0-3]):([0-5]\\d)$" placeholder="08:00" value="08:00" style="font-size:14px" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-md" id="btn-cancel-company-modal">Cancel</button>
          <button type="submit" class="btn btn-primary btn-md" id="btn-save-company-modal">Save</button>
        </div>
      </form>
    </div>

    <!-- ── Quick Edit Time Modal (Opportunities View) ───────────── -->
    <div class="overlay" id="edit-time-modal-overlay"></div>
    <div class="modal" id="edit-time-modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title">${Icons.clock(14)} Edit Alert Time</div>
        <button class="btn btn-ghost btn-sm" id="btn-close-time-modal" style="color:var(--text-light)">${Icons.x(14)}</button>
      </div>
      <form id="edit-time-form">
        <div class="modal-body" style="display:flex;flex-direction:column;gap:12px">
          <div style="font-size:13px;color:var(--text-muted)" id="edit-time-company-name">
            Company: Google
          </div>
          <div class="form-group">
            <label class="form-label">Daily Notification Time (24-hr HH:MM) *</label>
            <input type="text" id="input-quick-time" class="form-input" required pattern="^([01]\\d|2[0-3]):([0-5]\\d)$" placeholder="20:18" style="font-size:14px" />
            <span class="form-hint">Job matches will be delivered daily at this time.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-md" id="btn-cancel-time-modal">Cancel</button>
          <button type="submit" class="btn btn-primary btn-md" id="btn-save-time-modal">Save Time</button>
        </div>
      </form>
    </div>

    <!-- ── Job Details Slide-Out Drawer ────────────────────────── -->
    <div class="overlay" id="job-drawer-overlay"></div>
    <aside class="job-drawer" id="job-details-drawer">
      <div class="job-drawer-header">
        <div>
          <div class="badge badge-blue" id="drawer-company-badge" style="margin-bottom:6px;font-size:12px">Company</div>
          <h3 style="font-size:18px;font-weight:700;color:#fff;line-height:1.3" id="drawer-job-title">Position Title</h3>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-close-job-drawer" style="color:var(--text-light)">
          ${Icons.x(14)}
        </button>
      </div>

      <div class="job-drawer-body">
        <div class="detail-section">
          <div class="detail-section-title">Position Overview</div>
          <div class="detail-grid">
            <div>
              <div class="detail-item-label">${Icons.mapPin(12)} Location</div>
              <div class="detail-item-value" id="drawer-location">—</div>
            </div>
            <div>
              <div class="detail-item-label">${Icons.briefcase(12)} Employment Type</div>
              <div class="detail-item-value" id="drawer-type">—</div>
            </div>
            <div>
              <div class="detail-item-label">${Icons.award(12)} Experience Level</div>
              <div class="detail-item-value" id="drawer-exp">—</div>
            </div>
            <div>
              <div class="detail-item-label">${Icons.calendar(12)} Posted Date</div>
              <div class="detail-item-value" id="drawer-date">—</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Role Summary & Responsibilities</div>
          <div id="drawer-desc" style="font-size:14px;color:var(--text-secondary);line-height:1.65;background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px">
            No detailed summary available.
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Career Portal Link</div>
          <div style="background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;align-items:center;justify-content:space-between">
            <span id="drawer-url-preview" style="font-size:12.5px;color:var(--text-muted);font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px">
              https://careers...
            </span>
          </div>
        </div>
      </div>

      <div class="job-drawer-footer">
        <button class="btn btn-outline btn-md" id="btn-drawer-cancel">Close</button>
        <a id="btn-drawer-apply-link" href="#" target="_blank" rel="noopener" class="btn btn-primary btn-md">
          Apply on Career Site ${Icons.externalLink(13)}
        </a>
      </div>
    </aside>`;

  let allResultsData   = [];
  let currentUserData  = session;
  let activeCompanyObj = null;
  let currentFeedJobs  = [];
  let searchKeyword    = '';

  // Get or build companyConfigs array
  function getCompanyConfigs(user) {
    if (Array.isArray(user.companyConfigs) && user.companyConfigs.length > 0) {
      return user.companyConfigs;
    }
    // Fallback from flat companies array
    const defaultRole = user.desiredRole || 'Software Engineer';
    const defaultTime = user.notifyTime || '09:00';
    return (user.companies || ['PhonePe', 'Google']).map((c) => ({
      company: c,
      role: defaultRole,
      notifyTime: defaultTime,
    }));
  }

  async function loadData() {
    if (!session?.id) return;
    try {
      const data = await API.getUserJobs(session.id);
      allResultsData  = data.results || [];
      currentUserData = data.user || currentUserData;
      
      if (data.user) {
        session = { ...session, ...data.user };
        Auth.save(session);
      }

      renderCompaniesList();
      if (activeCompanyObj) {
        renderCompanyDetailView(activeCompanyObj.company);
      }
    } catch (err) {
      el.querySelector('#companies-table-container').innerHTML = `
        <div class="card" style="padding:32px;text-align:center;color:var(--danger)">
          Failed to load company data: ${err.message}
        </div>`;
      Toast.error('Load Error', err.message);
    }
  }

  // ── Render Tracked Companies Hub ───────────────────────────
  function renderCompaniesList() {
    const container = el.querySelector('#companies-table-container');
    const configs   = getCompanyConfigs(currentUserData);

    if (!configs.length) {
      container.innerHTML = `
        <div class="card" style="padding:48px 24px;text-align:center;color:var(--text-muted)">
          <div style="font-size:16px;font-weight:600;color:#fff">No Companies Tracked</div>
          <div style="font-size:13.5px;margin-top:4px;margin-bottom:16px">Add your first target employer to track matching roles.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-comp">
            ${Icons.plus(13)} Add Company
          </button>
        </div>`;
      container.querySelector('#btn-empty-add-comp')?.addEventListener('click', openAddModal);
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${configs.map((c, idx) => {
          const matchResult = allResultsData.find(
            r => r.company.toLowerCase() === c.company.toLowerCase() ||
                 c.company.toLowerCase().includes(r.company.toLowerCase())
          );
          const jobCount = matchResult?.jobs?.length || 0;

          return `
            <div class="card" style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:var(--transition)" data-idx="${idx}">
              <div style="flex:1;min-width:0;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                <div style="font-size:17px;font-weight:700;color:#fff;min-width:140px">
                  ${c.company}
                </div>
                <div style="font-size:14px;color:var(--primary);font-weight:500;min-width:160px">
                  ${c.role || currentUserData.desiredRole || 'Software Engineer'}
                </div>
                <div style="font-size:13.5px;color:var(--text-muted);display:flex;align-items:center;gap:5px">
                  ${Icons.clock(12)} ${c.notifyTime || '09:00'}
                </div>
                <span class="badge badge-slate" style="font-size:12px;padding:3px 8px">
                  ${jobCount} job${jobCount !== 1 ? 's' : ''} found
                </span>
              </div>

              <div class="flex items-center gap-2" style="flex-shrink:0" onclick="event.stopPropagation()">
                <button class="btn btn-ghost btn-sm" data-action="edit" data-idx="${idx}" title="Edit Configuration" style="padding:6px 10px;font-size:13px">
                  ${Icons.edit(13)} Edit
                </button>
                <button class="btn btn-ghost btn-sm" data-action="delete" data-idx="${idx}" title="Remove Company" style="padding:6px 10px;color:var(--text-light)">
                  ${Icons.trash(13)}
                </button>
                <button class="btn btn-outline btn-sm" data-action="open-detail" data-idx="${idx}" style="padding:6px 14px;font-size:13px;color:#fff">
                  View →
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    // Wire Row Clicks to open Company detail
    container.querySelectorAll('[data-idx]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        openCompanyDetail(configs[idx]);
      });
    });

    // Wire Edit buttons
    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        openEditModal(idx, configs[idx]);
      });
    });

    // Wire Delete buttons
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        await deleteCompany(idx, configs[idx].company);
      });
    });

    // Wire View buttons
    container.querySelectorAll('[data-action="open-detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        openCompanyDetail(configs[idx]);
      });
    });
  }

  // ── Open Company Detail Opportunities ──────────────────────
  function openCompanyDetail(compObj) {
    activeCompanyObj = compObj;
    el.querySelector('#view-companies-list').style.display  = 'none';
    el.querySelector('#view-company-detail').style.display = 'block';

    renderCompanyDetailView(compObj.company);
  }

  function backToCompaniesList() {
    activeCompanyObj = null;
    el.querySelector('#view-company-detail').style.display = 'none';
    el.querySelector('#view-companies-list').style.display  = 'block';
    renderCompaniesList();
  }

  function renderCompanyDetailView(companyName) {
    if (!activeCompanyObj) return;

    el.querySelector('#detail-company-title').textContent = `${activeCompanyObj.company} Opportunities`;
    el.querySelector('#detail-company-role').textContent  = activeCompanyObj.role || 'Software Engineer';
    el.querySelector('#detail-company-time').textContent  = activeCompanyObj.notifyTime || '09:00';

    const container = el.querySelector('#company-jobs-feed-container');
    const countLbl  = el.querySelector('#company-jobs-count-label');

    // Filter jobs for this specific company
    const foundResult = allResultsData.find(
      r => r.company.toLowerCase() === companyName.toLowerCase() ||
           companyName.toLowerCase().includes(r.company.toLowerCase()) ||
           r.company.toLowerCase().includes(companyName.toLowerCase())
    );

    let jobs = (foundResult?.jobs || []).map(j => ({ ...j, companyName: foundResult.company }));

    // Apply search filter if active
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase();
      jobs = jobs.filter(j => 
        (j.title || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.employmentType || '').toLowerCase().includes(q)
      );
    }

    currentFeedJobs = jobs;
    countLbl.textContent = `Showing ${jobs.length} opening${jobs.length !== 1 ? 's' : ''}`;

    if (!jobs.length) {
      container.innerHTML = `
        <div class="card" style="padding:48px 24px;text-align:center;color:var(--text-muted)">
          <div style="font-size:16px;font-weight:600;color:#fff">No Openings Found for ${companyName}</div>
          <div style="font-size:13.5px;margin-top:4px">
            ${searchKeyword ? 'Try clearing your search query.' : 'Scraper will automatically discover new matching roles.'}
          </div>
        </div>`;
      return;
    }

    container.innerHTML = jobs.map((j, idx) => `
      <div class="job-card" data-job-idx="${idx}" style="padding:16px 20px;margin-bottom:10px">
        <div class="job-card-main">
          <div class="flex items-center gap-2" style="margin-bottom:4px">
            <span class="badge badge-blue" style="font-size:12px;font-weight:600">${j.companyName}</span>
            <span class="badge badge-green" style="font-size:11px">Match</span>
          </div>
          <div class="job-card-title" style="font-size:17px;font-weight:700;color:#fff;margin-bottom:4px">
            ${j.title}
          </div>
          <div class="job-card-meta" style="font-size:13px;color:var(--text-secondary);display:flex;gap:14px;flex-wrap:wrap">
            ${j.location && j.location !== 'Not specified' ? `<span>${Icons.mapPin(12)} ${j.location}</span>` : ''}
            ${j.employmentType && j.employmentType !== 'Not specified' ? `<span>${Icons.briefcase(12)} ${j.employmentType}</span>` : ''}
            ${j.experience && j.experience !== 'Not specified' ? `<span>${Icons.award(12)} ${j.experience}</span>` : ''}
            ${j.postedDate ? `<span>${Icons.calendar(12)} ${j.postedDate}</span>` : ''}
          </div>
        </div>
        <div class="job-card-actions" style="display:flex;align-items:center;gap:8px;flex-shrink:0" onclick="event.stopPropagation()">
          <button class="btn btn-outline btn-sm" data-action="view" data-job-idx="${idx}" style="padding:6px 12px;font-size:13px">
            View
          </button>
          ${j.applyLink ? `
            <a href="${j.applyLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="padding:6px 14px;font-size:13px">
              Apply ${Icons.externalLink(11)}
            </a>` : ''}
        </div>
      </div>`).join('');

    // Wire click to view drawer
    container.querySelectorAll('[data-job-idx]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.jobIdx, 10);
        openJobDrawer(currentFeedJobs[idx]);
      });
    });

    container.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.jobIdx, 10);
        openJobDrawer(currentFeedJobs[idx]);
      });
    });
  }

  // ── Edit Time Modal (Opportunities View) ───────────────────
  const timeModal      = el.querySelector('#edit-time-modal');
  const timeOverlay    = el.querySelector('#edit-time-modal-overlay');
  const timeForm       = el.querySelector('#edit-time-form');
  const inputQuickTime = el.querySelector('#input-quick-time');
  const timeCompNameEl = el.querySelector('#edit-time-company-name');

  function openEditTimeModal() {
    if (!activeCompanyObj) return;
    timeCompNameEl.textContent = `Company: ${activeCompanyObj.company} (${activeCompanyObj.role || 'Software Engineer'})`;
    inputQuickTime.value       = activeCompanyObj.notifyTime || '09:00';
    timeModal.classList.add('open');
    timeOverlay.classList.add('open');
    inputQuickTime.focus();
  }

  function closeEditTimeModal() {
    timeModal.classList.remove('open');
    timeOverlay.classList.remove('open');
  }

  timeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTime = inputQuickTime.value.trim();
    if (!newTime || !activeCompanyObj) return;

    const currentConfigs = getCompanyConfigs(currentUserData);
    const updatedConfigs = currentConfigs.map(c => 
      c.company.toLowerCase() === activeCompanyObj.company.toLowerCase()
        ? { ...c, notifyTime: newTime }
        : c
    );

    try {
      const payload = {
        companyConfigs: updatedConfigs,
        companies: updatedConfigs.map(c => c.company),
      };
      const res = await API.updateUser(session.id, payload);
      currentUserData = res.data;
      session = { ...session, ...res.data };
      Auth.save(session);
      activeCompanyObj.notifyTime = newTime;
      Toast.success('Time Updated', `Daily notification set to ${newTime} for ${activeCompanyObj.company}.`);
      closeEditTimeModal();
      renderCompanyDetailView(activeCompanyObj.company);
    } catch (err) {
      Toast.error('Save Failed', err.message);
    }
  });

  el.querySelector('#btn-edit-current-time').addEventListener('click', openEditTimeModal);
  el.querySelector('#btn-close-time-modal').addEventListener('click', closeEditTimeModal);
  el.querySelector('#btn-cancel-time-modal').addEventListener('click', closeEditTimeModal);
  timeOverlay.addEventListener('click', closeEditTimeModal);

  // ── Add / Edit Company Modal ──────────────────────────────
  const compModal    = el.querySelector('#company-config-modal');
  const compOverlay  = el.querySelector('#company-modal-overlay');
  const compForm     = el.querySelector('#company-config-form');
  const modalTitle   = el.querySelector('#modal-company-title');
  const formIdx      = el.querySelector('#form-edit-index');
  const inputName    = el.querySelector('#form-company-name');
  const inputRole    = el.querySelector('#form-company-role');
  const inputTime    = el.querySelector('#form-company-time');

  function openAddModal() {
    modalTitle.innerHTML = `${Icons.plus(14)} Add Target Company`;
    formIdx.value        = '-1';
    inputName.value      = '';
    inputRole.value      = currentUserData.desiredRole || 'Software Engineer';
    inputTime.value      = '08:00';
    compModal.classList.add('open');
    compOverlay.classList.add('open');
    inputName.focus();
  }

  function openEditModal(index, item) {
    modalTitle.innerHTML = `${Icons.edit(14)} Edit ${item.company}`;
    formIdx.value        = String(index);
    inputName.value      = item.company;
    inputRole.value      = item.role || currentUserData.desiredRole || 'Software Engineer';
    inputTime.value      = item.notifyTime || '08:00';
    compModal.classList.add('open');
    compOverlay.classList.add('open');
    inputRole.focus();
  }

  function closeCompModal() {
    compModal.classList.remove('open');
    compOverlay.classList.remove('open');
  }

  compForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idx     = parseInt(formIdx.value, 10);
    const company = inputName.value.trim();
    const role    = inputRole.value.trim();
    const time    = inputTime.value.trim();

    if (!company || !role || !time) return;

    const currentConfigs = getCompanyConfigs(currentUserData);
    let updatedConfigs = [];

    if (idx === -1) {
      // Add new
      if (currentConfigs.some(c => c.company.toLowerCase() === company.toLowerCase())) {
        Toast.info('Already Tracked', `${company} is already in your tracked companies.`);
        closeCompModal();
        return;
      }
      updatedConfigs = [...currentConfigs, { company, role, notifyTime: time, active: true }];
    } else {
      // Edit existing
      updatedConfigs = currentConfigs.map((c, i) => i === idx ? { company, role, notifyTime: time, active: true } : c);
    }

    try {
      const payload = {
        companyConfigs: updatedConfigs,
        companies: updatedConfigs.map(c => c.company),
      };
      const res = await API.updateUser(session.id, payload);
      currentUserData = res.data;
      session = { ...session, ...res.data };
      Auth.save(session);
      Toast.success('Saved', `${company} configuration updated.`);
      closeCompModal();

      if (activeCompanyObj && activeCompanyObj.company === company) {
        activeCompanyObj = { company, role, notifyTime: time };
      }
      await loadData();
    } catch (err) {
      Toast.error('Save Failed', err.message);
    }
  });

  async function deleteCompany(idx, companyName) {
    const currentConfigs = getCompanyConfigs(currentUserData);
    if (currentConfigs.length <= 1) {
      Toast.warning('Cannot Remove', 'You must track at least one company.');
      return;
    }

    const updatedConfigs = currentConfigs.filter((_, i) => i !== idx);
    try {
      const payload = {
        companyConfigs: updatedConfigs,
        companies: updatedConfigs.map(c => c.company),
      };
      const res = await API.updateUser(session.id, payload);
      currentUserData = res.data;
      session = { ...session, ...res.data };
      Auth.save(session);
      Toast.success('Removed', `${companyName} removed.`);
      if (activeCompanyObj && activeCompanyObj.company === companyName) {
        backToCompaniesList();
      }
      await loadData();
    } catch (err) {
      Toast.error('Delete Failed', err.message);
    }
  }

  // Preset badge click in modal
  el.querySelectorAll('#suggested-badges-box [data-val]').forEach(badge => {
    badge.addEventListener('click', () => {
      inputName.value = badge.dataset.val;
      inputRole.focus();
    });
  });

  // ── Slide-Out Job Details Drawer ──────────────────────────
  function openJobDrawer(job) {
    if (!job) return;

    el.querySelector('#drawer-company-badge').textContent = job.companyName || 'Company';
    el.querySelector('#drawer-job-title').textContent     = job.title || 'Untitled Position';
    el.querySelector('#drawer-location').textContent      = job.location || 'Not specified';
    el.querySelector('#drawer-type').textContent          = job.employmentType || 'Full-time / Standard';
    el.querySelector('#drawer-exp').textContent           = job.experience || 'Not specified';
    el.querySelector('#drawer-date').textContent          = job.postedDate || 'Recent';
    el.querySelector('#drawer-desc').textContent          = job.description || 'Click "Apply on Career Site" to view complete job details and requirements.';
    el.querySelector('#drawer-url-preview').textContent   = job.applyLink || 'Direct link unavailable';

    const applyBtn = el.querySelector('#btn-drawer-apply-link');
    if (job.applyLink) {
      applyBtn.href = job.applyLink;
      applyBtn.style.display = 'inline-flex';
    } else {
      applyBtn.style.display = 'none';
    }

    el.querySelector('#job-drawer-overlay').classList.add('open');
    el.querySelector('#job-details-drawer').classList.add('open');
  }

  function closeJobDrawer() {
    el.querySelector('#job-drawer-overlay').classList.remove('open');
    el.querySelector('#job-details-drawer').classList.remove('open');
  }

  // Wire buttons
  el.querySelector('#btn-add-company-modal').addEventListener('click', openAddModal);
  el.querySelector('#btn-close-company-modal').addEventListener('click', closeCompModal);
  el.querySelector('#btn-cancel-company-modal').addEventListener('click', closeCompModal);
  compOverlay.addEventListener('click', closeCompModal);

  el.querySelector('#btn-back-to-companies').addEventListener('click', backToCompaniesList);

  el.querySelector('#company-job-search').addEventListener('input', (e) => {
    searchKeyword = e.target.value.trim();
    if (activeCompanyObj) renderCompanyDetailView(activeCompanyObj.company);
  });

  el.querySelector('#btn-close-job-drawer').addEventListener('click', closeJobDrawer);
  el.querySelector('#btn-drawer-cancel').addEventListener('click', closeJobDrawer);
  el.querySelector('#job-drawer-overlay').addEventListener('click', closeJobDrawer);

  loadData();
  return el;
}

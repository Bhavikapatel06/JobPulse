/* ═══════════════════════════════════════════════════════════
   JobPulse Dashboard — app.js
   Vanilla JS SPA: Router · APIClient · Dashboard · Users · Jobs
   ═══════════════════════════════════════════════════════════ */

'use strict';

const BASE_URL = window.location.origin; // same origin as Express

/* ─────────────────────────────────────────────────────────────
   Toast System
───────────────────────────────────────────────────────────── */
const Toast = (() => {
  const container = document.getElementById('toast-container');

  const icons = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    warning: '⚠️',
  };

  function show(type, title, msg, duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
      </div>
      <button class="toast-dismiss" title="Dismiss">✕</button>
    `;

    toast.querySelector('.toast-dismiss').addEventListener('click', () => remove(toast));
    container.appendChild(toast);

    if (duration > 0) setTimeout(() => remove(toast), duration);
    return toast;
  }

  function remove(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  return {
    success: (title, msg) => show('success', title, msg),
    error:   (title, msg) => show('error',   title, msg),
    info:    (title, msg) => show('info',    title, msg),
    warning: (title, msg) => show('warning', title, msg),
  };
})();

/* ─────────────────────────────────────────────────────────────
   Confirm Dialog
───────────────────────────────────────────────────────────── */
const Confirm = (() => {
  const overlay  = document.getElementById('confirm-overlay');
  const dialog   = document.getElementById('confirm-dialog');
  const iconEl   = document.getElementById('confirm-icon');
  const titleEl  = document.getElementById('confirm-title');
  const msgEl    = document.getElementById('confirm-msg');
  const btnOk    = document.getElementById('confirm-ok');
  const btnCancel= document.getElementById('confirm-cancel');

  let resolver = null;

  function open({ icon = '🗑️', title = 'Are you sure?', msg = '', okLabel = 'Delete', okClass = 'btn-danger-ghost' } = {}) {
    iconEl.textContent  = icon;
    titleEl.textContent = title;
    msgEl.textContent   = msg;
    btnOk.textContent   = okLabel;
    btnOk.className     = `btn ${okClass}`;

    overlay.classList.add('open');
    dialog.classList.add('open');

    return new Promise((resolve) => { resolver = resolve; });
  }

  function close(result) {
    overlay.classList.remove('open');
    dialog.classList.remove('open');
    if (resolver) { resolver(result); resolver = null; }
  }

  btnOk.addEventListener('click',     () => close(true));
  btnCancel.addEventListener('click', () => close(false));
  overlay.addEventListener('click',   () => close(false));

  return { open };
})();

/* ─────────────────────────────────────────────────────────────
   Activity Feed
───────────────────────────────────────────────────────────── */
const Activity = (() => {
  const list = document.getElementById('activity-feed');
  const MAX  = 20;

  const dotColor = { info: 'cyan', success: 'green', warning: 'amber', error: 'red' };

  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.style.animation = 'fadeInUp 0.25s ease-out';
    li.innerHTML = `
      <div class="activity-dot ${dotColor[type] || 'cyan'}"></div>
      <div class="activity-content">
        <div class="activity-msg">${msg}</div>
        <div class="activity-time">${time}</div>
      </div>`;
    list.prepend(li);
    while (list.children.length > MAX) list.lastChild.remove();
  }

  return { log };
})();

/* ─────────────────────────────────────────────────────────────
   API Client
───────────────────────────────────────────────────────────── */
const API = (() => {
  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return data;
  }

  return {
    health:         ()         => request('GET',  '/health'),
    getUsers:       ()         => request('GET',  '/api/users'),
    createUser:     (body)     => request('POST', '/api/users', body),
    updateUser:     (id, body) => request('PUT',  `/api/users/${id}`, body),
    deleteUser:     (id)       => request('DELETE',`/api/users/${id}?hard=true`),
    deactivateUser: (id)       => request('DELETE',`/api/users/${id}`),
    triggerUser:    (id)       => request('POST', `/api/users/${id}/trigger`),
    getJobs:        ()         => request('GET',  '/api/jobs'),
    getJobsByCompany:(c)       => request('GET',  `/api/jobs/${encodeURIComponent(c)}`),
    refreshCompany: (c)        => request('POST', `/api/jobs/${encodeURIComponent(c)}/refresh`),
  };
})();

/* ─────────────────────────────────────────────────────────────
   Router
───────────────────────────────────────────────────────────── */
const Router = (() => {
  const pages = {
    dashboard: {
      el:       document.getElementById('page-dashboard'),
      nav:      document.getElementById('nav-dashboard'),
      title:    'Dashboard',
      subtitle: 'Real-time job tracking overview',
    },
    users: {
      el:       document.getElementById('page-users'),
      nav:      document.getElementById('nav-users'),
      title:    'Users',
      subtitle: 'Manage job tracking profiles',
    },
    jobs: {
      el:       document.getElementById('page-jobs'),
      nav:      document.getElementById('nav-jobs'),
      title:    'Companies & Jobs',
      subtitle: 'Cached job listings from automated scraping',
    },
  };

  const topbarTitle    = document.getElementById('topbar-title');
  const topbarSubtitle = document.getElementById('topbar-subtitle');

  let current = null;
  const onEnterCallbacks = {};

  function goto(name) {
    if (!pages[name] || current === name) return;

    // Deactivate current
    if (current && pages[current]) {
      pages[current].el.classList.remove('active');
      pages[current].nav.classList.remove('active');
    }

    // Activate new
    current = name;
    pages[name].el.classList.add('active');
    pages[name].nav.classList.add('active');
    topbarTitle.textContent    = pages[name].title;
    topbarSubtitle.textContent = pages[name].subtitle;

    if (onEnterCallbacks[name]) onEnterCallbacks[name]();
  }

  function onEnter(name, cb) { onEnterCallbacks[name] = cb; }

  // Wire nav buttons
  Object.keys(pages).forEach(name => {
    pages[name].nav.addEventListener('click', () => goto(name));
  });

  // Init
  goto('dashboard');

  return { goto, onEnter };
})();

/* ─────────────────────────────────────────────────────────────
   Drawer (Add / Edit User)
───────────────────────────────────────────────────────────── */
const Drawer = (() => {
  const overlay    = document.getElementById('overlay');
  const drawer     = document.getElementById('user-drawer');
  const drawerTitle= document.getElementById('drawer-title');
  const drawerSub  = document.getElementById('drawer-subtitle');
  const saveText   = document.getElementById('drawer-save-text');
  const form       = document.getElementById('user-form');

  const fields = {
    id:        document.getElementById('user-id'),
    name:      document.getElementById('field-name'),
    email:     document.getElementById('field-email'),
    role:      document.getElementById('field-role'),
    companies: document.getElementById('field-companies'),
    location:  document.getElementById('field-location'),
    exp:       document.getElementById('field-exp'),
    notify:    document.getElementById('field-notify'),
  };

  let onSaveCallback = null;
  let mode = 'create'; // 'create' | 'edit'

  function open(opts = {}) {
    mode = opts.user ? 'edit' : 'create';
    drawerTitle.textContent = mode === 'edit' ? 'Edit User' : 'Add User';
    drawerSub.textContent   = mode === 'edit'
      ? 'Update job tracking preferences'
      : 'Fill in the details to create a job tracking profile';
    saveText.textContent    = mode === 'edit' ? 'Save Changes' : 'Create User';

    // Populate or clear
    const u = opts.user || {};
    fields.id.value        = u._id || '';
    fields.name.value      = u.name || '';
    fields.email.value     = u.email || '';
    fields.role.value      = u.desiredRole || '';
    fields.companies.value = (u.companies || []).join(', ');
    fields.location.value  = (u.filters && u.filters.location) || '';
    fields.exp.value       = (u.filters && u.filters.experienceLevel) || '';
    fields.notify.value    = u.notifyTime || '09:00';

    onSaveCallback = opts.onSave || null;

    overlay.classList.add('open');
    drawer.classList.add('open');
    setTimeout(() => fields.name.focus(), 350);
  }

  function close() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    form.reset();
  }

  function getFormData() {
    const companiesRaw = fields.companies.value.split(',').map(s => s.trim()).filter(Boolean);
    return {
      name:       fields.name.value.trim(),
      email:      fields.email.value.trim(),
      desiredRole:fields.role.value.trim(),
      companies:  companiesRaw,
      filters: {
        location:        fields.location.value.trim() || null,
        experienceLevel: fields.exp.value || null,
      },
      notifyTime: fields.notify.value,
    };
  }

  document.getElementById('drawer-close').addEventListener('click',  close);
  document.getElementById('drawer-cancel').addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.getElementById('drawer-save').addEventListener('click', async () => {
    const data = getFormData();

    // Basic validation
    if (!data.name || !data.email || !data.desiredRole || data.companies.length === 0 || !data.notifyTime) {
      Toast.warning('Missing fields', 'Please fill in all required fields.');
      return;
    }

    const saveBtn = document.getElementById('drawer-save');
    saveBtn.classList.add('loading');

    try {
      if (mode === 'edit') {
        const id = fields.id.value;
        await API.updateUser(id, data);
        Toast.success('User updated', `${data.name}'s profile has been updated.`);
        Activity.log(`Updated user: ${data.name}`, 'success');
      } else {
        await API.createUser(data);
        Toast.success('User created', `${data.name} is now tracking ${data.companies.join(', ')}.`);
        Activity.log(`New user created: ${data.name} tracking ${data.companies.join(', ')}`, 'success');
      }
      close();
      if (onSaveCallback) onSaveCallback();
    } catch (err) {
      Toast.error('Save failed', err.message);
    } finally {
      saveBtn.classList.remove('loading');
    }
  });

  return { open, close };
})();

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status) {
  const map = {
    success: ['badge-green', '✓ Verified'],
    failed:  ['badge-red',   '✗ Failed'],
    pending: ['badge-cyan',  '↻ Pending'],
  };
  const [cls, label] = map[status] || ['badge-navy', status || 'Unknown'];
  return `<span class="badge ${cls}">${label}</span>`;
}

/* ─────────────────────────────────────────────────────────────
   Dashboard Module
───────────────────────────────────────────────────────────── */
const Dashboard = (() => {
  let pollInterval = null;

  async function load() {
    await Promise.all([loadStats(), loadRecentUsers()]);
  }

  async function loadStats() {
    try {
      const [health, usersData, jobsData] = await Promise.all([
        API.health(),
        API.getUsers(),
        API.getJobs(),
      ]);

      const users    = usersData.data || [];
      const jobs     = jobsData.data  || [];
      const active   = users.filter(u => u.active).length;
      const totalJobs = jobs.reduce((acc, c) => acc + (c.jobCount || 0), 0);

      const statUsers    = document.getElementById('stat-users');
      const statCompanies= document.getElementById('stat-companies');
      const statJobs     = document.getElementById('stat-jobs');
      const statApi      = document.getElementById('stat-api');

      statUsers.classList.remove('skeleton', 'skeleton-stat');
      statCompanies.classList.remove('skeleton', 'skeleton-stat');
      statJobs.classList.remove('skeleton', 'skeleton-stat');

      statUsers.textContent = active;
      document.getElementById('stat-users-meta').textContent =
        `${users.length} total · ${active} active`;

      statCompanies.textContent = jobs.length;
      document.getElementById('stat-companies-meta').textContent =
        `${jobs.length} company record${jobs.length !== 1 ? 's' : ''} cached`;

      statJobs.textContent = totalJobs;
      document.getElementById('stat-jobs-meta').textContent =
        `Across all tracked companies`;

      statApi.textContent = '● Online';
      statApi.style.color = 'var(--success)';
      document.getElementById('stat-api-meta').textContent =
        `MongoDB: ${health.mongoState || 'unknown'}`;

      // Update sidebar status
      document.getElementById('api-status-dot').className  = 'status-dot';
      document.getElementById('api-status-text').textContent = `API online · port ${window.location.port || 80}`;

    } catch (err) {
      document.getElementById('stat-api').textContent = '● Offline';
      document.getElementById('stat-api').style.color = 'var(--danger)';
      document.getElementById('stat-api-meta').textContent = err.message;
      document.getElementById('api-status-dot').className  = 'status-dot offline';
      document.getElementById('api-status-text').textContent = 'API offline';
    }
  }

  async function loadRecentUsers() {
    const list = document.getElementById('dash-user-list');
    try {
      const data  = await API.getUsers();
      const users = (data.data || []).slice(0, 5);
      renderUserList(list, users, { compact: true });
    } catch (err) {
      list.innerHTML = `<li class="user-item text-muted" style="padding:20px;justify-content:center">Could not load users</li>`;
    }
  }

  function startPolling() {
    stopPolling();
    pollInterval = setInterval(loadStats, 30000);
  }

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  }

  return { load, loadStats, startPolling, stopPolling };
})();

/* ─────────────────────────────────────────────────────────────
   User List Renderer (shared)
───────────────────────────────────────────────────────────── */
function renderUserList(container, users, opts = {}) {
  if (!users.length) {
    container.innerHTML = `
      <li style="padding:0">
        <div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-title">No users yet</div>
          <div class="empty-state-msg">Create a user to start tracking jobs</div>
        </div>
      </li>`;
    return;
  }

  container.innerHTML = users.map(u => {
    const active = u.active !== false;
    const tags   = (u.companies || []).slice(0, 3).map(c =>
      `<span class="badge badge-navy">${c}</span>`).join('');

    const actions = opts.compact ? '' : `
      <div class="user-actions">
        <button class="btn btn-ghost btn-icon" title="Trigger Report" data-action="trigger" data-id="${u._id}" data-name="${u.name}">▶</button>
        <button class="btn btn-ghost btn-icon" title="Edit User" data-action="edit" data-id="${u._id}">✏️</button>
        <button class="btn btn-danger-ghost btn-icon" title="Delete User" data-action="delete" data-id="${u._id}" data-name="${u.name}">🗑️</button>
      </div>`;

    const pipelineBadge = `<span class="pipeline-badge" id="pipe-${u._id}" style="display:none">
      <span class="spinner"></span> Running
    </span>`;

    return `<li class="user-item" data-user-id="${u._id}">
      <div class="user-avatar" style="background:${active ? 'var(--primary)' : '#9aaac0'}">${initials(u.name)}</div>
      <div class="user-info">
        <div class="user-name">${u.name}
          ${!active ? '<span class="badge badge-amber" style="margin-left:6px">Inactive</span>' : ''}
          ${pipelineBadge}
        </div>
        <div class="user-meta">
          <span class="badge badge-cyan" style="font-size:10px">⚡ ${u.desiredRole || '—'}</span>
          &nbsp;${tags}
          &nbsp;⏰ ${u.notifyTime || '—'}
        </div>
      </div>
      ${actions}
    </li>`;
  }).join('');

  // Wire action buttons
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const { action, id, name } = btn.dataset;
      if (action === 'trigger') handleTrigger(id, name);
      if (action === 'edit')    handleEditUser(id);
      if (action === 'delete')  handleDeleteUser(id, name);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   Users Module
───────────────────────────────────────────────────────────── */
const UsersModule = (() => {
  let allUsers = [];

  async function load() {
    const list  = document.getElementById('users-full-list');
    const badge = document.getElementById('users-count-badge');
    try {
      const data = await API.getUsers();
      allUsers   = data.data || [];
      badge.innerHTML = `<span class="badge badge-navy">${allUsers.length} user${allUsers.length !== 1 ? 's' : ''}</span>`;
      renderUserList(list, allUsers);
    } catch (err) {
      list.innerHTML = `<li class="user-item" style="padding:20px;color:var(--danger)">Error: ${err.message}</li>`;
      Toast.error('Failed to load users', err.message);
    }
  }

  function getUserById(id) {
    return allUsers.find(u => u._id === id);
  }

  return { load, getUserById };
})();

/* ─────────────────────────────────────────────────────────────
   Jobs Module
───────────────────────────────────────────────────────────── */
const JobsModule = (() => {

  async function load() {
    const accordion = document.getElementById('jobs-accordion');
    const badge     = document.getElementById('jobs-count-badge');
    try {
      const data     = await API.getJobs();
      const companies = data.data || [];

      badge.innerHTML = `<span class="badge badge-cyan">${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'}</span>`;

      if (!companies.length) {
        accordion.innerHTML = `
          <div class="empty-state" style="padding:64px 24px">
            <div class="empty-state-icon">🏢</div>
            <div class="empty-state-title">No companies cached yet</div>
            <div class="empty-state-msg">Trigger a user report or wait for the scheduler to run</div>
          </div>`;
        return;
      }

      accordion.innerHTML = companies.map(c => buildCompanyPanel(c)).join('');

      // Expand panels + wire refresh buttons
      accordion.querySelectorAll('.jobs-panel-header').forEach(hdr => {
        hdr.addEventListener('click', (e) => {
          if (e.target.closest('.btn')) return; // don't toggle when clicking btn
          const panel = hdr.closest('.jobs-panel');
          const wasExpanded = panel.classList.contains('expanded');
          // Collapse all
          accordion.querySelectorAll('.jobs-panel').forEach(p => p.classList.remove('expanded'));
          if (!wasExpanded) {
            panel.classList.add('expanded');
            // Lazy-load jobs if not yet loaded
            const body    = panel.querySelector('.jobs-panel-body');
            const company = panel.dataset.company;
            if (!body.dataset.loaded) loadJobs(body, company);
          }
        });
      });

      accordion.querySelectorAll('[data-action="refresh"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const company = btn.dataset.company;
          btn.textContent = '↻';
          btn.classList.add('loading');
          try {
            await API.refreshCompany(company);
            Toast.success('Refresh started', `Scraping ${company}… Check back in a moment.`);
            Activity.log(`Force refresh started: ${company}`, 'info');
          } catch (err) {
            Toast.error('Refresh failed', err.message);
          } finally {
            btn.classList.remove('loading');
            btn.textContent = '↺ Refresh';
          }
        });
      });

    } catch (err) {
      accordion.innerHTML = `<div style="color:var(--danger);padding:20px">Error: ${err.message}</div>`;
      Toast.error('Failed to load companies', err.message);
    }
  }

  function buildCompanyPanel(c) {
    const abbrev = (c.company || '?').slice(0, 2).toUpperCase();
    return `
      <div class="jobs-panel" data-company="${c.company}">
        <div class="jobs-panel-header">
          <div class="jobs-panel-info">
            <div class="jobs-panel-logo">${abbrev}</div>
            <div>
              <div class="company-name">${c.company}</div>
              <div class="company-url">${c.careersUrl || 'No URL cached'}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${statusBadge(c.scrapeStatus)}
            <span class="badge badge-${c.jobCount > 0 ? 'green' : 'navy'}">
              ${c.jobCount} job${c.jobCount !== 1 ? 's' : ''}
            </span>
            <span class="text-muted" style="font-size:11px">${timeAgo(c.lastUpdated)}</span>
            <button class="btn btn-ghost btn-sm" data-action="refresh" data-company="${c.company}">↺ Refresh</button>
            <span class="jobs-panel-chevron">⌄</span>
          </div>
        </div>
        <div class="jobs-panel-body" data-company="${c.company}">
          <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Loading jobs…</div>
        </div>
      </div>`;
  }

  async function loadJobs(bodyEl, company) {
    bodyEl.dataset.loaded = '1';
    try {
      const data = await API.getJobsByCompany(company);
      const jobs = data.data?.jobs || [];
      if (!jobs.length) {
        bodyEl.innerHTML = `
          <div class="empty-state" style="padding:32px">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">No jobs cached</div>
            <div class="empty-state-msg">Click "↺ Refresh" to scrape this company now</div>
          </div>`;
        return;
      }
      bodyEl.innerHTML = `<ul class="job-list">${jobs.map(j => buildJobRow(j)).join('')}</ul>`;
    } catch (err) {
      bodyEl.innerHTML = `<div style="padding:16px;color:var(--danger);font-size:13px">Error: ${err.message}</div>`;
    }
  }

  function buildJobRow(j) {
    const tags = [
      j.location      && `<span class="badge badge-navy">📍 ${j.location}</span>`,
      j.employmentType && j.employmentType !== 'Not specified' && `<span class="badge badge-navy">${j.employmentType}</span>`,
      j.experience    && j.experience !== 'Not specified'    && `<span class="badge badge-navy">${j.experience}</span>`,
      j.postedDate    && `<span class="badge badge-amber">🗓 ${j.postedDate}</span>`,
    ].filter(Boolean).join('');

    const applyBtn = j.applyLink
      ? `<a class="job-apply" href="${j.applyLink}" target="_blank" rel="noopener">Apply →</a>`
      : '';

    return `
      <li class="job-item">
        <div class="job-verified-dot"></div>
        <div class="job-info">
          <div class="job-title">${j.title}</div>
          ${tags ? `<div class="job-tags">${tags}</div>` : ''}
        </div>
        ${applyBtn}
      </li>`;
  }

  return { load };
})();

/* ─────────────────────────────────────────────────────────────
   User Action Handlers
───────────────────────────────────────────────────────────── */
async function handleTrigger(id, name) {
  const pipeBadge = document.getElementById(`pipe-${id}`);
  if (pipeBadge) pipeBadge.style.display = 'inline-flex';

  Activity.log(`Report pipeline triggered for ${name}`, 'info');
  Toast.info('Pipeline running', `Report for ${name} is being generated. Check your terminal.`);

  try {
    const res = await API.triggerUser(id);
    Activity.log(`Pipeline started: ${name}`, 'success');
    Toast.success('Pipeline started', res.message || 'Check terminal for output.');
  } catch (err) {
    Toast.error('Trigger failed', err.message);
    Activity.log(`Pipeline failed: ${name} — ${err.message}`, 'error');
  }

  // Hide badge after 15s
  setTimeout(() => {
    if (pipeBadge) pipeBadge.style.display = 'none';
  }, 15000);
}

async function handleEditUser(id) {
  const user = UsersModule.getUserById(id);
  if (!user) {
    // Fetch fresh if not in cache
    try {
      const data = await API.getUsers();
      const found = (data.data || []).find(u => u._id === id);
      if (found) openEditDrawer(found);
    } catch { Toast.error('Could not load user', ''); }
    return;
  }
  openEditDrawer(user);
}

function openEditDrawer(user) {
  Drawer.open({
    user,
    onSave: () => {
      UsersModule.load();
      Dashboard.loadStats();
    },
  });
}

async function handleDeleteUser(id, name) {
  const confirmed = await Confirm.open({
    icon: '🗑️',
    title: 'Delete User',
    msg: `Are you sure you want to permanently delete "${name}"? This cannot be undone.`,
    okLabel: 'Delete',
    okClass: 'btn-danger-ghost',
  });

  if (!confirmed) return;

  try {
    await API.deleteUser(id);
    Toast.success('User deleted', `${name} has been permanently removed.`);
    Activity.log(`Deleted user: ${name}`, 'warning');
    await UsersModule.load();
    await Dashboard.loadStats();
  } catch (err) {
    Toast.error('Delete failed', err.message);
  }
}

/* ─────────────────────────────────────────────────────────────
   Clock
───────────────────────────────────────────────────────────── */
function startClock() {
  const el = document.getElementById('live-clock');
  function tick() {
    el.textContent = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────────────────────
   Wire Buttons
───────────────────────────────────────────────────────────── */
function wireButtons() {
  // Add user buttons
  ['btn-add-user', 'btn-add-user-2'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      Drawer.open({ onSave: () => { UsersModule.load(); Dashboard.loadStats(); } });
    });
  });

  // Dashboard → View All users
  document.getElementById('dash-view-all-users')?.addEventListener('click', () => {
    Router.goto('users');
  });

  // Dashboard refresh feed
  document.getElementById('dash-refresh-feed')?.addEventListener('click', () => {
    Dashboard.loadStats();
    Activity.log('Manual stats refresh', 'info');
  });

  // Refresh all companies
  document.getElementById('btn-refresh-all')?.addEventListener('click', async () => {
    try {
      const data = await API.getJobs();
      const companies = (data.data || []).map(c => c.company);
      if (!companies.length) { Toast.warning('No companies', 'No cached companies found.'); return; }

      Toast.info('Refresh started', `Refreshing ${companies.length} companies…`);
      for (const c of companies) {
        await API.refreshCompany(c).catch(() => {});
        Activity.log(`Refresh queued: ${c}`, 'info');
      }
      Toast.success('All refreshes queued', 'Scrapers are running in the background.');
    } catch (err) {
      Toast.error('Refresh failed', err.message);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   Page Enter Hooks (lazy load)
───────────────────────────────────────────────────────────── */
Router.onEnter('users', () => UsersModule.load());
Router.onEnter('jobs',  () => JobsModule.load());

/* ─────────────────────────────────────────────────────────────
   User Portal Module
───────────────────────────────────────────────────────────── */
const UserPortal = (() => {
  let currentUserId = null;
  let pollTimer     = null;
  let jobIndex      = 0;

  // ── DOM refs ──────────────────────────────────────────────
  const lookupEl   = () => document.getElementById('portal-lookup');
  const resultsEl  = () => document.getElementById('portal-results');
  const emailInput = () => document.getElementById('portal-email-input');
  const hintEl     = () => document.getElementById('portal-search-hint');
  const avatarEl   = () => document.getElementById('portal-avatar');
  const nameEl     = () => document.getElementById('portal-name');
  const metaEl     = () => document.getElementById('portal-meta');
  const summaryEl  = () => document.getElementById('portal-summary-bar');
  const jobsListEl = () => document.getElementById('portal-jobs-list');
  const pipeEl     = () => document.getElementById('portal-pipeline-badge');

  // ── Show / hide states ────────────────────────────────────
  function showLookup() {
    lookupEl().style.display  = '';
    resultsEl().style.display = 'none';
    currentUserId = null;
    stopPoll();
  }

  function showResults() {
    lookupEl().style.display  = 'none';
    resultsEl().style.display = '';
  }

  function setHint(msg, cls = '') {
    const el = hintEl();
    el.textContent = msg;
    el.className   = `portal-search-hint ${cls}`;
  }

  // ── Email lookup ──────────────────────────────────────────
  async function lookup() {
    const email = emailInput().value.trim().toLowerCase();
    if (!email) { setHint('Please enter your email address.', 'error'); return; }

    const btn = document.getElementById('portal-search-btn');
    btn.classList.add('loading');
    setHint('Looking up your profile…', 'loading');

    try {
      const data  = await API.getUsers();
      const users = data.data || [];
      const user  = users.find(u => (u.email || '').toLowerCase() === email);

      if (!user) {
        setHint(`No profile found for "${email}". Ask your admin to create one.`, 'error');
        btn.classList.remove('loading');
        return;
      }

      if (!user.active) {
        setHint('Your account is deactivated. Contact an admin.', 'error');
        btn.classList.remove('loading');
        return;
      }

      currentUserId = user._id;
      setHint('');
      btn.classList.remove('loading');

      Activity.log(`User portal: ${user.name} signed in`, 'success');
      await loadUserJobs(user._id);

    } catch (err) {
      setHint('Failed to reach the server. Is the backend running?', 'error');
      btn.classList.remove('loading');
    }
  }

  // ── Load & render matched jobs ────────────────────────────
  async function loadUserJobs(userId, silent = false) {
    if (!userId) return;

    if (!silent) {
      jobsListEl().innerHTML = `
        <div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px"></div>
        <div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px"></div>
        <div class="skeleton" style="height:80px;border-radius:12px"></div>`;
      showResults();
    }

    try {
      const data = await API.getUserJobs(userId);
      renderProfile(data.user);
      renderSummary(data.summary, data.results);
      renderJobs(data.results);
    } catch (err) {
      jobsListEl().innerHTML = `<div style="padding:20px;color:var(--danger);font-size:14px">Error: ${err.message}</div>`;
    }
  }

  // ── Profile strip render ──────────────────────────────────
  function renderProfile(user) {
    avatarEl().textContent = initials(user.name);
    nameEl().textContent   = user.name;

    const filters = [];
    if (user.filters?.location)        filters.push(`📍 ${user.filters.location}`);
    if (user.filters?.experienceLevel) filters.push(`🏆 ${user.filters.experienceLevel}`);

    metaEl().innerHTML =
      `<span class="badge badge-cyan" style="font-size:11px;opacity:0.9">⚡ ${user.desiredRole}</span>` +
      `&nbsp;` +
      (user.companies || []).map(c => `<span style="opacity:0.75;margin-left:4px">${c}</span>`).join(' ·') +
      `&nbsp;&nbsp;⏰ ${user.notifyTime}`;
  }

  // ── Summary bar render ────────────────────────────────────
  function renderSummary(summary, results) {
    const lastUpdated = results.reduce((latest, r) => {
      if (!r.lastUpdated) return latest;
      const d = new Date(r.lastUpdated);
      return d > latest ? d : latest;
    }, new Date(0));

    summaryEl().innerHTML = [
      chip(summary.totalMatched, 'Matched Jobs', '✅'),
      chip(summary.companiesWithMatches, 'Companies w/ Matches', '🏢'),
      chip(summary.companiesScanned, 'Companies Scanned', '🔍'),
      chipText(lastUpdated.getTime() > 0 ? timeAgo(lastUpdated) : 'Never', 'Last Data Refresh', '🕐'),
    ].join('');
  }

  function chip(val, label, icon) {
    return `<div class="portal-summary-chip">
      <span style="font-size:18px">${icon}</span>
      <div>
        <div class="portal-summary-chip-val">${val}</div>
        <div class="portal-summary-chip-label">${label}</div>
      </div>
    </div>`;
  }

  function chipText(val, label, icon) {
    return `<div class="portal-summary-chip">
      <span style="font-size:18px">${icon}</span>
      <div>
        <div class="portal-summary-chip-val" style="font-size:16px;letter-spacing:-0.5px">${val}</div>
        <div class="portal-summary-chip-label">${label}</div>
      </div>
    </div>`;
  }

  // ── Jobs render ───────────────────────────────────────────
  function renderJobs(results) {
    if (!results || results.length === 0) {
      jobsListEl().innerHTML = `
        <div class="empty-state" style="padding:64px">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No matching jobs found</div>
          <div class="empty-state-msg">Try triggering a fresh report or broaden your role/location filters</div>
        </div>`;
      return;
    }

    jobIndex = 0;

    // Show pipeline bar if running
    const pipelineBarId = 'portal-anim-bar';
    const existing = document.getElementById(pipelineBarId);
    if (existing) existing.remove();

    const totalMatched = results.reduce((a, r) => a + r.matchedCount, 0);

    if (totalMatched === 0) {
      jobsListEl().innerHTML = `
        <div class="empty-state" style="padding:64px">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">No jobs matched your profile yet</div>
          <div class="empty-state-msg">Data is cached — try "↺ Refresh" or "▶ Trigger Report" to run a fresh scrape</div>
        </div>`;
      return;
    }

    jobsListEl().innerHTML = results.map(r => buildCompanySection(r)).join('');
  }

  function buildCompanySection(r) {
    const abbrev    = (r.company || '?').slice(0, 2).toUpperCase();
    const hasJobs   = r.matchedCount > 0;
    const statusBadgeHtml = statusBadge(r.scrapeStatus);

    const jobsHtml = hasJobs
      ? r.jobs.map(j => buildJobCard(j)).join('')
      : `<div class="portal-company-no-match">
          <span style="font-size:20px">🔍</span>
          <span>No jobs matching your role in ${r.company} — ${r.jobCount} total jobs cached. Try broadening your filters.</span>
         </div>`;

    return `
      <div class="portal-company-section">
        <div class="portal-company-header">
          <div class="portal-company-logo">${abbrev}</div>
          <div class="portal-company-info">
            <div class="portal-company-name">${r.company}</div>
            <div class="portal-company-sub">
              ${statusBadgeHtml}
              &nbsp;
              <span class="badge badge-${r.matchedCount > 0 ? 'green' : 'navy'}">
                ${r.matchedCount} matched
              </span>
              &nbsp;
              <span style="font-size:11px;color:var(--text-muted)">${r.jobCount} total cached · ${timeAgo(r.lastUpdated)}</span>
            </div>
          </div>
        </div>
        ${jobsHtml}
      </div>`;
  }

  function buildJobCard(j) {
    jobIndex++;
    const tags = [
      j.location && j.location !== 'Not specified' &&
        `<span class="badge badge-navy">📍 ${j.location}</span>`,
      j.employmentType && j.employmentType !== 'Not specified' &&
        `<span class="badge badge-navy">${j.employmentType}</span>`,
      j.experience && j.experience !== 'Not specified' &&
        `<span class="badge badge-amber">${j.experience}</span>`,
    ].filter(Boolean).join('');

    const applyBtn = j.applyLink
      ? `<a class="portal-apply-btn" href="${j.applyLink}" target="_blank" rel="noopener">Apply Now ↗</a>`
      : `<span class="portal-apply-btn no-link">No link</span>`;

    const posted = j.postedDate
      ? `<div class="portal-job-posted">🗓 ${j.postedDate}</div>`
      : '';

    const desc = j.description
      ? `<div class="portal-job-desc">${j.description}</div>`
      : '';

    return `
      <div class="portal-job-card">
        <div class="portal-job-index">${jobIndex}</div>
        <div class="portal-job-body">
          <div class="portal-job-title">${j.title}</div>
          ${tags ? `<div class="portal-job-tags">${tags}</div>` : ''}
          ${desc}
        </div>
        <div class="portal-job-apply">
          ${applyBtn}
          ${posted}
        </div>
      </div>`;
  }

  // ── Pipeline trigger ──────────────────────────────────────
  async function triggerAndPoll() {
    if (!currentUserId) return;

    const badge = pipeEl();
    const trigBtn = document.getElementById('portal-trigger-btn');

    badge.style.display = 'inline-flex';
    trigBtn.classList.add('loading');

    // Add animated bar
    const barDiv = document.createElement('div');
    barDiv.id = 'portal-anim-bar';
    barDiv.className = 'portal-pipeline-bar';
    document.getElementById('portal-jobs-list').before(barDiv);

    Activity.log('User portal: pipeline triggered', 'info');
    Toast.info('Report running', 'Your job report is being generated. Jobs will refresh automatically.');

    try {
      await API.triggerUser(currentUserId);
    } catch (err) {
      Toast.warning('Trigger note', err.message || 'Pipeline may still be running.');
    }

    // Poll every 8s for up to 90s
    let attempts = 0;
    const MAX_ATTEMPTS = 11;

    stopPoll();
    pollTimer = setInterval(async () => {
      attempts++;
      await loadUserJobs(currentUserId, true);

      if (attempts >= MAX_ATTEMPTS) {
        stopPoll();
        badge.style.display = 'none';
        trigBtn.classList.remove('loading');
        barDiv.remove();
        Toast.success('Pipeline complete', 'Job results have been refreshed.');
        Activity.log('User portal: pipeline complete', 'success');
      }
    }, 8000);
  }

  function stopPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  // ── Init / wire ───────────────────────────────────────────
  function init() {
    // Search button
    document.getElementById('portal-search-btn').addEventListener('click', lookup);

    // Enter key in email field
    document.getElementById('portal-email-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') lookup();
    });

    // Trigger report
    document.getElementById('portal-trigger-btn').addEventListener('click', triggerAndPoll);

    // Refresh (silent reload)
    document.getElementById('portal-refresh-btn').addEventListener('click', () => {
      if (currentUserId) loadUserJobs(currentUserId);
    });

    // Back button
    document.getElementById('portal-back-btn').addEventListener('click', () => {
      showLookup();
      emailInput().value = '';
    });
  }

  return { init, showLookup };
})();

/* ─────────────────────────────────────────────────────────────
   Extend API client with getUserJobs
───────────────────────────────────────────────────────────── */
API.getUserJobs = (id) => fetch(`${BASE_URL}/api/users/${id}/jobs`)
  .then(r => r.json())
  .then(d => { if (!d.success) throw new Error(d.error); return d; });

/* ─────────────────────────────────────────────────────────────
   Extend Router for portal page
───────────────────────────────────────────────────────────── */
// Portal page needs to be registered — patch pages map
(function patchRouter() {
  const portalNav = document.getElementById('nav-portal');
  const portalPage= document.getElementById('page-portal');
  if (!portalNav || !portalPage) return;

  portalNav.addEventListener('click', () => {
    // Deactivate all active nav items and pages
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    portalNav.classList.add('active');
    portalPage.classList.add('active');
    portalPage.style.animation = 'fadeInUp 0.3s ease-out';

    document.getElementById('topbar-title').textContent    = 'My Jobs';
    document.getElementById('topbar-subtitle').textContent = 'Find jobs matched to your profile';

    UserPortal.showLookup();
  });
})();

/* ─────────────────────────────────────────────────────────────
   Boot — extend existing
───────────────────────────────────────────────────────────── */

async function boot() {
  startClock();
  wireButtons();
  UserPortal.init();

  Activity.log('JobPulse dashboard initialising…', 'info');

  await Dashboard.load();
  Dashboard.startPolling();

  Activity.log('Dashboard ready', 'success');
}

document.addEventListener('DOMContentLoaded', boot);

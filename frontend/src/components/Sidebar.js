// ── Minimal Top Navigation Bar with Clearable Notification Dropdown ──
import { Auth }              from '../auth/auth.js';
import { Router }            from '../main.js';
import { Icons }             from '../utils/icons.js';
import { NotificationStore } from '../utils/notifications.js';

const adminNavItems = [
  { route: 'dashboard', label: 'Dashboard' },
  { route: 'users',     label: 'Users' },
  { route: 'jobs',      label: 'Companies' },
];

const candidateNavItems = [
  { route: 'my-jobs', label: 'Job Explorer' },
];

export function Sidebar({ onLogout, currentRoute }) {
  const user    = Auth.get();
  const isAdmin = Auth.isAdmin();
  const items   = isAdmin ? adminNavItems : candidateNavItems;

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

  const navHtml = items.map(item => `
    <button class="nav-link-btn ${currentRoute === item.route ? 'active' : ''}"
            data-route="${item.route}">
      ${item.label}
    </button>`).join('');

  const el = document.createElement('header');
  el.className = 'top-navbar';
  el.innerHTML = `
    <!-- Brand (Left) -->
    <div class="nav-brand" id="nav-brand-home" title="JobPulse">
      <div class="brand-icon">${Icons.pulse(15)}</div>
      <div class="brand-title">Job<span>Pulse</span></div>
    </div>

    <!-- Center Navigation Links -->
    <div class="nav-links">
      ${navHtml}
    </div>

    <!-- Right Controls: Notification Icon + Profile Dropdown -->
    <div class="nav-right" style="display:flex;align-items:center;gap:8px;position:relative">
      
      <!-- Compact Notification Bell Dropdown Trigger -->
      <div style="position:relative">
        <button class="btn btn-ghost btn-sm" id="btn-notif-dropdown" title="Notifications" style="padding:6px 8px;color:var(--text-muted);position:relative">
          ${Icons.bell(15)}
          <span id="notif-badge-dot" style="position:absolute;top:5px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--primary);display:block"></span>
        </button>

        <!-- Notification Dropdown Menu -->
        <div class="profile-dropdown" id="notif-dropdown-menu" style="min-width:280px;max-width:320px;right:0;padding:0">
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:12.5px;font-weight:600;color:#fff">Notifications</span>
            <button class="btn btn-ghost btn-sm" id="btn-clear-all-notifs" style="font-size:11.5px;padding:2px 6px;color:var(--text-light)">
              Clear All
            </button>
          </div>
          <div id="notif-items-list" style="max-height:260px;overflow-y:auto">
            <!-- Filled dynamically -->
          </div>
        </div>
      </div>

      <!-- User Profile Dropdown Trigger -->
      <div style="position:relative">
        <button class="profile-menu-trigger" id="btn-profile-dropdown" title="Account Menu">
          <div class="user-avatar">${initials(user?.name)}</div>
          <span class="user-name-label">${user?.name || 'User'}</span>
          <span class="dropdown-chevron">${Icons.chevronDown(12)}</span>
        </button>

        <!-- Profile Dropdown Menu (Simple & Clean) -->
        <div class="profile-dropdown" id="profile-dropdown-menu" style="min-width:200px">
          <div class="dropdown-header" style="padding:10px 14px">
            <div style="font-size:13px;font-weight:600;color:#fff">${user?.name || 'User'}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">
              ${user?.email || ''}
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="menu-item-home">
            ${Icons.externalLink(13)} Home
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-danger" id="menu-item-logout">
            ${Icons.logOut(13)} Sign Out
          </button>
        </div>
      </div>
    </div>`;

  // Wire navigation buttons
  el.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => Router.goto(btn.dataset.route));
  });

  // Wire Brand click
  el.querySelector('#nav-brand-home').addEventListener('click', () => {
    Router.goto(isAdmin ? 'dashboard' : 'my-jobs');
  });

  // ── Render Notifications ────────────────────────────────────
  const notifListEl  = el.querySelector('#notif-items-list');
  const notifBadgeEl = el.querySelector('#notif-badge-dot');
  const notifBtn     = el.querySelector('#btn-notif-dropdown');
  const notifMenu    = el.querySelector('#notif-dropdown-menu');

  function renderNotifs(notifs) {
    if (!notifs.length) {
      notifBadgeEl.style.display = 'none';
      notifListEl.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--text-light);font-size:12.5px">
          No new notifications
        </div>`;
      return;
    }

    notifBadgeEl.style.display = 'block';
    notifListEl.innerHTML = notifs.map((n, idx) => `
      <div style="padding:10px 14px;border-bottom:${idx === notifs.length - 1 ? 'none' : '1px solid var(--border-subtle)'};font-size:12.5px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-weight:600;color:#fff">${n.title}</span>
          <span style="font-size:10.5px;color:var(--text-light)">${n.time}</span>
        </div>
        ${n.msg ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;line-height:1.4">${n.msg}</div>` : ''}
      </div>`).join('');
  }

  // Subscribe to notification updates
  renderNotifs(NotificationStore.get());
  NotificationStore.subscribe(renderNotifs);

  // Wire Clear All
  el.querySelector('#btn-clear-all-notifs').addEventListener('click', (e) => {
    e.stopPropagation();
    NotificationStore.clear();
  });

  // Wire Notification Dropdown toggle
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.remove('open');
    notifMenu.classList.toggle('open');
  });

  // Wire Profile Dropdown toggle
  const profileTrigger  = el.querySelector('#btn-profile-dropdown');
  const profileDropdown = el.querySelector('#profile-dropdown-menu');

  profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    notifMenu.classList.remove('open');
    profileDropdown.classList.toggle('open');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!el.contains(e.target)) {
      notifMenu.classList.remove('open');
      profileDropdown.classList.remove('open');
    }
  });

  // Dropdown items
  el.querySelector('#menu-item-home').addEventListener('click', () => {
    profileDropdown.classList.remove('open');
    Router.goto('landing');
  });

  el.querySelector('#menu-item-logout').addEventListener('click', () => {
    profileDropdown.classList.remove('open');
    if (onLogout) onLogout();
  });

  return el;
}

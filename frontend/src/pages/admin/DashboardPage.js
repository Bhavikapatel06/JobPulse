// ── Admin: Dashboard Page (System Overview) ──────────────────
import { API }     from '../../api/client.js';
import { Toast }   from '../../components/Toast.js';
import { Router }  from '../../main.js';
import { helpers } from '../../utils/helpers.js';
import { Icons }   from '../../utils/icons.js';

export function DashboardPage() {
  const el = document.createElement('div');
  el.className = 'page active';
  el.id = 'page-dashboard';

  el.innerHTML = `
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div>
          <div class="stat-label">Active Candidates</div>
          <div class="stat-value" id="stat-users">—</div>
          <div class="stat-meta" id="stat-users-meta">Loading candidates…</div>
        </div>
        <div class="stat-icon-wrap">${Icons.users(18)}</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Target Companies</div>
          <div class="stat-value" id="stat-cos">—</div>
          <div class="stat-meta" id="stat-cos-meta">Scraper endpoints</div>
        </div>
        <div class="stat-icon-wrap">${Icons.building(18)}</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Cached Jobs</div>
          <div class="stat-value" id="stat-jobs" style="color:var(--text)">—</div>
          <div class="stat-meta" id="stat-jobs-meta">Verified listings</div>
        </div>
        <div class="stat-icon-wrap">${Icons.briefcase(18)}</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Cluster Status</div>
          <div class="stat-value" id="stat-api" style="font-size:18px;color:var(--success)">—</div>
          <div class="stat-meta" id="stat-api-meta">Checking health…</div>
        </div>
        <div class="stat-icon-wrap" style="color:var(--success)">${Icons.activity(18)}</div>
      </div>
    </div>

    <!-- Two Column: Recent Candidates & Live Scraper Activity Stream -->
    <div class="two-col">
      <!-- Candidates List -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            ${Icons.users(15)} Candidate Profiles
          </span>
          <button class="btn btn-outline btn-sm" id="btn-view-all-users">
            Manage All →
          </button>
        </div>
        <ul class="user-list" id="dash-users">
          <li style="padding:20px;text-align:center;color:var(--text-muted)">Loading candidates…</li>
        </ul>
      </div>

      <!-- Automation Activity Stream -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            ${Icons.terminal(15)} Automation Activity Log
          </span>
          <button class="btn btn-ghost btn-sm" id="btn-refresh-feed" title="Refresh Feed">
            ${Icons.refresh(13)}
          </button>
        </div>
        <ul class="activity-list" id="activity-feed">
          <li class="activity-item">
            <div class="activity-dot blue"></div>
            <div>
              <div style="color:var(--text);font-weight:500;font-size:12.5px">Cluster connection initialized</div>
              <div style="font-size:11px;color:var(--text-light)">System ready</div>
            </div>
          </li>
        </ul>
      </div>
    </div>`;

  let pollInterval = null;

  async function load() {
    try {
      const [health, usersData, jobsData] = await Promise.all([
        API.health(), API.getUsers(), API.getJobs(),
      ]);

      const users   = usersData.data || [];
      const jobs    = jobsData.data  || [];
      const active  = users.filter(u => u.active).length;
      const total   = jobs.reduce((a, c) => a + (c.jobCount || 0), 0);

      el.querySelector('#stat-users').textContent     = active;
      el.querySelector('#stat-users-meta').textContent = `${users.length} total · ${active} active crons`;
      el.querySelector('#stat-cos').textContent        = jobs.length;
      el.querySelector('#stat-cos-meta').textContent   = `${jobs.length} company domains`;
      el.querySelector('#stat-jobs').textContent       = total;
      el.querySelector('#stat-jobs-meta').textContent  = 'Total cached listings';
      el.querySelector('#stat-api').textContent        = 'Operational';
      el.querySelector('#stat-api-meta').textContent   = `MongoDB: ${health.mongoState || 'Connected'}`;

      renderRecentUsers(users.slice(0, 5));
      logActivity('Telemetry data refreshed from cluster', 'green');
    } catch (err) {
      el.querySelector('#stat-api').textContent      = 'Degraded';
      el.querySelector('#stat-api').style.color      = 'var(--danger)';
      el.querySelector('#stat-api-meta').textContent = err.message;
      logActivity(`Connection error: ${err.message}`, 'red');
    }
  }

  function renderRecentUsers(users) {
    const list = el.querySelector('#dash-users');
    if (!users.length) {
      list.innerHTML = `<li style="padding:24px;text-align:center;color:var(--text-muted)">No candidates registered yet.</li>`;
      return;
    }
    list.innerHTML = users.map(u => `
      <li class="user-item">
        <div class="user-item-avatar">${helpers.initials(u.name)}</div>
        <div class="user-item-info">
          <div class="user-item-name">
            ${u.name}
            <span class="badge ${u.role === 'admin' ? 'badge-blue' : 'badge-slate'}" style="font-size:10px">
              ${u.role === 'admin' ? 'Admin' : 'Candidate'}
            </span>
          </div>
          <div class="user-item-sub">
            ${u.desiredRole} · ${(u.companies || []).slice(0, 3).join(', ')} · Alert ${u.notifyTime}
          </div>
        </div>
      </li>`).join('');
  }

  function logActivity(msg, color = 'blue') {
    const feed = el.querySelector('#activity-feed');
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
      <div class="activity-dot ${color}"></div>
      <div>
        <div style="color:var(--text);font-weight:500;font-size:12.5px">${msg}</div>
        <div style="font-size:11px;color:var(--text-light)">${time}</div>
      </div>`;
    feed.prepend(li);
    while (feed.children.length > 10) feed.lastChild.remove();
  }

  el.querySelector('#btn-view-all-users').addEventListener('click', () => Router.goto('users'));
  el.querySelector('#btn-refresh-feed').addEventListener('click', () => { load(); logActivity('Manual telemetry refresh triggered', 'amber'); });

  load();
  pollInterval = setInterval(load, 30000);

  el._unmount = () => clearInterval(pollInterval);
  return el;
}

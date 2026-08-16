// ── Admin: Candidates & Users Management (Emoji-free) ────────
import { API }     from '../../api/client.js';
import { Toast }   from '../../components/Toast.js';
import { confirm } from '../../components/Modal.js';
import { helpers } from '../../utils/helpers.js';
import { Icons }   from '../../utils/icons.js';

export function UsersPage() {
  const el = document.createElement('div');
  el.className = 'page active';
  el.id = 'page-users';

  el.innerHTML = `
    <div class="flex items-center justify-between" style="margin-bottom:20px">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px">Candidate Directory</h2>
        <p style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Manage target companies, match keywords, and notification schedules</p>
      </div>
      <div class="flex items-center gap-2">
        <span id="users-count-badge"></span>
        <button class="btn btn-primary btn-sm" id="btn-create-user">
          ${Icons.plus(13)} Add Candidate
        </button>
      </div>
    </div>

    <!-- Users List Card -->
    <div class="card">
      <ul class="user-list" id="users-list-container">
        <li style="padding:28px;text-align:center;color:var(--text-muted)">Loading candidate directory…</li>
      </ul>
    </div>

    <!-- Slide-in Drawer for Create / Edit -->
    <div class="overlay" id="user-drawer-overlay"></div>
    <aside class="drawer" id="user-drawer">
      <div class="drawer-header">
        <div>
          <h3 style="font-size:15px;font-weight:600;color:#fff" id="drawer-title">Add Candidate</h3>
          <p style="font-size:11.5px;color:var(--text-muted);margin-top:1px" id="drawer-sub">Configure user profile and automation settings</p>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-close-drawer">${Icons.x(13)}</button>
      </div>

      <div class="drawer-body">
        <form id="user-profile-form" autocomplete="off">
          <input type="hidden" id="form-user-id" />

          <div class="form-group">
            <label class="form-label">Full Name <span>*</span></label>
            <input class="form-input" type="text" id="form-name" placeholder="e.g. Alex Rivera" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email Address <span>*</span></label>
            <input class="form-input" type="email" id="form-email" placeholder="e.g. alex@example.com" required />
          </div>

          <div class="form-group">
            <label class="form-label">Access Role <span>*</span></label>
            <select class="form-select" id="form-role">
              <option value="user">Candidate (Job Explorer only)</option>
              <option value="admin">Administrator (Full Console Access)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Desired Job Title <span>*</span></label>
            <input class="form-input" type="text" id="form-desired-role" placeholder="e.g. Software Engineer" required />
          </div>

          <div class="form-group">
            <label class="form-label">Target Companies <span>*</span></label>
            <input class="form-input" type="text" id="form-companies" placeholder="Google, Microsoft, PhonePe, Meesho" required />
            <div class="form-hint">Comma-separated company names to scrape</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location Constraint</label>
              <input class="form-input" type="text" id="form-location" placeholder="e.g. Remote / India" />
            </div>
            <div class="form-group">
              <label class="form-label">Experience Level</label>
              <select class="form-select" id="form-exp">
                <option value="">Any Level</option>
                <option value="Junior">Junior / Entry</option>
                <option value="Mid-level">Mid-Level</option>
                <option value="Senior">Senior / Staff</option>
                <option value="Lead">Lead / Principal</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Alert Schedule Time (24h) <span>*</span></label>
            <input class="form-input" type="time" id="form-notify-time" value="09:00" required />
          </div>
        </form>
      </div>

      <div class="drawer-footer">
        <button class="btn btn-outline btn-sm" id="btn-cancel-drawer">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-user">
          <span id="btn-save-label">Save Candidate</span>
        </button>
      </div>
    </aside>`;

  let userDirectory = [];
  let formMode      = 'create';

  async function loadDirectory() {
    try {
      const data = await API.getUsers();
      userDirectory = data.data || [];

      el.querySelector('#users-count-badge').innerHTML = `
        <span class="badge badge-slate">${userDirectory.length} Candidates</span>`;

      renderList(userDirectory);
    } catch (err) {
      Toast.error('Load Failed', err.message);
    }
  }

  function renderList(users) {
    const listContainer = el.querySelector('#users-list-container');
    if (!users.length) {
      listContainer.innerHTML = `
        <li style="padding:36px;text-align:center;color:var(--text-muted)">
          <div style="font-size:14px;font-weight:600;color:#fff">No Candidates Found</div>
          <div style="font-size:12px;margin-top:2px">Click "Add Candidate" to configure a profile.</div>
        </li>`;
      return;
    }

    listContainer.innerHTML = users.map(u => `
      <li class="user-item">
        <div class="user-item-avatar">${helpers.initials(u.name)}</div>
        <div class="user-item-info">
          <div class="user-item-name">
            ${u.name}
            <span class="badge ${u.role === 'admin' ? 'badge-blue' : 'badge-slate'}" style="font-size:10px">
              ${u.role === 'admin' ? 'Admin' : 'Candidate'}
            </span>
            ${!u.active ? '<span class="badge badge-amber" style="font-size:10px">Inactive</span>' : ''}
            <span class="badge badge-blue" id="pipe-run-${u._id}" style="display:none;font-size:10px">
              Running Scraper...
            </span>
          </div>
          <div class="user-item-sub">
            <span style="color:var(--text);font-weight:500">${u.desiredRole}</span> · 
            ${(u.companies || []).map(c => `<span class="badge badge-slate" style="font-size:10px;padding:1px 5px">${c}</span>`).join(' ')} · 
            Alert ${u.notifyTime}
          </div>
        </div>
        <div class="user-actions">
          <button class="btn btn-outline btn-sm" data-action="trigger" data-id="${u._id}" data-name="${u.name}" title="Run Scraper Pipeline">
            ${Icons.play(12)} Run
          </button>
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${u._id}" title="Edit Profile">
            ${Icons.edit(13)}
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${u._id}" data-name="${u.name}" title="Delete Candidate">
            ${Icons.trash(13)}
          </button>
        </div>
      </li>`).join('');

    listContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { action, id, name } = btn.dataset;
        if (action === 'trigger') triggerPipeline(id, name);
        if (action === 'edit')    openDrawer('edit', userDirectory.find(u => u._id === id));
        if (action === 'delete')  deleteUser(id, name);
      });
    });
  }

  function openDrawer(mode = 'create', user = null) {
    formMode = mode;
    el.querySelector('#drawer-title').textContent = mode === 'edit' ? 'Edit Candidate Profile' : 'Add Candidate Profile';
    el.querySelector('#drawer-sub').textContent   = mode === 'edit' ? 'Update matching rules and scheduled delivery' : 'Configure new target profile';
    el.querySelector('#btn-save-label').textContent = mode === 'edit' ? 'Save Changes' : 'Create Candidate';

    el.querySelector('#form-user-id').value      = user?._id || '';
    el.querySelector('#form-name').value         = user?.name || '';
    el.querySelector('#form-email').value        = user?.email || '';
    el.querySelector('#form-role').value         = user?.role || 'user';
    el.querySelector('#form-desired-role').value = user?.desiredRole || '';
    el.querySelector('#form-companies').value    = (user?.companies || []).join(', ');
    el.querySelector('#form-location').value     = user?.filters?.location || '';
    el.querySelector('#form-exp').value          = user?.filters?.experienceLevel || '';
    el.querySelector('#form-notify-time').value  = user?.notifyTime || '09:00';

    el.querySelector('#user-drawer-overlay').classList.add('open');
    el.querySelector('#user-drawer').classList.add('open');
    setTimeout(() => el.querySelector('#form-name').focus(), 250);
  }

  function closeDrawer() {
    el.querySelector('#user-drawer-overlay').classList.remove('open');
    el.querySelector('#user-drawer').classList.remove('open');
  }

  async function saveUser() {
    const body = {
      name:        el.querySelector('#form-name').value.trim(),
      email:       el.querySelector('#form-email').value.trim(),
      role:        el.querySelector('#form-role').value,
      desiredRole: el.querySelector('#form-desired-role').value.trim(),
      companies:   el.querySelector('#form-companies').value.split(',').map(s => s.trim()).filter(Boolean),
      filters: {
        location:        el.querySelector('#form-location').value.trim() || null,
        experienceLevel: el.querySelector('#form-exp').value || null,
      },
      notifyTime: el.querySelector('#form-notify-time').value,
    };

    if (!body.name || !body.email || !body.desiredRole || !body.companies.length) {
      Toast.warning('Incomplete Form', 'Please fill out all required fields.');
      return;
    }

    const saveBtn = el.querySelector('#btn-save-user');
    saveBtn.classList.add('loading');

    try {
      const id = el.querySelector('#form-user-id').value;
      if (formMode === 'edit') {
        await API.updateUser(id, body);
        Toast.success('Candidate Updated', body.name);
      } else {
        await API.createUser(body);
        Toast.success('Candidate Created', `${body.name} added successfully.`);
      }
      closeDrawer();
      loadDirectory();
    } catch (err) {
      Toast.error('Save Failed', err.message);
    } finally {
      saveBtn.classList.remove('loading');
    }
  }

  async function triggerPipeline(id, name) {
    const badge = el.querySelector(`#pipe-run-${id}`);
    if (badge) badge.style.display = 'inline-flex';
    Toast.info('Scraper Dispatched', `Running scraper for ${name}...`);

    try {
      await API.triggerUser(id);
      Toast.success('Pipeline Started', 'Scrapers running in background.');
    } catch (err) {
      Toast.error('Trigger Failed', err.message);
    }

    setTimeout(() => { if (badge) badge.style.display = 'none'; }, 10000);
  }

  async function deleteUser(id, name) {
    const confirmed = await confirm({
      iconKey: 'trash',
      title: 'Delete Candidate',
      msg: `Permanently delete "${name}" from the system?`,
      okLabel: 'Delete',
      okClass: 'btn-danger',
    });

    if (!confirmed) return;

    try {
      await API.deleteUser(id);
      Toast.success('Candidate Deleted', name);
      loadDirectory();
    } catch (err) {
      Toast.error('Delete Failed', err.message);
    }
  }

  el.querySelector('#btn-create-user').addEventListener('click', () => openDrawer('create'));
  el.querySelector('#btn-close-drawer').addEventListener('click', closeDrawer);
  el.querySelector('#btn-cancel-drawer').addEventListener('click', closeDrawer);
  el.querySelector('#user-drawer-overlay').addEventListener('click', closeDrawer);
  el.querySelector('#btn-save-user').addEventListener('click', saveUser);

  loadDirectory();
  return el;
}

// ── JobPulse Frontend — Main Entry Point & Router ───────────
import './style.css';
import { Auth }          from './auth/auth.js';
import { API }           from './api/client.js';
import { LandingPage }   from './pages/LandingPage.js';
import { LoginPage }     from './pages/LoginPage.js';
import { DashboardPage } from './pages/admin/DashboardPage.js';
import { UsersPage }     from './pages/admin/UsersPage.js';
import { JobsPage }      from './pages/admin/JobsPage.js';
import { MyJobsPage }    from './pages/user/MyJobsPage.js';
import { Sidebar }       from './components/Sidebar.js';

// Setup Toast Root
const toastRoot = document.getElementById('toast-root');
if (toastRoot) toastRoot.className = 'toast-container';

let activeComponent = null;

const pageConfig = {
  // Public
  landing:   { title: 'JobPulse', subtitle: 'Autonomous AI Job Tracking', public: true, factory: LandingPage },
  
  // Admin Routes
  dashboard: { title: 'Dashboard',             subtitle: 'Real-time telemetry, cluster health & live activity', role: 'admin', factory: DashboardPage },
  users:     { title: 'Users',                 subtitle: 'Manage candidate preferences, schedules & active crons', role: 'admin', factory: UsersPage },
  jobs:      { title: 'Companies',             subtitle: 'Enterprise career endpoints & cached job inventories', role: 'admin', factory: JobsPage },
  
  // Candidate Routes
  'my-jobs': { title: 'My Matched Jobs',       subtitle: 'Personalized career stream & live scraping runner', role: 'user',  factory: MyJobsPage },
};

export const Router = {
  currentRoute: null,

  showLogin(targetRole = 'user', initialMode = 'login') {
    if (activeComponent?._unmount) activeComponent._unmount();
    this.currentRoute = 'login';
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    const loginPage = LoginPage({
      initialRole: targetRole,
      initialMode,
      onLogin: (user) => {
        if (user.role === 'admin') {
          this.goto('dashboard');
        } else {
          this.goto('my-jobs');
        }
      },
    });
    app.appendChild(loginPage);
  },

  goto(route) {
    const config = pageConfig[route];
    if (!config) {
      this.goto('landing');
      return;
    }

    // Public route (Landing)
    if (config.public) {
      if (activeComponent?._unmount) activeComponent._unmount();
      this.currentRoute = route;
      const app = document.getElementById('app');
      app.innerHTML = '';
      activeComponent = config.factory();
      app.appendChild(activeComponent);
      return;
    }

    // Auth & Role checking for private routes
    const user = Auth.get();
    if (!user) {
      this.showLogin(config.role || 'user');
      return;
    }

    // If candidate attempts to visit admin route
    if (config.role === 'admin' && user.role !== 'admin') {
      this.goto('my-jobs');
      return;
    }

    this.currentRoute = route;
    this.renderAppShell(user, route, config);
  },

  renderAppShell(user, route, config) {
    const app = document.getElementById('app');
    
    // Check if shell is already present
    let shell = document.querySelector('.app-shell');
    let pageRoot = document.getElementById('page-root');
    let topbarTitle = document.getElementById('topbar-page-title');
    let topbarSub = document.getElementById('topbar-page-sub');

    if (!shell) {
      app.innerHTML = '';
      shell = document.createElement('div');
      shell.className = 'app-shell';

      // Top Navbar
      const navbar = Sidebar({
        currentRoute: route,
        onLogout: () => {
          Auth.clear();
          this.goto('landing');
        },
      });
      shell.appendChild(navbar);

      // Main content wrap
      const main = document.createElement('div');
      main.className = 'main-content';

      // Page Title Bar (sub-header for admin)
      const titleBar = document.createElement('div');
      titleBar.className = 'page-title-bar';
      titleBar.id = 'global-title-bar';
      titleBar.style.display = route === 'my-jobs' ? 'none' : 'flex';
      titleBar.innerHTML = `
        <div class="page-title">
          <span id="topbar-page-title">${config.title}</span>
          <span class="page-subtitle" id="topbar-page-sub">${config.subtitle}</span>
        </div>
        <div class="live-clock-pill" id="live-clock-pill"></div>`;

      // Live Clock
      const clockEl = titleBar.querySelector('#live-clock-pill');
      const tick = () => {
        clockEl.textContent = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
      };
      tick();
      setInterval(tick, 1000);

      main.appendChild(titleBar);

      // Page content container
      const content = document.createElement('div');
      content.className = 'page-content';
      
      pageRoot = document.createElement('div');
      pageRoot.id = 'page-root';
      content.appendChild(pageRoot);
      main.appendChild(content);

      shell.appendChild(main);
      app.appendChild(shell);

      // Check API status periodically
      this.probeApi();
    } else {
      // Update existing title bar & active navbar buttons
      const titleBarEl = document.getElementById('global-title-bar');
      if (titleBarEl) {
        titleBarEl.style.display = route === 'my-jobs' ? 'none' : 'flex';
      }
      if (topbarTitle) topbarTitle.textContent = config.title;
      if (topbarSub)   topbarSub.textContent   = config.subtitle;

      document.querySelectorAll('.nav-link-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.route === route);
      });
    }

    // Mount page view
    if (activeComponent?._unmount) activeComponent._unmount();
    pageRoot.innerHTML = '';
    activeComponent = config.factory();
    pageRoot.appendChild(activeComponent);
  },

  async probeApi() {
    try {
      await API.health();
      const dot = document.getElementById('nav-status-dot');
      const txt = document.getElementById('nav-status-text');
      if (dot) dot.className = 'activity-dot green';
      if (txt) txt.textContent = 'API :3000 Online';
    } catch {
      const dot = document.getElementById('nav-status-dot');
      const txt = document.getElementById('nav-status-text');
      if (dot) dot.className = 'activity-dot red';
      if (txt) txt.textContent = 'API Offline';
    }
  },
};

// ── Application Boot Sequence ───────────────────────────────
function boot() {
  const user = Auth.get();
  if (user) {
    if (user.role === 'admin') {
      Router.goto('dashboard');
    } else {
      Router.goto('my-jobs');
    }
  } else {
    // Default to Landing page for visitors
    Router.goto('landing');
  }
}

document.addEventListener('DOMContentLoaded', boot);

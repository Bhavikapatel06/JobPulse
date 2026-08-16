// ── JobPulse — Public Landing Page (User-Centric, Emoji-Free) ──
import { Router } from '../main.js';
import { Icons }  from '../utils/icons.js';

export function LandingPage() {
  const el = document.createElement('div');
  el.className = 'landing-wrap';

  el.innerHTML = `
    <!-- Top Landing Navbar -->
    <header class="top-navbar" style="position:sticky;top:0;background:var(--surface-glass);backdrop-filter:blur(12px)">
      <div class="nav-brand" id="brand-home">
        <div class="brand-icon">${Icons.pulse(17)}</div>
        <div class="brand-title">Job<span>Pulse</span></div>
      </div>
      <nav class="nav-links">
        <a href="#features" class="nav-link-btn">Features</a>
        <a href="#how-it-works" class="nav-link-btn">How It Works</a>
      </nav>
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-sm" id="btn-signin-nav" style="padding:6px 14px;font-size:13.5px">
          Sign In
        </button>
        <button class="btn btn-primary btn-sm" id="btn-signup-nav" style="padding:6px 16px;font-size:13.5px">
          Get Started
        </button>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="page-content" style="padding:70px 24px 50px;text-align:center;max-width:920px;margin:0 auto">
      <div class="badge badge-blue" style="margin-bottom:18px;padding:5px 14px;font-size:13px">
        Automated Career Scraping & Matching
      </div>
      <h1 style="font-size:44px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-1.2px;margin-bottom:18px">
        Never Miss Verified Openings at Your Target Companies
      </h1>
      <p style="font-size:16.5px;color:var(--text-muted);max-width:680px;margin:0 auto 32px;line-height:1.6">
        JobPulse continuously tracks enterprise career pages, matches verified job listings against your criteria, and lets you explore and apply directly with one click.
      </p>
      <div class="flex items-center gap-3" style="justify-content:center;margin-bottom:30px">
        <button class="btn btn-primary btn-lg" id="hero-get-started" style="font-size:15px;padding:12px 28px">
          Create Account — Find Jobs ${Icons.arrowRight(14)}
        </button>
        <button class="btn btn-outline btn-lg" id="hero-signin" style="font-size:15px;padding:12px 24px">
          Sign In
        </button>
      </div>
    </section>

    <!-- Features Section -->
    <section class="page-content" id="features" style="padding:30px 24px 50px;max-width:1120px;margin:0 auto">
      <div style="text-align:center;margin-bottom:36px">
        <h2 style="font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px">Built for Seamless Job Discovery</h2>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Everything you need to monitor target employers automatically</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        <div class="card" style="padding:24px">
          <div class="stat-icon-wrap" style="width:40px;height:40px;margin-bottom:14px">${Icons.building(20)}</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px">Multi-Company Tracking</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Monitor Google, Microsoft, PhonePe, Meesho, and more from a single unified hub.</p>
        </div>
        <div class="card" style="padding:24px">
          <div class="stat-icon-wrap" style="width:40px;height:40px;margin-bottom:14px">${Icons.filter(20)}</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px">Smart Role Filtering</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Filter listings by desired job title, tech stack, location constraint, and experience level.</p>
        </div>
        <div class="card" style="padding:24px">
          <div class="stat-icon-wrap" style="width:40px;height:40px;margin-bottom:14px">${Icons.externalLink(20)}</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px">Direct Application</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Inspect structured job requirements in a clean drawer and apply directly on verified career portals.</p>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="page-content" id="how-it-works" style="padding:30px 24px 60px;max-width:1120px;margin:0 auto">
      <div style="text-align:center;margin-bottom:36px">
        <h2 style="font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px">How It Works</h2>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Three simple steps to automate your job search</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        <div class="card" style="padding:24px">
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-bottom:8px">01</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px">Select Target Companies</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Choose the enterprise companies you want to track and set your target title and preferences.</p>
        </div>
        <div class="card" style="padding:24px">
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-bottom:8px">02</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px">Automatic Live Scrapes</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Headless scraper agents extract fresh job postings from career sites on your schedule.</p>
        </div>
        <div class="card" style="padding:24px">
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-bottom:8px">03</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px">Explore & One-Click Apply</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Browse filtered listings by company, inspect full job summaries, and apply with direct links.</p>
        </div>
      </div>
    </section>

    <!-- Bottom CTA Banner -->
    <section class="page-content" style="padding:20px 24px 70px;max-width:920px;margin:0 auto;text-align:center">
      <div class="card" style="padding:40px 30px;background:var(--surface-hover);border-color:var(--border-strong)">
        <h2 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:10px">Ready to Track Your Next Opportunity?</h2>
        <p style="font-size:14.5px;color:var(--text-muted);max-width:540px;margin:0 auto 24px">
          Sign in to access your personalized multi-company job feed and live scraper runner.
        </p>
        <button class="btn btn-primary btn-lg" id="bottom-get-started" style="font-size:15px;padding:12px 30px">
          Sign In to JobPulse ${Icons.arrowRight(14)}
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer style="border-top:1px solid var(--border);padding:24px 32px;display:flex;align-items:center;justify-content:space-between;background:var(--bg-dark)">
      <div class="flex items-center gap-2">
        <div class="brand-icon" style="width:26px;height:26px">${Icons.pulse(15)}</div>
        <span style="font-size:14px;font-weight:600;color:#fff">JobPulse</span>
        <span style="font-size:12px;color:var(--text-light);margin-left:8px">© 2026 JobPulse</span>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm" id="footer-signin-btn" style="font-size:12.5px">Sign In</button>
        <span class="badge badge-green" style="font-size:11px">${Icons.check(10)} API Operational</span>
      </div>
    </footer>`;

  // Wire buttons to open Sign In / Sign Up
  el.querySelector('#btn-signin-nav').addEventListener('click',    () => Router.showLogin('user', 'login'));
  el.querySelector('#btn-signup-nav').addEventListener('click',    () => Router.showLogin('user', 'signup'));
  el.querySelector('#hero-get-started').addEventListener('click',  () => Router.showLogin('user', 'signup'));
  el.querySelector('#hero-signin').addEventListener('click',       () => Router.showLogin('user', 'login'));
  el.querySelector('#bottom-get-started').addEventListener('click',() => Router.showLogin('user', 'signup'));
  el.querySelector('#footer-signin-btn').addEventListener('click', () => Router.showLogin('user', 'login'));
  el.querySelector('#brand-home').addEventListener('click',        () => Router.goto('landing'));

  // Wire smooth scrolling for navbar anchor links
  el.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href').slice(1);
      const targetEl = el.querySelector(`#${targetId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  return el;
}

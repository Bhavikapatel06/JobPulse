(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const u of n.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&r(u)}).observe(document,{childList:!0,subtree:!0});function s(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(i){if(i.ep)return;i.ep=!0;const n=s(i);fetch(i.href,n)}})();const G="jobpulse_session",z={save(e){localStorage.setItem(G,JSON.stringify(e))},get(){try{return JSON.parse(localStorage.getItem(G)||"null")}catch{return null}},clear(){localStorage.removeItem(G)},isAdmin(){const e=this.get();return e&&e.role==="admin"},isUser(){const e=this.get();return e&&e.role==="user"},isLoggedIn(){return!!this.get()}},X="";async function j(e,t,s=null){const r={method:e,headers:{"Content-Type":"application/json"}};s&&(r.body=JSON.stringify(s));const i=await fetch(`${X}${t}`,r),n=await i.json().catch(()=>({}));if(!i.ok)throw new Error(n.error||n.message||`HTTP ${i.status}`);return n}const C={login:e=>j("POST","/api/auth/login",{email:e}),logout:()=>j("POST","/api/auth/logout"),health:()=>j("GET","/health"),getUsers:()=>j("GET","/api/users"),createUser:e=>j("POST","/api/users",e),updateUser:(e,t)=>j("PUT",`/api/users/${e}`,t),deleteUser:e=>j("DELETE",`/api/users/${e}?hard=true`),triggerUser:e=>j("POST",`/api/users/${e}/trigger`),getUserJobs:e=>j("GET",`/api/users/${e}/jobs`),getJobs:()=>j("GET","/api/jobs"),getJobsByCompany:e=>j("GET",`/api/jobs/${encodeURIComponent(e)}`),refreshCompany:e=>j("POST",`/api/jobs/${encodeURIComponent(e)}/refresh`)},a={pulse:(e=18,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>`,dashboard:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>`,users:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>`,user:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>`,building:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <line x1="9" y1="6" x2="9" y2="6.01"></line>
      <line x1="15" y1="6" x2="15" y2="6.01"></line>
      <line x1="9" y1="10" x2="9" y2="10.01"></line>
      <line x1="15" y1="10" x2="15" y2="10.01"></line>
      <line x1="9" y1="14" x2="9" y2="14.01"></line>
      <line x1="15" y1="14" x2="15" y2="14.01"></line>
      <line x1="9" y1="18" x2="15" y2="18"></line>
    </svg>`,briefcase:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>`,activity:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>`,shield:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>`,search:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>`,refresh:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>`,plus:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>`,edit:(e=15,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`,trash:(e=15,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`,play:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>`,externalLink:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>`,arrowRight:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>`,bell:(e=15,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>`,trash:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>`,logOut:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>`,mapPin:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>`,clock:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>`,calendar:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>`,award:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>`,check:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`,x:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,chevronRight:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>`,chevronDown:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`,filter:(e=14,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>`,alertCircle:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>`,info:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,terminal:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>`,layers:(e=16,t="")=>`
    <svg class="${t}" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>`};function Z(){const e=document.createElement("div");return e.className="landing-wrap",e.innerHTML=`
    <!-- Top Landing Navbar -->
    <header class="top-navbar" style="position:sticky;top:0;background:var(--surface-glass);backdrop-filter:blur(12px)">
      <div class="nav-brand" id="brand-home">
        <div class="brand-icon">${a.pulse(17)}</div>
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
          Create Account — Find Jobs ${a.arrowRight(14)}
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
          <div class="stat-icon-wrap" style="width:40px;height:40px;margin-bottom:14px">${a.building(20)}</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px">Multi-Company Tracking</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Monitor Google, Microsoft, PhonePe, Meesho, and more from a single unified hub.</p>
        </div>
        <div class="card" style="padding:24px">
          <div class="stat-icon-wrap" style="width:40px;height:40px;margin-bottom:14px">${a.filter(20)}</div>
          <h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px">Smart Role Filtering</h3>
          <p style="font-size:13.5px;color:var(--text-muted);line-height:1.55">Filter listings by desired job title, tech stack, location constraint, and experience level.</p>
        </div>
        <div class="card" style="padding:24px">
          <div class="stat-icon-wrap" style="width:40px;height:40px;margin-bottom:14px">${a.externalLink(20)}</div>
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
          Sign In to JobPulse ${a.arrowRight(14)}
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer style="border-top:1px solid var(--border);padding:24px 32px;display:flex;align-items:center;justify-content:space-between;background:var(--bg-dark)">
      <div class="flex items-center gap-2">
        <div class="brand-icon" style="width:26px;height:26px">${a.pulse(15)}</div>
        <span style="font-size:14px;font-weight:600;color:#fff">JobPulse</span>
        <span style="font-size:12px;color:var(--text-light);margin-left:8px">© 2026 JobPulse</span>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm" id="footer-signin-btn" style="font-size:12.5px">Sign In</button>
        <span class="badge badge-green" style="font-size:11px">${a.check(10)} API Operational</span>
      </div>
    </footer>`,e.querySelector("#btn-signin-nav").addEventListener("click",()=>q.showLogin("user","login")),e.querySelector("#btn-signup-nav").addEventListener("click",()=>q.showLogin("user","signup")),e.querySelector("#hero-get-started").addEventListener("click",()=>q.showLogin("user","signup")),e.querySelector("#hero-signin").addEventListener("click",()=>q.showLogin("user","login")),e.querySelector("#bottom-get-started").addEventListener("click",()=>q.showLogin("user","signup")),e.querySelector("#footer-signin-btn").addEventListener("click",()=>q.showLogin("user","login")),e.querySelector("#brand-home").addEventListener("click",()=>q.goto("landing")),e.querySelectorAll('a[href^="#"]').forEach(t=>{t.addEventListener("click",s=>{s.preventDefault();const r=t.getAttribute("href").slice(1),i=e.querySelector(`#${r}`);i&&i.scrollIntoView({behavior:"smooth"})})}),e}function ee({initialRole:e="user",initialMode:t="login",onLogin:s}){let r=e,i=t;const n=document.createElement("div");n.className="login-wrap",n.innerHTML=`
    <div class="login-card" style="max-width:440px">
      <div style="text-align:center;margin-bottom:20px">
        <div class="brand-icon" style="width:36px;height:36px;margin:0 auto 10px">
          ${a.pulse(20)}
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.4px">
          Job<span>Pulse</span>
        </h2>
        <p style="font-size:13.5px;color:var(--text-muted);margin-top:4px" id="login-sub-msg">
          Sign in to your account
        </p>
      </div>

      <!-- Role Selector Tabs -->
      <div class="login-tab-bar" style="margin-bottom:16px">
        <button class="login-tab-btn ${r==="user"?"active":""}" id="tab-candidate">
          ${a.briefcase(14)} Candidate
        </button>
        <button class="login-tab-btn ${r==="admin"?"active":""}" id="tab-admin">
          ${a.shield(14)} Administrator
        </button>
      </div>

      <!-- Candidate Sign In / Sign Up Sub-toggle -->
      <div id="candidate-mode-switch" style="display:${r==="user"?"flex":"none"};align-items:center;background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm);padding:3px;margin-bottom:16px">
        <button type="button" class="btn btn-ghost btn-sm w-full ${i==="login"?"active-mode":""}" id="btn-mode-signin" style="font-size:12.5px;padding:6px">
          Sign In
        </button>
        <button type="button" class="btn btn-ghost btn-sm w-full ${i==="signup"?"active-mode":""}" id="btn-mode-signup" style="font-size:12.5px;padding:6px">
          Create Account
        </button>
      </div>

      <!-- Error Box -->
      <div id="login-error" style="display:none;background:var(--danger-subtle);color:#F87171;border:1px solid var(--danger-border);border-radius:var(--radius-sm);padding:9px 13px;font-size:12.5px;margin-bottom:14px"></div>

      <!-- 1. Sign In Form (Candidate & Admin) -->
      <form id="login-form" autocomplete="off" style="display:${i==="login"?"block":"none"}">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            type="email"
            id="login-email"
            class="form-input"
            placeholder="name@example.com"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" id="login-submit-btn" style="margin-top:8px">
          <span id="btn-text">${r==="user"?"Open Candidate Portal":"Access Admin Console"}</span>
        </button>
      </form>

      <!-- 2. Candidate Sign Up Form -->
      <form id="signup-form" autocomplete="off" style="display:${i==="signup"&&r==="user"?"block":"none"}">
        <div class="form-group">
          <label class="form-label">Your Full Name *</label>
          <input type="text" id="signup-name" class="form-input" placeholder="e.g. Alex Sharma" required />
        </div>

        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input type="email" id="signup-email" class="form-input" placeholder="alex@gmail.com" required />
        </div>

        <div class="form-group">
          <label class="form-label">Desired Job Title *</label>
          <input type="text" id="signup-role" class="form-input" placeholder="e.g. Software Engineer" required />
        </div>

        <div class="form-group">
          <label class="form-label">Target Companies (comma-separated) *</label>
          <input type="text" id="signup-companies" class="form-input" placeholder="e.g. PhonePe, Google, Microsoft" value="PhonePe, Google" required />
        </div>

        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group">
            <label class="form-label">Notification Time (24-hr)</label>
            <input type="text" id="signup-time" class="form-input" placeholder="20:00" value="09:00" pattern="^([01]\\d|2[0-3]):([0-5]\\d)$" />
          </div>
          <div class="form-group">
            <label class="form-label">Location (Optional)</label>
            <input type="text" id="signup-location" class="form-input" placeholder="Remote / Bengaluru" />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" id="signup-submit-btn" style="margin-top:8px">
          Create Account & Find Jobs
        </button>
      </form>

      <!-- Quick Demo Credentials -->
      <div style="margin-top:20px;padding:12px;background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px">
          Quick Demo Accounts
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;font-size:12px" id="demo-chips">
          <!-- Filled dynamically -->
        </div>
      </div>

      <!-- Back to Landing -->
      <div style="text-align:center;margin-top:16px">
        <button class="btn btn-ghost btn-sm" id="btn-back-home" style="font-size:12.5px;color:var(--text-light)">
          ← Back to Homepage
        </button>
      </div>
    </div>`;const u=n.querySelector("#login-email"),o=n.querySelector("#login-error"),f=n.querySelector("#login-form"),p=n.querySelector("#signup-form"),m=n.querySelector("#login-submit-btn"),c=n.querySelector("#signup-submit-btn"),l=n.querySelector("#btn-text"),x=n.querySelector("#login-sub-msg"),E=n.querySelector("#tab-candidate"),I=n.querySelector("#tab-admin"),D=n.querySelector("#candidate-mode-switch"),N=n.querySelector("#btn-mode-signin"),H=n.querySelector("#btn-mode-signup"),P=n.querySelector("#demo-chips");function A(){E.classList.toggle("active",r==="user"),I.classList.toggle("active",r==="admin"),r==="admin"?(D.style.display="none",f.style.display="block",p.style.display="none",x.textContent="Sign in with administrator privileges",l.textContent="Access Admin Console"):(D.style.display="flex",N.classList.toggle("active-mode",i==="login"),H.classList.toggle("active-mode",i==="signup"),i==="login"?(f.style.display="block",p.style.display="none",x.textContent="Sign in to access your matched job feed",l.textContent="Open Candidate Portal"):(f.style.display="none",p.style.display="block",x.textContent="Set up your profile, target companies & schedule")),F()}async function F(){try{const M=((await C.getUsers()).data||[]).filter($=>r==="admin"?$.role==="admin":$.role!=="admin");M.length>0?(P.innerHTML=M.slice(0,3).map($=>`
          <div style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:4px;background:rgba(255,255,255,0.02)" class="demo-user-chip" data-email="${$.email}">
            <span style="color:var(--text);font-weight:500">${$.name}</span>
            <span style="color:var(--text-muted);font-family:monospace">${$.email}</span>
          </div>`).join(""),n.querySelectorAll(".demo-user-chip").forEach($=>{$.addEventListener("click",()=>{i="login",A(),u.value=$.dataset.email,u.focus()})})):P.innerHTML='<div style="color:var(--text-light)">Enter registered email to continue.</div>'}catch{P.innerHTML='<div style="color:var(--text-light)">Enter registered email to continue.</div>'}}return E.addEventListener("click",()=>{r="user",A()}),I.addEventListener("click",()=>{r="admin",A()}),N.addEventListener("click",()=>{i="login",A()}),H.addEventListener("click",()=>{i="signup",A()}),f.addEventListener("submit",async R=>{R.preventDefault();const T=u.value.trim();if(T){o.style.display="none",m.classList.add("loading");try{const $=(await C.login(T)).user;if(r==="admin"&&$.role!=="admin"){o.textContent=`"${$.name}" is a candidate account. Redirecting to Candidate Portal...`,o.style.display="block",setTimeout(()=>{z.save($),s&&s($)},1e3);return}z.save($),s&&s($)}catch(M){o.textContent=M.message||"Login failed. Please verify your email.",o.style.display="block"}finally{m.classList.remove("loading")}}}),p.addEventListener("submit",async R=>{R.preventDefault();const T=n.querySelector("#signup-name").value.trim(),M=n.querySelector("#signup-email").value.trim(),$=n.querySelector("#signup-role").value.trim(),J=n.querySelector("#signup-companies").value.trim(),U=n.querySelector("#signup-time").value.trim()||"09:00",d=n.querySelector("#signup-location").value.trim()||null,g=J.split(",").map(h=>h.trim()).filter(Boolean);if(!T||!M||!$||!g.length){o.textContent="Please fill out all required fields.",o.style.display="block";return}o.style.display="none",c.classList.add("loading");try{const h={name:T,email:M,desiredRole:$,companies:g,notifyTime:U,filters:{location:d||null},role:"user"},y=(await C.createUser(h)).data;z.save(y),s&&s(y)}catch(h){o.textContent=h.message||"Sign up failed. Please check your inputs.",o.style.display="block"}finally{c.classList.remove("loading")}}),n.querySelector("#btn-back-home").addEventListener("click",()=>{q.goto("landing")}),A(),n}function te(){return document.getElementById("toast-root")}function K(e){e.classList.contains("removing")||(e.classList.add("removing"),e.addEventListener("animationend",()=>e.remove(),{once:!0}))}function O(e,t,s,r=2500){const i=te();if(!i)return;const n={success:a.check(14),error:a.alertCircle(14),info:a.info(14),warning:a.alertCircle(14)}[e]||a.info(14),u=document.createElement("div");u.className=`toast toast-${e}`,u.innerHTML=`
    <div style="display:flex;align-items:center;color:var(--${e==="info"?"primary":e})">${n}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:600;color:#fff">${t}</div>
      ${s?`<div style="font-size:12px;color:var(--text-muted);margin-top:1px">${s}</div>`:""}
    </div>
    <button class="btn btn-ghost btn-sm" style="padding:2px 6px;color:var(--text-light)" title="Dismiss">
      ${a.x(12)}
    </button>`,u.querySelector("button").addEventListener("click",()=>K(u)),i.appendChild(u),r>0&&setTimeout(()=>K(u),r)}const w={success:(e,t)=>O("success",e,t),error:(e,t)=>O("error",e,t),info:(e,t)=>O("info",e,t),warning:(e,t)=>O("warning",e,t)},V={initials(e=""){return e.split(" ").slice(0,2).map(t=>{var s;return((s=t[0])==null?void 0:s.toUpperCase())||""}).join("")||"?"},timeAgo(e){if(!e)return"Never";const t=Date.now()-new Date(e).getTime(),s=Math.floor(t/6e4),r=Math.floor(t/36e5),i=Math.floor(t/864e5);return s<1?"just now":s<60?`${s}m ago`:r<24?`${r}h ago`:`${i}d ago`},statusBadge(e){const t={success:["badge-green",`${a.check(12)} Verified`],failed:["badge-red",`${a.x(12)} Failed`],pending:["badge-blue",`${a.refresh(12)} Pending`]},[s,r]=t[e]||["badge-slate",e||"Unknown"];return`<span class="badge ${s}">${r}</span>`}};function ie(){const e=document.createElement("div");e.className="page active",e.id="page-dashboard",e.innerHTML=`
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div>
          <div class="stat-label">Active Candidates</div>
          <div class="stat-value" id="stat-users">—</div>
          <div class="stat-meta" id="stat-users-meta">Loading candidates…</div>
        </div>
        <div class="stat-icon-wrap">${a.users(18)}</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Target Companies</div>
          <div class="stat-value" id="stat-cos">—</div>
          <div class="stat-meta" id="stat-cos-meta">Scraper endpoints</div>
        </div>
        <div class="stat-icon-wrap">${a.building(18)}</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Cached Jobs</div>
          <div class="stat-value" id="stat-jobs" style="color:var(--text)">—</div>
          <div class="stat-meta" id="stat-jobs-meta">Verified listings</div>
        </div>
        <div class="stat-icon-wrap">${a.briefcase(18)}</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Cluster Status</div>
          <div class="stat-value" id="stat-api" style="font-size:18px;color:var(--success)">—</div>
          <div class="stat-meta" id="stat-api-meta">Checking health…</div>
        </div>
        <div class="stat-icon-wrap" style="color:var(--success)">${a.activity(18)}</div>
      </div>
    </div>

    <!-- Two Column: Recent Candidates & Live Scraper Activity Stream -->
    <div class="two-col">
      <!-- Candidates List -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            ${a.users(15)} Candidate Profiles
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
            ${a.terminal(15)} Automation Activity Log
          </span>
          <button class="btn btn-ghost btn-sm" id="btn-refresh-feed" title="Refresh Feed">
            ${a.refresh(13)}
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
    </div>`;let t=null;async function s(){try{const[n,u,o]=await Promise.all([C.health(),C.getUsers(),C.getJobs()]),f=u.data||[],p=o.data||[],m=f.filter(l=>l.active).length,c=p.reduce((l,x)=>l+(x.jobCount||0),0);e.querySelector("#stat-users").textContent=m,e.querySelector("#stat-users-meta").textContent=`${f.length} total · ${m} active crons`,e.querySelector("#stat-cos").textContent=p.length,e.querySelector("#stat-cos-meta").textContent=`${p.length} company domains`,e.querySelector("#stat-jobs").textContent=c,e.querySelector("#stat-jobs-meta").textContent="Total cached listings",e.querySelector("#stat-api").textContent="Operational",e.querySelector("#stat-api-meta").textContent=`MongoDB: ${n.mongoState||"Connected"}`,r(f.slice(0,5)),i("Telemetry data refreshed from cluster","green")}catch(n){e.querySelector("#stat-api").textContent="Degraded",e.querySelector("#stat-api").style.color="var(--danger)",e.querySelector("#stat-api-meta").textContent=n.message,i(`Connection error: ${n.message}`,"red")}}function r(n){const u=e.querySelector("#dash-users");if(!n.length){u.innerHTML='<li style="padding:24px;text-align:center;color:var(--text-muted)">No candidates registered yet.</li>';return}u.innerHTML=n.map(o=>`
      <li class="user-item">
        <div class="user-item-avatar">${V.initials(o.name)}</div>
        <div class="user-item-info">
          <div class="user-item-name">
            ${o.name}
            <span class="badge ${o.role==="admin"?"badge-blue":"badge-slate"}" style="font-size:10px">
              ${o.role==="admin"?"Admin":"Candidate"}
            </span>
          </div>
          <div class="user-item-sub">
            ${o.desiredRole} · ${(o.companies||[]).slice(0,3).join(", ")} · Alert ${o.notifyTime}
          </div>
        </div>
      </li>`).join("")}function i(n,u="blue"){const o=e.querySelector("#activity-feed"),f=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),p=document.createElement("li");for(p.className="activity-item",p.innerHTML=`
      <div class="activity-dot ${u}"></div>
      <div>
        <div style="color:var(--text);font-weight:500;font-size:12.5px">${n}</div>
        <div style="font-size:11px;color:var(--text-light)">${f}</div>
      </div>`,o.prepend(p);o.children.length>10;)o.lastChild.remove()}return e.querySelector("#btn-view-all-users").addEventListener("click",()=>q.goto("users")),e.querySelector("#btn-refresh-feed").addEventListener("click",()=>{s(),i("Manual telemetry refresh triggered","amber")}),s(),t=setInterval(s,3e4),e._unmount=()=>clearInterval(t),e}let _=null;function ne(){return document.getElementById("modal-root")}function oe({iconKey:e="alertCircle",title:t="Confirm Action",msg:s="",okLabel:r="Confirm",okClass:i="btn-danger"}={}){const n=ne();if(!n)return Promise.resolve(!1);const u=a[e]?a[e](28):a.alertCircle(28),o=document.createElement("div");return o.className="confirm-backdrop",o.innerHTML=`
    <div class="confirm-box">
      <div style="display:flex;justify-content:center;color:var(--text-muted);margin-bottom:12px">
        ${u}
      </div>
      <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px">${t}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.5">${s}</div>
      <div class="flex items-center justify-between gap-2" style="justify-content:center">
        <button class="btn btn-outline btn-sm" id="c-cancel">Cancel</button>
        <button class="btn ${i} btn-sm" id="c-ok">${r}</button>
      </div>
    </div>`,n.appendChild(o),requestAnimationFrame(()=>o.classList.add("open")),new Promise(f=>{_=f,o.querySelector("#c-ok").addEventListener("click",()=>Y(o,!0)),o.querySelector("#c-cancel").addEventListener("click",()=>Y(o,!1)),o.addEventListener("click",p=>{p.target===o&&Y(o,!1)})})}function Y(e,t){e.classList.remove("open"),setTimeout(()=>e.remove(),150),_&&(_(t),_=null)}function ae(){const e=document.createElement("div");e.className="page active",e.id="page-users",e.innerHTML=`
    <div class="flex items-center justify-between" style="margin-bottom:20px">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px">Candidate Directory</h2>
        <p style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Manage target companies, match keywords, and notification schedules</p>
      </div>
      <div class="flex items-center gap-2">
        <span id="users-count-badge"></span>
        <button class="btn btn-primary btn-sm" id="btn-create-user">
          ${a.plus(13)} Add Candidate
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
        <button class="btn btn-ghost btn-sm" id="btn-close-drawer">${a.x(13)}</button>
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
    </aside>`;let t=[],s="create";async function r(){try{t=(await C.getUsers()).data||[],e.querySelector("#users-count-badge").innerHTML=`
        <span class="badge badge-slate">${t.length} Candidates</span>`,i(t)}catch(m){w.error("Load Failed",m.message)}}function i(m){const c=e.querySelector("#users-list-container");if(!m.length){c.innerHTML=`
        <li style="padding:36px;text-align:center;color:var(--text-muted)">
          <div style="font-size:14px;font-weight:600;color:#fff">No Candidates Found</div>
          <div style="font-size:12px;margin-top:2px">Click "Add Candidate" to configure a profile.</div>
        </li>`;return}c.innerHTML=m.map(l=>`
      <li class="user-item">
        <div class="user-item-avatar">${V.initials(l.name)}</div>
        <div class="user-item-info">
          <div class="user-item-name">
            ${l.name}
            <span class="badge ${l.role==="admin"?"badge-blue":"badge-slate"}" style="font-size:10px">
              ${l.role==="admin"?"Admin":"Candidate"}
            </span>
            ${l.active?"":'<span class="badge badge-amber" style="font-size:10px">Inactive</span>'}
            <span class="badge badge-blue" id="pipe-run-${l._id}" style="display:none;font-size:10px">
              Running Scraper...
            </span>
          </div>
          <div class="user-item-sub">
            <span style="color:var(--text);font-weight:500">${l.desiredRole}</span> · 
            ${(l.companies||[]).map(x=>`<span class="badge badge-slate" style="font-size:10px;padding:1px 5px">${x}</span>`).join(" ")} · 
            Alert ${l.notifyTime}
          </div>
        </div>
        <div class="user-actions">
          <button class="btn btn-outline btn-sm" data-action="trigger" data-id="${l._id}" data-name="${l.name}" title="Run Scraper Pipeline">
            ${a.play(12)} Run
          </button>
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${l._id}" title="Edit Profile">
            ${a.edit(13)}
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${l._id}" data-name="${l.name}" title="Delete Candidate">
            ${a.trash(13)}
          </button>
        </div>
      </li>`).join(""),c.querySelectorAll("[data-action]").forEach(l=>{l.addEventListener("click",x=>{x.stopPropagation();const{action:E,id:I,name:D}=l.dataset;E==="trigger"&&f(I,D),E==="edit"&&n("edit",t.find(N=>N._id===I)),E==="delete"&&p(I,D)})})}function n(m="create",c=null){var l,x;s=m,e.querySelector("#drawer-title").textContent=m==="edit"?"Edit Candidate Profile":"Add Candidate Profile",e.querySelector("#drawer-sub").textContent=m==="edit"?"Update matching rules and scheduled delivery":"Configure new target profile",e.querySelector("#btn-save-label").textContent=m==="edit"?"Save Changes":"Create Candidate",e.querySelector("#form-user-id").value=(c==null?void 0:c._id)||"",e.querySelector("#form-name").value=(c==null?void 0:c.name)||"",e.querySelector("#form-email").value=(c==null?void 0:c.email)||"",e.querySelector("#form-role").value=(c==null?void 0:c.role)||"user",e.querySelector("#form-desired-role").value=(c==null?void 0:c.desiredRole)||"",e.querySelector("#form-companies").value=((c==null?void 0:c.companies)||[]).join(", "),e.querySelector("#form-location").value=((l=c==null?void 0:c.filters)==null?void 0:l.location)||"",e.querySelector("#form-exp").value=((x=c==null?void 0:c.filters)==null?void 0:x.experienceLevel)||"",e.querySelector("#form-notify-time").value=(c==null?void 0:c.notifyTime)||"09:00",e.querySelector("#user-drawer-overlay").classList.add("open"),e.querySelector("#user-drawer").classList.add("open"),setTimeout(()=>e.querySelector("#form-name").focus(),250)}function u(){e.querySelector("#user-drawer-overlay").classList.remove("open"),e.querySelector("#user-drawer").classList.remove("open")}async function o(){const m={name:e.querySelector("#form-name").value.trim(),email:e.querySelector("#form-email").value.trim(),role:e.querySelector("#form-role").value,desiredRole:e.querySelector("#form-desired-role").value.trim(),companies:e.querySelector("#form-companies").value.split(",").map(l=>l.trim()).filter(Boolean),filters:{location:e.querySelector("#form-location").value.trim()||null,experienceLevel:e.querySelector("#form-exp").value||null},notifyTime:e.querySelector("#form-notify-time").value};if(!m.name||!m.email||!m.desiredRole||!m.companies.length){w.warning("Incomplete Form","Please fill out all required fields.");return}const c=e.querySelector("#btn-save-user");c.classList.add("loading");try{const l=e.querySelector("#form-user-id").value;s==="edit"?(await C.updateUser(l,m),w.success("Candidate Updated",m.name)):(await C.createUser(m),w.success("Candidate Created",`${m.name} added successfully.`)),u(),r()}catch(l){w.error("Save Failed",l.message)}finally{c.classList.remove("loading")}}async function f(m,c){const l=e.querySelector(`#pipe-run-${m}`);l&&(l.style.display="inline-flex"),w.info("Scraper Dispatched",`Running scraper for ${c}...`);try{await C.triggerUser(m),w.success("Pipeline Started","Scrapers running in background.")}catch(x){w.error("Trigger Failed",x.message)}setTimeout(()=>{l&&(l.style.display="none")},1e4)}async function p(m,c){if(await oe({iconKey:"trash",title:"Delete Candidate",msg:`Permanently delete "${c}" from the system?`,okLabel:"Delete",okClass:"btn-danger"}))try{await C.deleteUser(m),w.success("Candidate Deleted",c),r()}catch(x){w.error("Delete Failed",x.message)}}return e.querySelector("#btn-create-user").addEventListener("click",()=>n("create")),e.querySelector("#btn-close-drawer").addEventListener("click",u),e.querySelector("#btn-cancel-drawer").addEventListener("click",u),e.querySelector("#user-drawer-overlay").addEventListener("click",u),e.querySelector("#btn-save-user").addEventListener("click",o),r(),e}function se(){const e=document.createElement("div");e.className="page active",e.id="page-jobs",e.innerHTML=`
    <div class="flex items-center justify-between" style="margin-bottom:20px">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px">Company Scraping Fleet</h2>
        <p style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Cached inventory extracted directly from primary company career endpoints</p>
      </div>
      <div class="flex items-center gap-2">
        <span id="cos-count-badge"></span>
        <button class="btn btn-outline btn-sm" id="btn-force-refresh-all">
          ${a.refresh(13)} Refresh All Scrapers
        </button>
      </div>
    </div>

    <!-- Companies Explorer Container -->
    <div id="company-accordion-container">
      <div style="padding:32px;text-align:center;color:var(--text-muted)">Loading scraping fleet inventory…</div>
    </div>`;async function t(){const i=e.querySelector("#company-accordion-container");try{const u=(await C.getJobs()).data||[];if(e.querySelector("#cos-count-badge").innerHTML=`
        <span class="badge badge-slate">${u.length} Companies</span>`,!u.length){i.innerHTML=`
          <div class="card" style="padding:36px;text-align:center;color:var(--text-muted)">
            <div style="font-size:14px;font-weight:600;color:#fff">No Companies in Database</div>
            <div style="font-size:12px;margin-top:2px">Trigger a candidate's pipeline to initiate first scrape.</div>
          </div>`;return}i.innerHTML=u.map(o=>s(o)).join(""),i.querySelectorAll(".card-header-clickable").forEach(o=>{o.addEventListener("click",f=>{if(f.target.closest(".btn"))return;const p=o.closest(".jobs-panel"),m=p.classList.contains("expanded");if(i.querySelectorAll(".jobs-panel").forEach(c=>c.classList.remove("expanded")),!m){p.classList.add("expanded");const c=p.querySelector(".jobs-panel-body"),l=p.dataset.company;c.dataset.loaded||r(c,l)}})}),i.querySelectorAll('[data-action="refresh-single"]').forEach(o=>{o.addEventListener("click",async f=>{f.stopPropagation();const p=o.dataset.company;o.classList.add("loading"),o.textContent="…";try{await C.refreshCompany(p),w.success("Scraper Started",`Extracting listings for ${p}...`)}catch(m){w.error("Scrape Error",m.message)}finally{o.classList.remove("loading"),o.innerHTML=`${a.refresh(12)} Scrape`}})})}catch(n){i.innerHTML=`<div style="color:var(--danger);padding:20px">Failed to load scraping inventory: ${n.message}</div>`,w.error("Load Failed",n.message)}}function s(i){const n=(i.company||"?").slice(0,2).toUpperCase(),u=V.statusBadge(i.scrapeStatus);return`
      <div class="jobs-panel card" style="margin-bottom:12px" data-company="${i.company}">
        <div class="card-header card-header-clickable" style="cursor:pointer">
          <div class="flex items-center gap-3">
            <div class="brand-icon" style="width:32px;height:32px;font-size:11px;font-weight:700">
              ${n}
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#fff">${i.company}</div>
              <div style="font-size:11.5px;color:var(--text-muted);font-family:monospace">${i.careersUrl||"Configured endpoint"}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${u}
            <span class="badge ${i.jobCount>0?"badge-blue":"badge-slate"}">${i.jobCount} Jobs</span>
            <span style="font-size:11.5px;color:var(--text-light)">${V.timeAgo(i.lastUpdated)}</span>
            <button class="btn btn-outline btn-sm" data-action="refresh-single" data-company="${i.company}">
              ${a.refresh(12)} Scrape
            </button>
            <span class="jobs-panel-chevron">${a.chevronDown(14)}</span>
          </div>
        </div>
        <div class="jobs-panel-body" data-company="${i.company}">
          <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12.5px">Loading listings…</div>
        </div>
      </div>`}async function r(i,n){var u;i.dataset.loaded="1";try{const f=((u=(await C.getJobsByCompany(n)).data)==null?void 0:u.jobs)||[];if(!f.length){i.innerHTML=`
          <div style="padding:24px;text-align:center;color:var(--text-muted)">
            <div style="font-size:13px;font-weight:500;color:#fff">No listings currently in database</div>
            <div style="font-size:11.5px;margin-top:2px">Click "Scrape" to run live extraction agent.</div>
          </div>`;return}i.innerHTML=`
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
          ${f.map(p=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm)">
              <div>
                <div style="font-size:13.5px;font-weight:600;color:#fff">${p.title}</div>
                <div class="flex items-center gap-2" style="margin-top:4px">
                  ${p.location&&p.location!=="Not specified"?`<span class="badge badge-slate" style="font-size:10.5px">${a.mapPin(10)} ${p.location}</span>`:""}
                  ${p.employmentType&&p.employmentType!=="Not specified"?`<span class="badge badge-slate" style="font-size:10.5px">${p.employmentType}</span>`:""}
                  ${p.experience&&p.experience!=="Not specified"?`<span class="badge badge-slate" style="font-size:10.5px">${p.experience}</span>`:""}
                </div>
              </div>
              <div>
                ${p.applyLink?`
                  <a href="${p.applyLink}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="font-size:12px">
                    Apply ${a.externalLink(11)}
                  </a>`:'<span style="font-size:11.5px;color:var(--text-light)">No URL</span>'}
              </div>
            </div>`).join("")}
        </div>`}catch(o){i.innerHTML=`<div style="padding:16px;color:var(--danger);font-size:12.5px">Error loading jobs: ${o.message}</div>`}}return e.querySelector("#btn-force-refresh-all").addEventListener("click",async()=>{w.info("Batch Dispatched","Triggering scrapers for all tracked companies...");try{const i=await C.getJobs();for(const n of i.data||[])await C.refreshCompany(n.company).catch(()=>{});w.success("Batch Queued","Scrapers running in background.")}catch(i){w.error("Batch Error",i.message)}}),t(),e}function re(){let e=z.get();const t=document.createElement("div");t.className="page active",t.id="page-my-jobs",t.innerHTML=`
    <!-- ── View 1: Tracked Companies List ──────────────────────── -->
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
          ${a.plus(13)} Add Company
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
            <p style="font-size:13.5px;color:var(--text-muted);margin-top:3px" id="detail-company-sub">
              Role: <span style="color:var(--primary);font-weight:600" id="detail-company-role">—</span> · Alert at <span style="color:#fff" id="detail-company-time">—</span>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-outline btn-sm" id="btn-edit-current-company" style="font-size:13px;padding:7px 14px">
              ${a.edit(12)} Edit Config
            </button>
            <button class="btn btn-primary btn-sm" id="btn-scan-current-company" style="font-size:13px;padding:7px 15px">
              ${a.play(12)} Find
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Search Bar -->
      <div class="filter-toolbar" style="margin-bottom:18px">
        <div class="search-input-wrap" style="max-width:340px;width:100%">
          <span class="search-input-icon">${a.search(14)}</span>
          <input
            type="text"
            id="company-job-search"
            class="form-input search-input"
            placeholder="Search by title, location, stack…"
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

    <!-- ── Add / Edit Company Modal ────────────────────────────── -->
    <div class="overlay" id="company-modal-overlay"></div>
    <div class="modal" id="company-config-modal" style="max-width:440px">
      <div class="modal-header">
        <div class="modal-title" id="modal-company-title">${a.building(14)} Add Target Company</div>
        <button class="btn btn-ghost btn-sm" id="btn-close-company-modal" style="color:var(--text-light)">${a.x(14)}</button>
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
            <input type="text" id="form-company-role" class="form-input" required placeholder="e.g. Software Engineer, Backend Developer" style="font-size:14px" />
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

    <!-- ── Job Details Slide-Out Drawer ────────────────────────── -->
    <div class="overlay" id="job-drawer-overlay"></div>
    <aside class="job-drawer" id="job-details-drawer">
      <div class="job-drawer-header">
        <div>
          <div class="badge badge-blue" id="drawer-company-badge" style="margin-bottom:6px;font-size:12px">Company</div>
          <h3 style="font-size:18px;font-weight:700;color:#fff;line-height:1.3" id="drawer-job-title">Position Title</h3>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-close-job-drawer" style="color:var(--text-light)">
          ${a.x(14)}
        </button>
      </div>

      <div class="job-drawer-body">
        <div class="detail-section">
          <div class="detail-section-title">Position Overview</div>
          <div class="detail-grid">
            <div>
              <div class="detail-item-label">${a.mapPin(12)} Location</div>
              <div class="detail-item-value" id="drawer-location">—</div>
            </div>
            <div>
              <div class="detail-item-label">${a.briefcase(12)} Employment Type</div>
              <div class="detail-item-value" id="drawer-type">—</div>
            </div>
            <div>
              <div class="detail-item-label">${a.award(12)} Experience Level</div>
              <div class="detail-item-value" id="drawer-exp">—</div>
            </div>
            <div>
              <div class="detail-item-label">${a.calendar(12)} Posted Date</div>
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
          Apply on Career Site ${a.externalLink(13)}
        </a>
      </div>
    </aside>`;let s=[],r=e,i=null,n=[],u="";function o(d){if(Array.isArray(d.companyConfigs)&&d.companyConfigs.length>0)return d.companyConfigs;const g=d.desiredRole||"Software Engineer",h=d.notifyTime||"09:00";return(d.companies||["PhonePe","Google"]).map((b,y)=>({company:b,role:g,notifyTime:h}))}async function f(){if(e!=null&&e.id)try{const d=await C.getUserJobs(e.id);s=d.results||[],r=d.user||r,d.user&&(e={...e,...d.user},z.save(e)),p(),i&&l(i.company)}catch(d){t.querySelector("#companies-table-container").innerHTML=`
        <div class="card" style="padding:32px;text-align:center;color:var(--danger)">
          Failed to load company data: ${d.message}
        </div>`,w.error("Load Error",d.message)}}function p(){var h;const d=t.querySelector("#companies-table-container"),g=o(r);if(!g.length){d.innerHTML=`
        <div class="card" style="padding:48px 24px;text-align:center;color:var(--text-muted)">
          <div style="font-size:16px;font-weight:600;color:#fff">No Companies Tracked</div>
          <div style="font-size:13.5px;margin-top:4px;margin-bottom:16px">Add your first target employer to start tracking matching roles.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-comp">
            ${a.plus(13)} Add Company
          </button>
        </div>`,(h=d.querySelector("#btn-empty-add-comp"))==null||h.addEventListener("click",F);return}d.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:10px">
        ${g.map((b,y)=>{var S;const k=s.find(B=>B.company.toLowerCase()===b.company.toLowerCase()||b.company.toLowerCase().includes(B.company.toLowerCase())),v=((S=k==null?void 0:k.jobs)==null?void 0:S.length)||0;return`
            <div class="card" style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:var(--transition)" class="company-row-card" data-idx="${y}">
              <div style="flex:1;min-width:0;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                <div style="font-size:17px;font-weight:700;color:#fff;min-width:140px">
                  ${b.company}
                </div>
                <div style="font-size:14px;color:var(--primary);font-weight:500;min-width:160px">
                  ${b.role||r.desiredRole||"Software Engineer"}
                </div>
                <div style="font-size:13.5px;color:var(--text-muted);display:flex;align-items:center;gap:5px">
                  ${a.clock(12)} ${b.notifyTime||"09:00"}
                </div>
                <span class="badge badge-slate" style="font-size:12px;padding:3px 8px">
                  ${v} job${v!==1?"s":""} found
                </span>
              </div>

              <div class="flex items-center gap-2" style="flex-shrink:0" onclick="event.stopPropagation()">
                <button class="btn btn-ghost btn-sm" data-action="edit" data-idx="${y}" title="Edit Configuration" style="padding:6px 10px;font-size:13px">
                  ${a.edit(13)} Edit
                </button>
                <button class="btn btn-ghost btn-sm" data-action="delete" data-idx="${y}" title="Remove Company" style="padding:6px 10px;color:var(--text-light)">
                  ${a.trash(13)}
                </button>
                <button class="btn btn-outline btn-sm" data-action="open-detail" data-idx="${y}" style="padding:6px 14px;font-size:13px;color:#fff">
                  View →
                </button>
              </div>
            </div>`}).join("")}
      </div>`,d.querySelectorAll("[data-idx]").forEach(b=>{b.addEventListener("click",()=>{const y=parseInt(b.dataset.idx,10);m(g[y])})}),d.querySelectorAll('[data-action="edit"]').forEach(b=>{b.addEventListener("click",y=>{y.stopPropagation();const k=parseInt(b.dataset.idx,10);R(k,g[k])})}),d.querySelectorAll('[data-action="delete"]').forEach(b=>{b.addEventListener("click",async y=>{y.stopPropagation();const k=parseInt(b.dataset.idx,10);await M(k,g[k].company)})}),d.querySelectorAll('[data-action="open-detail"]').forEach(b=>{b.addEventListener("click",y=>{y.stopPropagation();const k=parseInt(b.dataset.idx,10);m(g[k])})})}function m(d){i=d,t.querySelector("#view-companies-list").style.display="none",t.querySelector("#view-company-detail").style.display="block",l(d.company)}function c(){i=null,t.querySelector("#view-company-detail").style.display="none",t.querySelector("#view-companies-list").style.display="block",p()}function l(d){var k;if(!i)return;t.querySelector("#detail-company-title").textContent=`${i.company} Opportunities`,t.querySelector("#detail-company-role").textContent=i.role||"Software Engineer",t.querySelector("#detail-company-time").textContent=i.notifyTime||"09:00";const g=t.querySelector("#company-jobs-feed-container"),h=t.querySelector("#company-jobs-count-label"),b=s.find(v=>v.company.toLowerCase()===d.toLowerCase()||d.toLowerCase().includes(v.company.toLowerCase())||v.company.toLowerCase().includes(d.toLowerCase()));let y=((b==null?void 0:b.jobs)||[]).map(v=>({...v,companyName:b.company}));if(u){const v=u.toLowerCase();y=y.filter(S=>(S.title||"").toLowerCase().includes(v)||(S.location||"").toLowerCase().includes(v)||(S.employmentType||"").toLowerCase().includes(v))}if(n=y,h.textContent=`Showing ${y.length} opening${y.length!==1?"s":""}`,!y.length){g.innerHTML=`
        <div class="card" style="padding:48px 24px;text-align:center;color:var(--text-muted)">
          <div style="font-size:16px;font-weight:600;color:#fff">No Openings Found for ${d}</div>
          <div style="font-size:13.5px;margin-top:4px;margin-bottom:16px">
            ${u?"Try clearing your search query.":'Click "Find" to scan verified openings for this company.'}
          </div>
          <button class="btn btn-primary btn-sm" id="btn-inner-scan" style="padding:7px 16px;font-size:13.5px">
            ${a.play(12)} Find
          </button>
        </div>`,(k=g.querySelector("#btn-inner-scan"))==null||k.addEventListener("click",$);return}g.innerHTML=y.map((v,S)=>`
      <div class="job-card" data-job-idx="${S}" style="padding:16px 20px;margin-bottom:10px">
        <div class="job-card-main">
          <div class="flex items-center gap-2" style="margin-bottom:4px">
            <span class="badge badge-blue" style="font-size:12px;font-weight:600">${v.companyName}</span>
            <span class="badge badge-green" style="font-size:11px">Match</span>
          </div>
          <div class="job-card-title" style="font-size:17px;font-weight:700;color:#fff;margin-bottom:4px">
            ${v.title}
          </div>
          <div class="job-card-meta" style="font-size:13px;color:var(--text-secondary);display:flex;gap:14px;flex-wrap:wrap">
            ${v.location&&v.location!=="Not specified"?`<span>${a.mapPin(12)} ${v.location}</span>`:""}
            ${v.employmentType&&v.employmentType!=="Not specified"?`<span>${a.briefcase(12)} ${v.employmentType}</span>`:""}
            ${v.experience&&v.experience!=="Not specified"?`<span>${a.award(12)} ${v.experience}</span>`:""}
            ${v.postedDate?`<span>${a.calendar(12)} ${v.postedDate}</span>`:""}
          </div>
        </div>
        <div class="job-card-actions" style="display:flex;align-items:center;gap:8px;flex-shrink:0" onclick="event.stopPropagation()">
          <button class="btn btn-outline btn-sm" data-action="view" data-job-idx="${S}" style="padding:6px 12px;font-size:13px">
            View
          </button>
          ${v.applyLink?`
            <a href="${v.applyLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="padding:6px 14px;font-size:13px">
              Apply ${a.externalLink(11)}
            </a>`:""}
        </div>
      </div>`).join(""),g.querySelectorAll("[data-job-idx]").forEach(v=>{v.addEventListener("click",()=>{const S=parseInt(v.dataset.jobIdx,10);J(n[S])})}),g.querySelectorAll('[data-action="view"]').forEach(v=>{v.addEventListener("click",S=>{S.stopPropagation();const B=parseInt(v.dataset.jobIdx,10);J(n[B])})})}const x=t.querySelector("#company-config-modal"),E=t.querySelector("#company-modal-overlay"),I=t.querySelector("#company-config-form"),D=t.querySelector("#modal-company-title"),N=t.querySelector("#form-edit-index"),H=t.querySelector("#form-company-name"),P=t.querySelector("#form-company-role"),A=t.querySelector("#form-company-time");function F(){D.innerHTML=`${a.plus(14)} Add Target Company`,N.value="-1",H.value="",P.value=r.desiredRole||"Software Engineer",A.value="08:00",x.classList.add("open"),E.classList.add("open"),H.focus()}function R(d,g){D.innerHTML=`${a.edit(14)} Edit ${g.company}`,N.value=String(d),H.value=g.company,P.value=g.role||r.desiredRole||"Software Engineer",A.value=g.notifyTime||"08:00",x.classList.add("open"),E.classList.add("open"),P.focus()}function T(){x.classList.remove("open"),E.classList.remove("open")}I.addEventListener("submit",async d=>{d.preventDefault();const g=parseInt(N.value,10),h=H.value.trim(),b=P.value.trim(),y=A.value.trim();if(!h||!b||!y)return;const k=o(r);let v=[];if(g===-1){if(k.some(S=>S.company.toLowerCase()===h.toLowerCase())){w.info("Already Tracked",`${h} is already in your tracked companies.`),T();return}v=[...k,{company:h,role:b,notifyTime:y,active:!0}]}else v=k.map((S,B)=>B===g?{company:h,role:b,notifyTime:y,active:!0}:S);try{const S={companyConfigs:v,companies:v.map(W=>W.company)},B=await C.updateUser(e.id,S);r=B.data,e={...e,...B.data},z.save(e),w.success("Saved",`${h} configuration updated.`),T(),i&&i.company===h&&(i={company:h,role:b,notifyTime:y}),await f()}catch(S){w.error("Save Failed",S.message)}});async function M(d,g){const h=o(r);if(h.length<=1){w.warning("Cannot Remove","You must track at least one company.");return}const b=h.filter((y,k)=>k!==d);try{const y={companyConfigs:b,companies:b.map(v=>v.company)},k=await C.updateUser(e.id,y);r=k.data,e={...e,...k.data},z.save(e),w.success("Removed",`${g} removed.`),i&&i.company===g&&c(),await f()}catch(y){w.error("Delete Failed",y.message)}}t.querySelectorAll("#suggested-badges-box [data-val]").forEach(d=>{d.addEventListener("click",()=>{H.value=d.dataset.val,P.focus()})});async function $(){const d=t.querySelector("#btn-scan-current-company");d&&d.classList.add("loading"),w.info("Scanning Openings",`Checking career site for ${(i==null?void 0:i.company)||"company"}…`);try{await C.triggerUser(e.id)}catch(g){w.warning("Notice",g.message||"Scan in progress.")}setTimeout(async()=>{d&&d.classList.remove("loading"),await f(),w.success("Updated","Job listings refreshed.")},4e3)}function J(d){if(!d)return;t.querySelector("#drawer-company-badge").textContent=d.companyName||"Company",t.querySelector("#drawer-job-title").textContent=d.title||"Untitled Position",t.querySelector("#drawer-location").textContent=d.location||"Not specified",t.querySelector("#drawer-type").textContent=d.employmentType||"Full-time / Standard",t.querySelector("#drawer-exp").textContent=d.experience||"Not specified",t.querySelector("#drawer-date").textContent=d.postedDate||"Recent",t.querySelector("#drawer-desc").textContent=d.description||'Click "Apply on Career Site" to view complete job details and requirements.',t.querySelector("#drawer-url-preview").textContent=d.applyLink||"Direct link unavailable";const g=t.querySelector("#btn-drawer-apply-link");d.applyLink?(g.href=d.applyLink,g.style.display="inline-flex"):g.style.display="none",t.querySelector("#job-drawer-overlay").classList.add("open"),t.querySelector("#job-details-drawer").classList.add("open")}function U(){t.querySelector("#job-drawer-overlay").classList.remove("open"),t.querySelector("#job-details-drawer").classList.remove("open")}return t.querySelector("#btn-add-company-modal").addEventListener("click",F),t.querySelector("#btn-close-company-modal").addEventListener("click",T),t.querySelector("#btn-cancel-company-modal").addEventListener("click",T),E.addEventListener("click",T),t.querySelector("#btn-back-to-companies").addEventListener("click",c),t.querySelector("#btn-edit-current-company").addEventListener("click",()=>{if(i){const g=o(r).findIndex(h=>h.company.toLowerCase()===i.company.toLowerCase());R(g>=0?g:0,i)}}),t.querySelector("#btn-scan-current-company").addEventListener("click",$),t.querySelector("#company-job-search").addEventListener("input",d=>{u=d.target.value.trim(),i&&l(i.company)}),t.querySelector("#btn-close-job-drawer").addEventListener("click",U),t.querySelector("#btn-drawer-cancel").addEventListener("click",U),t.querySelector("#job-drawer-overlay").addEventListener("click",U),f(),t}const le=[{route:"dashboard",label:"Dashboard"},{route:"users",label:"Users"},{route:"jobs",label:"Companies"}],de=[{route:"my-jobs",label:"Job Explorer"}];function ce({onLogout:e,currentRoute:t}){const s=z.get(),r=z.isAdmin(),i=r?le:de,n=(l="")=>l.split(" ").slice(0,2).map(x=>{var E;return((E=x[0])==null?void 0:E.toUpperCase())||""}).join("")||"?",u=i.map(l=>`
    <button class="nav-link-btn ${t===l.route?"active":""}"
            data-route="${l.route}">
      ${l.label}
    </button>`).join(""),o=document.createElement("header");o.className="top-navbar",o.innerHTML=`
    <!-- Brand -->
    <div class="nav-brand" id="nav-brand-home" title="JobPulse">
      <div class="brand-icon">${a.pulse(15)}</div>
      <div class="brand-title">Job<span>Pulse</span></div>
    </div>

    <!-- Center Navigation Links (Clean Text + Subtle Underline) -->
    <div class="nav-links">
      ${u}
    </div>

    <!-- Right Controls: Notification Icon + Profile Dropdown -->
    <div class="nav-right" style="display:flex;align-items:center;gap:10px;position:relative">
      
      <!-- Compact Notification Bell Dropdown Trigger -->
      <div style="position:relative">
        <button class="btn btn-ghost btn-sm" id="btn-notif-dropdown" title="Notifications" style="padding:5px 8px;color:var(--text-muted);position:relative">
          ${a.bell(15)}
          <span style="position:absolute;top:5px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--primary)"></span>
        </button>

        <!-- Notification Dropdown Menu -->
        <div class="profile-dropdown" id="notif-dropdown-menu" style="min-width:280px;right:0;padding:8px 0">
          <div style="padding:6px 14px 8px;font-size:12px;font-weight:600;color:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <span>Alerts & Activity</span>
            <span style="font-size:11px;color:var(--primary);font-weight:500">Live</span>
          </div>
          <div style="padding:10px 14px;font-size:12.5px;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle)">
            <div style="font-weight:500;color:#fff">Career Scraper Active</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Continuous tracking for your target companies</div>
          </div>
          <div style="padding:10px 14px;font-size:12.5px;color:var(--text-secondary)">
            <div style="font-weight:500;color:#fff">Scheduled Pulses Ready</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Daily notification triggers at configured alert times</div>
          </div>
        </div>
      </div>

      <!-- User Profile Dropdown Trigger -->
      <div style="position:relative">
        <button class="profile-menu-trigger" id="btn-profile-dropdown" title="Account Menu">
          <div class="user-avatar">${n(s==null?void 0:s.name)}</div>
          <span class="user-name-label">${(s==null?void 0:s.name)||(r?"System Admin":"Candidate")}</span>
          <span class="dropdown-chevron">${a.chevronDown(12)}</span>
        </button>

        <!-- Profile Dropdown Menu -->
        <div class="profile-dropdown" id="profile-dropdown-menu">
          <div class="dropdown-header">
            <div style="font-size:13px;font-weight:600;color:#fff">${(s==null?void 0:s.name)||"User"}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;font-family:monospace">
              ${r?"Administrator":"Candidate"} · ${(s==null?void 0:s.email)||""}
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="menu-item-home">
            ${a.externalLink(13)} Public Homepage
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-danger" id="menu-item-logout">
            ${a.logOut(13)} Sign Out
          </button>
        </div>
      </div>
    </div>`,o.querySelectorAll("[data-route]").forEach(l=>{l.addEventListener("click",()=>q.goto(l.dataset.route))}),o.querySelector("#nav-brand-home").addEventListener("click",()=>{q.goto(r?"dashboard":"my-jobs")});const f=o.querySelector("#btn-notif-dropdown"),p=o.querySelector("#notif-dropdown-menu");f.addEventListener("click",l=>{l.stopPropagation(),c.classList.remove("open"),p.classList.toggle("open")});const m=o.querySelector("#btn-profile-dropdown"),c=o.querySelector("#profile-dropdown-menu");return m.addEventListener("click",l=>{l.stopPropagation(),p.classList.remove("open"),c.classList.toggle("open")}),document.addEventListener("click",l=>{o.contains(l.target)||(p.classList.remove("open"),c.classList.remove("open"))}),o.querySelector("#menu-item-home").addEventListener("click",()=>{c.classList.remove("open"),q.goto("landing")}),o.querySelector("#menu-item-logout").addEventListener("click",()=>{c.classList.remove("open"),e&&e()}),o}const Q=document.getElementById("toast-root");Q&&(Q.className="toast-container");let L=null;const pe={landing:{title:"JobPulse",subtitle:"Autonomous AI Job Tracking",public:!0,factory:Z},dashboard:{title:"Dashboard",subtitle:"Real-time telemetry, cluster health & live activity",role:"admin",factory:ie},users:{title:"Users",subtitle:"Manage candidate preferences, schedules & active crons",role:"admin",factory:ae},jobs:{title:"Companies",subtitle:"Enterprise career endpoints & cached job inventories",role:"admin",factory:se},"my-jobs":{title:"My Matched Jobs",subtitle:"Personalized career stream & live scraping runner",role:"user",factory:re}},q={currentRoute:null,showLogin(e="user",t="login"){L!=null&&L._unmount&&L._unmount(),this.currentRoute="login";const s=document.getElementById("app");s.innerHTML="";const r=ee({initialRole:e,initialMode:t,onLogin:i=>{i.role==="admin"?this.goto("dashboard"):this.goto("my-jobs")}});s.appendChild(r)},goto(e){const t=pe[e];if(!t){this.goto("landing");return}if(t.public){L!=null&&L._unmount&&L._unmount(),this.currentRoute=e;const r=document.getElementById("app");r.innerHTML="",L=t.factory(),r.appendChild(L);return}const s=z.get();if(!s){this.showLogin(t.role||"user");return}if(t.role==="admin"&&s.role!=="admin"){this.goto("my-jobs");return}this.currentRoute=e,this.renderAppShell(s,e,t)},renderAppShell(e,t,s){const r=document.getElementById("app");let i=document.querySelector(".app-shell"),n=document.getElementById("page-root"),u=document.getElementById("topbar-page-title"),o=document.getElementById("topbar-page-sub");if(i){const f=document.getElementById("global-title-bar");f&&(f.style.display=t==="my-jobs"?"none":"flex"),u&&(u.textContent=s.title),o&&(o.textContent=s.subtitle),document.querySelectorAll(".nav-link-btn").forEach(p=>{p.classList.toggle("active",p.dataset.route===t)})}else{r.innerHTML="",i=document.createElement("div"),i.className="app-shell";const f=ce({currentRoute:t,onLogout:()=>{z.clear(),this.goto("landing")}});i.appendChild(f);const p=document.createElement("div");p.className="main-content";const m=document.createElement("div");m.className="page-title-bar",m.id="global-title-bar",m.style.display=t==="my-jobs"?"none":"flex",m.innerHTML=`
        <div class="page-title">
          <span id="topbar-page-title">${s.title}</span>
          <span class="page-subtitle" id="topbar-page-sub">${s.subtitle}</span>
        </div>
        <div class="live-clock-pill" id="live-clock-pill"></div>`;const c=m.querySelector("#live-clock-pill"),l=()=>{c.textContent=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})};l(),setInterval(l,1e3),p.appendChild(m);const x=document.createElement("div");x.className="page-content",n=document.createElement("div"),n.id="page-root",x.appendChild(n),p.appendChild(x),i.appendChild(p),r.appendChild(i),this.probeApi()}L!=null&&L._unmount&&L._unmount(),n.innerHTML="",L=s.factory(),n.appendChild(L)},async probeApi(){try{await C.health();const e=document.getElementById("nav-status-dot"),t=document.getElementById("nav-status-text");e&&(e.className="activity-dot green"),t&&(t.textContent="API :3000 Online")}catch{const e=document.getElementById("nav-status-dot"),t=document.getElementById("nav-status-text");e&&(e.className="activity-dot red"),t&&(t.textContent="API Offline")}}};function ue(){const e=z.get();e?e.role==="admin"?q.goto("dashboard"):q.goto("my-jobs"):q.goto("landing")}document.addEventListener("DOMContentLoaded",ue);

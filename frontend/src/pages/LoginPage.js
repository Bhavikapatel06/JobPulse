// ── Role-Aware Login & Sign Up Page ───────────────────────────
import { API }    from '../api/client.js';
import { Auth }   from '../auth/auth.js';
import { Router } from '../main.js';
import { Icons }  from '../utils/icons.js';

export function LoginPage({ initialRole = 'user', initialMode = 'login', onLogin }) {
  let selectedRole = initialRole; // 'user' | 'admin'
  let authMode     = initialMode; // 'login' | 'signup'

  const el = document.createElement('div');
  el.className = 'login-wrap';

  el.innerHTML = `
    <div class="login-card" style="max-width:440px">
      <div style="text-align:center;margin-bottom:20px">
        <div class="brand-icon" style="width:36px;height:36px;margin:0 auto 10px">
          ${Icons.pulse(20)}
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
        <button class="login-tab-btn ${selectedRole === 'user' ? 'active' : ''}" id="tab-candidate">
          ${Icons.briefcase(14)} Candidate
        </button>
        <button class="login-tab-btn ${selectedRole === 'admin' ? 'active' : ''}" id="tab-admin">
          ${Icons.shield(14)} Administrator
        </button>
      </div>

      <!-- Candidate Sign In / Sign Up Sub-toggle -->
      <div id="candidate-mode-switch" style="display:${selectedRole === 'user' ? 'flex' : 'none'};align-items:center;background:var(--bg-dark);border:1px solid var(--border);border-radius:var(--radius-sm);padding:3px;margin-bottom:16px">
        <button type="button" class="btn btn-ghost btn-sm w-full ${authMode === 'login' ? 'active-mode' : ''}" id="btn-mode-signin" style="font-size:12.5px;padding:6px">
          Sign In
        </button>
        <button type="button" class="btn btn-ghost btn-sm w-full ${authMode === 'signup' ? 'active-mode' : ''}" id="btn-mode-signup" style="font-size:12.5px;padding:6px">
          Create Account
        </button>
      </div>

      <!-- Error Box -->
      <div id="login-error" style="display:none;background:var(--danger-subtle);color:#F87171;border:1px solid var(--danger-border);border-radius:var(--radius-sm);padding:9px 13px;font-size:12.5px;margin-bottom:14px"></div>

      <!-- 1. Sign In Form (Candidate & Admin) -->
      <form id="login-form" autocomplete="off" style="display:${authMode === 'login' ? 'block' : 'none'}">
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
          <span id="btn-text">${selectedRole === 'user' ? 'Open Candidate Portal' : 'Access Admin Console'}</span>
        </button>
      </form>

      <!-- 2. Candidate Sign Up Form -->
      <form id="signup-form" autocomplete="off" style="display:${authMode === 'signup' && selectedRole === 'user' ? 'block' : 'none'}">
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
    </div>`;

  const emailInput      = el.querySelector('#login-email');
  const errorBox        = el.querySelector('#login-error');
  const loginForm       = el.querySelector('#login-form');
  const signupForm      = el.querySelector('#signup-form');
  const submitBtn       = el.querySelector('#login-submit-btn');
  const signupBtn       = el.querySelector('#signup-submit-btn');
  const btnText         = el.querySelector('#btn-text');
  const subMsg          = el.querySelector('#login-sub-msg');
  const tabCand         = el.querySelector('#tab-candidate');
  const tabAdm          = el.querySelector('#tab-admin');
  const modeSwitch      = el.querySelector('#candidate-mode-switch');
  const btnModeSignin   = el.querySelector('#btn-mode-signin');
  const btnModeSignup   = el.querySelector('#btn-mode-signup');
  const demoChips       = el.querySelector('#demo-chips');

  function updateView() {
    tabCand.classList.toggle('active', selectedRole === 'user');
    tabAdm.classList.toggle('active', selectedRole === 'admin');

    if (selectedRole === 'admin') {
      modeSwitch.style.display = 'none';
      loginForm.style.display  = 'block';
      signupForm.style.display = 'none';
      subMsg.textContent      = 'Sign in with administrator privileges';
      btnText.textContent     = 'Access Admin Console';
    } else {
      modeSwitch.style.display = 'flex';
      btnModeSignin.classList.toggle('active-mode', authMode === 'login');
      btnModeSignup.classList.toggle('active-mode', authMode === 'signup');

      if (authMode === 'login') {
        loginForm.style.display  = 'block';
        signupForm.style.display = 'none';
        subMsg.textContent      = 'Sign in to access your matched job feed';
        btnText.textContent     = 'Open Candidate Portal';
      } else {
        loginForm.style.display  = 'none';
        signupForm.style.display = 'block';
        subMsg.textContent      = 'Set up your profile, target companies & schedule';
      }
    }
    loadDemoChips();
  }

  async function loadDemoChips() {
    try {
      const data = await API.getUsers();
      const users = data.data || [];
      const filtered = users.filter(u => selectedRole === 'admin' ? u.role === 'admin' : u.role !== 'admin');
      
      if (filtered.length > 0) {
        demoChips.innerHTML = filtered.slice(0, 3).map(u => `
          <div style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:4px;background:rgba(255,255,255,0.02)" class="demo-user-chip" data-email="${u.email}">
            <span style="color:var(--text);font-weight:500">${u.name}</span>
            <span style="color:var(--text-muted);font-family:monospace">${u.email}</span>
          </div>`).join('');

        el.querySelectorAll('.demo-user-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            authMode = 'login';
            updateView();
            emailInput.value = chip.dataset.email;
            emailInput.focus();
          });
        });
      } else {
        demoChips.innerHTML = `<div style="color:var(--text-light)">Enter registered email to continue.</div>`;
      }
    } catch {
      demoChips.innerHTML = `<div style="color:var(--text-light)">Enter registered email to continue.</div>`;
    }
  }

  tabCand.addEventListener('click', () => { selectedRole = 'user'; updateView(); });
  tabAdm.addEventListener('click',  () => { selectedRole = 'admin'; updateView(); });
  btnModeSignin.addEventListener('click', () => { authMode = 'login'; updateView(); });
  btnModeSignup.addEventListener('click', () => { authMode = 'signup'; updateView(); });

  // Handle Sign In Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    errorBox.style.display = 'none';
    submitBtn.classList.add('loading');

    try {
      const res = await API.login(email);
      const user = res.user;

      if (selectedRole === 'admin' && user.role !== 'admin') {
        errorBox.textContent = `"${user.name}" is a candidate account. Redirecting to Candidate Portal...`;
        errorBox.style.display = 'block';
        setTimeout(() => {
          Auth.save(user);
          if (onLogin) onLogin(user);
        }, 1000);
        return;
      }

      Auth.save(user);
      if (onLogin) onLogin(user);
    } catch (err) {
      errorBox.textContent = err.message || 'Login failed. Please verify your email.';
      errorBox.style.display = 'block';
    } finally {
      submitBtn.classList.remove('loading');
    }
  });

  // Handle Sign Up Submit
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name            = el.querySelector('#signup-name').value.trim();
    const email           = el.querySelector('#signup-email').value.trim();
    const desiredRole     = el.querySelector('#signup-role').value.trim();
    const companiesInput  = el.querySelector('#signup-companies').value.trim();
    const notifyTime      = el.querySelector('#signup-time').value.trim() || '09:00';
    const location        = el.querySelector('#signup-location').value.trim() || null;

    const companies = companiesInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!name || !email || !desiredRole || !companies.length) {
      errorBox.textContent = 'Please fill out all required fields.';
      errorBox.style.display = 'block';
      return;
    }

    errorBox.style.display = 'none';
    signupBtn.classList.add('loading');

    try {
      const payload = {
        name,
        email,
        desiredRole,
        companies,
        notifyTime,
        filters: { location: location || null },
        role: 'user',
      };

      const res = await API.createUser(payload);
      const newUser = res.data;

      // Auto login newly created user
      Auth.save(newUser);
      if (onLogin) onLogin(newUser);
    } catch (err) {
      errorBox.textContent = err.message || 'Sign up failed. Please check your inputs.';
      errorBox.style.display = 'block';
    } finally {
      signupBtn.classList.remove('loading');
    }
  });

  el.querySelector('#btn-back-home').addEventListener('click', () => {
    Router.goto('landing');
  });

  updateView();
  return el;
}

// ── Confirm Dialog (Modal) (Emoji-free) ──────────────────────
import { Icons } from '../utils/icons.js';

let resolver = null;

function getRoot() {
  return document.getElementById('modal-root');
}

export function confirm({ iconKey = 'alertCircle', title = 'Confirm Action', msg = '', okLabel = 'Confirm', okClass = 'btn-danger' } = {}) {
  const root = getRoot();
  if (!root) return Promise.resolve(false);

  const iconSvg = Icons[iconKey] ? Icons[iconKey](28) : Icons.alertCircle(28);

  const el = document.createElement('div');
  el.className = 'confirm-backdrop';
  el.innerHTML = `
    <div class="confirm-box">
      <div style="display:flex;justify-content:center;color:var(--text-muted);margin-bottom:12px">
        ${iconSvg}
      </div>
      <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px">${title}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.5">${msg}</div>
      <div class="flex items-center justify-between gap-2" style="justify-content:center">
        <button class="btn btn-outline btn-sm" id="c-cancel">Cancel</button>
        <button class="btn ${okClass} btn-sm" id="c-ok">${okLabel}</button>
      </div>
    </div>`;

  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('open'));

  return new Promise((resolve) => {
    resolver = resolve;
    el.querySelector('#c-ok').addEventListener('click',     () => close(el, true));
    el.querySelector('#c-cancel').addEventListener('click', () => close(el, false));
    el.addEventListener('click', (e) => { if (e.target === el) close(el, false); });
  });
}

function close(el, result) {
  el.classList.remove('open');
  setTimeout(() => el.remove(), 150);
  if (resolver) { resolver(result); resolver = null; }
}

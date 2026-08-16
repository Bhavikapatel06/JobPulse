// ── Topbar component ──────────────────────────────────────────

export function Topbar({ title, subtitle, actions = '' }) {
  const el = document.createElement('header');
  el.className = 'topbar';
  el.innerHTML = `
    <div>
      <div class="topbar-title" id="topbar-title">${title}</div>
      <div class="topbar-subtitle" id="topbar-subtitle">${subtitle}</div>
    </div>
    <div class="topbar-right">
      <div class="topbar-clock" id="topbar-clock"></div>
      <div id="topbar-actions">${actions}</div>
    </div>`;

  // Live clock
  const clockEl = el.querySelector('#topbar-clock');
  function tick() {
    clockEl.textContent = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  tick();
  const interval = setInterval(tick, 1000);
  el._stopClock = () => clearInterval(interval);

  return el;
}

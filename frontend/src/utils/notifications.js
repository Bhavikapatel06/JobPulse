// ── Central Notification Store (Clean Top Dropdown Only) ────────
let listeners = [];
let notifs = [
  {
    id: 1,
    title: 'Career Scrapers Active',
    msg: 'Verified job monitoring for tracked employers',
    time: 'Live',
    type: 'info',
  },
  {
    id: 2,
    title: 'Daily Alert Schedule Ready',
    msg: 'Autonomous match delivery at configured trigger times',
    time: 'Live',
    type: 'info',
  },
];

export const NotificationStore = {
  get() {
    return notifs;
  },

  add(title, msg = '', type = 'info') {
    const item = {
      id: Date.now(),
      title,
      msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
    };
    notifs = [item, ...notifs.slice(0, 19)];
    listeners.forEach(fn => fn(notifs));
  },

  clear() {
    notifs = [];
    listeners.forEach(fn => fn(notifs));
  },

  subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },
};

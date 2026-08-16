// ── Shared Helper Utilities (Emoji-free) ──────────────────────
import { Icons } from './icons.js';

export const helpers = {
  initials(name = '') {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
  },

  timeAgo(dateStr) {
    if (!dateStr) return 'Never';
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  },

  statusBadge(status) {
    const map = {
      success: ['badge-green', `${Icons.check(12)} Verified`],
      failed:  ['badge-red',   `${Icons.x(12)} Failed`],
      pending: ['badge-blue',  `${Icons.refresh(12)} Pending`],
    };
    const [cls, label] = map[status] || ['badge-slate', status || 'Unknown'];
    return `<span class="badge ${cls}">${label}</span>`;
  },
};

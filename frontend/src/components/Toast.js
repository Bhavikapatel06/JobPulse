// ── Clean Notification Dispatcher ──────────────────────────────
import { NotificationStore } from '../utils/notifications.js';

export const Toast = {
  success: (title, msg = '') => NotificationStore.add(title, msg, 'success'),
  error:   (title, msg = '') => NotificationStore.add(title, msg, 'error'),
  info:    (title, msg = '') => NotificationStore.add(title, msg, 'info'),
  warning: (title, msg = '') => NotificationStore.add(title, msg, 'warning'),
};

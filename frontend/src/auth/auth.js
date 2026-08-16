// ── Auth — localStorage-backed session + role guards ──────────

const SESSION_KEY = 'jobpulse_session';

export const Auth = {
  /** Save user to localStorage after login */
  save(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  /** Get current session user (or null) */
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },

  /** Clear session */
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },

  /** Is the current user an admin? */
  isAdmin() {
    const u = this.get();
    return u && u.role === 'admin';
  },

  /** Is the current user a regular user? */
  isUser() {
    const u = this.get();
    return u && u.role === 'user';
  },

  /** Is there any valid session? */
  isLoggedIn() {
    return !!this.get();
  },
};

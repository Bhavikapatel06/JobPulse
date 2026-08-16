// ── API Client ────────────────────────────────────────────────
// All fetch calls go through here. /api is proxied to :3000 by Vite.

const BASE = '';

async function request(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

export const API = {
  // Auth
  login:           (email)     => request('POST', '/api/auth/login', { email }),
  logout:          ()          => request('POST', '/api/auth/logout'),

  // Health
  health:          ()          => request('GET',  '/health'),

  // Users (admin)
  getUsers:        ()          => request('GET',  '/api/users'),
  createUser:      (body)      => request('POST', '/api/users', body),
  updateUser:      (id, body)  => request('PUT',  `/api/users/${id}`, body),
  deleteUser:      (id)        => request('DELETE',`/api/users/${id}?hard=true`),
  triggerUser:     (id)        => request('POST', `/api/users/${id}/trigger`),
  getUserJobs:     (id)        => request('GET',  `/api/users/${id}/jobs`),

  // Jobs (admin)
  getJobs:         ()          => request('GET',  '/api/jobs'),
  getJobsByCompany:(c)         => request('GET',  `/api/jobs/${encodeURIComponent(c)}`),
  refreshCompany:  (c)         => request('POST', `/api/jobs/${encodeURIComponent(c)}/refresh`),
};

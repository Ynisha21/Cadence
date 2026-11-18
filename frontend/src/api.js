const BASE = import.meta.env.VITE_API_URL || '/api';
let onUnauthorized = () => {};

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export const getToken = () => localStorage.getItem('token');

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) p.append(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

async function request(path, { method = 'GET', body, params, raw } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path + qs(params), {
      method,
      headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the API is running.');
  }
  if (res.status === 401 && token) onUnauthorized();
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.details?.[0];
    const err = new Error(d ? `${d.field ? d.field + ': ' : ''}${d.message}` : data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

const post = (path) => (body) => request(path, { method: 'POST', body: body || {} });
const get = (path) => (params) => request(path, { params });

export const api = {
  login: post('/auth/login'),
  register: post('/auth/register'),
  me: () => request('/auth/me'),
  tasks: {
    list: get('/tasks'),
    create: post('/tasks'),
    update: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body }),
    remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    overview: get('/analytics/overview'),
    trends: get('/analytics/trends'),
    categories: get('/analytics/categories'),
    priorities: get('/analytics/priorities'),
    deadlines: get('/analytics/deadlines'),
  },
  ai: { prioritize: post('/ai/prioritize'), plan: post('/ai/plan'), summary: post('/ai/summary') },
  exportCsv: async (params) => (await request('/reports/tasks/export', { params, raw: true })).blob(),
};

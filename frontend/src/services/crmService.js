// CRM Service — Real API calls, no mock data.
// All functions call the backend API with real persistence.

const API = process.env.REACT_APP_BACKEND_URL;

function getToken() {
  return localStorage.getItem('spetap_token') || '';
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API}/api/crm${path}`, { headers: headers(), ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  const json = await res.json();
  // API envelope: { success, data, error }
  return json.data !== undefined ? json.data : json;
}

// ─── Plans & Modules (constants, shared) ───

export const PLANS = [
  { id: 'core', name: 'Spet Core', price: 149, modules: ['pulse'] },
  { id: 'flow', name: 'Spet Flow', price: 299, modules: ['pulse', 'tap', 'table'] },
  { id: 'sync', name: 'Spet Sync', price: 499, modules: ['pulse', 'tap', 'table', 'kds', 'bar', 'finance'] },
  { id: 'os', name: 'Spet OS', price: 724, modules: ['pulse', 'tap', 'table', 'kds', 'bar', 'finance', 'analytics', 'ai'] },
];

export const ALL_MODULES = [
  { key: 'pulse', name: 'Pulse', description: 'CRM & Guest Intelligence' },
  { key: 'tap', name: 'Tap', description: 'NFC Entry System' },
  { key: 'table', name: 'Table', description: 'Floor Management' },
  { key: 'kds', name: 'KDS', description: 'Kitchen Display' },
  { key: 'bar', name: 'Bar', description: 'Bar Operations' },
  { key: 'finance', name: 'Finance', description: 'Cashier & Billing' },
  { key: 'analytics', name: 'Analytics', description: 'Advanced Reporting' },
  { key: 'ai', name: 'AI', description: 'Intelligent Insights' },
];

export const DEAL_STAGES = [
  { key: 'lead', label: 'Lead', color: '#3B82F6' },
  { key: 'qualified', label: 'Qualified', color: '#F59F00' },
  { key: 'proposal', label: 'Proposal', color: '#EC4899' },
  { key: 'negotiation', label: 'Negotiation', color: '#E03131' },
  { key: 'closed_won', label: 'Closed Won', color: '#1FAA6B' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#6B7280' },
];

export const ACTIVITY_TYPES = [
  { key: 'call', label: 'Call', icon: 'Phone' },
  { key: 'meeting', label: 'Meeting', icon: 'Users' },
  { key: 'email', label: 'Email', icon: 'Mail' },
  { key: 'follow_up', label: 'Follow Up', icon: 'ArrowRight' },
  { key: 'note', label: 'Note', icon: 'FileText' },
];

export function getPlanName(planId) {
  return PLANS.find(p => p.id === planId)?.name || planId;
}

export function getPlanPrice(planId) {
  return PLANS.find(p => p.id === planId)?.price || 0;
}

export function getDefaultModules(planId) {
  return PLANS.find(p => p.id === planId)?.modules || ['pulse'];
}

// ─── Deals ───

export async function getDeals(filters) {
  const params = new URLSearchParams();
  if (filters?.stage) params.set('stage', filters.stage);
  const qs = params.toString();
  const data = await request(`/deals${qs ? `?${qs}` : ''}`);
  return data.deals;
}

export async function getDealById(id) {
  return request(`/deals/${id}`);
}

export async function createDeal(deal) {
  return request('/deals', { method: 'POST', body: JSON.stringify(deal) });
}

export async function updateDeal(id, updates) {
  return request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function closeDealAsWon(dealId) {
  return request(`/deals/${dealId}/won`, { method: 'POST' });
}

export async function closeDealAsLost(dealId) {
  return request(`/deals/${dealId}/lost`, { method: 'POST' });
}

// ─── Activities ───

export async function addActivity(dealId, type, description) {
  return request(`/deals/${dealId}/activities`, {
    method: 'POST',
    body: JSON.stringify({ type, description }),
  });
}

export async function updateActivity(id, description) {
  return request(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  });
}

export async function deleteActivity(id) {
  return request(`/activities/${id}`, { method: 'DELETE' });
}

// ─── Customers ───

export async function getCustomers(filters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.plan_id) params.set('plan_id', filters.plan_id);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  const data = await request(`/customers${qs ? `?${qs}` : ''}`);
  return data.customers;
}

export async function updateCustomer(id, updates) {
  return request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

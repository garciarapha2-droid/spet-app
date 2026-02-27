import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('spetap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('spetap_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (email, password, company_name) => api.post('/auth/signup', { email, password, company_name }),
  getMe: () => api.get('/auth/me')
};

// Billing API
export const billingAPI = {
  getEntitlements: (companyId) => api.get('/billing/entitlements', { params: { company_id: companyId } }),
  createCheckout: (data) => api.post('/billing/checkout/session', data),
  getCheckoutStatus: (sessionId) => api.get(`/billing/checkout/status/${sessionId}`)
};

// Pulse APIs
export const pulseAPI = {
  getVenueConfig: (venueId) => api.get('/pulse/venue/config', { params: { venue_id: venueId } }),
  guestIntake: (formData) => api.post('/pulse/guest/intake', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  dedupeSearch: (formData) => api.post('/pulse/guest/dedupe', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getGuest: (guestId, venueId) => api.get(`/pulse/guest/${guestId}`, { params: { venue_id: venueId } }),
  getGuestHistory: (guestId, venueId) => api.get(`/pulse/guest/${guestId}/history`, { params: { venue_id: venueId } }),
  recordDecision: (formData) => api.post('/pulse/entry/decision', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTodayEntries: (venueId) => api.get('/pulse/entries/today', { params: { venue_id: venueId } }),
  getInsideGuests: (venueId) => api.get('/pulse/inside', { params: { venue_id: venueId } }),
  registerExit: (formData) => api.post('/pulse/exit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// TAP APIs
export const tapAPI = {
  getConfig: (venueId) => api.get('/tap/config', { params: { venue_id: venueId } }),
  getStats: (venueId) => api.get('/tap/stats', { params: { venue_id: venueId } }),
  getCatalog: (venueId) => api.get('/tap/catalog', { params: { venue_id: venueId } }),
  openSession: (formData) => api.post('/tap/session/open', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listSessions: (venueId, status = 'open') => api.get('/tap/sessions', { params: { venue_id: venueId, status } }),
  getSession: (sessionId) => api.get(`/tap/session/${sessionId}`),
  addItem: (sessionId, formData) => api.post(`/tap/session/${sessionId}/add`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  closeSession: (sessionId, formData) => api.post(`/tap/session/${sessionId}/close`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Table APIs
export const tableAPI = {
  listTables: (venueId) => api.get('/table/tables', { params: { venue_id: venueId } }),
  openTable: (formData) => api.post('/table/open', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  closeTable: (formData) => api.post('/table/close', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTable: (tableId) => api.get(`/table/${tableId}`),
};

// KDS APIs
export const kdsAPI = {
  listTickets: (venueId, destination = 'kitchen', status = null) => {
    const params = { venue_id: venueId, destination };
    if (status) params.status = status;
    return api.get('/kds/tickets', { params });
  },
  sendToKds: (formData) => api.post('/kds/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (ticketId, formData) => api.post(`/kds/ticket/${ticketId}/status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};


export const managerAPI = {
  getOverview: (venueId) => api.get('/manager/overview', { params: { venue_id: venueId } }),
  getCatalog: (venueId) => api.get('/manager/catalog', { params: { venue_id: venueId } })
};

export const ownerAPI = {
  getDashboard: (companyId) => api.get('/owner/dashboard', { params: { company_id: companyId } }),
  getVenues: (companyId) => api.get('/owner/venues', { params: { company_id: companyId } })
};

export const ceoAPI = {
  getDashboard: () => api.get('/ceo/dashboard'),
  getCompanies: () => api.get('/ceo/companies')
};

// Venue APIs
export const venueAPI = {
  getHome: () => api.get('/venue/home'),
};

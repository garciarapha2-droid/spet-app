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
  recordDecision: (formData) => api.post('/pulse/entry/decision', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTodayEntries: (venueId) => api.get('/pulse/entries/today', { params: { venue_id: venueId } }),
};

export const tapAPI = {
  createSession: (data) => api.post('/tap/session', data),
  addItem: (sessionId, data) => api.post(`/tap/session/${sessionId}/items`, data),
  addPayment: (sessionId, data) => api.post(`/tap/session/${sessionId}/payment`, data),
  getSession: (sessionId) => api.get(`/tap/session/${sessionId}`)
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

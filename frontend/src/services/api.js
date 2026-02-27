import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spetap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('spetap_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (email, password, company_name) => api.post('/auth/signup', { email, password, company_name }),
  getMe: () => api.get('/auth/me'),
};

// Venue
export const venueAPI = {
  getHome: () => api.get('/venue/home'),
  getEvents: (venueId, date) => api.get(`/venue/${venueId}/events`, { params: { date } }),
  createEvent: (venueId, fd) => api.post(`/venue/${venueId}/events`, fd),
  getEventDates: (venueId, month) => api.get(`/venue/${venueId}/events/dates`, { params: { month } }),
};

// Pulse
export const pulseAPI = {
  getVenueConfig: (venueId) => api.get('/pulse/venue/config', { params: { venue_id: venueId } }),
  guestIntake: (fd) => api.post('/pulse/guest/intake', fd),
  dedupeSearch: (fd) => api.post('/pulse/guest/dedupe', fd),
  getGuest: (guestId, venueId) => api.get(`/pulse/guest/${guestId}`, { params: { venue_id: venueId } }),
  recordDecision: (fd) => api.post('/pulse/entry/decision', fd),
  getTodayEntries: (venueId) => api.get('/pulse/entries/today', { params: { venue_id: venueId } }),
  getGuestHistory: (guestId, venueId) => api.get(`/pulse/guest/${guestId}/history`, { params: { venue_id: venueId } }),
  getGuestProfile: (guestId, venueId) => api.get(`/pulse/guest/${guestId}/profile`, { params: { venue_id: venueId } }),
  getInsideGuests: (venueId) => api.get('/pulse/inside', { params: { venue_id: venueId } }),
  registerExit: (fd) => api.post('/pulse/exit', fd),
  getTodayExits: (venueId) => api.get('/pulse/exits/today', { params: { venue_id: venueId } }),
  blockWristband: (guestId, fd) => api.post(`/pulse/guest/${guestId}/block`, fd),
  unblockWristband: (guestId, fd) => api.post(`/pulse/guest/${guestId}/unblock`, fd),
  getTabStatus: (guestId, venueId) => api.get(`/pulse/guest/${guestId}/tab-status`, { params: { venue_id: venueId } }),
};

// TAP
export const tapAPI = {
  getCatalog: (venueId) => api.get('/tap/catalog', { params: { venue_id: venueId } }),
  getConfig: (venueId) => api.get('/tap/config', { params: { venue_id: venueId } }),
  getStats: (venueId) => api.get('/tap/stats', { params: { venue_id: venueId } }),
  openSession: (fd) => api.post('/tap/session/open', fd),
  addItem: (sessionId, fd) => api.post(`/tap/session/${sessionId}/add`, fd),
  addCustomItem: (sessionId, fd) => api.post(`/tap/session/${sessionId}/add-custom`, fd),
  getSession: (sessionId) => api.get(`/tap/session/${sessionId}`),
  closeSession: (sessionId, fd) => api.post(`/tap/session/${sessionId}/close`, fd),
  voidItem: (sessionId, fd) => api.post(`/tap/session/${sessionId}/void-item`, fd),
  getActiveSessions: (venueId) => api.get('/tap/sessions/active', { params: { venue_id: venueId } }),
  listSessions: (venueId, status) => api.get('/tap/sessions/active', { params: { venue_id: venueId, status } }),
};

// Table
export const tableAPI = {
  getTables: (venueId) => api.get('/table/tables', { params: { venue_id: venueId } }),
  listTables: (venueId) => api.get('/table/tables', { params: { venue_id: venueId } }),
  openTable: (fd) => api.post('/table/open', fd),
  closeTable: (fd) => api.post('/table/close', fd),
  getTableDetail: (tableId) => api.get(`/table/${tableId}`),
  getTable: (tableId) => api.get(`/table/${tableId}`),
  addTableItem: (tableId, fd) => api.post(`/table/${tableId}/add-item`, fd),
  sendToKDS: (fd) => api.post('/kds/send', fd),
  addTable: (fd) => api.post('/table/tables/add', fd),
  editTable: (tableId, fd) => api.post(`/table/tables/${tableId}/edit`, fd),
  deleteTable: (tableId) => api.delete(`/table/tables/${tableId}`),
};

// KDS
export const kdsAPI = {
  getTickets: (venueId, dest) => api.get('/kds/tickets', { params: { venue_id: venueId, destination: dest } }),
  listTickets: (venueId, dest) => api.get('/kds/tickets', { params: { venue_id: venueId, destination: dest } }),
  updateStatus: (ticketId, fd) => api.post(`/kds/ticket/${ticketId}/status`, fd),
  sendToKDS: (fd) => api.post('/kds/send', fd),
  getEstimate: (venueId) => api.get('/kds/estimate', { params: { venue_id: venueId } }),
};

// Rewards
export const rewardsAPI = {
  getConfig: (venueId) => api.get('/rewards/config', { params: { venue_id: venueId } }),
  saveConfig: (fd) => api.post('/rewards/config', fd),
  updateTiers: (fd) => api.post('/rewards/config/tiers', fd),
  updateRewards: (fd) => api.post('/rewards/config/rewards', fd),
  addPoints: (fd) => api.post('/rewards/points/add', fd),
  getGuestPoints: (guestId, venueId) => api.get(`/rewards/guest/${guestId}/points`, { params: { venue_id: venueId } }),
};

// Manager / Owner / CEO
export const managerAPI = {
  getDashboard: (venueId) => api.get('/manager/dashboard', { params: { venue_id: venueId } }),
};

export const ownerAPI = {
  getDashboard: () => api.get('/owner/dashboard'),
};

export const ceoAPI = {
  getDashboard: () => api.get('/ceo/dashboard'),
  getCompanies: () => api.get('/ceo/companies'),
};

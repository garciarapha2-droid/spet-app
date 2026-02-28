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
  // Event guests (temporal presence)
  getEventGuests: (venueId, eventId) => api.get(`/venue/${venueId}/events/${eventId}/guests`),
  addGuestToEvent: (venueId, eventId, fd) => api.post(`/venue/${venueId}/events/${eventId}/guests`, fd),
  removeGuestFromEvent: (venueId, eventId, guestId) => api.delete(`/venue/${venueId}/events/${eventId}/guests/${guestId}`),
  endEvent: (venueId, eventId) => api.post(`/venue/${venueId}/events/${eventId}/end`),
  // Event staff (per-event with snapshot)
  getEventStaff: (venueId, eventId) => api.get(`/venue/${venueId}/events/${eventId}/staff`),
  assignStaffToEvent: (venueId, eventId, fd) => api.post(`/venue/${venueId}/events/${eventId}/staff`, fd),
  removeStaffFromEvent: (venueId, eventId, staffId) => api.delete(`/venue/${venueId}/events/${eventId}/staff/${staffId}`),
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
  searchGuests: (venueId, q) => api.get('/pulse/guests/search', { params: { venue_id: venueId, q } }),
  barSearch: (venueId, q) => api.get('/pulse/bar/search', { params: { venue_id: venueId, q } }),
};

// TAP
export const tapAPI = {
  getCatalog: (venueId) => api.get('/tap/catalog', { params: { venue_id: venueId } }),
  getConfig: (venueId) => api.get('/tap/config', { params: { venue_id: venueId } }),
  getStats: (venueId) => api.get('/tap/stats', { params: { venue_id: venueId } }),
  getSessions: (venueId) => api.get('/tap/sessions', { params: { venue_id: venueId } }),
  openSession: (fd) => api.post('/tap/session/open', fd),
  addItem: (sessionId, fd) => api.post(`/tap/session/${sessionId}/add`, fd),
  addCustomItem: (sessionId, fd) => api.post(`/tap/session/${sessionId}/add-custom`, fd),
  addCatalogItem: (fd) => api.post('/tap/catalog', fd),
  updateCatalogItem: (itemId, fd) => api.put(`/tap/catalog/${itemId}`, fd),
  deleteCatalogItem: (itemId) => api.delete(`/tap/catalog/${itemId}`),
  uploadCatalogPhoto: (itemId, fd) => api.post(`/tap/catalog/${itemId}/photo`, fd),
  getSession: (sessionId) => api.get(`/tap/session/${sessionId}`),
  closeSession: (sessionId, fd) => api.post(`/tap/session/${sessionId}/close`, fd),
  recordTip: (sessionId, fd) => api.post(`/tap/session/${sessionId}/record-tip`, fd),
  getClosedSessions: (venueId) => api.get('/tap/sessions/closed', { params: { venue_id: venueId } }),
  voidItem: (sessionId, fd) => api.post(`/tap/session/${sessionId}/void-item`, fd),
  getActiveSessions: (venueId) => api.get('/tap/sessions/active', { params: { venue_id: venueId } }),
  listSessions: (venueId, status) => api.get('/tap/sessions/active', { params: { venue_id: venueId, status } }),
  verifyId: (sessionId) => api.post(`/tap/session/${sessionId}/verify-id`),
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
  assignServer: (fd) => api.post('/table/assign-server', fd),
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

// Staff / Barmen
export const staffAPI = {
  getBarmen: (venueId) => api.get('/staff/barmen', { params: { venue_id: venueId } }),
  addBarman: (fd) => api.post('/staff/barmen', fd),
  updateBarman: (barmanId, fd) => api.put(`/staff/barmen/${barmanId}`, fd),
  deleteBarman: (barmanId) => api.delete(`/staff/barmen/${barmanId}`),
};

// Manager
export const managerAPI = {
  getOverview: (venueId) => api.get('/manager/overview', { params: { venue_id: venueId } }),
  getStaff: (venueId) => api.get('/manager/staff', { params: { venue_id: venueId } }),
  addStaff: (fd) => api.post('/manager/staff', fd),
  updateStaff: (id, fd) => api.put(`/manager/staff/${id}`, fd),
  deleteStaff: (id) => api.delete(`/manager/staff/${id}`),
  getSchedule: (venueId) => api.get('/manager/schedule', { params: { venue_id: venueId } }),
  saveSchedule: (fd) => api.post('/manager/schedule', fd),
  deleteSchedule: (id) => api.delete(`/manager/schedule/${id}`),
  getShifts: (venueId) => api.get('/manager/shifts', { params: { venue_id: venueId } }),
  closeShift: (fd) => api.post('/manager/shifts/close', fd),
  getGuests: (venueId, search) => api.get('/manager/guests', { params: { venue_id: venueId, search } }),
  getGuestDetail: (guestId, venueId) => api.get(`/manager/guests/${guestId}`, { params: { venue_id: venueId } }),
  getSalesReport: (venueId, period) => api.get('/manager/reports/sales', { params: { venue_id: venueId, period } }),
  exportReport: (venueId, period) => api.get('/manager/reports/export', { params: { venue_id: venueId, period }, responseType: 'blob' }),
  getLoyalty: (venueId) => api.get('/manager/loyalty', { params: { venue_id: venueId } }),
  saveLoyalty: (fd) => api.post('/manager/loyalty', fd),
  getSettings: (venueId) => api.get('/manager/settings', { params: { venue_id: venueId } }),
  updateSettings: (fd) => api.put('/manager/settings', fd),
  getAudit: (venueId) => api.get('/manager/audit', { params: { venue_id: venueId } }),
  getFunnelDetail: (venueId, stage) => api.get('/manager/funnel-detail', { params: { venue_id: venueId, stage } }),
  getTablesByServer: (venueId) => api.get('/manager/tables-by-server', { params: { venue_id: venueId } }),
  getTableDetail: (tableId) => api.get(`/manager/table-detail/${tableId}`),
  voidTableItem: (fd) => api.post('/manager/table-void-item', fd),
  // Shift vs Operations
  getStaffRoles: (venueId) => api.get('/manager/staff-roles', { params: { venue_id: venueId } }),
  saveStaffRole: (fd) => api.post('/manager/staff-roles', fd),
  deleteStaffRole: (id, venueId) => api.delete(`/manager/staff-roles/${id}`, { params: { venue_id: venueId } }),
  customizeStaff: (id, fd) => api.put(`/manager/staff-customize/${id}`, fd),
  getShiftOverview: (venueId, dateFrom, dateTo) => api.get('/manager/shift-overview', { params: { venue_id: venueId, date_from: dateFrom, date_to: dateTo } }),
  getStaffCosts: (venueId, dateFrom, dateTo) => api.get('/manager/staff-costs', { params: { venue_id: venueId, date_from: dateFrom, date_to: dateTo } }),
  getShiftHistory: (venueId, days) => api.get('/manager/shift-history', { params: { venue_id: venueId, days } }),
  getShiftChart: (venueId, period, dateFrom, dateTo) => api.get('/manager/shift-chart', { params: { venue_id: venueId, period, date_from: dateFrom, date_to: dateTo } }),
  saveShiftSnapshot: (fd) => api.post('/manager/shift-snapshot', fd),
  shiftAI: (fd) => api.post('/manager/shift-ai', fd),
};

// Owner
export const ownerAPI = {
  getDashboard: (view) => api.get('/owner/dashboard', { params: { view: view || 'business' } }),
  getVenues: () => api.get('/owner/venues'),
  getInsights: () => api.get('/owner/insights'),
  getFinance: () => api.get('/owner/finance'),
  getGrowth: () => api.get('/owner/growth'),
  getPeople: () => api.get('/owner/people'),
  getVenueStaff: (venueId) => api.get(`/owner/people/${venueId}/staff`),
  getEventStaff: (eventId) => api.get(`/owner/people/event/${eventId}/staff`),
  getSystem: () => api.get('/owner/system'),
  getModules: () => api.get('/owner/modules'),
  generateAIInsights: (question) => {
    const fd = new FormData();
    if (question) fd.append('question', question);
    return api.post('/owner/ai-insights', fd);
  },
};

export const ceoAPI = {
  getHealth: () => api.get('/ceo/health'),
  getRevenue: (period) => api.get('/ceo/revenue', { params: { period: period || 'month' } }),
  getTargets: () => api.get('/ceo/targets'),
  updateTargets: (fd) => api.post('/ceo/targets', fd),
  getCompanies: () => api.get('/ceo/companies'),
  getModules: () => api.get('/ceo/modules'),
  getAlerts: () => api.get('/ceo/alerts'),
  getPipeline: () => api.get('/ceo/pipeline'),
};

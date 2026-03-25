// API configuration — single source of truth
// Change this URL when deploying to production
export const API_BASE_URL = 'https://access-payment-hub.preview.emergentagent.com';
export const API_PREFIX = '/api';
// Derive WS URL from API_BASE_URL to keep them in sync
export const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss');

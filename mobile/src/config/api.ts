// API configuration — single source of truth
// Production URL is set via EXPO_PUBLIC_API_URL in eas.json
// Falls back to preview URL for development
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://access-payment-hub.preview.emergentagent.com';

export const API_PREFIX = '/api';

// Derive WS URL from API_BASE_URL to keep them in sync
export const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss');

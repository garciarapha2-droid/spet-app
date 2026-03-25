/**
 * API configuration — single source of truth.
 *
 * The URL comes exclusively from EXPO_PUBLIC_API_URL (set in .env or eas.json).
 * No hardcoded fallback — if it's missing, the app fails fast so we know immediately.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

export const API_PREFIX = '/api';

// Derive WS URL from API_BASE_URL
export const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');

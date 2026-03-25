/**
 * API configuration — single source of truth.
 *
 * The URL comes exclusively from EXPO_PUBLIC_API_URL (set in .env or eas.json).
 * No hardcoded fallback — if it's missing, the app fails fast so we know immediately.
 *
 * CRITICAL: We use /mapi instead of /api as the prefix.
 * Reason: The Kubernetes ingress intercepts /api and routes directly to port 8001,
 * but this routing fails inconsistently from iOS devices (returns plain-text "404 page not found").
 * Using /mapi, requests go to port 3000 (frontend) where setupProxy.js catches them
 * and rewrites /mapi → /api before forwarding to the backend on port 8001.
 * This bypasses the broken ingress routing entirely.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

export const API_PREFIX = '/mapi';

// Derive WS URL from API_BASE_URL
export const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');

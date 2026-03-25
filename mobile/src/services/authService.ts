/**
 * Auth service — handles login, logout, session refresh, token storage.
 *
 * CRITICAL: Login uses direct fetch (same pattern as the connection test)
 * to bypass any framework-level issues with the api.ts request chain.
 * The connection test proves iOS CAN reach the server — login must use
 * the same approach.
 */
import { getToken, setTokens, clearTokens, getRefreshToken } from './api';
import { API_BASE_URL, API_PREFIX } from '../config/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: { role: string; venue_id: string; company_id: string }[];
  status: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * Login — uses direct fetch to match the working connection test pattern.
 * Adds cache-busting parameter to prevent Cloudflare/iOS response caching.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ user: User }> {
  const timestamp = Date.now();
  const url = `${API_BASE_URL}${API_PREFIX}/auth/login?_cb=${timestamp}`;

  console.log(`[AUTH] Login attempt: POST ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify({ email, password }),
    });
  } catch (err: any) {
    console.log(`[AUTH] Login fetch failed: ${err.message}`);
    throw new Error(
      `Network error: ${err.message}\n\nURL: ${url}\n\nPlease check your internet connection.`,
    );
  }

  console.log(`[AUTH] Login response: HTTP ${response.status}`);

  // Check if response is JSON
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '(empty)');
    console.log(`[AUTH] Non-JSON response: ${text.substring(0, 200)}`);
    throw new Error(
      `Server returned non-JSON (HTTP ${response.status})\n\nResponse: ${text.substring(0, 100)}\n\nURL: ${url}`,
    );
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    const msg = json.error?.message || `Login failed (HTTP ${response.status})`;
    console.log(`[AUTH] Login error: ${msg}`);
    throw new Error(msg);
  }

  const data: LoginResponse = json.data;
  await setTokens(data.access_token, data.refresh_token);
  console.log(`[AUTH] Login success: ${data.user.name} (${data.user.role})`);

  return { user: data.user };
}

/**
 * Logout — clears stored tokens.
 */
export async function logout(): Promise<void> {
  console.log('[AUTH] Logout');
  await clearTokens();
}

/**
 * Refresh — try to get a new access token using the refresh token.
 */
export async function refreshSession(): Promise<boolean> {
  const refresh = await getRefreshToken();
  if (!refresh) return false;

  try {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      await clearTokens();
      return false;
    }

    const json = await response.json();
    if (json.success && json.data?.access_token) {
      await setTokens(json.data.access_token, json.data.refresh_token || refresh);
      return true;
    }

    await clearTokens();
    return false;
  } catch {
    await clearTokens();
    return false;
  }
}

/**
 * Check if user has a stored token.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getToken();
    return !!token;
  } catch {
    return false;
  }
}

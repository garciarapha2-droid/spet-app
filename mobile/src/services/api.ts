/**
 * Base HTTP client with JWT auth.
 * Handles token injection, response unwrapping, refresh, and automatic retry.
 *
 * IMPORTANT: Every SecureStore call is wrapped in try/catch.
 * If the keychain is locked, corrupted, or unavailable, we treat it
 * as "no data" rather than crashing the app.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL, API_PREFIX } from '../config/api';

const TOKEN_KEY = 'spet_access_token';
const REFRESH_KEY = 'spet_refresh_token';

// ─── Token management (all SecureStore calls guarded) ───

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, access);
  } catch {}
  try {
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  } catch {}
}

export async function clearTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {}
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

export class ApiError extends Error {
  code: string;
  status: number;
  url?: string;
  constructor(message: string, code: string = 'UNKNOWN', status: number = 500, url?: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.url = url;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// ─── Startup validation ─────────────────────────────────

if (!API_BASE_URL) {
  console.error('[API] FATAL: EXPO_PUBLIC_API_URL is not set. Check your .env or eas.json.');
}

console.log(`[API] Configured: ${API_BASE_URL}${API_PREFIX} (${Platform.OS})`);

// ─── Core request function with retry ───────────────────

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'API URL not configured. Set EXPO_PUBLIC_API_URL in .env or eas.json.',
      'CONFIG_ERROR',
      0,
    );
  }

  const url = `${API_BASE_URL}${API_PREFIX}${path}`;
  const method = options.method || 'GET';

  console.log(`[API] ${method} ${url}`);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Retry loop for transient network errors (ECONNABORTED, TLS failures)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`[API] Retry ${attempt}/${MAX_RETRIES} for ${method} ${path}`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        console.warn(`[API] Timeout on attempt ${attempt + 1} for ${path}`);
        continue; // retry on timeout
      }

      // Network errors (ECONNABORTED, TLS, etc.) — retry
      console.warn(`[API] Network error on attempt ${attempt + 1}: ${err.message}`);
      continue;
    }

    // Got a response — parse it
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status} (non-JSON response)`,
          'HTTP_ERROR',
          response.status,
          url,
        );
      }
      return {} as T;
    }

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      const msg = json.error?.message || `Request failed (${response.status})`;
      const code = json.error?.code || 'API_ERROR';
      throw new ApiError(msg, code, response.status, url);
    }

    return json.data;
  }

  // All retries exhausted
  const isTimeout = lastError && (lastError as any).name === 'AbortError';
  const errorMsg = isTimeout
    ? `Connection timed out after ${MAX_RETRIES + 1} attempts. Server may be unreachable.`
    : `Connection failed after ${MAX_RETRIES + 1} attempts. Check your network or server URL.`;
  const errorCode = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';

  console.error(`[API] All retries failed for ${method} ${url}. Last error: ${lastError?.message}`);

  throw new ApiError(
    `${errorMsg}\n\nURL: ${url}\nError: ${lastError?.message || 'Unknown'}`,
    errorCode,
    0,
    url,
  );
}

// ─── Public API methods ─────────────────────────────────

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  postPublic: <T = any>(path: string, body: any) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }, true),

  postForm: <T = any>(path: string, formData: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: formData,
    }),
};

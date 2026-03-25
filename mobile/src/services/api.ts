/**
 * Base HTTP client with JWT auth.
 * Handles token injection, response unwrapping, and refresh.
 *
 * IMPORTANT: Every SecureStore call is wrapped in try/catch.
 * If the keychain is locked, corrupted, or unavailable, we treat it
 * as "no data" rather than crashing the app.
 */
import * as SecureStore from 'expo-secure-store';
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
  constructor(message: string, code: string = 'UNKNOWN', status: number = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 15_000;

// ─── Core request function ──────────────────────────────

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Check your connection.', 'TIMEOUT', 0);
    }
    throw new ApiError('Network error. Check your connection.', 'NETWORK_ERROR', 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, 'HTTP_ERROR', response.status);
    }
    return {} as T;
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    const msg = json.error?.message || `Request failed (${response.status})`;
    const code = json.error?.code || 'API_ERROR';
    throw new ApiError(msg, code, response.status);
  }

  return json.data;
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

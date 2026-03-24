/**
 * Base HTTP client with JWT auth.
 * Handles token injection, response unwrapping, and refresh.
 */
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_PREFIX } from '../config/api';

const TOKEN_KEY = 'spet_access_token';
const REFRESH_KEY = 'spet_refresh_token';

// Token management
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

// Response type from backend
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

// Core request function
async function request<T = any>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add auth token unless skipped
  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add JSON content type unless it's FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  // Handle non-JSON responses
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

// Public API methods
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

  // POST without auth (for login)
  postPublic: <T = any>(path: string, body: any) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }, true),

  // POST with FormData (for multipart)
  postForm: <T = any>(path: string, formData: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: formData,
    }),
};

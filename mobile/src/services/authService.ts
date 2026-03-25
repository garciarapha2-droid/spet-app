/**
 * Auth service — login, refresh, logout.
 *
 * Every function that touches SecureStore or network is fully guarded.
 * No function in this file can throw an unhandled exception.
 */
import { api, setTokens, clearTokens, getRefreshToken, getToken } from './api';

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

export async function login(email: string, password: string): Promise<{ user: User }> {
  // This intentionally throws on failure — LoginScreen shows the error
  const data = await api.postPublic<LoginResponse>('/auth/login', { email, password });
  await setTokens(data.access_token, data.refresh_token);
  return { user: data.user };
}

export async function refreshSession(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const data = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (!data?.access_token || !data?.refresh_token) {
      await clearTokens();
      return false;
    }

    await setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    }
  } catch {
    // Ignore — we clear tokens regardless
  }
  await clearTokens();
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getToken();
    return !!token;
  } catch {
    return false;
  }
}

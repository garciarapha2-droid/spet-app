/**
 * Auth service — login, refresh, logout.
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
  const data = await api.postPublic<LoginResponse>('/auth/login', { email, password });
  await setTokens(data.access_token, data.refresh_token);
  return { user: data.user };
}

export async function refreshSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const data = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
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
    // Ignore errors on logout
  }
  await clearTokens();
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

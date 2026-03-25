/**
 * Auth context — manages login state, user, tokens.
 *
 * Startup sequence:
 *   1. loading = true (splash stays visible)
 *   2. Check SecureStore for existing token
 *   3. If token → try refresh → authenticated = true/false
 *   4. If no token → authenticated = false
 *   5. loading = false → splash hides, navigation renders
 *
 * GUARANTEE: loading always becomes false. Any error → fallback to login.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { isAuthenticated } from '../services/authService';

interface AuthState {
  user: authService.User | null;
  loading: boolean;
  authenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authenticated: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  // ─── Session restore on mount ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.log('[AUTH] Restoring session...');
      try {
        const hasToken = await isAuthenticated();

        if (cancelled) return;

        if (hasToken) {
          console.log('[AUTH] Token found, refreshing...');
          const ok = await authService.refreshSession();
          console.log('[AUTH] Refresh result:', ok ? 'success' : 'failed');
          if (!cancelled) {
            setState({ user: null, loading: false, authenticated: ok });
          }
        } else {
          console.log('[AUTH] No token → login');
          if (!cancelled) {
            setState({ user: null, loading: false, authenticated: false });
          }
        }
      } catch (e: any) {
        console.log('[AUTH] Session restore failed:', e?.message || e);
        if (!cancelled) {
          setState({ user: null, loading: false, authenticated: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ─── Login ────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    // Let errors propagate to the caller (LoginScreen shows them)
    const { user } = await authService.login(email, password);
    setState({ user, loading: false, authenticated: true });
  }, []);

  // ─── Logout ───────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore — we clear state regardless
    }
    setState({ user: null, loading: false, authenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Auth context — manages login state, user, tokens.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { isAuthenticated } from '../services/authService';
import { getToken } from '../services/api';

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

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const hasToken = await isAuthenticated();
        if (hasToken) {
          const ok = await authService.refreshSession();
          setState({ user: null, loading: false, authenticated: ok });
        } else {
          setState({ user: null, loading: false, authenticated: false });
        }
      } catch {
        setState({ user: null, loading: false, authenticated: false });
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await authService.login(email, password);
    setState({ user, loading: false, authenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
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

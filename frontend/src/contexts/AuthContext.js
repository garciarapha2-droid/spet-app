import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('spetap_token'));

  const loadUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getMe();
      const raw = response.data;
      const userData = raw?.data || raw;
      setUser(userData);
    } catch {
      localStorage.removeItem('spetap_token');
      localStorage.removeItem('spetap_refresh_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser(token);
  }, [token, loadUser]);

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const raw = response.data;
    const payload = raw?.data || raw;
    const { access_token, refresh_token, user: userData, next } = payload;
    localStorage.setItem('spetap_token', access_token);
    if (refresh_token) localStorage.setItem('spetap_refresh_token', refresh_token);
    setToken(access_token);
    setUser(userData);
    return next;
  };

  const signup = async (email, password, company_name) => {
    await authAPI.signup(email, password, company_name);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('spetap_token');
    localStorage.removeItem('spetap_refresh_token');
    setToken(null);
    setUser(null);
  }, []);

  const setTokenDirect = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem('spetap_token', accessToken);
    if (refreshToken) localStorage.setItem('spetap_refresh_token', refreshToken);
    setToken(accessToken);
    if (userData) setUser(userData);
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('spetap_token');
    if (!currentToken) return;
    try {
      const response = await authAPI.getMe();
      const raw = response.data;
      const userData = raw?.data || raw;
      setUser(userData);
    } catch {
      // silent fail
    }
  }, []);

  const isCEO = user?.role === 'CEO';
  const isPendingPayment = user?.status === 'pending_payment';
  const isActive = user?.status === 'active';
  const isOnboarded = user?.onboarding_completed === true;

  return (
    <AuthContext.Provider value={{
      user, loading, login, signup, logout, setTokenDirect, refreshUser,
      isAuthenticated: !!token,
      isCEO,
      isPendingPayment,
      isActive,
      isOnboarded,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

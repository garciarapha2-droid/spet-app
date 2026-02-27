import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('spetap_token'));

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        console.error('Failed to load user:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { access_token, user: userData, next } = response.data;
    
    localStorage.setItem('spetap_token', access_token);
    setToken(access_token);
    setUser(userData);
    
    return next;
  };

  const signup = async (email, password, company_name) => {
    await authAPI.signup(email, password, company_name);
  };

  const logout = () => {
    localStorage.removeItem('spetap_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

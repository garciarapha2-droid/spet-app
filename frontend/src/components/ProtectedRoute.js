import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LOVABLE_LOGIN = process.env.REACT_APP_LOVABLE_LOGIN_URL || 'https://spet.lovable.app/login';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground/30"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = LOVABLE_LOGIN;
    return null;
  }

  return children;
};

export const CEORoute = ({ children }) => {
  const { isAuthenticated, loading, isCEO } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground/30"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = LOVABLE_LOGIN;
    return null;
  }

  if (!isCEO) {
    // Redirect non-CEO users to venue home
    window.location.href = '/venue/home';
    return null;
  }

  return children;
};

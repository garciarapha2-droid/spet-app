import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/*
 * PRODUCTION: Set REACT_APP_LOVABLE_LOGIN_URL to redirect to Lovable.
 * PREVIEW/DEV: Leave it unset — falls back to internal /login page.
 */
const LOVABLE_LOGIN = process.env.REACT_APP_LOVABLE_LOGIN_URL;

const RedirectToLogin = () => {
  if (LOVABLE_LOGIN) {
    window.location.href = LOVABLE_LOGIN;
    return null;
  }
  return <Navigate to="/login" replace />;
};

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
    return <RedirectToLogin />;
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
    return <RedirectToLogin />;
  }

  if (!isCEO) {
    return <Navigate to="/venue/home" replace />;
  }

  return children;
};

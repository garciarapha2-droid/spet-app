import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
  </div>
);

/** Only accessible when NOT authenticated (login, signup) */
export const PublicOnly = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Spinner />;

  if (isAuthenticated) {
    if (user?.status === 'pending_payment') return <Navigate to="/payment/pending" replace />;
    if (!user?.onboarding_completed) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/venue/home" replace />;
  }

  return children;
};

/** Requires authentication only (any status) — for payment pages */
export const AuthOnly = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

/** Requires auth + active status — for onboarding */
export const ActiveOnly = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'pending_payment') return <Navigate to="/payment/pending" replace />;

  return children;
};

/** Full protection: auth + active + onboarded — for all app routes */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'pending_payment') return <Navigate to="/payment/pending" replace />;
  if (!user?.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return children;
};

/** CEO-only route: auth + active + onboarded + CEO role */
export const CEORoute = ({ children }) => {
  const { isAuthenticated, loading, user, isCEO } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'pending_payment') return <Navigate to="/payment/pending" replace />;
  if (!user?.onboarding_completed) return <Navigate to="/onboarding" replace />;
  if (!isCEO) return <Navigate to="/venue/home" replace />;

  return children;
};

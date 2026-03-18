import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export const AuthHandoffPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenDirect } = useAuth();
  const [error, setError] = useState(null);
  const handoffStarted = useRef(false);

  useEffect(() => {
    if (handoffStarted.current) return;
    handoffStarted.current = true;

    const token = searchParams.get('token');
    const code = searchParams.get('code');

    if (token) {
      handleTokenHandoff(token);
    } else if (code) {
      handleCodeHandoff(code);
    } else {
      setError('No authentication data provided');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTokenHandoff = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Invalid token');
      const userData = await res.json();
      setTokenDirect(token, userData);
      navigate('/venue/home', { replace: true });
    } catch {
      setError('Token validation failed');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    }
  };

  const handleCodeHandoff = async (code) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/handoff/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error('Code exchange failed');
      const data = await res.json();
      setTokenDirect(data.access_token, data.user);
      navigate('/venue/home', { replace: true });
    } catch {
      setError('Authentication handoff failed');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background" data-testid="handoff-error">
        <div className="text-destructive text-lg font-medium mb-2">Authentication failed</div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <p className="text-muted-foreground text-xs mt-2">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background" data-testid="handoff-loading">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground text-sm">Authenticating...</p>
    </div>
  );
};

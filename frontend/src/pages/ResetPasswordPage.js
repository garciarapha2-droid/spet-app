import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Lock, CheckCircle, XCircle } from 'lucide-react';
import { AuthHeader } from '../components/AuthHeader';
import api from '../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid reset link. No token provided.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 5) {
      setError('Password must be at least 5 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-background" data-testid="reset-password-page">
        <AuthHeader backTo="/login" />
        <main className="flex-1 flex items-center justify-center -mt-16 px-6">
          <div className="w-full max-w-[420px] space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Password reset successful
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-premium inline-flex items-center justify-center h-[48px] px-8 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold"
              data-testid="go-to-login-button"
            >
              Go to Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col min-h-screen bg-background" data-testid="reset-password-page">
        <AuthHeader backTo="/login" />
        <main className="flex-1 flex items-center justify-center -mt-16 px-6">
          <div className="w-full max-w-[420px] space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Invalid reset link
            </h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:brightness-125"
              style={{ color: 'hsl(var(--primary))' }}
              data-testid="request-new-link"
            >
              Request a new reset link
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="reset-password-page">
      <AuthHeader backTo="/login" />
      <main className="flex-1 flex items-center justify-center -mt-16 px-6">
        <div className="w-full max-w-[420px] space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Set new password
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Choose a strong password for your account
            </p>
          </div>

          {error && (
            <div
              className="px-4 py-2.5 text-[13px] text-center rounded-lg border"
              style={{
                color: 'hsl(var(--destructive))',
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                borderColor: 'hsl(var(--destructive) / 0.2)',
              }}
              data-testid="reset-password-error"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="block text-[13px] font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 5 characters"
                required
                minLength={5}
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="new-password-input"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="block text-[13px] font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={5}
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="confirm-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium mt-1 flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-primary-foreground text-[15px] font-semibold disabled:opacity-50 disabled:pointer-events-none"
              data-testid="reset-password-button"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Reset password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

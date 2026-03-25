import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { AuthHeader } from '../components/AuthHeader';
import api from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        email,
        origin_url: window.location.origin,
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col min-h-screen bg-background" data-testid="forgot-password-page">
        <AuthHeader backTo="/login" />
        <main className="flex-1 flex items-center justify-center -mt-16 px-6">
          <div className="w-full max-w-[420px] space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If an account with <strong className="text-foreground">{email}</strong> exists, we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:brightness-125"
              style={{ color: 'hsl(var(--primary))' }}
              data-testid="back-to-login-link"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="forgot-password-page">
      <AuthHeader backTo="/login" />
      <main className="flex-1 flex items-center justify-center -mt-16 px-6">
        <div className="w-full max-w-[420px] space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Forgot password?
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Enter your email and we'll send you a reset link
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
              data-testid="forgot-password-error"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="block text-[13px] font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                Email address
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="forgot-email-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium mt-1 flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-primary-foreground text-[15px] font-semibold disabled:opacity-50 disabled:pointer-events-none"
              data-testid="send-reset-button"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-medium transition-all hover:brightness-125"
              style={{ color: 'hsl(var(--primary))' }}
              data-testid="back-to-login-link"
            >
              <ArrowLeft size={12} /> Back to login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

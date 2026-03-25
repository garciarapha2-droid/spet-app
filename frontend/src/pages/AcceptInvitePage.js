import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Users, CheckCircle, XCircle } from 'lucide-react';
import { AuthHeader } from '../components/AuthHeader';
import api from '../services/api';

export const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => {
    if (!token) setError('Invalid invite link.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 5) {
      setError('Password must be at least 5 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/team/accept-invite', { token, name, password });
      setInviteInfo(res.data);
      setSuccess(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error?.message || 'Failed to accept invite.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-background" data-testid="accept-invite-page">
        <AuthHeader backTo="/login" />
        <main className="flex-1 flex items-center justify-center -mt-16 px-6">
          <div className="w-full max-w-[420px] space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Welcome to the team!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your account has been set up as <strong className="text-foreground">{inviteInfo?.role}</strong>. You can now log in.
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
      <div className="flex flex-col min-h-screen bg-background" data-testid="accept-invite-page">
        <AuthHeader backTo="/login" />
        <main className="flex-1 flex items-center justify-center -mt-16 px-6">
          <div className="w-full max-w-[420px] space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Invalid invite</h1>
            <p className="text-sm text-muted-foreground">This invite link is invalid or has expired.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="accept-invite-page">
      <AuthHeader backTo="/login" />
      <main className="flex-1 flex items-center justify-center -mt-16 px-6">
        <div className="w-full max-w-[420px] space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Join the team
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Set up your account to accept the invite
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
              data-testid="invite-error"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="invite-name" className="block text-[13px] font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                Your name
              </label>
              <input
                id="invite-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="invite-name-input"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite-password" className="block text-[13px] font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                Choose a password
              </label>
              <input
                id="invite-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 5 characters"
                required
                minLength={5}
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="invite-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium mt-1 flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-primary-foreground text-[15px] font-semibold disabled:opacity-50 disabled:pointer-events-none"
              data-testid="accept-invite-button"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Accept & Join'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

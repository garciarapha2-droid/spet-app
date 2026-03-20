import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthHeader } from '../components/AuthHeader';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const nextRoute = await login(email, password);
      const route = nextRoute?.route || '/venue/home';
      navigate(route, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="login-page">
      <AuthHeader backTo="/" />

      <main className="flex-1 flex items-center justify-center -mt-16 px-6">
        <div className="w-full max-w-[420px] space-y-4">
          {/* Identity Block */}
          <div className="flex flex-col items-center text-center">
            <img
              src="/spet-icon-hd.png"
              alt="Spet"
              className="w-[200px] h-[200px] rounded-[44px]"
              data-testid="spet-icon"
            />
            <h1
              className="mt-3 text-[22px] font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Sign in to your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="px-4 py-2.5 text-[13px] text-center rounded-lg border"
              style={{
                color: 'hsl(var(--destructive))',
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                borderColor: 'hsl(var(--destructive) / 0.2)',
              }}
              data-testid="login-error"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-[13px] font-medium"
                style={{ color: 'hsl(var(--text-secondary))' }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-medium"
                  style={{ color: 'hsl(var(--text-secondary))' }}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-[12px] font-medium transition-all hover:brightness-125"
                  style={{ color: 'hsl(var(--primary))' }}
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium mt-1 flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-primary-foreground text-[15px] font-semibold disabled:opacity-50 disabled:pointer-events-none"
              data-testid="login-button"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium transition-all hover:brightness-125"
              style={{ color: 'hsl(var(--primary))' }}
              data-testid="signup-link"
            >
              Get started
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

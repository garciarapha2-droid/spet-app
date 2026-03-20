import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthHeader } from '../components/AuthHeader';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLANS = [
  {
    id: 'core',
    name: 'Spet Core',
    price: 49,
    tagline: 'CRM & Guest Intelligence',
    features: ['1 Venue', 'Pulse module', 'Up to 5 staff', 'Basic support'],
  },
  {
    id: 'flow',
    name: 'Spet Flow',
    price: 89,
    tagline: 'Tap + Table',
    features: ['3 Venues', 'Pulse + Tap + Table', 'Up to 20 staff', 'Priority support'],
  },
  {
    id: 'sync',
    name: 'Spet Sync',
    price: 149,
    tagline: 'Full operational control',
    popular: true,
    features: ['10 Venues', 'All core modules + KDS', 'Up to 50 staff', 'Dedicated support'],
  },
  {
    id: 'os',
    name: 'Spet OS',
    price: 299,
    tagline: 'Everything + AI insights',
    features: ['Unlimited venues', 'All modules + AI', 'Unlimited staff', 'CEO dashboard'],
  },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', plan_id: 'sync' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    if (user?.status === 'pending_payment') {
      window.location.href = '/payment/pending';
      return null;
    }
    if (!user?.onboarding_completed) {
      window.location.href = '/onboarding';
      return null;
    }
    window.location.href = '/venue/home';
    return null;
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const origin_url = window.location.origin;
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, origin_url }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error?.message || json?.detail || 'Signup failed';
        throw new Error(msg);
      }

      const payload = json?.data || json;
      localStorage.setItem('spetap_token', payload.access_token);

      if (payload.checkout_url) {
        window.location.href = payload.checkout_url;
      } else {
        navigate('/payment/pending');
      }
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="signup-page">
      <AuthHeader backTo="/login" />

      <main className="flex-1 flex items-center justify-center -mt-8 px-6">
        <div className="w-full max-w-[480px] space-y-4">
          {/* Identity Block */}
          <div className="flex flex-col items-center text-center">
            <img
              src="/spet-icon-hd.png"
              alt="Spet"
              className="w-[120px] h-[120px] rounded-[28px]"
            />
            <h1
              className="mt-3 text-[22px] font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Create your account
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Start managing your venue in minutes
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-2.5 text-[13px] text-center rounded-lg border"
              style={{
                color: 'hsl(var(--destructive))',
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                borderColor: 'hsl(var(--destructive) / 0.2)',
              }}
              data-testid="signup-error"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="block text-[13px] font-medium"
                style={{ color: 'hsl(var(--text-secondary))' }}
              >
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
                required
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="signup-name-input"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-[13px] font-medium"
                style={{ color: 'hsl(var(--text-secondary))' }}
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                required
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="signup-email-input"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-[13px] font-medium"
                style={{ color: 'hsl(var(--text-secondary))' }}
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="flex h-12 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                data-testid="signup-password-input"
              />
            </div>

            {/* Plan Selection */}
            <div className="space-y-2 pt-1">
              <label
                className="block text-[13px] font-medium"
                style={{ color: 'hsl(var(--text-secondary))' }}
              >
                Choose your plan
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PLANS.map((plan) => (
                  <label
                    key={plan.id}
                    data-testid={`plan-option-${plan.id}`}
                    className={`relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                      form.plan_id === plan.id
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card hover:border-primary/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={form.plan_id === plan.id}
                      onChange={set('plan_id')}
                      className="sr-only"
                    />
                    {plan.popular && (
                      <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                        Popular
                      </span>
                    )}
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-bold text-foreground">{plan.name}</span>
                      <span className="text-[13px] font-bold" style={{ color: 'hsl(var(--primary))' }}>
                        ${plan.price}
                        <span className="text-[10px] font-normal" style={{ color: 'hsl(var(--text-tertiary))' }}>/mo</span>
                      </span>
                    </div>
                    <span className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {plan.tagline}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-premium mt-2 flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-primary-foreground text-[15px] font-semibold disabled:opacity-50 disabled:pointer-events-none"
              data-testid="signup-submit-btn"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Get started'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium transition-all hover:brightness-125"
              style={{ color: 'hsl(var(--primary))' }}
              data-testid="login-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

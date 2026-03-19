import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLANS = [
  { id: 'starter', name: 'Starter', price: 79, features: ['1 Venue', 'Pulse + Tap', 'Basic KDS', 'Up to 5 staff'] },
  { id: 'growth', name: 'Growth', price: 149, features: ['3 Venues', 'All Modules', 'Advanced KDS', 'Up to 20 staff'] },
  { id: 'enterprise', name: 'Enterprise', price: 299, features: ['Unlimited', 'All Modules', 'Unlimited staff', 'CEO dashboard'] },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', plan_id: 'starter' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    if (user?.status === 'pending_payment') return <Navigate to="/payment/pending" replace />;
    if (!user?.onboarding_completed) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/venue/home" replace />;
  }

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      localStorage.setItem('spetap_token', data.access_token);

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        navigate('/payment/pending');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div data-testid="signup-page" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 data-testid="signup-title" className="text-3xl font-bold text-white tracking-tight">Create Your Account</h1>
          <p className="text-zinc-400 mt-2">Start managing your venue with SPET</p>
        </div>

        {error && (
          <div data-testid="signup-error" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
            <input
              data-testid="signup-name-input"
              type="text"
              value={form.name}
              onChange={set('name')}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              data-testid="signup-email-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <input
              data-testid="signup-password-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Select Plan</label>
            <div className="space-y-2.5">
              {PLANS.map((plan) => (
                <label
                  key={plan.id}
                  data-testid={`plan-option-${plan.id}`}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    form.plan_id === plan.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={form.plan_id === plan.id}
                    onChange={set('plan_id')}
                    className="mt-1 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{plan.name}</span>
                      <span className="text-blue-400 font-bold">${plan.price}/mo</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{plan.features.join(' · ')}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            data-testid="signup-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account & Pay'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Log in</Link>
        </p>
      </div>
    </div>
  );
}

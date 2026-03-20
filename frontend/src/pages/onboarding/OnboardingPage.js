import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VENUE_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'nightclub', label: 'Nightclub' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'lounge', label: 'Lounge' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'other', label: 'Other' },
];

const MODULES = [
  { id: 'pulse', label: 'Pulse', desc: 'Guest entry & check-in management' },
  { id: 'tap', label: 'Tap', desc: 'Bar ordering & tab management' },
  { id: 'table', label: 'Table', desc: 'Table management & reservations' },
  { id: 'kds', label: 'KDS', desc: 'Kitchen Display System' },
];

function getToken() {
  return localStorage.getItem('spetap_token');
}

async function apiCall(endpoint, body = null) {
  const opts = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body) {
    opts.method = 'POST';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}/api/onboarding${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

function StepIndicator({ current, total }) {
  return (
    <div data-testid="step-indicator" className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current ? 'w-8 bg-blue-500' : i === current ? 'w-8 bg-blue-400' : 'w-2 bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }) {
  return (
    <div data-testid="onboarding-welcome" className="text-center">
      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Welcome to SPET</h2>
      <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
        Let's set up your venue in just a few steps. This will take about 2 minutes.
      </p>
      <button
        data-testid="onboarding-start-btn"
        onClick={onNext}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
}

function AccountSetupStep({ onNext, onError }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    user_name: user?.name || '',
    venue_name: '',
    venue_type: 'bar',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/account-setup', form);
      onNext();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="onboarding-account-setup">
      <h2 className="text-xl font-bold text-white mb-1">Account Setup</h2>
      <p className="text-zinc-400 text-sm mb-6">Tell us about your venue</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your Name</label>
          <input
            data-testid="onboarding-user-name"
            type="text"
            value={form.user_name}
            onChange={(e) => setForm({ ...form, user_name: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Venue Name</label>
          <input
            data-testid="onboarding-venue-name"
            type="text"
            value={form.venue_name}
            onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Bar & Grill"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Venue Type</label>
          <div className="grid grid-cols-3 gap-2">
            {VENUE_TYPES.map((vt) => (
              <button
                key={vt.id}
                type="button"
                data-testid={`venue-type-${vt.id}`}
                onClick={() => setForm({ ...form, venue_type: vt.id })}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  form.venue_type === vt.id
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {vt.label}
              </button>
            ))}
          </div>
        </div>
        <button
          data-testid="onboarding-account-next"
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

function PasswordResetStep({ onNext, onError }) {
  const [form, setForm] = useState({ new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      onError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/password-reset', { new_password: form.new_password });
      onNext();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="onboarding-password-reset">
      <h2 className="text-xl font-bold text-white mb-1">Set Your Password</h2>
      <p className="text-zinc-400 text-sm mb-6">Choose a secure password for your account</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
          <input
            data-testid="onboarding-new-password"
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Min 6 characters"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
          <input
            data-testid="onboarding-confirm-password"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
          />
        </div>
        <button
          data-testid="onboarding-password-next"
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

function ModulesSetupStep({ onNext, onError }) {
  const [selected, setSelected] = useState(['pulse', 'tap', 'table', 'kds']);
  const [loading, setLoading] = useState(false);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      onError('Select at least one module');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/modules-setup', { modules: selected });
      onNext();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="onboarding-modules-setup">
      <h2 className="text-xl font-bold text-white mb-1">Enable Modules</h2>
      <p className="text-zinc-400 text-sm mb-6">Choose which features you want to use</p>
      <div className="space-y-3 mb-6">
        {MODULES.map((mod) => (
          <label
            key={mod.id}
            data-testid={`module-option-${mod.id}`}
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
              selected.includes(mod.id)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(mod.id)}
              onChange={() => toggle(mod.id)}
              className="accent-blue-500 w-4 h-4"
            />
            <div>
              <div className="font-medium text-white text-sm">{mod.label}</div>
              <div className="text-xs text-zinc-500">{mod.desc}</div>
            </div>
          </label>
        ))}
      </div>
      <button
        data-testid="onboarding-modules-next"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}

function CompleteStep({ onComplete, loading }) {
  return (
    <div data-testid="onboarding-complete" className="text-center">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">All Set!</h2>
      <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
        Your venue is ready. Let's start managing your operations.
      </p>
      <button
        data-testid="onboarding-complete-btn"
        onClick={onComplete}
        disabled={loading}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
      >
        {loading ? 'Finishing...' : 'Go to Dashboard'}
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.onboarding_step) {
      const savedStep = Math.min(user.onboarding_step, 4);
      if (savedStep > step) setStep(savedStep);
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'pending_payment') return <Navigate to="/payment/pending" replace />;
  if (user?.onboarding_completed) {
    if (user?.role === 'CEO') return <Navigate to="/ceo" replace />;
    return <Navigate to="/venue/home" replace />;
  }

  const TOTAL_STEPS = 5;
  const onNext = () => { setError(''); setStep((s) => s + 1); };
  const onError = (msg) => setError(msg);

  const onComplete = async () => {
    setCompleting(true);
    try {
      await apiCall('/complete', {});
      await refreshUser();
      // Route based on role
      if (user?.role === 'CEO') {
        navigate('/ceo', { replace: true });
      } else {
        navigate('/venue/home', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div data-testid="onboarding-page" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {error && (
          <div data-testid="onboarding-error" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 0 && <WelcomeStep onNext={onNext} />}
        {step === 1 && <AccountSetupStep onNext={onNext} onError={onError} />}
        {step === 2 && <PasswordResetStep onNext={onNext} onError={onError} />}
        {step === 3 && <ModulesSetupStep onNext={onNext} onError={onError} />}
        {step === 4 && <CompleteStep onComplete={onComplete} loading={completing} />}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function PaymentPendingPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'active' && !user?.onboarding_completed) return <Navigate to="/onboarding" replace />;
  if (user?.status === 'active' && user?.onboarding_completed) return <Navigate to="/venue/home" replace />;

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const origin_url = window.location.origin;
      const token = localStorage.getItem('spetap_token');
      const res = await fetch(`${API_URL}/api/onboarding/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ origin_url }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to create checkout');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="payment-pending-page" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 data-testid="payment-pending-title" className="text-2xl font-bold text-white mb-3">Payment Required</h1>
        <p className="text-zinc-400 mb-8">
          Your account has been created. Complete your payment to activate access to the platform.
        </p>

        {error && (
          <div data-testid="payment-error" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          data-testid="continue-to-payment-btn"
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Redirecting to payment...' : 'Continue to Payment'}
        </button>

        <p className="text-zinc-600 text-xs mt-6">
          Secure payment processed by Stripe
        </p>
      </div>
    </div>
  );
}

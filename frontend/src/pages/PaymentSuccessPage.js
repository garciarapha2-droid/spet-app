import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('checking');
  const pollingRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId && !pollingRef.current) {
      pollingRef.current = true;
      pollStatus(sessionId, 0);
    }
  }, []);

  const pollStatus = async (sessionId, attempt) => {
    if (attempt >= 10) {
      setStatus('timeout');
      return;
    }

    try {
      const token = localStorage.getItem('spetap_token');
      const res = await fetch(`${API_URL}/api/onboarding/checkout/status/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to check status');

      const data = await res.json();

      if (data.payment_status === 'paid') {
        setStatus('success');
        await refreshUser();
        setTimeout(() => navigate('/onboarding', { replace: true }), 1500);
      } else if (data.status === 'expired') {
        setStatus('expired');
      } else {
        setTimeout(() => pollStatus(sessionId, attempt + 1), 2000);
      }
    } catch {
      if (attempt < 5) {
        setTimeout(() => pollStatus(sessionId, attempt + 1), 2000);
      } else {
        setStatus('error');
      }
    }
  };

  return (
    <div data-testid="payment-success-page" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6" />
            <h1 data-testid="payment-checking" className="text-xl font-bold text-white mb-2">Verifying Payment...</h1>
            <p className="text-zinc-400">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 data-testid="payment-confirmed" className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h1>
            <p className="text-zinc-400">Redirecting to account setup...</p>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Session Expired</h1>
            <Link to="/payment/pending" className="text-blue-400 hover:text-blue-300 underline">Try again</Link>
          </>
        )}

        {(status === 'error' || status === 'timeout') && (
          <>
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Issue</h1>
            <p className="text-zinc-400 mb-4">We couldn't verify your payment status.</p>
            <Link to="/payment/pending" className="text-blue-400 hover:text-blue-300 underline">Try again</Link>
          </>
        )}
      </div>
    </div>
  );
}

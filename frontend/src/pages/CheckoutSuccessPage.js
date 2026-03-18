import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import SpetLogo from '../components/SpetLogo';
import { CheckCircle, XCircle, Loader2, ArrowRight, RotateCcw } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('polling'); // polling | paid | failed | error
  const [paymentData, setPaymentData] = useState(null);

  const pollStatus = useCallback(async (attempts = 0) => {
    if (!sessionId) { setStatus('error'); return; }
    const maxAttempts = 8;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }

    try {
      const res = await fetch(`${API}/api/onboarding/checkout/status/${sessionId}`);
      if (!res.ok) throw new Error('Failed to check status');
      const data = await res.json();
      setPaymentData(data);

      if (data.payment_status === 'paid') {
        setStatus('paid');
        return;
      } else if (data.status === 'expired') {
        setStatus('failed');
        return;
      }

      // Continue polling
      setTimeout(() => pollStatus(attempts + 1), pollInterval);
    } catch {
      setStatus('error');
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) pollStatus();
    else setStatus('error');
  }, [sessionId, pollStatus]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" data-testid="checkout-success-page">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <SpetLogo size="default" />
        </div>

        {status === 'polling' && (
          <div className="space-y-4" data-testid="payment-polling">
            <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Confirming your payment...</h1>
            <p className="text-muted-foreground">This usually takes a few seconds</p>
          </div>
        )}

        {status === 'paid' && (
          <div className="space-y-6" data-testid="payment-success">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">Welcome to SPET. Your account is being set up.</p>
            </div>
            {paymentData && (
              <div className="bg-card border border-border rounded-xl p-4 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">${((paymentData.amount_total || 0) / 100).toFixed(2)} {paymentData.currency?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold text-green-500">Paid</span>
                </div>
              </div>
            )}
            <Button className="w-full h-12 font-semibold text-base" onClick={() => navigate('/login')} data-testid="go-to-app-btn">
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {(status === 'failed' || status === 'error') && (
          <div className="space-y-6" data-testid="payment-failed">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {status === 'failed' ? 'Payment Failed' : 'Something went wrong'}
              </h1>
              <p className="text-muted-foreground">
                {status === 'failed' ? 'Your payment session expired or was cancelled.' : 'We couldn\'t confirm your payment. Please try again.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => navigate('/pricing')} data-testid="try-again-btn">
                <RotateCcw className="h-4 w-4 mr-2" /> Try Again
              </Button>
              <Button className="flex-1 h-11" onClick={() => navigate('/login')} data-testid="go-login-btn">
                Log In
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

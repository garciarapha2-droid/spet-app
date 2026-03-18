import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import SpetLogo from '../components/SpetLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Check, ArrowRight, X, Loader2, ChevronRight, Zap, Shield,
  BarChart3, Users, Smartphone, Clock
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const FEATURES_HIGHLIGHT = [
  { icon: Zap, title: 'Real-time KDS', desc: 'Kitchen display that keeps your team in sync' },
  { icon: Smartphone, title: 'POS Built for Touch', desc: 'Fast item grid designed for real operations' },
  { icon: Users, title: 'Guest Pulse', desc: 'Track who\'s inside, spending, and loyalty' },
  { icon: BarChart3, title: 'Manager Insights', desc: 'Live dashboards with revenue and staff data' },
  { icon: Shield, title: 'Role-Based Access', desc: 'CEO, manager, and staff permission levels' },
  { icon: Clock, title: 'Tip Distribution', desc: 'Automatic, transparent tip splitting' },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const pricingRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState(0); // 0=none, 1=lead, 2=processing
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/onboarding/plans`)
      .then(r => r.json())
      .then(d => setPlans(d.plans || []))
      .catch(() => {});
  }, []);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep(1);
    setError('');
  };

  const handleSubmitLead = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Step 1: Save lead
      const leadRes = await fetch(`${API}/api/onboarding/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan_id: selectedPlan.id }),
      });
      if (!leadRes.ok) throw new Error('Failed to save info');
      const leadData = await leadRes.json();

      // Step 2: Create checkout session
      setStep(2);
      const checkoutRes = await fetch(`${API}/api/onboarding/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          lead_id: leadData.lead_id,
          origin_url: window.location.origin,
        }),
      });
      if (!checkoutRes.ok) throw new Error('Failed to create payment session');
      const checkoutData = await checkoutRes.json();

      // Redirect to Stripe
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setStep(1);
    }
    setLoading(false);
  };

  const closeModal = () => {
    setStep(0);
    setSelectedPlan(null);
    setError('');
    setForm({ name: '', email: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="pricing-page">
      {/* ═══ HERO ═══ */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <SpetLogo size="default" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} data-testid="login-link">
              Log in
            </Button>
          </div>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
          <Zap className="h-3.5 w-3.5" /> Built for real restaurant operations
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          The operating system<br />
          <span className="text-primary">your venue deserves</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Kitchen display, POS, guest pulse, tips, and manager dashboards — all in one platform built for nightlife and hospitality.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="h-13 px-8 text-base font-semibold" onClick={scrollToPricing} data-testid="start-now-btn">
            Start Now <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg" className="h-13 px-8 text-base" onClick={() => navigate('/login')} data-testid="see-demo-btn">
            See Demo
          </Button>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES_HIGHLIGHT.map(f => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all">
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-base mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section ref={pricingRef} className="max-w-6xl mx-auto px-6 pb-32" data-testid="pricing-section">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">No hidden fees. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isPopular = i === 1;
            return (
              <div key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all ${
                  isPopular
                    ? 'border-primary bg-primary/[0.03] shadow-xl shadow-primary/10 scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.interval}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-12 font-semibold ${isPopular ? '' : 'bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                  data-testid={`select-plan-${plan.id}`}
                >
                  Get Started <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ CHECKOUT MODAL ═══ */}
      {step > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget && step === 1) closeModal(); }}
          data-testid="checkout-modal">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold">{step === 1 ? 'Your Information' : 'Processing...'}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedPlan?.name} — ${selectedPlan?.price}/{selectedPlan?.interval}
                </p>
              </div>
              {step === 1 && (
                <Button variant="ghost" size="icon" onClick={closeModal} data-testid="close-modal-btn">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4">
              <div className="flex items-center gap-2 mb-6">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>1</div>
                <div className={`h-0.5 flex-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>2</div>
              </div>
            </div>

            {/* Step 1: Lead capture */}
            {step === 1 && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Rafael Garcia"
                      className="h-12"
                      autoFocus
                      data-testid="checkout-name-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="rafael@restaurant.com"
                      className="h-12"
                      data-testid="checkout-email-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone</label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="h-12"
                      data-testid="checkout-phone-input"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 mt-3" data-testid="checkout-error">{error}</p>
                )}

                <Button
                  className="w-full h-12 mt-6 font-semibold text-base"
                  onClick={handleSubmitLead}
                  disabled={loading}
                  data-testid="checkout-continue-btn"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue to Payment <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-[11px] text-muted-foreground text-center mt-4">
                  You'll be redirected to our secure payment page powered by Stripe.
                  <br />Card, Apple Pay, Google Pay accepted.
                </p>
              </div>
            )}

            {/* Step 2: Processing / Redirect */}
            {step === 2 && (
              <div className="px-6 pb-8 pt-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-base font-semibold mb-1">Setting up your payment...</p>
                <p className="text-sm text-muted-foreground">Redirecting to secure checkout</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <SpetLogo size="small" />
        <p className="text-xs text-muted-foreground mt-3">Built for hospitality. Powered by operations.</p>
      </footer>
    </div>
  );
}

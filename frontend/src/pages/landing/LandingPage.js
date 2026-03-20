import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowRight, Eye, Zap, TrendingUp, DollarSign,
  AlertTriangle, Users, Workflow, Heart, ChefHat, Sparkles, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/* ═══════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════ */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setRevealed(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, revealed];
}

function useTypewriter(text, speed = 38, trigger = false) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    let i = 0;
    setDisplay('');
    setDone(false);
    const id = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, trigger]);
  return [display, done];
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'Modules', href: '#modules' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border" data-testid="navbar">
      <div className="flex items-center justify-between h-[76px] px-6 lg:px-10 max-w-[1200px] mx-auto">
        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/spet-icon-hd.png" alt="" className="w-8 h-8 rounded-lg" />
          <span className="text-[22px] font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            spet<span className="gradient-text">.</span>
          </span>
        </Link>

        {/* Center — Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-[13px] font-medium transition-colors duration-200 hover:text-primary" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2.5 rounded-full transition-all duration-200 hover:bg-muted" style={{ color: 'hsl(var(--text-tertiary))' }} data-testid="theme-toggle">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/login" className="hidden md:inline text-[13px] font-medium px-3 py-2 transition-colors" style={{ color: 'hsl(var(--text-tertiary))' }} data-testid="nav-login">
            Log in
          </Link>
          <Link to="/signup" className="hidden md:inline btn-premium text-[13px] font-semibold px-5 py-2.5 rounded-full bg-primary text-primary-foreground" data-testid="nav-signup">
            Start Now
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-full hover:bg-muted" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-8 pb-6 space-y-4">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium py-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {l.label}
            </a>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} className="block text-sm py-1" style={{ color: 'hsl(var(--text-tertiary))' }}>Log in</Link>
          <Link to="/signup" onClick={() => setOpen(false)} className="block w-full text-center btn-premium text-[13px] font-semibold px-5 py-2.5 rounded-full bg-primary text-primary-foreground">
            Start Now
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════ */

function Hero() {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);
  const [typed, typedDone] = useTypewriter("You just can't see where.", 38, show);

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden" data-testid="hero">
      {/* Background glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[900px] rounded-full opacity-100" style={{ background: 'radial-gradient(ellipse, hsl(258 75% 58% / 0.14), transparent 70%)', filter: 'blur(260px)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[600px] rounded-full" style={{ background: 'radial-gradient(ellipse, hsl(258 75% 58% / 0.06), transparent 70%)', filter: 'blur(180px)' }} />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 text-center">
        {/* Line 1 */}
        <h1
          className="text-foreground font-black tracking-[-0.05em] leading-[1.02] whitespace-nowrap transition-all duration-1000"
          style={{ fontSize: 'clamp(32px, 6vw, 96px)', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(32px)' }}
        >
          You're not losing money.
        </h1>

        {/* Line 2 — typewriter */}
        <h1
          className="font-black tracking-[-0.05em] leading-[1.02] mt-2 whitespace-nowrap transition-all duration-1000"
          style={{ fontSize: 'clamp(32px, 6vw, 96px)', color: 'hsl(var(--foreground) / 0.3)', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(32px)', transitionDelay: '500ms' }}
        >
          {typed}
          {!typedDone && <span className="inline-block w-[3px] h-[0.55em] bg-primary rounded-full ml-1 align-middle animate-pulse" />}
          {typedDone && <span className="inline-block w-[3px] h-[0.55em] bg-primary rounded-full ml-1 align-middle" style={{ animation: 'pulse 1.4s ease-in-out infinite' }} />}
        </h1>

        {/* Subtext */}
        <p
          className="mt-12 md:mt-16 max-w-[580px] mx-auto text-[15px] md:text-base leading-[1.8] transition-all duration-1000"
          style={{ color: 'hsl(var(--text-secondary))', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(24px)', transitionDelay: '1400ms' }}
        >
          Spet gives you <span className="text-foreground font-medium">full visibility</span> of your venue. Guests, tables, staff and revenue{' '}
          <span className="text-foreground font-medium">in real time</span>.{' '}
          <span className="gradient-text font-bold">Spet AI</span> turns your data into decisions, specific to your venue.
        </p>

        {/* Closing line */}
        <h2
          className="mt-10 text-[28px] md:text-[44px] font-extrabold tracking-[-0.035em] text-foreground transition-all duration-1000"
          style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '1800ms' }}
        >
          No guessing. No blind spots.
        </h2>

        {/* CTA buttons */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000"
          style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '2200ms' }}
        >
          <a href="#pricing" className="btn-premium inline-flex items-center gap-2 px-10 py-4 rounded-full bg-primary text-primary-foreground text-[15px] font-bold" data-testid="hero-cta-primary">
            See everything live <ArrowRight size={16} />
          </a>
          <a href="#pricing" className="inline-flex items-center gap-2 px-10 py-4 rounded-full border border-border text-[15px] font-medium text-foreground bg-transparent hover:border-primary/30 transition-colors">
            Explore plans
          </a>
        </div>

        {/* Trust line */}
        <p
          className="mt-8 text-[12px] tracking-[0.04em] transition-all duration-700"
          style={{ color: 'hsl(var(--text-tertiary))', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(12px)', transitionDelay: '2500ms' }}
        >
          No setup headaches · No contracts · Stripe-powered billing
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════ */

function Section({ id, children, glow, className = '' }) {
  const [ref, revealed] = useScrollReveal(0.1);
  return (
    <section id={id} ref={ref} className={`relative py-14 md:py-20 px-6 lg:px-10 ${glow ? 'mt-6' : ''} ${className}`}>
      {glow && <div className="section-glow" />}
      <div className={`max-w-[1100px] mx-auto transition-all duration-1000 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ children, center = true }) {
  return (
    <h2 className={`text-[28px] md:text-[44px] font-extrabold tracking-[-0.035em] leading-[1.08] text-foreground ${center ? 'text-center' : ''}`}>
      {children}
    </h2>
  );
}

function IconBadge({ children }) {
  return (
    <div className="w-[56px] h-[52px] rounded-[14px] flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.03))', border: '1px solid hsl(var(--primary) / 0.06)' }}>
      {children}
    </div>
  );
}

function PremiumCard({ children, className = '', delay = 0 }) {
  const [ref, revealed] = useScrollReveal(0.1);
  return (
    <div ref={ref}
      className={`premium-card p-8 md:p-9 rounded-2xl transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROBLEM
   ═══════════════════════════════════════════════════════ */

function Problem() {
  const pains = [
    'Who your best customers are',
    'Which nights actually make money',
    'Where your team is losing efficiency',
    "What's breaking your flow",
  ];
  return (
    <Section id="problem">
      <div className="max-w-4xl">
        <SectionHeading center={false}>
          Most venues don't have an operations problem.<br />
          <span className="gradient-text">They have a visibility problem.</span>
        </SectionHeading>

        <p className="mt-10 md:mt-14 text-[22px] md:text-[28px] font-bold tracking-[-0.025em]" style={{ color: 'hsl(var(--primary))' }}>
          You don't know:
        </p>

        <div className="mt-6 space-y-4">
          {pains.map((p, i) => (
            <div key={i} className="flex items-center gap-4">
              <ArrowRight size={18} className="text-primary shrink-0" strokeWidth={1} />
              <span className="text-[17px] md:text-[20px] font-medium" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-16 md:mt-22">
        <SectionHeading>
          Guessing is <span style={{ color: '#7C3AED' }}>expensive.</span>
        </SectionHeading>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   SOLUTION CORE
   ═══════════════════════════════════════════════════════ */

function SolutionCore() {
  const cards = [
    { icon: Eye, title: 'See everything', desc: 'Real-time view of guests, tables, orders, and staff — all in one place.' },
    { icon: Zap, title: 'Understand instantly', desc: "Clear data, no noise. Know what's working and what's not at a glance." },
    { icon: TrendingUp, title: 'Improve continuously', desc: 'AI-powered insights that learn from your venue and suggest what to do next.' },
  ];
  return (
    <Section id="solution" glow>
      <SectionHeading>Spet shows you what's really happening.</SectionHeading>
      <p className="text-center mt-4 text-[15px] md:text-base max-w-lg mx-auto" style={{ color: 'hsl(var(--text-secondary))' }}>
        One platform to track, manage, and improve your entire venue — in real time.
      </p>
      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {cards.map((c, i) => (
          <PremiumCard key={i} delay={i * 100} className="text-center">
            <IconBadge><c.icon size={24} strokeWidth={1} className="text-primary" /></IconBadge>
            <h3 className="text-[18px] font-bold text-foreground mt-4 mb-2.5">{c.title}</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>{c.desc}</p>
          </PremiumCard>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════ */

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Set up your venue', desc: 'Choose the modules that match your space.' },
    { n: '02', title: 'Connect your operations', desc: 'Set up team, workflows, and guided onboarding.' },
    { n: '03', title: 'Start tracking live', desc: 'See guests, tables, orders in real time.' },
    { n: '04', title: 'Make better decisions', desc: 'AI insights deliver actionable recommendations.' },
  ];
  return (
    <Section id="how-it-works">
      <SectionHeading>
        From setup to full control — <span className="text-muted-foreground">in minutes</span>
      </SectionHeading>
      <div className="hidden md:grid grid-cols-4 gap-5 mt-10">
        {steps.map((s, i) => (
          <PremiumCard key={i} delay={i * 120} className="!p-7">
            <span className="block text-[48px] font-black mb-4" style={{ background: 'linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {s.n}
            </span>
            <h3 className="text-base font-bold leading-snug text-foreground">{s.title}</h3>
            <p className="text-[13px] mt-2" style={{ color: 'hsl(var(--text-secondary))' }}>{s.desc}</p>
          </PremiumCard>
        ))}
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-3 mt-8">
        {steps.map((s, i) => (
          <PremiumCard key={i} delay={i * 80} className="!p-6 flex gap-4">
            <span className="text-[40px] font-black w-12 shrink-0" style={{ background: 'linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {s.n}
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-foreground">{s.title}</h3>
              <p className="text-[13px] mt-1" style={{ color: 'hsl(var(--text-secondary))' }}>{s.desc}</p>
            </div>
          </PremiumCard>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   AI SECTION
   ═══════════════════════════════════════════════════════ */

function AISection() {
  const [ref, revealed] = useScrollReveal(0.2);
  const [typed, done] = useTypewriter("It's direction.", 45, revealed);
  const cards = [
    { icon: DollarSign, title: 'Know your revenue drivers', desc: 'Spot top spenders, peak hours, and your best-performing nights.' },
    { icon: AlertTriangle, title: 'Catch problems early', desc: 'Know when something is off — before it becomes a real issue.' },
    { icon: TrendingUp, title: 'Grow smarter', desc: 'Receive clear recommendations to increase retention and spending.' },
  ];
  return (
    <Section id="ai" glow>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full -z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse, hsl(258 75% 58% / 0.10), transparent 70%)', filter: 'blur(200px)' }} />
      <div ref={ref}>
        <SectionHeading>
          This isn't just data. <span className="gradient-text">{typed}{!done && <span className="inline-block w-[3px] h-[0.5em] bg-primary rounded-full ml-0.5 align-middle animate-pulse" />}</span>
        </SectionHeading>
      </div>
      <div className="text-center max-w-xl mx-auto mt-4 mb-10">
        <p className="text-base md:text-lg font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Your data is useless without direction.</p>
        <p className="text-base md:text-lg font-semibold text-foreground mt-1">
          <span className="gradient-text font-bold">Spet AI</span> turns it into decisions — specific to your venue.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((c, i) => (
          <PremiumCard key={i} delay={i * 100} className="text-center">
            <IconBadge><c.icon size={24} strokeWidth={1} className="text-primary" /></IconBadge>
            <h3 className="text-[18px] font-bold text-foreground mt-4 mb-2.5">{c.title}</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>{c.desc}</p>
          </PremiumCard>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   BENEFITS
   ═══════════════════════════════════════════════════════ */

function Benefits() {
  const cards = [
    { icon: Users, title: 'Know your customers', desc: 'Build real profiles over time — preferences, frequency, and spending patterns.' },
    { icon: Workflow, title: 'Control your operations', desc: 'From entry to kitchen, every step is tracked and visible in real time.' },
    { icon: DollarSign, title: 'Increase revenue', desc: 'Track sales, tips, and performance across your entire venue instantly.' },
  ];
  return (
    <Section id="benefits">
      <SectionHeading>
        Run your venue with clarity — <span className="text-muted-foreground">not guesswork</span>
      </SectionHeading>
      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {cards.map((c, i) => (
          <PremiumCard key={i} delay={i * 100} className="text-center">
            <IconBadge><c.icon size={24} strokeWidth={1} className="text-primary" /></IconBadge>
            <h3 className="text-[18px] font-bold text-foreground mt-4 mb-2.5">{c.title}</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>{c.desc}</p>
          </PremiumCard>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULES (SOLUTIONS)
   ═══════════════════════════════════════════════════════ */

function Modules() {
  const modules = [
    { icon: Heart, name: 'Spet Core', sub: 'CRM & Guest Intelligence', desc: 'Guest profiles, visit history, loyalty tracking, and engagement tools.' },
    { icon: Zap, name: 'Spet Flow', sub: 'Tap + Table', desc: 'NFC entry, table management, and real-time consumption tracking.' },
    { icon: ChefHat, name: 'Spet Sync', sub: 'Tap + Table + Kitchen', desc: 'Everything in Flow plus kitchen order flow and coordination.' },
    { icon: Sparkles, name: 'Spet OS', sub: 'Everything + AI insights', desc: 'The complete platform with AI-powered analytics and recommendations.' },
  ];
  return (
    <Section id="modules" glow>
      <SectionHeading>Built to match how your venue actually runs</SectionHeading>
      <div className="grid sm:grid-cols-2 gap-5 mt-10">
        {modules.map((m, i) => (
          <PremiumCard key={i} delay={i * 100} className="text-left">
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.03))', border: '1px solid hsl(var(--primary) / 0.06)' }}>
                <m.icon size={24} strokeWidth={1} className="text-primary" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-foreground">{m.name}</h3>
                <p className="text-[12px] mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>{m.sub}</p>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed mt-4" style={{ color: 'hsl(var(--text-secondary))' }}>{m.desc}</p>
          </PremiumCard>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING
   ═══════════════════════════════════════════════════════ */

const PRICING = [
  { id: 'core', name: 'Spet Core', price: 49, tagline: 'The foundation of your guest system', cta: 'Get started', features: ['Guest profiles', 'Visit history', 'Loyalty tracking', 'Engagement tools', 'Email support'] },
  { id: 'flow', name: 'Spet Flow', price: 89, tagline: 'Run your venue in real time', cta: 'Get started', features: ['Everything in Core', 'NFC entry', 'Table management', 'Real-time consumption', 'Priority support'] },
  { id: 'sync', name: 'Spet Sync', price: 149, tagline: 'Full operational control with kitchen coordination', badge: 'Most Popular', highlight: true, cta: 'Get started', features: ['Everything in Flow', 'Kitchen (KDS)', 'Order coordination', 'Bar module', 'Manager dashboard'] },
  { id: 'os', name: 'Spet OS', price: 299, tagline: 'The operating system for high-performing venues', badge: 'For serious operators', cta: 'Upgrade to OS', features: ['All modules included', 'Advanced analytics', 'AI recommendations', 'Unlimited staff', 'Dedicated support', 'API access'] },
];

function Pricing() {
  return (
    <Section id="pricing">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full -z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse, hsl(258 75% 58% / 0.06), transparent 70%)', filter: 'blur(200px)' }} />

      <div className="max-w-[1200px] mx-auto">
        <SectionHeading>Simple pricing. Real impact.</SectionHeading>
        <p className="text-center mt-4 text-[15px] max-w-md mx-auto" style={{ color: 'hsl(var(--text-secondary))' }}>
          Most venues recover the cost in the first week.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
          {['No contracts', 'Cancel anytime', 'Setup in minutes'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: 'hsl(var(--text-tertiary))' }}>
              <Check size={13} className="text-primary" /> {t}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end mt-16">
          {PRICING.map((plan, i) => (
            <PremiumCard
              key={plan.id}
              delay={i * 100}
              className={`relative !p-6 ${plan.highlight ? 'border-primary/25 lg:scale-[1.03] lg:-my-2 z-10' : ''}`}
              style={plan.highlight ? { background: 'hsl(258 75% 58% / 0.04)' } : {}}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-[14px] font-bold text-foreground text-left">{plan.name}</h3>
              <p className="text-[12px] mt-1 text-left" style={{ color: 'hsl(var(--text-tertiary))' }}>{plan.tagline}</p>
              <div className="mt-4 text-left">
                <span className="text-[28px] font-extrabold tracking-tight text-foreground">${plan.price}</span>
                <span className="text-[13px] ml-1" style={{ color: 'hsl(var(--text-tertiary))' }}>/month</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-left">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'hsl(var(--text-secondary))' }}>
                    <Check size={14} className="text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-6 flex items-center justify-center gap-1 w-full py-3 rounded-full text-[13px] font-bold transition-all ${
                  plan.highlight
                    ? 'btn-premium bg-primary text-primary-foreground'
                    : plan.id === 'flow'
                    ? 'btn-premium bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground border border-border hover:bg-primary hover:text-primary-foreground'
                }`}
                data-testid={`pricing-cta-${plan.id}`}
              >
                {plan.cta} <ArrowRight size={14} />
              </Link>
            </PremiumCard>
          ))}
        </div>

        {/* Upgrade path */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {['Core', 'Flow', 'Sync', 'OS'].map((name, i, arr) => (
            <React.Fragment key={name}>
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium border ${
                name === 'OS'
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground'
              }`}>
                {name}
              </span>
              {i < arr.length - 1 && <ArrowRight size={12} style={{ color: 'hsl(var(--text-tertiary))' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[11px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
          Secure billing powered by Stripe. All plans include 14-day onboarding support.
        </p>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════ */

const FAQ_DATA = [
  { q: 'Do guests need to download an app?', a: 'No. Guests use NFC wristbands or cards — no app, no signup required.' },
  { q: 'Can I upgrade my plan later?', a: 'Yes. You can upgrade or change plans anytime from your dashboard. Changes are prorated.' },
  { q: 'Is AI included in all plans?', a: 'AI insights are included in the Spet OS plan. Other plans focus on operations.' },
  { q: 'Is Stripe used for billing?', a: 'Yes. All billing is securely handled through Stripe — cards, invoices, and subscriptions.' },
  { q: 'Can clubs use Spet without the kitchen module?', a: 'Absolutely. Choose Spet Flow for entry and table management without kitchen features.' },
  { q: 'How long does setup take?', a: 'Most venues are live within 48 hours. Our onboarding team guides you through the process.' },
];

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Section id="faq">
      <SectionHeading center={false}>Answers before you decide</SectionHeading>
      <p className="text-[14px] font-medium mt-2" style={{ color: 'hsl(var(--text-secondary))' }}>
        Everything you need to know — before you start.
      </p>
      <div className="grid md:grid-cols-2 gap-3 mt-8">
        {FAQ_DATA.map((faq, i) => (
          <div
            key={i}
            className={`premium-card rounded-2xl cursor-pointer transition-all duration-300 ${openIdx === i ? 'border-primary/15' : ''}`}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div className="flex items-center justify-between px-7 py-6">
              <span className="text-base font-semibold text-foreground pr-4">{faq.q}</span>
              <ChevronDown size={16} className={`text-primary shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`} />
            </div>
            <div className={`grid transition-all duration-300 ${openIdx === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <p className="px-7 pb-6 text-[14px]" style={{ color: 'hsl(var(--text-secondary))' }}>{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════════ */

function FinalCTA() {
  const [ref, revealed] = useScrollReveal(0.3);
  const [typed, done] = useTypewriter("you can't fix it.", 55, revealed);

  return (
    <Section>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full -z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse, hsl(258 75% 58% / 0.10), transparent 70%)', filter: 'blur(180px)' }} />
      <div ref={ref} className="text-center">
        <SectionHeading>
          If you can't see it, <span className="text-muted-foreground">{typed}{!done && <span className="inline-block w-[3px] h-[0.5em] bg-primary rounded-full ml-0.5 align-middle animate-pulse" />}</span>
        </SectionHeading>
        <p className="mt-6 text-[15px] max-w-md mx-auto" style={{ color: 'hsl(var(--text-secondary))' }}>
          Start using Spet and take full control of your venue — from day one.
        </p>
        <div className="mt-8">
          <Link to="/signup" className="btn-premium inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-primary-foreground text-[15px] font-bold" data-testid="final-cta">
            Start running smarter <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   CONTACT FORM
   ═══════════════════════════════════════════════════════ */

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', venue_type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const types = ['Club', 'Bar', 'Restaurant', 'Lounge'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leads/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: form.name, email: form.email, phone: form.phone, product_interest: form.venue_type, source: 'contact' }),
      });
      setSent(true);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <Section id="contact" glow>
      <SectionHeading>
        Get your venue <span className="gradient-text">running smarter</span>
      </SectionHeading>
      <p className="mt-4 text-[15px] max-w-[900px]" style={{ color: 'hsl(var(--text-secondary))' }}>
        Every venue is different. We'll help you choose the setup that fits yours.
      </p>

      {sent ? (
        <div className="mt-8 p-8 premium-card rounded-2xl text-center">
          <h3 className="text-xl font-bold text-foreground">Request received!</h3>
          <p className="mt-2 text-[14px]" style={{ color: 'hsl(var(--text-secondary))' }}>We'll be in touch within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-[900px] mt-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { k: 'name', label: 'Full name', type: 'text', ph: 'Your name' },
              { k: 'phone', label: 'Phone number', type: 'tel', ph: '+1 (555) 000-0000' },
              { k: 'email', label: 'Work email', type: 'email', ph: 'you@venue.com' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[11px] uppercase tracking-wide font-medium mb-1.5" style={{ color: 'hsl(var(--text-tertiary))' }}>{f.label}</label>
                <input
                  type={f.type}
                  required
                  placeholder={f.ph}
                  value={form[f.k]}
                  onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                  className="w-full px-5 py-3.5 h-[50px] rounded-xl border border-border bg-card text-[14px] text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/30 focus:outline-none"
                  style={{ boxShadow: 'none' }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 3px hsl(258 75% 58% / 0.08)'; }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </div>

          {/* Venue type */}
          <div className="pt-1">
            <label className="block text-[11px] uppercase tracking-wide font-medium mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>Venue type</label>
            <div className="flex flex-wrap gap-3">
              {types.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, venue_type: t }))}
                  className={`px-5 py-2.5 rounded-full text-[13px] font-medium border transition-all duration-200 ${
                    form.venue_type === t
                      ? 'bg-primary/15 text-foreground border-primary/40'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/20 hover:text-foreground'
                  }`}
                  style={form.venue_type === t ? { boxShadow: '0 0 12px hsl(258 75% 58% / 0.15)' } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="pt-2">
            <label className="block text-[11px] uppercase tracking-wide font-medium mb-1.5" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>Optional</label>
            <textarea
              placeholder="If you could fix one thing in your venue today, what would it be?"
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full px-5 py-3.5 rounded-xl border border-border bg-card text-[14px] text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/30 focus:outline-none resize-y"
              style={{ minHeight: '100px' }}
              onFocus={e => { e.target.style.boxShadow = '0 0 0 3px hsl(258 75% 58% / 0.08)'; }}
              onBlur={e => { e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="btn-premium inline-flex items-center gap-2 px-12 py-5 rounded-full bg-primary text-primary-foreground text-base font-bold disabled:opacity-50">
              {loading ? 'Setting up…' : <>Take control of your venue <ArrowRight size={16} /></>}
            </button>
          </div>
          <p className="text-[11px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
            We'll reach out within 24 hours to show you how Spet fits your venue.
          </p>
        </form>
      )}
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="border-t py-8 px-6 lg:px-10" style={{ borderColor: 'hsl(var(--foreground) / 0.06)' }}>
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/spet-icon-hd.png" alt="" className="h-6 w-6 rounded-md" />
          <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'hsl(var(--foreground) / 0.6)' }}>
            spet<span className="gradient-text">.</span> &copy; 2026
          </span>
        </div>
        <div className="flex items-center gap-5">
          {['How it works', 'Benefits', 'Pricing', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`} className="text-[13px] transition-colors hover:text-foreground" style={{ color: 'hsl(var(--foreground) / 0.5)' }}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION DIVIDER
   ═══════════════════════════════════════════════════════ */

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="w-[580px] max-w-[60%] h-px" style={{ background: 'hsl(var(--foreground) / 0.10)' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="landing-page">
      <Navbar />
      <Hero />
      <Problem />
      <SectionDivider />
      <SolutionCore />
      <HowItWorks />
      <SectionDivider />
      <AISection />
      <Benefits />
      <SectionDivider />
      <Modules />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <SectionDivider />
      <ContactForm />
      <Footer />
    </div>
  );
}

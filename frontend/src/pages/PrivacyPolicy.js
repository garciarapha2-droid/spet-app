import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const sections = [
  {
    title: '1. Information We Collect',
    content: 'We may collect:',
    items: [
      'Personal information (such as name and email)',
      'Usage data (app interactions, session data)',
      'Device information (device type, OS, identifiers)',
      'NFC interactions (only when you use NFC features)',
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: 'We use your data to:',
    items: [
      'Provide and operate the app',
      'Improve user experience',
      'Enable features such as NFC interactions',
      'Monitor performance and fix issues',
    ],
  },
  {
    title: '3. Data Sharing',
    content: 'We do not sell your personal data. We may share data with:',
    items: [
      'Service providers (hosting, analytics)',
      'Legal authorities if required',
    ],
  },
  { title: '4. Data Security', content: 'We implement industry-standard security measures to protect your data.' },
  { title: '5. Your Rights', content: 'You may request access, correction, or deletion of your data by contacting us.' },
  { title: '6. Third-Party Services', content: 'The app may use third-party services (e.g., analytics, backend infrastructure).' },
  { title: '7. Changes to This Policy', content: 'We may update this policy. Updates will be reflected on this page.' },
  { title: '8. Contact', content: 'If you have questions, contact us at:', email: 'support@spetapp.com' },
];

function PageNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border" data-testid="page-navbar">
      <div className="flex items-center justify-between h-[76px] px-6 lg:px-10 max-w-[1200px] mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src="/spet-icon-hd.png" alt="" className="w-8 h-8 rounded-lg" />
          <span className="text-[22px] font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            spet<span className="gradient-text">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2.5 rounded-full transition-all duration-200 hover:bg-muted" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button onClick={() => navigate(-1)} className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-full transition-colors hover:bg-muted" style={{ color: 'hsl(var(--text-tertiary))' }}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    </nav>
  );
}

function PageFooter() {
  return (
    <footer className="border-t py-8 px-6 lg:px-10" style={{ borderColor: 'hsl(var(--foreground) / 0.06)' }}>
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/spet-icon-hd.png" alt="" className="h-6 w-6 rounded-md" />
          <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'hsl(var(--foreground) / 0.6)' }}>
            spet<span className="gradient-text">.</span> &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-5">
          {['How it works', 'Benefits', 'Pricing', 'Contact'].map(l => (
            <a key={l} href={`/#${l.toLowerCase().replace(/\s/g, '-')}`} className="text-[13px] transition-colors hover:text-foreground" style={{ color: 'hsl(var(--foreground) / 0.5)' }}>
              {l}
            </a>
          ))}
          <Link to="/privacy" className="text-[13px] transition-colors hover:text-foreground" style={{ color: 'hsl(var(--foreground) / 0.5)' }}>
            Privacy Policy
          </Link>
          <Link to="/support" className="text-[13px] transition-colors hover:text-foreground" style={{ color: 'hsl(var(--foreground) / 0.5)' }}>
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="privacy-policy-page">
      <PageNavbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-[720px] mx-auto">
          <h1
            className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-[-0.035em] leading-[1.08] text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            data-testid="privacy-title"
          >
            Privacy Policy
          </h1>
          <p className="mt-4 text-[15px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Last updated: March 24, 2026
          </p>
          <p className="mt-6 text-[15px] leading-[1.75]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            SPET ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
          </p>

          <div className="mt-12 space-y-10">
            {sections.map((s, i) => (
              <section key={i} data-testid={`privacy-section-${i + 1}`}>
                <h2 className="text-[18px] font-semibold tracking-[-0.01em] leading-[1.3] text-foreground">
                  {s.title}
                </h2>
                <p className="mt-3 text-[15px] leading-[1.75]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {s.content}
                </p>
                {s.items && (
                  <ul className="mt-3 pl-5 list-disc space-y-1.5 text-[15px] leading-[1.75]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {s.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )}
                {s.email && (
                  <a
                    href={`mailto:${s.email}`}
                    className="mt-2 inline-block text-primary hover:underline text-[15px]"
                    data-testid="privacy-contact-email"
                  >
                    {s.email}
                  </a>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}

export { PageNavbar, PageFooter };

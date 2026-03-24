import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Moon, Sun, LogOut,
  LayoutDashboard, DollarSign, Users, RefreshCw, Target, Mail,
  BarChart3, TrendingUp, Percent, PieChart, Shield, ClipboardList,
  Layers, FileBarChart
} from 'lucide-react';
import { revenueTargets } from '../../data/ceoData';

const navSections = [
  {
    label: 'DASHBOARDS',
    items: [
      { label: 'Overview', icon: LayoutDashboard, path: '/ceo/overview' },
      { label: 'Revenue', icon: DollarSign, path: '/ceo/revenue' },
      { label: 'Customer', icon: Users, path: '/ceo/customer-lifecycle' },
      { label: 'MRR Ret', icon: RefreshCw, path: '/ceo/mrr-retention' },
      { label: 'CAC', icon: Target, path: '/ceo/cac' },
      { label: 'Lead Break', icon: Mail, path: '/ceo/lead-breakdown' },
      { label: 'Sales KPIs', icon: BarChart3, path: '/ceo/sales-kpis' },
      { label: 'Cash Flow', icon: TrendingUp, path: '/ceo/cash-flow' },
      { label: 'Conv Rate', icon: Percent, path: '/ceo/conversion' },
      { label: 'Executive', icon: PieChart, path: '/ceo/executive' },
      { label: 'Security', icon: Shield, path: '/ceo/security' },
      { label: 'Startup', icon: ClipboardList, path: '/ceo/startup' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Pipeline', icon: Layers, path: '/ceo/pipeline' },
      { label: 'Reports', icon: FileBarChart, path: '/ceo/reports' },
    ],
  },
  {
    label: null,
    items: [
      { label: 'Users', icon: Users, path: '/ceo/users' },
    ],
  },
];

const ProgressBar = ({ current, target, label, percentage }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <span className={`text-[12px] font-semibold rounded-[6px] px-2 py-0.5 ${
        percentage > 0 ? 'text-[#1FAA6B] bg-[#1FAA6B]/10' : 'text-muted-foreground bg-muted'
      }`}>
        {percentage}%
      </span>
    </div>
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }} />
    </div>
    <div className="flex justify-between mt-1">
      <span className="text-[13px] text-muted-foreground">${current.toLocaleString()}</span>
      <span className="text-[13px] text-muted-foreground">${target > 0 ? target.toLocaleString() : '—'}</span>
    </div>
  </div>
);

export default function CeoLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(prev => !prev);
  };

  const dateStr = new Date(2026, 2, 24).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const targets = revenueTargets;
  const monthlyPct = targets.monthly.target > 0 ? Math.round((targets.monthly.current / targets.monthly.target) * 1000) / 10 : 0;
  const weeklyPct = targets.weekly.target > 0 ? Math.round((targets.weekly.current / targets.weekly.target) * 1000) / 10 : 0;
  const annualPct = targets.annual.target > 0 ? Math.round((targets.annual.current / targets.annual.target) * 1000) / 10 : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="ceo-layout">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-6" data-testid="ceo-navbar">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/owner')} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="ceo-back">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <span className="text-[18px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>spet.</span>
          <span className="text-[11px] font-semibold uppercase rounded-md px-2 py-0.5 bg-primary/10 text-primary">CEO</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[14px] text-muted-foreground hidden md:block">{dateStr}</span>
          <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="theme-toggle">
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button onClick={() => navigate('/login')} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="logout-btn">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </nav>

      {/* ─── Sidebar ─── */}
      <aside className="fixed top-16 left-0 w-[200px] h-[calc(100vh-64px)] bg-background border-r border-border overflow-y-auto z-40 flex flex-col" data-testid="ceo-sidebar">
        <div className="p-4 flex-1">
          {/* Revenue Targets */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Revenue Targets</span>
              <button className="text-[13px] font-medium text-primary hover:underline">Edit</button>
            </div>
            <ProgressBar label="Weekly" current={targets.weekly.current} target={targets.weekly.target} percentage={weeklyPct} />
            <ProgressBar label="Monthly" current={targets.monthly.current} target={targets.monthly.target} percentage={monthlyPct} />
            <ProgressBar label="Annual" current={targets.annual.current} target={targets.annual.target} percentage={annualPct} />
          </div>

          <div className="border-t border-border" />

          {/* Nav Sections */}
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-6 mb-2 px-1">{section.label}</p>
              )}
              {!section.label && <div className="border-t border-border mt-4 pt-4" />}
              <nav className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path || (item.path === '/ceo/overview' && location.pathname === '/ceo');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors relative ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      data-testid={`ceo-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground">SPET CEO OS</p>
          <p className="text-[11px] text-muted-foreground">v2.0</p>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="ml-[200px] mt-16 p-8 min-h-[calc(100vh-64px)]" data-testid="ceo-main">
        <Outlet />
      </main>
    </div>
  );
}

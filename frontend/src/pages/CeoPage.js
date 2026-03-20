import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ceoAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, LayoutDashboard, DollarSign, Users, Activity,
  Target, Megaphone, ShoppingCart, LineChart, PieChart,
  BarChart3, Shield, FileBarChart, Kanban, TrendingUp,
  LogOut, Sun, Moon
} from 'lucide-react';

import OverviewDashboard from '../components/ceo/OverviewDashboard';
import RevenueDashboard from '../components/ceo/RevenueDashboard';
import CustomerLifecycleDashboard from '../components/ceo/CustomerLifecycleDashboard';
import MrrRetentionDashboard from '../components/ceo/MrrRetentionDashboard';
import CacDashboard from '../components/ceo/CacDashboard';
import LeadBreakdownDashboard from '../components/ceo/LeadBreakdownDashboard';
import SalesKpisDashboard from '../components/ceo/SalesKpisDashboard';
import CashFlowMrrDashboard from '../components/ceo/CashFlowMrrDashboard';
import ConversionRateDashboard from '../components/ceo/ConversionRateDashboard';
import ExecutiveDashboard from '../components/ceo/ExecutiveDashboard';
import RiskDashboard from '../components/ceo/RiskDashboard';
import StartupKpisDashboard from '../components/ceo/StartupKpisDashboard';
import CrmPipelineDashboard from '../components/ceo/CrmPipelineDashboard';
import CrmReportsDashboard from '../components/ceo/CrmReportsDashboard';

/* ─── Navigation Structure ─── */
const NAV_GROUPS = [
  {
    label: 'Dashboards',
    items: [
      { key: 'overview', label: 'Overview', icon: LayoutDashboard },
      { key: 'revenue', label: 'Revenue', icon: DollarSign },
      { key: 'customer-lifecycle', label: 'Customer Lifecycle', icon: Users },
      { key: 'mrr-retention', label: 'MRR Retention', icon: Activity },
      { key: 'cac', label: 'CAC & Metrics', icon: Target },
      { key: 'leads', label: 'Lead Breakdown', icon: Megaphone },
      { key: 'sales', label: 'Sales KPIs', icon: ShoppingCart },
      { key: 'cashflow-mrr', label: 'Cash Flow & MRR', icon: LineChart },
      { key: 'conversion', label: 'Conversion Rate', icon: PieChart },
      { key: 'executive', label: 'Executive', icon: BarChart3 },
      { key: 'security', label: 'Security', icon: Shield },
      { key: 'startup-kpis', label: 'Startup KPIs', icon: FileBarChart },
    ],
  },
  {
    label: 'CRM',
    items: [
      { key: 'crm', label: 'CRM Pipeline', icon: Kanban },
      { key: 'crm-reports', label: 'CRM Reports', icon: TrendingUp },
    ],
  },
];

const DASHBOARDS = {
  'overview': OverviewDashboard,
  'revenue': RevenueDashboard,
  'customer-lifecycle': CustomerLifecycleDashboard,
  'mrr-retention': MrrRetentionDashboard,
  'cac': CacDashboard,
  'leads': LeadBreakdownDashboard,
  'sales': SalesKpisDashboard,
  'cashflow-mrr': CashFlowMrrDashboard,
  'conversion': ConversionRateDashboard,
  'executive': ExecutiveDashboard,
  'security': RiskDashboard,
  'startup-kpis': StartupKpisDashboard,
  'crm': CrmPipelineDashboard,
  'crm-reports': CrmReportsDashboard,
};

export default function CeoPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [targets, setTargets] = useState(null);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [editingTargets, setEditingTargets] = useState(false);
  const [targetForm, setTargetForm] = useState({ weekly: '', monthly: '', annual: '' });

  const loadTargets = useCallback(() => {
    setTargetsLoading(true);
    ceoAPI.getTargets().then(r => setTargets(r.data.targets)).catch(() => {}).finally(() => setTargetsLoading(false));
  }, []);

  useEffect(() => { loadTargets(); }, [loadTargets]);

  const handleSaveTargets = async () => {
    const fd = new FormData();
    if (targetForm.weekly) { fd.append('weekly_value', targetForm.weekly); fd.append('weekly_type', 'revenue'); }
    if (targetForm.monthly) { fd.append('monthly_value', targetForm.monthly); fd.append('monthly_type', 'revenue'); }
    if (targetForm.annual) { fd.append('annual_value', targetForm.annual); fd.append('annual_type', 'revenue'); }
    try {
      await ceoAPI.updateTargets(fd);
      toast.success('Targets updated');
      setEditingTargets(false);
      loadTargets();
    } catch { toast.error('Failed'); }
  };

  const handleLogout = async () => {
    const { handleFullLogout } = await import('../utils/logout');
    await handleFullLogout(logout);
  };

  const ActiveDashboard = DASHBOARDS[activeSection];

  return (
    <div className="min-h-screen bg-background" data-testid="ceo-dashboard">
      {/* ─── Top Bar ─── */}
      <header className="h-[48px] border-b border-border bg-card px-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/venue/home')} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="ceo-back-btn">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="h-5 w-px bg-border" />
          <Link to="/" className="flex items-center">
            <span className="text-[16px] font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              spet<span className="gradient-text">.</span>
            </span>
          </Link>
          <span className="text-[8px] font-bold bg-secondary px-1.5 py-0.5 rounded tracking-[0.15em]" style={{ color: 'hsl(var(--text-tertiary))' }}>CEO</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: 'hsl(var(--text-tertiary))' }}>{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="theme-toggle">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="logout-btn">
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-48px)]">
        {/* ─── Sidebar ─── */}
        <aside className="w-[200px] border-r border-border bg-card flex flex-col flex-shrink-0">
          {/* Revenue Targets */}
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--text-tertiary))' }}>Revenue Targets</span>
              <button onClick={() => { setEditingTargets(!editingTargets); if (!editingTargets && targets) setTargetForm({ weekly: targets.weekly?.goal || '', monthly: targets.monthly?.goal || '', annual: targets.annual?.goal || '' }); }}
                className="text-[9px] text-primary hover:text-primary/80 font-semibold" data-testid="edit-targets-btn">
                {editingTargets ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingTargets ? (
              <div className="space-y-1.5" data-testid="targets-form">
                {['weekly', 'monthly', 'annual'].map(k => (
                  <div key={k}>
                    <label className="text-[8px] uppercase tracking-wider font-bold" style={{ color: 'hsl(var(--text-tertiary))' }}>{k}</label>
                    <Input type="number" value={targetForm[k]} onChange={e => setTargetForm(p => ({ ...p, [k]: e.target.value }))} className="h-7 text-[11px] mt-0.5" />
                  </div>
                ))}
                <Button size="sm" className="w-full h-7 text-[10px]" onClick={handleSaveTargets} data-testid="save-targets-btn">Save</Button>
              </div>
            ) : targetsLoading ? (
              <div className="space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-11 bg-muted rounded-lg" />)}</div>
            ) : targets ? (
              <div className="space-y-2">
                {[{ k: 'weekly', c: '#3b82f6' }, { k: 'monthly', c: '#10b981' }, { k: 'annual', c: '#8b5cf6' }].map(({ k, c }) => {
                  const d = targets[k]; if (!d) return null;
                  const pct = Math.min(d.pct || 0, 100);
                  return (
                    <div key={k} className="rounded-lg bg-muted p-2.5" data-testid={`target-${k}`}>
                      <div className="flex items-center justify-between text-[8px] mb-1">
                        <span className="font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--text-tertiary))' }}>{k}</span>
                        <span className="font-bold" style={{ color: c }}>{pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: c }} />
                      </div>
                      <div className="flex justify-between text-[8px] mt-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
                        <span>${(d.actual || 0).toLocaleString()}</span>
                        <span>${(d.goal || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 p-2 overflow-y-auto">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] px-3 mb-1.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(s => {
                    const Icon = s.icon;
                    const isActive = activeSection === s.key;
                    return (
                      <button key={s.key} onClick={() => setActiveSection(s.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        data-testid={`nav-${s.key}`}>
                        <Icon className={`h-[14px] w-[14px] ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border/50">
            <p className="text-[8px] text-center tracking-wider" style={{ color: 'hsl(var(--text-tertiary))' }}>SPET CEO OS v2.0</p>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 overflow-y-auto p-5">
          <ActiveDashboard />
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ceoAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  ArrowLeft, LayoutDashboard, DollarSign, TrendingUp, Megaphone,
  ShoppingCart, Users, Layers, ShieldAlert, ChevronDown
} from 'lucide-react';

import OverviewDashboard from '../components/ceo/OverviewDashboard';
import RevenueDashboard from '../components/ceo/RevenueDashboard';
import GrowthDashboard from '../components/ceo/GrowthDashboard';
import MarketingDashboard from '../components/ceo/MarketingDashboard';
import SalesDashboard from '../components/ceo/SalesDashboard';
import CustomersDashboard from '../components/ceo/CustomersDashboard';
import ProductDashboard from '../components/ceo/ProductDashboard';
import RiskDashboard from '../components/ceo/RiskDashboard';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'growth', label: 'Growth', icon: TrendingUp },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
  { key: 'sales', label: 'Sales', icon: ShoppingCart },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'product', label: 'Product', icon: Layers },
  { key: 'risk', label: 'Risk / Security', icon: ShieldAlert },
];

const DASHBOARDS = {
  overview: OverviewDashboard,
  revenue: RevenueDashboard,
  growth: GrowthDashboard,
  marketing: MarketingDashboard,
  sales: SalesDashboard,
  customers: CustomersDashboard,
  product: ProductDashboard,
  risk: RiskDashboard,
};

export default function CeoPage() {
  const navigate = useNavigate();
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

  const ActiveDashboard = DASHBOARDS[activeSection];

  return (
    <div className="min-h-screen bg-[#f7f8fa]" data-testid="ceo-dashboard">
      {/* Top Bar */}
      <header className="h-[48px] border-b border-slate-200/50 bg-white px-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/venue/home')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" data-testid="ceo-back-btn">
            <ArrowLeft className="h-4 w-4 text-slate-400" />
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center">
              <span className="text-[9px] font-black text-white tracking-wider">S</span>
            </div>
            <span className="text-[13px] font-bold text-slate-900 tracking-tight">SPET</span>
            <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-[0.15em]">CEO</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-400 font-medium">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <aside className="w-[200px] border-r border-slate-200/50 bg-white flex flex-col flex-shrink-0">
          {/* Targets */}
          <div className="p-3 border-b border-slate-100/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400">Revenue Targets</span>
              <button onClick={() => { setEditingTargets(!editingTargets); if (!editingTargets && targets) setTargetForm({ weekly: targets.weekly?.goal || '', monthly: targets.monthly?.goal || '', annual: targets.annual?.goal || '' }); }}
                className="text-[9px] text-blue-600 hover:text-blue-700 font-semibold" data-testid="edit-targets-btn">
                {editingTargets ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingTargets ? (
              <div className="space-y-1.5" data-testid="targets-form">
                {['weekly', 'monthly', 'annual'].map(k => (
                  <div key={k}>
                    <label className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">{k}</label>
                    <Input type="number" value={targetForm[k]} onChange={e => setTargetForm(p => ({ ...p, [k]: e.target.value }))} className="h-7 text-[11px] mt-0.5" />
                  </div>
                ))}
                <Button size="sm" className="w-full h-7 text-[10px] bg-slate-900 hover:bg-slate-800" onClick={handleSaveTargets} data-testid="save-targets-btn">Save</Button>
              </div>
            ) : targetsLoading ? (
              <div className="space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-11 bg-slate-50 rounded-lg" />)}</div>
            ) : targets ? (
              <div className="space-y-2">
                {[{ k: 'weekly', c: '#3b82f6' }, { k: 'monthly', c: '#10b981' }, { k: 'annual', c: '#8b5cf6' }].map(({ k, c }) => {
                  const d = targets[k]; if (!d) return null;
                  const pct = Math.min(d.pct || 0, 100);
                  return (
                    <div key={k} className="rounded-lg bg-slate-50/80 p-2.5" data-testid={`target-${k}`}>
                      <div className="flex items-center justify-between text-[8px] mb-1">
                        <span className="font-bold uppercase tracking-[0.12em] text-slate-400">{k}</span>
                        <span className="font-bold" style={{ color: c }}>{pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: c }} />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                        <span>${(d.actual || 0).toLocaleString()}</span>
                        <span>${(d.goal || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const isActive = activeSection === s.key;
              return (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  data-testid={`nav-${s.key}`}>
                  <Icon className={`h-[14px] w-[14px] ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100/80">
            <p className="text-[8px] text-slate-400 text-center tracking-wider">SPET CEO OS v2.0</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <ActiveDashboard />
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ceoAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  ArrowLeft, DollarSign, TrendingUp, Users, Building2, Activity,
  Target, AlertTriangle, ChevronRight, BarChart3, ShieldAlert,
  Zap, ArrowUpRight, ArrowDownRight, X, Check, Layers, UserPlus,
  Pencil, Trash2, ContactRound, Eye, StickyNote, CreditCard,
  UserCheck, Rocket, LayoutGrid, List, ChevronDown, Mail, Phone,
  Calendar, Globe, Shield, AlertCircle, ArrowRight, Grip, Search,
  Filter, MoreVertical, Clock, Hash, Percent, TrendingDown
} from 'lucide-react';

/* ─── Constants ─── */
const TABS = [
  { key: 'crm', label: 'CRM', icon: ContactRound },
  { key: 'health', label: 'Business Health', icon: Activity },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'modules', label: 'Modules', icon: Layers },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'alerts', label: 'Risk & Alerts', icon: AlertTriangle },
  { key: 'pipeline', label: 'Pipeline', icon: TrendingUp },
];

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'paid', 'onboarding', 'active', 'lost'];
const STATUS_CONFIG = {
  new: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8', label: 'New' },
  contacted: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6', label: 'Contacted' },
  qualified: { bg: '#f5f3ff', text: '#7c3aed', dot: '#8b5cf6', label: 'Qualified' },
  paid: { bg: '#ecfdf5', text: '#059669', dot: '#10b981', label: 'Paid' },
  onboarding: { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', label: 'Onboarding' },
  active: { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e', label: 'Active' },
  lost: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', label: 'Lost' },
};

const SOURCE_CONFIG = {
  signup: { bg: '#eef2ff', text: '#4f46e5' },
  contact: { bg: '#f0f9ff', text: '#0284c7' },
  support: { bg: '#fff7ed', text: '#ea580c' },
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const FUNNEL_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#22c55e'];

/* ─── Reusable: Side Panel with animation ─── */
function SidePanel({ open, onClose, title, children, width = 420 }) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/15 z-40 transition-opacity duration-250 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 bg-white border-l border-slate-200 z-50 shadow-xl overflow-y-auto transition-transform duration-250 ease-out ${animate ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width }}
        data-testid="side-panel"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between z-10">
          <h3 className="font-semibold text-[15px] text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors" data-testid="side-panel-close">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}

/* ─── Badge ─── */
function Badge({ children, color, className = '' }) {
  const style = color ? { backgroundColor: color + '18', color } : {};
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${className}`} style={style}>
      {children}
    </span>
  );
}

/* ─── KPI Card (enhanced) ─── */
function KPICard({ label, value, icon: Icon, color = '#3b82f6', trend, trendUp, subtitle, onClick, compact }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''} ${compact ? 'p-3.5' : 'p-4'}`}
      data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '12' }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className={`font-bold tracking-tight text-slate-900 ${compact ? 'text-lg' : 'text-xl'}`}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{label}</p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* ─── Skeleton ─── */
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
      </div>
      <div className="h-48 bg-slate-100 rounded-xl" />
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/* ─── Chart Card wrapper ─── */
function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl p-5 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Custom Tooltip for Recharts ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-semibold">{typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN CEO DASHBOARD
   ════════════════════════════════════════════════════════════════ */
export default function CeoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('crm');
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
    } catch { toast.error('Failed to update targets'); }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]" data-testid="ceo-dashboard">
      {/* Header */}
      <header className="h-[52px] border-b border-slate-200/60 bg-white px-5 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/venue/home')} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors" data-testid="ceo-back-btn">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight">Founder Dashboard</span>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-wider">CEO</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">{new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 border-r border-slate-200/60 bg-white min-h-[calc(100vh-52px)] flex flex-col flex-shrink-0">
          {/* Targets */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Revenue Targets</span>
              <button
                onClick={() => { setEditingTargets(!editingTargets); if (!editingTargets && targets) { setTargetForm({ weekly: targets.weekly?.goal || '', monthly: targets.monthly?.goal || '', annual: targets.annual?.goal || '' }); } }}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                data-testid="edit-targets-btn"
              >
                {editingTargets ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingTargets ? (
              <div className="space-y-2" data-testid="targets-edit-form">
                {['weekly', 'monthly', 'annual'].map(k => (
                  <div key={k}>
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{k}</label>
                    <Input type="number" value={targetForm[k]} onChange={e => setTargetForm(p => ({ ...p, [k]: e.target.value }))} className="h-7 text-xs mt-0.5" />
                  </div>
                ))}
                <Button size="sm" className="w-full h-7 text-[11px] bg-slate-900 hover:bg-slate-800" onClick={handleSaveTargets} data-testid="save-targets-btn">Save</Button>
              </div>
            ) : targetsLoading ? (
              <div className="space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg" />)}</div>
            ) : targets ? (
              <div className="space-y-2">
                {[{ k: 'weekly', c: '#3b82f6' }, { k: 'monthly', c: '#10b981' }, { k: 'annual', c: '#8b5cf6' }].map(({ k, c }) => {
                  const d = targets[k]; if (!d) return null;
                  const pct = Math.min(d.pct || 0, 100);
                  return (
                    <div key={k} className="rounded-lg bg-slate-50 p-2.5" data-testid={`target-${k}`}>
                      <div className="flex items-center justify-between text-[9px] mb-1.5">
                        <span className="font-bold uppercase tracking-wider text-slate-400">{k}</span>
                        <span className="font-bold" style={{ color: c }}>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: c }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>${(d.actual || 0).toLocaleString()}</span>
                        <span>${(d.goal || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  data-testid={`ceo-tab-${t.key}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : ''}`} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-5 overflow-y-auto max-h-[calc(100vh-52px)]">
          {activeTab === 'crm' && <CRMSection />}
          {activeTab === 'health' && <HealthSection />}
          {activeTab === 'revenue' && <RevenueSection />}
          {activeTab === 'companies' && <CompaniesSection />}
          {activeTab === 'modules' && <ModulesSection />}
          {activeTab === 'users' && <UsersSection />}
          {activeTab === 'alerts' && <AlertsSection />}
          {activeTab === 'pipeline' && <PipelineSection />}
        </main>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CRM SECTION
   ════════════════════════════════════════════════════════════════ */
function CRMSection() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');
  const [subTab, setSubTab] = useState('leads');
  const [filterSource, setFilterSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dragItem = useRef(null);
  const dragOverCol = useRef(null);

  const loadLeads = useCallback(() => {
    setLoading(true);
    ceoAPI.getLeads().then(r => setLeads(r.data.leads || [])).catch(() => toast.error('Failed to load leads')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  const updateField = async (leadId, field, value) => {
    setSaving(true);
    const fd = new FormData();
    fd.append(field, value);
    try {
      await ceoAPI.updateLeadStatus(leadId, fd);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, [field]: value }));
      toast.success('Updated');
    } catch { toast.error('Update failed'); }
    setSaving(false);
  };

  const saveNote = async (leadId) => {
    if (!noteText.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('notes', noteText);
    try {
      await ceoAPI.updateLeadStatus(leadId, fd);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: noteText } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, notes: noteText }));
      toast.success('Note saved');
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleDragStart = (lead) => { dragItem.current = lead; };
  const handleDragOver = (e, status) => { e.preventDefault(); dragOverCol.current = status; };
  const handleDrop = (status) => {
    if (dragItem.current && dragItem.current.status !== status) {
      updateField(dragItem.current.id, 'status', status);
    }
    dragItem.current = null;
    dragOverCol.current = null;
  };

  const filtered = useMemo(() => {
    let result = leads;
    if (filterSource !== 'all') result = result.filter(l => l.source === filterSource);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => l.full_name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.company_name || '').toLowerCase().includes(q));
    }
    return result;
  }, [leads, filterSource, searchQuery]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    paid: leads.filter(l => l.status === 'paid' || l.payment_status === 'paid').length,
    active: leads.filter(l => l.status === 'active').length,
    conversion: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'active' || l.status === 'paid').length / leads.length) * 100) : 0,
    lost: leads.filter(l => l.status === 'lost').length,
  }), [leads]);

  if (loading) return <Skeleton />;

  return (
    <div data-testid="ceo-crm-section">
      <SectionHeader title="CRM" subtitle={`${leads.length} leads in pipeline`}>
        {/* Sub-tabs */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 mr-3">
          {['leads', 'reports'].map(t => (
            <button key={t} onClick={() => setSubTab(t)}
              className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-md transition-all ${subTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              data-testid={`crm-subtab-${t}`}>
              {t === 'leads' ? 'Leads' : 'Reports'}
            </button>
          ))}
        </div>
        {subTab === 'leads' && (
          <>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="h-8 w-44 text-[11px] bg-white border border-slate-200 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all"
                data-testid="crm-search"
              />
            </div>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="h-8 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 text-slate-600 focus:outline-none" data-testid="crm-filter-source">
              <option value="all">All Sources</option>
              <option value="signup">Signup</option>
              <option value="contact">Contact</option>
              <option value="support">Support</option>
            </select>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`} data-testid="crm-view-kanban">
                <LayoutGrid className="h-3.5 w-3.5 text-slate-600" />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`} data-testid="crm-view-table">
                <List className="h-3.5 w-3.5 text-slate-600" />
              </button>
            </div>
          </>
        )}
      </SectionHeader>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Leads', value: stats.total, color: '#475569', icon: Users },
          { label: 'New', value: stats.new, color: '#94a3b8', icon: UserPlus },
          { label: 'Paid', value: stats.paid, color: '#059669', icon: CreditCard },
          { label: 'Active', value: stats.active, color: '#16a34a', icon: UserCheck },
          { label: 'Conversion', value: `${stats.conversion}%`, color: '#3b82f6', icon: Percent },
        ].map(s => (
          <KPICard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} compact />
        ))}
      </div>

      {subTab === 'leads' ? (
        viewMode === 'kanban' ? (
          /* ─── Kanban View ─── */
          <div className="flex gap-2.5 overflow-x-auto pb-4" data-testid="crm-kanban">
            {LEAD_STATUSES.map(status => {
              const cfg = STATUS_CONFIG[status];
              const cards = filtered.filter(l => l.status === status);
              const isDragOver = dragOverCol.current === status;
              return (
                <div key={status}
                  className={`flex-shrink-0 w-[220px] min-h-[420px] rounded-xl border transition-all duration-200 ${isDragOver ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200/60 bg-slate-50/50'}`}
                  onDragOver={e => handleDragOver(e, status)}
                  onDrop={() => handleDrop(status)}
                  data-testid={`kanban-col-${status}`}
                >
                  {/* Column Header */}
                  <div className="px-3 py-2.5 border-b border-slate-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <span className="text-[11px] font-bold text-slate-700">{cfg.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100">{cards.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="p-1.5 space-y-1.5">
                    {cards.map(lead => (
                      <div key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        onClick={() => { setSelectedLead(lead); setNoteText(lead.notes || ''); }}
                        className="bg-white border border-slate-200/60 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150 group"
                        data-testid={`kanban-card-${lead.id}`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-[12px] font-semibold text-slate-800 leading-tight truncate max-w-[150px]">{lead.full_name}</p>
                          <Grip className="h-3 w-3 text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5" />
                        </div>
                        {lead.company_name !== 'N/A' && (
                          <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                            <Building2 className="h-2.5 w-2.5" />{lead.company_name}
                          </p>
                        )}
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: SOURCE_CONFIG[lead.source]?.bg, color: SOURCE_CONFIG[lead.source]?.text }}>{lead.source}</span>
                          {lead.product_interest && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{lead.product_interest}</span>}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${lead.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                            {lead.payment_status === 'paid' ? 'Paid' : lead.payment_status}
                          </span>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400">
                            <Clock className="h-2.5 w-2.5" />
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {cards.length === 0 && <p className="text-[10px] text-slate-400 text-center py-8">No leads</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── Table View ─── */
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden" data-testid="crm-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['Name', 'Source', 'Interest', 'Status', 'Payment', 'Company', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} onClick={() => { setSelectedLead(l); setNoteText(l.notes || ''); }}
                    className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                    data-testid={`crm-lead-row-${l.id}`}>
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-slate-800">{l.full_name}</p>
                      <p className="text-[10px] text-slate-400">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: SOURCE_CONFIG[l.source]?.bg, color: SOURCE_CONFIG[l.source]?.text }}>{l.source}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{l.product_interest || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[l.status]?.bg, color: STATUS_CONFIG[l.status]?.text }}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{l.payment_status}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{l.company_name}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">{l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <CRMReports leads={leads} stats={stats} />
      )}

      {/* Lead Detail Side Panel */}
      <SidePanel open={!!selectedLead} onClose={() => setSelectedLead(null)} title="Lead Details">
        {selectedLead && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-bold text-slate-900">{selectedLead.full_name}</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-[12px] text-slate-500"><Mail className="h-3.5 w-3.5 text-slate-400" />{selectedLead.email}</div>
                {selectedLead.phone && <div className="flex items-center gap-2 text-[12px] text-slate-500"><Phone className="h-3.5 w-3.5 text-slate-400" />{selectedLead.phone}</div>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Source', value: selectedLead.source, isBadge: true },
                { label: 'Interest', value: selectedLead.product_interest || '-' },
                { label: 'Company', value: selectedLead.company_name },
                { label: 'Account', value: selectedLead.has_account ? 'Created' : 'None' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">{item.label}</p>
                  {item.isBadge ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: SOURCE_CONFIG[item.value]?.bg, color: SOURCE_CONFIG[item.value]?.text }}>{item.value}</span>
                  ) : (
                    <p className="text-[12px] font-semibold text-slate-700">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STATUSES.map(s => {
                  const isSelected = selectedLead.status === s;
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button key={s} disabled={saving} onClick={() => updateField(selectedLead.id, 'status', s)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all duration-150 ${
                        isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`} data-testid={`crm-status-${s}`}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
              <div className="flex gap-2">
                {['N/A', 'pending', 'paid'].map(ps => (
                  <button key={ps} disabled={saving} onClick={() => updateField(selectedLead.id, 'payment_status', ps)}
                    className={`flex-1 py-2 text-[10px] font-semibold rounded-lg border transition-all duration-150 ${
                      selectedLead.payment_status === ps ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`} data-testid={`crm-payment-${ps}`}>
                    {ps === 'paid' && <CreditCard className="h-3 w-3 inline mr-1" />}{ps.charAt(0).toUpperCase() + ps.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" disabled={saving} className="text-[10px] h-8 border-slate-200" onClick={() => { updateField(selectedLead.id, 'payment_status', 'paid'); updateField(selectedLead.id, 'status', 'paid'); }} data-testid="crm-mark-paid">
                <CreditCard className="h-3 w-3 mr-1" />Paid
              </Button>
              <Button size="sm" variant="outline" disabled={saving} className="text-[10px] h-8 border-slate-200" onClick={() => updateField(selectedLead.id, 'status', 'onboarding')} data-testid="crm-mark-onboarding">
                <Rocket className="h-3 w-3 mr-1" />Onboard
              </Button>
              <Button size="sm" variant="outline" disabled={saving} className="text-[10px] h-8 border-slate-200" onClick={() => updateField(selectedLead.id, 'status', 'active')} data-testid="crm-mark-active">
                <UserCheck className="h-3 w-3 mr-1" />Active
              </Button>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Notes</p>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                className="w-full h-20 text-[12px] bg-slate-50 border border-slate-200 rounded-lg p-3 resize-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all text-slate-700"
                placeholder="Add notes..." data-testid="crm-notes-input" />
              <Button size="sm" className="w-full text-[11px] h-8 mt-2 bg-slate-900 hover:bg-slate-800" disabled={saving} onClick={() => saveNote(selectedLead.id)} data-testid="crm-save-notes">
                <Check className="h-3 w-3 mr-1" />Save Note
              </Button>
            </div>

            <div className="text-[10px] text-slate-400 space-y-0.5 pt-3 border-t border-slate-100">
              <p>ID: <span className="font-mono text-slate-500">{selectedLead.id?.slice(0, 8)}</span></p>
              <p>Created: {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : '-'}</p>
              <p>Email sent: {selectedLead.email_sent ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

/* ─── CRM Reports ─── */
function CRMReports({ leads, stats }) {
  const funnel = useMemo(() => [
    { label: 'Awareness', value: leads.length, color: '#8b5cf6' },
    { label: 'Interest', value: leads.filter(l => ['contacted', 'qualified', 'paid', 'onboarding', 'active'].includes(l.status)).length, color: '#06b6d4' },
    { label: 'Evaluation', value: leads.filter(l => ['qualified', 'paid', 'onboarding', 'active'].includes(l.status)).length, color: '#f59e0b' },
    { label: 'Purchase', value: leads.filter(l => ['paid', 'onboarding', 'active'].includes(l.status)).length, color: '#10b981' },
    { label: 'Active', value: leads.filter(l => l.status === 'active').length, color: '#22c55e' },
  ], [leads]);

  const sourceBreakdown = useMemo(() => ['signup', 'contact', 'support'].map(s => ({
    source: s,
    total: leads.filter(l => l.source === s).length,
    paid: leads.filter(l => l.source === s && (l.status === 'paid' || l.status === 'active')).length,
  })), [leads]);

  const statusDistribution = useMemo(() =>
    LEAD_STATUSES.map(s => ({
      name: STATUS_CONFIG[s].label,
      value: leads.filter(l => l.status === s).length,
      color: STATUS_CONFIG[s].dot,
    })).filter(s => s.value > 0),
  [leads]);

  const monthlyData = useMemo(() => {
    const months = {};
    leads.forEach(l => {
      if (!l.created_at) return;
      const d = new Date(l.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { month: key, total: 0, paid: 0 };
      months[key].total++;
      if (l.status === 'paid' || l.status === 'active') months[key].paid++;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [leads]);

  const maxFunnel = Math.max(...funnel.map(f => f.value), 1);

  return (
    <div className="space-y-4" data-testid="crm-reports">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Total Leads" value={stats.total} icon={Users} color="#475569" />
        <KPICard label="Conversion Rate" value={`${stats.conversion}%`} icon={TrendingUp} color="#3b82f6" />
        <KPICard label="Paid Users" value={stats.paid} icon={CreditCard} color="#059669" />
        <KPICard label="Active Users" value={stats.active} icon={UserCheck} color="#16a34a" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Funnel */}
        <ChartCard title="Sales Funnel" subtitle="Lead progression through stages">
          <div className="space-y-2 mt-2">
            {funnel.map((f, i) => {
              const widthPct = Math.max((f.value / maxFunnel) * 100, 15);
              return (
                <div key={f.label} className="flex items-center gap-3" data-testid={`funnel-${f.label.toLowerCase()}`}>
                  <span className="text-[10px] font-medium w-20 text-right text-slate-500">{f.label}</span>
                  <div className="flex-1">
                    <div
                      className="h-9 rounded-md flex items-center justify-center transition-all duration-500 mx-auto"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: f.color,
                        clipPath: i < funnel.length - 1 ? 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)' : undefined,
                      }}
                    >
                      <span className="text-white text-[11px] font-bold">{f.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Status Distribution Donut */}
        <ChartCard title="Lead Distribution" subtitle="Current status breakdown">
          <div className="flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-1.5 pl-2">
              {statusDistribution.map(s => (
                <div key={s.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-600">{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Conversion */}
        <ChartCard title="Leads Over Time" subtitle="Monthly lead capture and conversion">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[12px] text-slate-400">No data yet</div>
          )}
        </ChartCard>

        {/* Source Performance */}
        <ChartCard title="Source Performance" subtitle="Conversion rate by acquisition channel">
          <div className="space-y-3 mt-1">
            {sourceBreakdown.map(s => {
              const convRate = s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0;
              return (
                <div key={s.source} className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-16 text-center" style={{ backgroundColor: SOURCE_CONFIG[s.source]?.bg, color: SOURCE_CONFIG[s.source]?.text }}>{s.source}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-500">{s.total} leads</span>
                      <span className="font-bold text-slate-800">{convRate}% conv.</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${convRate}%`, backgroundColor: SOURCE_CONFIG[s.source]?.text }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BUSINESS HEALTH
   ════════════════════════════════════════════════════════════════ */
function HealthSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailPanel, setDetailPanel] = useState(null);
  const [kpiBreakdown, setKpiBreakdown] = useState(null);

  useEffect(() => {
    ceoAPI.getHealth().then(r => setData(r.data.kpis)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  const openDetail = async (kpiKey, label) => {
    setDetailPanel(label);
    try {
      const res = await ceoAPI.getKpiBreakdown(kpiKey);
      setKpiBreakdown(res.data);
    } catch { toast.error('Failed to load breakdown'); }
  };

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-slate-400 text-sm">No data available</p>;

  return (
    <div data-testid="ceo-health-section">
      <SectionHeader title="Business Health" subtitle="SaaS metrics overview" />

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPICard label="MRR" value={`$${(data.mrr || 0).toLocaleString()}`} icon={DollarSign} color="#059669"
          trend={`${data.growth_pct > 0 ? '+' : ''}${data.growth_pct}%`} trendUp={data.growth_pct >= 0}
          subtitle="Monthly Recurring Revenue" onClick={() => openDetail('mrr', 'MRR')} />
        <KPICard label="Total Customers" value={data.active_companies || 0} icon={Building2} color="#3b82f6" subtitle="Active companies" />
        <KPICard label="Active Subscriptions" value={data.active_venues || 0} icon={Zap} color="#8b5cf6" subtitle="Venues with activity" />
        <KPICard label="Churn Rate" value={`${data.churn_rate || 0}%`} icon={TrendingDown} color={data.churn_rate > 5 ? '#ef4444' : '#10b981'}
          subtitle={data.churn_rate > 5 ? 'Above target' : 'Healthy range'} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPICard label="Activation Rate" value={`${data.activation_rate || 0}%`} icon={Activity} color={data.activation_rate > 50 ? '#16a34a' : '#f59e0b'} compact />
        <KPICard label="Avg Revenue / Customer" value={`$${(data.avg_rev_company || 0).toLocaleString()}`} icon={TrendingUp} color="#3b82f6" compact
          onClick={() => openDetail('gross_revenue', 'Revenue')} />
        <KPICard label="Revenue Today" value={`$${(data.revenue_today || 0).toLocaleString()}`} icon={BarChart3} color="#059669" compact />
        <KPICard label="Revenue YTD" value={`$${(data.revenue_ytd || 0).toLocaleString()}`} icon={DollarSign} color="#6366f1" compact />
      </div>

      {/* Growth Banner */}
      <ChartCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.growth_pct >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {data.growth_pct >= 0 ? <ArrowUpRight className="h-7 w-7 text-emerald-600" /> : <ArrowDownRight className="h-7 w-7 text-red-500" />}
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Month-over-Month Growth</p>
              <p className={`text-3xl font-bold tracking-tight ${data.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {data.growth_pct > 0 ? '+' : ''}{data.growth_pct}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Previous month</p>
            <p className="text-[13px] font-bold text-slate-500">${(data.gross_revenue || 0).toLocaleString()}</p>
          </div>
        </div>
      </ChartCard>

      <SidePanel open={!!detailPanel} onClose={() => { setDetailPanel(null); setKpiBreakdown(null); }} title={`${detailPanel} Breakdown`}>
        {kpiBreakdown ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total</p>
              <p className="text-2xl font-bold text-emerald-600">${(kpiBreakdown.total || 0).toFixed(2)}</p>
            </div>
            {(kpiBreakdown.venues || []).map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">{v.venue_name}</p>
                  <p className="text-[10px] text-slate-400">{v.sessions_closed} sessions</p>
                </div>
                <p className="text-[14px] font-bold text-emerald-600">${v.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : <div className="animate-pulse h-32 bg-slate-50 rounded-xl" />}
      </SidePanel>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REVENUE & PROFIT
   ════════════════════════════════════════════════════════════════ */
function RevenueSection() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p) => {
    setLoading(true);
    ceoAPI.getRevenue(p || period).then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton />;
  const chart = data?.chart || [];
  const totalRev = chart.reduce((s, c) => s + c.revenue, 0);
  const totalProfit = chart.reduce((s, c) => s + c.profit, 0);
  const totalFees = chart.reduce((s, c) => s + c.fees, 0);

  const chartData = chart.map(c => ({
    ...c,
    label: period === 'year'
      ? new Date(c.period).toLocaleDateString('en', { month: 'short' })
      : new Date(c.period).toLocaleDateString('en', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div data-testid="ceo-revenue-section">
      <SectionHeader title="Revenue & Profit" subtitle="Financial performance overview">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => { setPeriod(p); load(p); }}
              className={`px-4 py-1.5 rounded-md text-[11px] font-semibold transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              data-testid={`period-${p}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </SectionHeader>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPICard label="Gross Revenue" value={`$${totalRev.toLocaleString()}`} icon={DollarSign} color="#059669" />
        <KPICard label="Net Revenue" value={`$${(totalRev - totalFees).toLocaleString()}`} icon={BarChart3} color="#3b82f6" />
        <KPICard label="Net Profit" value={`$${totalProfit.toLocaleString()}`} icon={TrendingUp} color="#16a34a" />
        <KPICard label="Fees & Costs" value={`$${totalFees.toLocaleString()}`} icon={AlertCircle} color="#ef4444" />
      </div>

      {chartData.length > 0 ? (
        <ChartCard title="Revenue Trend" subtitle={`${period === 'week' ? 'Daily' : period === 'month' ? 'Daily' : 'Monthly'} breakdown`}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={2} fill="url(#profGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><div className="w-3 h-1 rounded-full bg-emerald-500" />Revenue</span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><div className="w-3 h-1 rounded-full bg-blue-500" />Profit</span>
          </div>
        </ChartCard>
      ) : (
        <ChartCard>
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-8 w-8 text-slate-200 mb-3" />
            <p className="text-[13px] font-medium text-slate-400">No data for this period</p>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   COMPANIES
   ════════════════════════════════════════════════════════════════ */
function CompaniesSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    ceoAPI.getCompanies().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleModule = async (company, venue, mod) => {
    const currentMods = venue.modules || [];
    const newMods = currentMods.includes(mod) ? currentMods.filter(m => m !== mod) : [...currentMods, mod];
    const fd = new FormData();
    fd.append('venue_id', venue.venue_id);
    fd.append('modules', newMods.join(','));
    try {
      await ceoAPI.updateCompanyModules(company.user_id, fd);
      toast.success('Modules updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const updateStatus = async (company, newStatus) => {
    const fd = new FormData();
    fd.append('status', newStatus);
    try {
      await ceoAPI.updateCompanyStatus(company.user_id, fd);
      toast.success(`Status updated`);
      load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Skeleton />;
  const allModules = ['pulse', 'tap', 'table', 'kds'];
  const modColors = { pulse: '#ec4899', tap: '#3b82f6', table: '#10b981', kds: '#f97316' };

  return (
    <div data-testid="ceo-companies-section">
      <SectionHeader title="Companies" subtitle={`${data?.total || 0} registered companies`} />
      <div className="space-y-2">
        {data?.companies?.map((c, i) => (
          <div key={c.user_id} onClick={() => setSelected(c)}
            className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200"
            data-testid={`company-card-${i}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-[13px] text-slate-800">{c.name}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{c.status}</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-1.5">{c.email} &middot; {c.venue_count} venue(s)</p>
              <div className="flex gap-1">
                {(c.venues?.[0]?.modules || []).map(m => (
                  <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: modColors[m] + '15', color: modColors[m] }}>{m}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="font-bold text-[14px] text-emerald-600">${c.mrr.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400">MRR</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      <SidePanel open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Company'}>
        {selected && (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">MRR</p>
              <p className="text-2xl font-bold text-emerald-600">${selected.mrr.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex gap-2">
                {['active', 'suspended', 'pending'].map(st => (
                  <button key={st} onClick={() => updateStatus(selected, st)}
                    className={`flex-1 py-2 text-[10px] font-semibold rounded-lg border transition-all ${
                      selected.status === st ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`} data-testid={`status-btn-${st}`}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                ))}
              </div>
            </div>
            {selected.venues?.map((v, vi) => (
              <div key={v.venue_id}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{v.name} - Modules</p>
                <div className="flex gap-2 flex-wrap">
                  {allModules.map(mod => {
                    const isActive = (v.modules || []).includes(mod);
                    return (
                      <button key={mod} onClick={() => toggleModule(selected, v, mod)}
                        className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-400'}`}
                        data-testid={`module-toggle-${mod}-${vi}`}>
                        {isActive && <Check className="h-3 w-3 inline mr-1" />}{mod.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">MRR: ${v.mrr.toLocaleString()}</p>
              </div>
            ))}
            <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 space-y-0.5">
              <p>User ID: <span className="font-mono text-slate-500">{selected.user_id?.slice(0, 8)}</span></p>
              <p>Created: {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MODULES
   ════════════════════════════════════════════════════════════════ */
function ModulesSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getModules().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  const modules = data?.modules || [];
  const colors = { pulse: '#ec4899', tap: '#3b82f6', table: '#10b981', kds: '#f97316' };

  const chartData = modules.map(m => ({ name: m.name, value: m.active, color: colors[m.key] || '#6366f1' }));

  return (
    <div data-testid="ceo-modules-section">
      <SectionHeader title="Module Adoption" subtitle="Feature usage across venues" />

      <div className="grid grid-cols-2 gap-4 mb-4">
        {modules.map(m => {
          const c = colors[m.key] || '#6366f1';
          return (
            <div key={m.key} className="bg-white border border-slate-200/80 rounded-xl p-5" data-testid={`module-${m.key}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c + '12' }}>
                    <Layers className="h-5 w-5" style={{ color: c }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[13px] text-slate-800">{m.name}</h3>
                    <p className="text-[10px] text-slate-400">{m.active} of {data?.total_venues || 0} venues</p>
                  </div>
                </div>
                <span className="text-2xl font-bold" style={{ color: c }}>{m.adoption_pct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.adoption_pct}%`, backgroundColor: c }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Module usage chart */}
      <ChartCard title="Adoption Overview" subtitle="Venues using each module">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip />
            <Bar dataKey="value" name="Venues" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   USERS
   ════════════════════════════════════════════════════════════════ */
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'server', venue_id: '', status: 'active' });

  const loadUsers = useCallback(() => {
    ceoAPI.getUsers().then(r => setUsers(r.data.users || [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreate = async () => {
    if (!form.email || !form.password) { toast.error('Email and password required'); return; }
    const fd = new FormData();
    fd.append('email', form.email); fd.append('password', form.password); fd.append('role', form.role);
    if (form.venue_id) fd.append('venue_id', form.venue_id);
    fd.append('permissions', JSON.stringify({ pulse: true, tap: true, table: true, kds: true }));
    try {
      await ceoAPI.createUser(fd);
      toast.success('User created');
      setShowCreate(false);
      setForm({ email: '', password: '', role: 'server', venue_id: '', status: 'active' });
      loadUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    const fd = new FormData();
    if (form.role) fd.append('role', form.role);
    if (form.status) fd.append('status', form.status);
    if (form.venue_id) fd.append('venue_id', form.venue_id);
    if (form.email) fd.append('email', form.email);
    fd.append('permissions', JSON.stringify({ pulse: true, tap: true, table: true, kds: true }));
    try {
      await ceoAPI.updateUser(selectedUser.id, fd);
      toast.success('Updated');
      setSelectedUser(null);
      loadUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try { await ceoAPI.deleteUser(userId); toast.success('Deleted'); loadUsers(); setSelectedUser(null); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const ROLES = ['ceo', 'owner', 'manager', 'host', 'tap', 'bartender', 'server', 'kitchen', 'cashier'];
  const statusColors = { active: '#16a34a', suspended: '#ef4444', pending: '#f59e0b' };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="ceo-users-section">
      <SectionHeader title="Users" subtitle={`${users.length} registered users`}>
        <Button size="sm" className="h-8 text-[11px] bg-slate-900 hover:bg-slate-800" onClick={() => { setShowCreate(true); setSelectedUser(null); setForm({ email: '', password: '', role: 'server', venue_id: localStorage.getItem('active_venue_id') || '', status: 'active' }); }} data-testid="create-user-btn">
          <UserPlus className="h-3.5 w-3.5 mr-1" />New User
        </Button>
      </SectionHeader>

      {showCreate && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 mb-4 space-y-3" data-testid="user-form">
          <h3 className="font-bold text-[13px] text-slate-800">Create User</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Email</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-8 text-[12px] mt-0.5" data-testid="user-email-input" /></div>
            <div><label className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Password</label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="h-8 text-[12px] mt-0.5" data-testid="user-password-input" /></div>
            <div><label className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Role</label><select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full h-8 text-[12px] mt-0.5 bg-white border border-slate-200 rounded-md px-2" data-testid="user-role-select">{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-[11px] bg-slate-900 hover:bg-slate-800" onClick={handleCreate} data-testid="user-save-btn"><Check className="h-3 w-3 mr-1" />Create</Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] border-slate-200" onClick={() => setShowCreate(false)} data-testid="user-cancel-btn">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5" data-testid="users-list">
        {users.map(u => {
          const role = u.roles?.[0]?.role || 'N/A';
          const sc = statusColors[u.status] || '#94a3b8';
          return (
            <div key={u.id} onClick={() => { setSelectedUser(u); setForm({ email: u.email, password: '', role: u.roles?.[0]?.role || 'server', venue_id: u.roles?.[0]?.venue_id || '', status: u.status }); }}
              className={`bg-white border rounded-xl p-3.5 flex items-center cursor-pointer hover:shadow-md transition-all duration-200 ${selectedUser?.id === u.id ? 'border-slate-400 shadow-md' : 'border-slate-200/80 hover:border-slate-300'}`}
              data-testid={`user-row-${u.id}`}>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-500">{(u.email || '?')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[12px] text-slate-800 truncate">{u.name || u.email}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sc + '15', color: sc }}>{u.status}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{role}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[9px] text-slate-400">Last login</p>
                  <p className="text-[10px] font-medium text-slate-500">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Never'}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>

      <SidePanel open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details">
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-500">{(selectedUser.email || '?')[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{selectedUser.name || selectedUser.email}</p>
                <p className="text-[12px] text-slate-400">{selectedUser.email}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Role</p>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full h-9 text-[12px] bg-white border border-slate-200 rounded-lg px-3" data-testid="user-role-select">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex gap-2">
                {['active', 'suspended', 'pending'].map(st => (
                  <button key={st} onClick={() => setForm(p => ({ ...p, status: st }))}
                    className={`flex-1 py-2 text-[10px] font-semibold rounded-lg border transition-all ${
                      form.status === st ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`} data-testid="user-status-select">{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 h-9 text-[11px] bg-slate-900 hover:bg-slate-800" onClick={handleUpdate} data-testid="user-save-btn"><Check className="h-3 w-3 mr-1" />Save Changes</Button>
              <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => handleDelete(selectedUser.id)} data-testid={`delete-user-${selectedUser.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 space-y-0.5">
              <p>ID: <span className="font-mono text-slate-500">{selectedUser.id?.slice(0, 8)}</span></p>
              <p>Last login: {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : 'Never'}</p>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RISK & ALERTS
   ════════════════════════════════════════════════════════════════ */
function AlertsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getAlerts().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  const alerts = data?.alerts || [];

  return (
    <div data-testid="ceo-alerts-section">
      <SectionHeader title="Risk & Alerts" subtitle={`${alerts.length} active alerts`} />
      {alerts.length === 0 ? (
        <ChartCard>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-[14px] font-semibold text-emerald-700">All clear</p>
            <p className="text-[12px] text-slate-400 mt-1">No risk alerts at this time</p>
          </div>
        </ChartCard>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => {
            const isCritical = a.severity === 'critical';
            return (
              <div key={i} className={`bg-white border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200 ${isCritical ? 'border-red-200' : 'border-amber-200'}`}
                data-testid={`alert-${i}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-800">{a.message}</p>
                  <p className="text-[11px] text-slate-400">{a.type?.replace('_', ' ')} - {a.venue_name}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${isCritical ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>{a.severity}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GROWTH PIPELINE
   ════════════════════════════════════════════════════════════════ */
function PipelineSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getPipeline().then(r => setData(r.data.pipeline)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const stages = [
    { key: 'leads', label: 'Leads', color: '#94a3b8' },
    { key: 'paid', label: 'Paid', color: '#3b82f6' },
    { key: 'activated', label: 'Activated', color: '#06b6d4' },
    { key: 'active', label: 'Active', color: '#10b981' },
    { key: 'at_risk', label: 'At Risk', color: '#f59e0b' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];
  const maxVal = Math.max(...stages.map(s => data[s.key] || 0), 1);

  const funnelData = stages.filter(s => s.key !== 'cancelled' && s.key !== 'at_risk');
  const riskData = stages.filter(s => s.key === 'at_risk' || s.key === 'cancelled');

  return (
    <div data-testid="ceo-pipeline-section">
      <SectionHeader title="Growth Pipeline" subtitle="Customer lifecycle stages" />

      {/* Funnel Visualization */}
      <ChartCard title="Pipeline Funnel" className="mb-4">
        <div className="space-y-2">
          {funnelData.map((s, i) => {
            const val = data[s.key] || 0;
            const widthPct = Math.max((val / maxVal) * 100, 10);
            return (
              <div key={s.key} className="flex items-center gap-3" data-testid={`pipeline-${s.key}`}>
                <span className="text-[11px] font-medium w-20 text-right text-slate-500">{s.label}</span>
                <div className="flex-1">
                  <div
                    className="h-10 rounded-md flex items-center justify-center transition-all duration-500 mx-auto"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: s.color,
                      clipPath: i < funnelData.length - 1 ? 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)' : undefined,
                    }}
                  >
                    <span className="text-white text-[12px] font-bold">{val}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard label="Active Customers" value={data.active || 0} icon={UserCheck} color="#16a34a" />
        <KPICard label="At Risk" value={data.at_risk || 0} icon={AlertTriangle} color="#f59e0b" />
        <KPICard label="Unconverted Leads" value={Math.max((data.leads || 0) - (data.paid || 0), 0)} icon={Users} color="#3b82f6" />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ceoAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  ArrowLeft, DollarSign, TrendingUp, Users, Building2, Activity,
  Target, AlertTriangle, ChevronRight, BarChart3, ShieldAlert,
  Zap, ArrowUpRight, ArrowDownRight, X, Check, Layers, UserPlus,
  Pencil, Trash2, ContactRound, Eye, StickyNote, CreditCard,
  UserCheck, Rocket, LayoutGrid, List, ChevronDown, Mail, Phone,
  Calendar, Globe, Shield, AlertCircle, ArrowRight, Grip
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
const STATUS_COLORS = {
  new: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
  contacted: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  qualified: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  paid: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  onboarding: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  active: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
  lost: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-400' },
};
const SOURCE_COLORS = {
  signup: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
  contact: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400' },
  support: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
};

/* ─── Reusable: Right Side Panel ─── */
function SidePanel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-card border-l border-border z-50 shadow-2xl overflow-y-auto transition-transform" data-testid="side-panel">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="side-panel-close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}

/* ─── Reusable: Badge ─── */
function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${className}`}>{children}</span>;
}

/* ─── Reusable: Metric Card ─── */
function MetricCard({ label, value, icon: Icon, accent = 'text-blue-600', trend, trendUp, onClick }) {
  return (
    <div onClick={onClick} className={`bg-card border border-border/60 rounded-2xl p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800' : ''}`} data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

/* ─── Skeleton ─── */
function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-36 bg-muted rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
      </div>
      <div className="h-52 bg-muted rounded-2xl" />
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
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-background" data-testid="ceo-dashboard">
      {/* Header */}
      <header className="h-14 border-b border-border/40 bg-white dark:bg-card px-6 flex items-center justify-between relative z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/venue/home')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors" data-testid="ceo-back-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-sm font-bold tracking-tight">Founder Dashboard</span>
            <span className="text-[10px] text-muted-foreground ml-2 bg-slate-100 dark:bg-muted px-2 py-0.5 rounded-md">CEO</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border/40 bg-white dark:bg-card/50 min-h-[calc(100vh-3.5rem)] flex flex-col flex-shrink-0">
          {/* Targets */}
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Targets</span>
              <button onClick={() => { setEditingTargets(!editingTargets); if (!editingTargets && targets) { setTargetForm({ weekly: targets.weekly?.goal || '', monthly: targets.monthly?.goal || '', annual: targets.annual?.goal || '' }); } }}
                className="text-[10px] text-blue-600 hover:underline" data-testid="edit-targets-btn">
                {editingTargets ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingTargets ? (
              <div className="space-y-2" data-testid="targets-edit-form">
                {['weekly', 'monthly', 'annual'].map(k => (
                  <div key={k}>
                    <label className="text-[10px] text-muted-foreground capitalize">{k}</label>
                    <Input type="number" value={targetForm[k]} onChange={e => setTargetForm(p => ({ ...p, [k]: e.target.value }))} className="h-7 text-xs" />
                  </div>
                ))}
                <Button size="sm" className="w-full h-7 text-xs" onClick={handleSaveTargets} data-testid="save-targets-btn">Save</Button>
              </div>
            ) : targetsLoading ? (
              <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded-lg" />)}</div>
            ) : targets ? (
              <div className="space-y-2">
                {[{k:'weekly',c:'blue'},{k:'monthly',c:'emerald'},{k:'annual',c:'violet'}].map(({k,c}) => {
                  const d = targets[k]; if (!d) return null;
                  return (
                    <div key={k} className="rounded-lg bg-slate-50 dark:bg-muted/30 p-2.5" data-testid={`target-${k}`}>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-semibold uppercase text-muted-foreground">{k}</span>
                        <span className={`font-bold text-${c}-600`}>{d.pct || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-muted rounded-full">
                        <div className={`h-1.5 rounded-full bg-${c}-500 transition-all`} style={{ width: `${Math.min(d.pct || 0, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
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
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    activeTab === t.key
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-slate-500 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/30 hover:text-slate-700 dark:hover:text-foreground'
                  }`}
                  data-testid={`ceo-tab-${t.key}`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
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
   CRM SECTION — Kanban + Table + Reports
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
  const dragItem = useRef(null);

  const loadLeads = useCallback(() => {
    setLoading(true);
    ceoAPI.getLeads().then(r => setLeads(r.data.leads || [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
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
      toast.success(`Updated`);
    } catch { toast.error('Failed'); }
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

  const handleDrop = (status) => {
    if (dragItem.current && dragItem.current.status !== status) {
      updateField(dragItem.current.id, 'status', status);
    }
    dragItem.current = null;
  };

  const filtered = leads.filter(l => filterSource === 'all' || l.source === filterSource);
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    paid: leads.filter(l => l.status === 'paid' || l.payment_status === 'paid').length,
    active: leads.filter(l => l.status === 'active').length,
    conversion: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'active' || l.status === 'paid').length / leads.length) * 100) : 0,
  };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="ceo-crm-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">CRM</h2>
          <p className="text-xs text-muted-foreground">{leads.length} leads total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex bg-slate-100 dark:bg-muted/50 rounded-lg p-0.5 mr-2">
            {['leads', 'reports'].map(t => (
              <button key={t} onClick={() => setSubTab(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${subTab === t ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                data-testid={`crm-subtab-${t}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {subTab === 'leads' && (
            <>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-card border border-border/60 rounded-lg px-2" data-testid="crm-filter-source">
                <option value="all">All Sources</option>
                <option value="signup">Signup</option>
                <option value="contact">Contact</option>
                <option value="support">Support</option>
              </select>
              <div className="flex bg-slate-100 dark:bg-muted/50 rounded-lg p-0.5">
                <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-card shadow-sm' : ''}`} data-testid="crm-view-kanban">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-card shadow-sm' : ''}`} data-testid="crm-view-table">
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total Leads', value: stats.total, accent: 'text-slate-700 dark:text-slate-200' },
          { label: 'New', value: stats.new, accent: 'text-slate-500' },
          { label: 'Paid', value: stats.paid, accent: 'text-emerald-600' },
          { label: 'Active', value: stats.active, accent: 'text-green-600' },
          { label: 'Conversion', value: `${stats.conversion}%`, accent: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-card border border-border/40 rounded-xl p-3.5 text-center">
            <p className={`text-xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {subTab === 'leads' ? (
        viewMode === 'kanban' ? (
          /* ─── Kanban View ─── */
          <div className="flex gap-3 overflow-x-auto pb-4" data-testid="crm-kanban">
            {LEAD_STATUSES.map(status => {
              const cols = STATUS_COLORS[status];
              const cards = filtered.filter(l => l.status === status);
              return (
                <div key={status}
                  className="flex-shrink-0 w-56 min-h-[400px] rounded-xl bg-slate-50/80 dark:bg-muted/20 border border-border/30"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(status)}
                  data-testid={`kanban-col-${status}`}>
                  {/* Column Header */}
                  <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cols.dot}`} />
                      <span className="text-xs font-semibold capitalize">{status}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-white dark:bg-card px-1.5 py-0.5 rounded-md font-medium">{cards.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="p-2 space-y-2">
                    {cards.map(lead => (
                      <div key={lead.id}
                        draggable
                        onDragStart={() => { dragItem.current = lead; }}
                        onClick={() => { setSelectedLead(lead); setNoteText(lead.notes || ''); }}
                        className="bg-white dark:bg-card border border-border/40 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
                        data-testid={`kanban-card-${lead.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-[13px] font-semibold leading-tight truncate max-w-[140px]">{lead.full_name}</p>
                          <Grip className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                        </div>
                        {lead.company_name !== 'N/A' && (
                          <p className="text-[10px] text-muted-foreground mb-1.5 truncate">{lead.company_name}</p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`${SOURCE_COLORS[lead.source]?.bg} ${SOURCE_COLORS[lead.source]?.text}`}>{lead.source}</Badge>
                          {lead.product_interest && <Badge className="bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground">{lead.product_interest}</Badge>}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${lead.payment_status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-muted-foreground'}`}>
                            {lead.payment_status === 'paid' ? 'Paid' : lead.payment_status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                    {cards.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-6">No leads</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── Table View ─── */
          <div className="bg-white dark:bg-card border border-border/40 rounded-xl overflow-hidden" data-testid="crm-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-slate-50 dark:bg-muted/20">
                  {['Name', 'Source', 'Interest', 'Status', 'Payment', 'Company', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} onClick={() => { setSelectedLead(l); setNoteText(l.notes || ''); }}
                    className="border-b border-border/20 hover:bg-slate-50 dark:hover:bg-muted/10 cursor-pointer transition-colors"
                    data-testid={`crm-lead-row-${l.id}`}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium">{l.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{l.email}</p>
                    </td>
                    <td className="px-4 py-3"><Badge className={`${SOURCE_COLORS[l.source]?.bg} ${SOURCE_COLORS[l.source]?.text}`}>{l.source}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.product_interest || '—'}</td>
                    <td className="px-4 py-3"><Badge className={`${STATUS_COLORS[l.status]?.bg} ${STATUS_COLORS[l.status]?.text}`}>{l.status}</Badge></td>
                    <td className="px-4 py-3"><Badge className={l.payment_status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-muted text-muted-foreground'}>{l.payment_status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.company_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ─── Reports Sub-Tab ─── */
        <CRMReports leads={leads} stats={stats} />
      )}

      {/* Lead Detail Side Panel */}
      <SidePanel open={!!selectedLead} onClose={() => setSelectedLead(null)} title="Lead Details">
        {selectedLead && (
          <div className="space-y-5">
            {/* Contact */}
            <div>
              <p className="text-lg font-bold">{selectedLead.full_name}</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{selectedLead.email}</div>
                {selectedLead.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{selectedLead.phone}</div>}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Source', value: selectedLead.source, badge: true, colors: SOURCE_COLORS[selectedLead.source] },
                { label: 'Interest', value: selectedLead.product_interest || '—' },
                { label: 'Company', value: selectedLead.company_name },
                { label: 'Account', value: selectedLead.has_account ? 'Created' : 'None' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                  {item.badge ? <Badge className={`${item.colors?.bg} ${item.colors?.text}`}>{item.value}</Badge> : <p className="text-xs font-medium">{item.value}</p>}
                </div>
              ))}
            </div>

            {/* Status */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STATUSES.map(s => (
                  <button key={s} disabled={saving} onClick={() => updateField(selectedLead.id, 'status', s)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all duration-150 ${
                      selectedLead.status === s ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-border/60 text-muted-foreground hover:border-blue-200'
                    }`} data-testid={`crm-status-${s}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment</p>
              <div className="flex gap-2">
                {['N/A', 'pending', 'paid'].map(ps => (
                  <button key={ps} disabled={saving} onClick={() => updateField(selectedLead.id, 'payment_status', ps)}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-all duration-150 ${
                      selectedLead.payment_status === ps ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-border/60 text-muted-foreground hover:border-blue-200'
                    }`} data-testid={`crm-payment-${ps}`}>
                    {ps === 'paid' && <CreditCard className="h-3 w-3 inline mr-1" />}{ps.charAt(0).toUpperCase() + ps.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" disabled={saving} className="text-[11px] h-8" onClick={() => { updateField(selectedLead.id, 'payment_status', 'paid'); updateField(selectedLead.id, 'status', 'paid'); }} data-testid="crm-mark-paid">
                <CreditCard className="h-3 w-3 mr-1" />Paid
              </Button>
              <Button size="sm" variant="outline" disabled={saving} className="text-[11px] h-8" onClick={() => updateField(selectedLead.id, 'status', 'onboarding')} data-testid="crm-mark-onboarding">
                <Rocket className="h-3 w-3 mr-1" />Onboard
              </Button>
              <Button size="sm" variant="outline" disabled={saving} className="text-[11px] h-8" onClick={() => updateField(selectedLead.id, 'status', 'active')} data-testid="crm-mark-active">
                <UserCheck className="h-3 w-3 mr-1" />Active
              </Button>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Internal Notes</p>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                className="w-full h-20 text-xs bg-slate-50 dark:bg-muted/30 border border-border/40 rounded-lg p-3 resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Add notes..." data-testid="crm-notes-input" />
              <Button size="sm" className="w-full text-xs h-8 mt-2" disabled={saving} onClick={() => saveNote(selectedLead.id)} data-testid="crm-save-notes">
                <Check className="h-3 w-3 mr-1" />Save
              </Button>
            </div>

            {/* Meta */}
            <div className="text-[10px] text-muted-foreground space-y-0.5 pt-3 border-t border-border/30">
              <p>ID: {selectedLead.id}</p>
              <p>Created: {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : '—'}</p>
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
  const funnel = [
    { label: 'Awareness', key: 'total', value: leads.length, color: 'bg-blue-500' },
    { label: 'Interest', key: 'contacted', value: leads.filter(l => ['contacted','qualified','paid','onboarding','active'].includes(l.status)).length, color: 'bg-indigo-500' },
    { label: 'Intent', key: 'qualified', value: leads.filter(l => ['qualified','paid','onboarding','active'].includes(l.status)).length, color: 'bg-violet-500' },
    { label: 'Evaluation', key: 'paid', value: leads.filter(l => ['paid','onboarding','active'].includes(l.status)).length, color: 'bg-emerald-500' },
    { label: 'Purchase', key: 'active', value: leads.filter(l => l.status === 'active').length, color: 'bg-green-500' },
  ];
  const maxFunnel = Math.max(...funnel.map(f => f.value), 1);

  const sourceBreakdown = ['signup', 'contact', 'support'].map(s => ({
    source: s,
    total: leads.filter(l => l.source === s).length,
    paid: leads.filter(l => l.source === s && (l.status === 'paid' || l.status === 'active')).length,
  }));

  return (
    <div className="space-y-6" data-testid="crm-reports">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Leads" value={stats.total} icon={Users} accent="text-slate-600" />
        <MetricCard label="Conversion Rate" value={`${stats.conversion}%`} icon={TrendingUp} accent="text-blue-600" />
        <MetricCard label="Paid Users" value={stats.paid} icon={CreditCard} accent="text-emerald-600" />
        <MetricCard label="Active Users" value={stats.active} icon={UserCheck} accent="text-green-600" />
      </div>

      {/* Funnel */}
      <div className="bg-white dark:bg-card border border-border/40 rounded-2xl p-6">
        <h3 className="text-sm font-bold mb-4">Lead Funnel</h3>
        <div className="space-y-3">
          {funnel.map((f, i) => (
            <div key={f.label} className="flex items-center gap-4" data-testid={`funnel-${f.key}`}>
              <span className="text-xs font-medium w-24 text-right text-muted-foreground">{f.label}</span>
              <div className="flex-1 relative">
                <div className={`h-10 ${f.color} rounded-lg flex items-center justify-end px-4 transition-all duration-500`}
                  style={{ width: `${Math.max((f.value / maxFunnel) * 100, 12)}%`, opacity: 1 - (i * 0.1) }}>
                  <span className="text-white text-sm font-bold">{f.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Performance */}
      <div className="bg-white dark:bg-card border border-border/40 rounded-2xl p-6">
        <h3 className="text-sm font-bold mb-4">Source Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          {sourceBreakdown.map(s => (
            <div key={s.source} className="bg-slate-50 dark:bg-muted/30 rounded-xl p-4 text-center">
              <Badge className={`${SOURCE_COLORS[s.source]?.bg} ${SOURCE_COLORS[s.source]?.text} mb-2`}>{s.source}</Badge>
              <p className="text-2xl font-bold mt-1">{s.total}</p>
              <p className="text-xs text-muted-foreground">leads</p>
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-sm font-bold text-emerald-600">{s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">conversion</p>
              </div>
            </div>
          ))}
        </div>
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
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data</p>;

  return (
    <div data-testid="ceo-health-section">
      <h2 className="text-lg font-bold tracking-tight mb-5">Business Health</h2>

      {/* Primary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <MetricCard label="MRR" value={`$${(data.mrr || 0).toLocaleString()}`} icon={DollarSign} accent="text-emerald-600" trend={`${data.growth_pct > 0 ? '+' : ''}${data.growth_pct}%`} trendUp={data.growth_pct >= 0} onClick={() => openDetail('mrr', 'MRR')} />
        <MetricCard label="Total Customers" value={data.active_companies || 0} icon={Building2} accent="text-blue-600" />
        <MetricCard label="Active Subscriptions" value={data.active_venues || 0} icon={Zap} accent="text-violet-600" />
        <MetricCard label="Churn Rate" value={`${data.churn_rate || 0}%`} icon={AlertTriangle} accent={data.churn_rate > 5 ? 'text-red-500' : 'text-emerald-600'} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <MetricCard label="Activation Rate" value={`${data.activation_rate || 0}%`} icon={Activity} accent={data.activation_rate > 50 ? 'text-green-600' : 'text-amber-500'} />
        <MetricCard label="Avg Revenue / Customer" value={`$${(data.avg_rev_company || 0).toLocaleString()}`} icon={TrendingUp} accent="text-blue-600" onClick={() => openDetail('gross_revenue', 'Revenue')} />
        <MetricCard label="Revenue Today" value={`$${(data.revenue_today || 0).toLocaleString()}`} icon={BarChart3} accent="text-emerald-600" />
        <MetricCard label="Revenue YTD" value={`$${(data.revenue_ytd || 0).toLocaleString()}`} icon={DollarSign} accent="text-blue-600" />
      </div>

      {/* Growth Banner */}
      <div className="bg-white dark:bg-card border border-border/40 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${data.growth_pct >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            {data.growth_pct >= 0 ? <ArrowUpRight className="h-6 w-6 text-emerald-600" /> : <ArrowDownRight className="h-6 w-6 text-red-500" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Month-over-Month Growth</p>
            <p className={`text-3xl font-bold tracking-tight ${data.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {data.growth_pct > 0 ? '+' : ''}{data.growth_pct}%
            </p>
          </div>
        </div>
      </div>

      {/* Detail Side Panel */}
      <SidePanel open={!!detailPanel} onClose={() => { setDetailPanel(null); setKpiBreakdown(null); }} title={`${detailPanel} — Breakdown`}>
        {kpiBreakdown ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-emerald-600">${(kpiBreakdown.total || 0).toFixed(2)}</p>
            </div>
            {(kpiBreakdown.venues || []).map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-slate-50 dark:hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-medium">{v.venue_name}</p>
                  <p className="text-[10px] text-muted-foreground">{v.sessions_closed} sessions</p>
                </div>
                <p className="text-base font-bold text-emerald-600">${v.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : <div className="animate-pulse h-32 bg-muted rounded-xl" />}
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
  const maxRev = Math.max(...chart.map(c => c.revenue), 1);
  const totalRev = chart.reduce((s, c) => s + c.revenue, 0);
  const totalProfit = chart.reduce((s, c) => s + c.profit, 0);
  const totalFees = chart.reduce((s, c) => s + c.fees, 0);

  return (
    <div data-testid="ceo-revenue-section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold tracking-tight">Revenue & Profit</h2>
        <div className="flex bg-slate-100 dark:bg-muted/50 rounded-lg p-0.5">
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => { setPeriod(p); load(p); }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${period === p ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              data-testid={`period-${p}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="Gross Revenue" value={`$${totalRev.toLocaleString()}`} icon={DollarSign} accent="text-emerald-600" />
        <MetricCard label="Net Revenue" value={`$${(totalRev - totalFees).toLocaleString()}`} icon={BarChart3} accent="text-blue-600" />
        <MetricCard label="Net Profit" value={`$${totalProfit.toLocaleString()}`} icon={TrendingUp} accent="text-green-600" />
        <MetricCard label="Fees & Costs" value={`$${totalFees.toLocaleString()}`} icon={AlertCircle} accent="text-red-400" />
      </div>

      {chart.length > 0 ? (
        <div className="bg-white dark:bg-card border border-border/40 rounded-2xl p-6" data-testid="revenue-chart">
          <div className="flex items-end gap-1.5 h-48">
            {chart.map((c, i) => {
              const revH = (c.revenue / maxRev) * 100;
              const profH = (c.profit / maxRev) * 100;
              const label = period === 'year'
                ? new Date(c.period).toLocaleDateString('en', { month: 'short' })
                : new Date(c.period).toLocaleDateString('en', { day: 'numeric', month: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group" data-testid={`chart-bar-${i}`}>
                  <div className="w-full flex gap-0.5 items-end h-40">
                    <div className="flex-1 bg-emerald-400 rounded-t-md transition-all duration-300 group-hover:bg-emerald-500" style={{ height: `${revH}%` }} />
                    <div className="flex-1 bg-blue-400 rounded-t-md transition-all duration-300 group-hover:bg-blue-500" style={{ height: `${profH}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/30">
            <span className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Revenue</span>
            <span className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />Profit</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-card border-2 border-dashed border-border/40 rounded-2xl p-12 text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No data for this period</p>
        </div>
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
      toast.success(`Status → ${newStatus}`);
      load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Skeleton />;
  const allModules = ['pulse', 'tap', 'table', 'kds'];
  const modColors = { pulse: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600', tap: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600', table: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600', kds: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' };

  return (
    <div data-testid="ceo-companies-section">
      <h2 className="text-lg font-bold tracking-tight mb-5">Companies</h2>
      <div className="space-y-2">
        {data?.companies?.map((c, i) => (
          <div key={c.user_id} onClick={() => setSelected(c)}
            className="bg-white dark:bg-card border border-border/40 rounded-xl p-4 flex items-center cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200"
            data-testid={`company-card-${i}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{c.name}</p>
                <Badge className={c.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}>{c.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.email} &middot; {c.venue_count} venue(s)</p>
              <div className="flex gap-1 mt-1.5">
                {(c.venues?.[0]?.modules || []).map(m => <Badge key={m} className={modColors[m] || 'bg-muted text-muted-foreground'}>{m}</Badge>)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-emerald-600">${c.mrr.toLocaleString()}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      <SidePanel open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Company'}>
        {selected && (
          <div className="space-y-5">
            <div className="bg-slate-50 dark:bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">MRR</p>
              <p className="text-2xl font-bold text-emerald-600">${selected.mrr.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <div className="flex gap-2">
                {['active', 'suspended', 'pending'].map(st => (
                  <button key={st} onClick={() => updateStatus(selected, st)}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${selected.status === st ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'border-border/60 text-muted-foreground'}`}
                    data-testid={`status-btn-${st}`}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                ))}
              </div>
            </div>
            {selected.venues?.map((v, vi) => (
              <div key={v.venue_id}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{v.name} — Modules</p>
                <div className="flex gap-2 flex-wrap">
                  {allModules.map(mod => {
                    const isActive = (v.modules || []).includes(mod);
                    return (
                      <button key={mod} onClick={() => toggleModule(selected, v, mod)}
                        className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${isActive ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'border-border/60 text-muted-foreground opacity-50'}`}
                        data-testid={`module-toggle-${mod}-${vi}`}>
                        {isActive && <Check className="h-3 w-3 inline mr-1" />}{mod.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">MRR: ${v.mrr.toLocaleString()}</p>
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground pt-3 border-t border-border/30">
              <p>User ID: {selected.user_id}</p>
              <p>Created: {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</p>
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
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    ceoAPI.getModules().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  const modules = data?.modules || [];
  const colors = { pulse: { bar: 'bg-pink-500', text: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' }, tap: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }, table: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }, kds: { bar: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' } };

  return (
    <div data-testid="ceo-modules-section">
      <h2 className="text-lg font-bold tracking-tight mb-5">Module Adoption</h2>
      <div className="grid grid-cols-2 gap-4">
        {modules.map(m => {
          const c = colors[m.key] || { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' };
          return (
            <div key={m.key} className="bg-white dark:bg-card border border-border/40 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => setExpanded(expanded === m.key ? null : m.key)} data-testid={`module-${m.key}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Layers className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{m.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{m.active} companies</p>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${c.text}`}>{m.adoption_pct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-muted rounded-full">
                <div className={`h-2 rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${m.adoption_pct}%` }} />
              </div>
              {expanded === m.key && (
                <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  <p>Revenue from module: ${m.revenue?.toLocaleString() || '0'}</p>
                  <p>Total venues: {data?.total_venues || 0}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
      toast.success('User created'); setShowCreate(false);
      setForm({ email: '', password: '', role: 'server', venue_id: '', status: 'active' }); loadUsers();
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
      toast.success('Updated'); setSelectedUser(null); loadUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try { await ceoAPI.deleteUser(userId); toast.success('Deleted'); loadUsers(); setSelectedUser(null); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const ROLES = ['ceo', 'owner', 'manager', 'host', 'tap', 'bartender', 'server', 'kitchen', 'cashier'];
  const modColors = { pulse: 'bg-pink-100 text-pink-600', tap: 'bg-blue-100 text-blue-600', table: 'bg-emerald-100 text-emerald-600', kds: 'bg-orange-100 text-orange-600' };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="ceo-users-section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold tracking-tight">Users</h2>
        <Button size="sm" className="h-8 text-xs" onClick={() => { setShowCreate(true); setSelectedUser(null); setForm({ email: '', password: '', role: 'server', venue_id: localStorage.getItem('active_venue_id') || '', status: 'active' }); }} data-testid="create-user-btn">
          <UserPlus className="h-3.5 w-3.5 mr-1" />New User
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white dark:bg-card border border-border/40 rounded-xl p-4 mb-4 space-y-3" data-testid="user-form">
          <h3 className="font-semibold text-sm">Create User</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Email</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-8 text-xs" data-testid="user-email-input" /></div>
            <div><label className="text-[10px] text-muted-foreground">Password</label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="h-8 text-xs" data-testid="user-password-input" /></div>
            <div><label className="text-[10px] text-muted-foreground">Role</label><select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full h-8 text-xs bg-white dark:bg-background border border-border rounded-md px-2" data-testid="user-role-select">{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleCreate} data-testid="user-save-btn"><Check className="h-3 w-3 mr-1" />Create</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCreate(false)} data-testid="user-cancel-btn">Cancel</Button>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="space-y-2" data-testid="users-list">
        {users.map(u => (
          <div key={u.id} onClick={() => { setSelectedUser(u); setForm({ email: u.email, password: '', role: u.roles?.[0]?.role || 'server', venue_id: u.roles?.[0]?.venue_id || '', status: u.status }); }}
            className={`bg-white dark:bg-card border border-border/40 rounded-xl p-4 flex items-center cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 ${selectedUser?.id === u.id ? 'border-blue-300 shadow-md' : ''}`}
            data-testid={`user-row-${u.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{u.name || u.email}</span>
                <Badge className={u.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : u.status === 'suspended' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}>{u.status}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">{u.email}</p>
              <div className="flex gap-1 flex-wrap">
                {(u.roles || []).map((r, i) => <Badge key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600">{r.role}</Badge>)}
                {u.warning && <Badge className="bg-red-50 dark:bg-red-900/20 text-red-500"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Issue</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-muted-foreground">
                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* User Detail Side Panel */}
      <SidePanel open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details">
        {selectedUser && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-bold">{selectedUser.name || selectedUser.email}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Role</p>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full h-9 text-sm bg-white dark:bg-background border border-border/40 rounded-lg px-3" data-testid="user-role-select">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <div className="flex gap-2">
                {['active', 'suspended', 'pending'].map(st => (
                  <button key={st} onClick={() => setForm(p => ({ ...p, status: st }))}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${form.status === st ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'border-border/60 text-muted-foreground'}`}
                    data-testid={`user-status-select`}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 h-9 text-xs" onClick={handleUpdate} data-testid="user-save-btn"><Check className="h-3 w-3 mr-1" />Save Changes</Button>
              <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => handleDelete(selectedUser.id)} data-testid={`delete-user-${selectedUser.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="text-[10px] text-muted-foreground pt-3 border-t border-border/30 space-y-0.5">
              <p>ID: {selectedUser.id}</p>
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
      <h2 className="text-lg font-bold tracking-tight mb-5">Risk & Alerts</h2>
      {alerts.length === 0 ? (
        <div className="bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All clear</p>
          <p className="text-xs text-muted-foreground mt-1">No risk alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`bg-white dark:bg-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-200 ${
              a.severity === 'critical' ? 'border-red-200 dark:border-red-800' : 'border-amber-200 dark:border-amber-800'
            }`} data-testid={`alert-${i}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                a.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${a.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.message}</p>
                <p className="text-xs text-muted-foreground">{a.type?.replace('_', ' ')} — {a.venue_name}</p>
              </div>
              <Badge className={a.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}>{a.severity}</Badge>
            </div>
          ))}
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
    { key: 'leads', label: 'Leads', color: 'bg-slate-400' },
    { key: 'paid', label: 'Paid', color: 'bg-blue-500' },
    { key: 'activated', label: 'Activated', color: 'bg-emerald-500' },
    { key: 'active', label: 'Active', color: 'bg-green-500' },
    { key: 'at_risk', label: 'At Risk', color: 'bg-amber-500' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
  ];
  const maxVal = Math.max(...stages.map(s => data[s.key] || 0), 1);

  return (
    <div data-testid="ceo-pipeline-section">
      <h2 className="text-lg font-bold tracking-tight mb-5">Growth Pipeline</h2>

      <div className="bg-white dark:bg-card border border-border/40 rounded-2xl p-6 mb-5" data-testid="pipeline-funnel">
        <div className="space-y-3">
          {stages.map((s, i) => {
            const val = data[s.key] || 0;
            const width = Math.max((val / maxVal) * 100, 8);
            return (
              <div key={s.key} className="flex items-center gap-4 group cursor-pointer" data-testid={`pipeline-${s.key}`}>
                <span className="text-xs font-medium w-24 text-right text-muted-foreground">{s.label}</span>
                <div className="flex-1 relative">
                  <div className={`h-9 ${s.color} rounded-lg flex items-center justify-end px-4 transition-all duration-500 group-hover:opacity-90`}
                    style={{ width: `${width}%` }}>
                    <span className="text-white text-sm font-bold">{val}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Active Customers" value={data.active || 0} icon={UserCheck} accent="text-green-600" />
        <MetricCard label="At Risk" value={data.at_risk || 0} icon={AlertTriangle} accent="text-amber-500" />
        <MetricCard label="Unconverted Leads" value={(data.leads || 0) - (data.paid || 0)} icon={Users} accent="text-blue-600" />
      </div>
    </div>
  );
}

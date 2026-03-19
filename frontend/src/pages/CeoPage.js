import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ceoAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  ArrowLeft, DollarSign, TrendingUp, Users, Building2, Activity,
  Target, AlertTriangle, ChevronRight, BarChart3, ShieldAlert,
  Zap, ArrowUpRight, ArrowDownRight, X, Check, Layers, UserPlus, Pencil, Trash2, Power,
  ContactRound, Eye, StickyNote, CreditCard, UserCheck, Rocket
} from 'lucide-react';

const TABS = [
  { key: 'crm', label: 'CRM / Leads', icon: ContactRound },
  { key: 'health', label: 'Company Health', icon: Activity },
  { key: 'revenue', label: 'Revenue & Profit', icon: DollarSign },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'modules', label: 'Module Adoption', icon: Layers },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'alerts', label: 'Risk & Alerts', icon: AlertTriangle },
  { key: 'pipeline', label: 'Growth Pipeline', icon: TrendingUp },
];

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
    <div className="min-h-screen bg-background" data-testid="ceo-dashboard">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="ceo-back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold tracking-tight">CEO DASHBOARD</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Founder View</span>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar: Targets Panel */}
        <aside className="w-72 border-r border-border bg-card/50 min-h-[calc(100vh-3.5rem)] p-4 flex-shrink-0" data-testid="targets-panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Targets
            </h2>
            <button onClick={() => { setEditingTargets(!editingTargets); if (!editingTargets && targets) { setTargetForm({ weekly: targets.weekly?.goal || '', monthly: targets.monthly?.goal || '', annual: targets.annual?.goal || '' }); } }}
              className="text-xs text-primary hover:underline" data-testid="edit-targets-btn">
              {editingTargets ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingTargets ? (
            <div className="space-y-3" data-testid="targets-edit-form">
              <div>
                <label className="text-xs text-muted-foreground">Weekly Goal ($)</label>
                <Input type="number" value={targetForm.weekly} onChange={e => setTargetForm(p => ({ ...p, weekly: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Monthly Goal ($)</label>
                <Input type="number" value={targetForm.monthly} onChange={e => setTargetForm(p => ({ ...p, monthly: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Annual Goal ($)</label>
                <Input type="number" value={targetForm.annual} onChange={e => setTargetForm(p => ({ ...p, annual: e.target.value }))} className="h-8 text-sm" />
              </div>
              <Button size="sm" className="w-full" onClick={handleSaveTargets} data-testid="save-targets-btn">
                <Check className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          ) : targetsLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-muted rounded-xl" />
              <div className="h-24 bg-muted rounded-xl" />
              <div className="h-24 bg-muted rounded-xl" />
            </div>
          ) : targets ? (
            <div className="space-y-3">
              <TargetCard label="Weekly" data={targets.weekly} color="blue" />
              <TargetCard label="Monthly" data={targets.monthly} color="emerald" />
              <TargetCard label="Annual" data={targets.annual} color="purple" />
            </div>
          ) : null}

          {/* Nav Tabs */}
          <div className="mt-6 space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                  data-testid={`ceo-tab-${t.key}`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
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

/* ─── Target Card ─── */
function TargetCard({ label, data, color }) {
  if (!data) return null;
  const pct = data.pct || 0;
  const colorMap = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500' };
  const textMap = { blue: 'text-blue-500', emerald: 'text-emerald-500', purple: 'text-purple-500' };
  const bgMap = { blue: 'bg-blue-500/10', emerald: 'bg-emerald-500/10', purple: 'bg-purple-500/10' };

  return (
    <div className={`rounded-xl border border-border p-3 ${bgMap[color]}`} data-testid={`target-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${textMap[color]}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full mb-2">
        <div className={`h-2 rounded-full transition-all ${colorMap[color]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div>
          <span className="text-muted-foreground">Actual: </span>
          <span className="font-bold">${(data.actual || 0).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Goal: </span>
          <span className="font-bold">${(data.goal || 0).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Left: </span>
          <span className="font-bold">${(data.remaining || 0).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Pace: </span>
          <span className={`font-bold ${textMap[color]}`}>${(data.pace_needed || 0).toLocaleString()}/day</span>
        </div>
      </div>
    </div>
  );
}

/* ─── CRM: Leads Management ─── */
function CRMSection() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const loadLeads = useCallback(() => {
    setLoading(true);
    ceoAPI.getLeads()
      .then(r => setLeads(r.data.leads || []))
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const updateStatus = async (leadId, status) => {
    setSaving(true);
    const fd = new FormData();
    fd.append('status', status);
    try {
      await ceoAPI.updateLeadStatus(leadId, fd);
      toast.success(`Status → ${status}`);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, status }));
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const updatePaymentStatus = async (leadId, paymentStatus) => {
    setSaving(true);
    const fd = new FormData();
    fd.append('payment_status', paymentStatus);
    try {
      await ceoAPI.updateLeadStatus(leadId, fd);
      toast.success(`Payment → ${paymentStatus}`);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, payment_status: paymentStatus } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, payment_status: paymentStatus }));
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
      toast.success('Note saved');
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: noteText } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, notes: noteText }));
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const STATUSES = ['new', 'contacted', 'qualified', 'paid', 'onboarding', 'active', 'lost'];
  const statusColors = {
    new: 'bg-gray-500/10 text-gray-500', contacted: 'bg-blue-500/10 text-blue-500',
    qualified: 'bg-purple-500/10 text-purple-500', paid: 'bg-emerald-500/10 text-emerald-500',
    onboarding: 'bg-amber-500/10 text-amber-500', active: 'bg-green-500/10 text-green-600',
    lost: 'bg-red-500/10 text-red-500',
  };
  const sourceColors = {
    signup: 'bg-indigo-500/10 text-indigo-500', contact: 'bg-sky-500/10 text-sky-500',
    support: 'bg-orange-500/10 text-orange-500',
  };

  const filtered = leads.filter(l =>
    (filterSource === 'all' || l.source === filterSource) &&
    (filterStatus === 'all' || l.status === filterStatus)
  );

  if (loading) return <Skeleton />;

  return (
    <div className="flex gap-6" data-testid="ceo-crm-section">
      {/* Leads Table */}
      <div className={`${selectedLead ? 'flex-1 min-w-0' : 'w-full'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">CRM / Leads</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} of {leads.length} leads</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="h-8 text-xs bg-background border border-border rounded-md px-2" data-testid="crm-filter-source">
              <option value="all">All Sources</option>
              <option value="signup">Signup</option>
              <option value="contact">Contact</option>
              <option value="support">Support</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-8 text-xs bg-background border border-border rounded-md px-2" data-testid="crm-filter-status">
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total', value: leads.length, color: 'text-foreground' },
            { label: 'New', value: leads.filter(l => l.status === 'new').length, color: 'text-gray-500' },
            { label: 'Paid', value: leads.filter(l => l.status === 'paid' || l.payment_status === 'paid').length, color: 'text-emerald-500' },
            { label: 'Active', value: leads.filter(l => l.status === 'active').length, color: 'text-green-500' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm" data-testid="crm-leads-table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Source</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Interest</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Payment</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No leads found</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer ${selectedLead?.id === l.id ? 'bg-primary/5' : ''}`}
                  onClick={() => { setSelectedLead(l); setNoteText(l.notes || ''); }}
                  data-testid={`crm-lead-row-${l.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm truncate max-w-[160px]">{l.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{l.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sourceColors[l.source] || 'bg-muted text-muted-foreground'}`}>
                      {l.source}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{l.product_interest || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[l.status] || 'bg-muted'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      {l.payment_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedLead(l); setNoteText(l.notes || ''); }}
                      data-testid={`crm-view-${l.id}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <div className="w-96 flex-shrink-0 bg-card border border-border rounded-xl p-5 h-fit sticky top-0" data-testid="crm-lead-detail">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">Lead Details</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedLead(null)}
              data-testid="crm-close-detail"><X className="h-4 w-4" /></Button>
          </div>

          <div className="space-y-4">
            {/* Contact Info */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Contact</p>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-medium">{selectedLead.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedLead.email}</p>
                <p className="text-xs text-muted-foreground">{selectedLead.phone || 'No phone'}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-0.5">Source</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sourceColors[selectedLead.source] || ''}`}>{selectedLead.source}</span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-0.5">Interest</p>
                  <p className="font-medium">{selectedLead.product_interest || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-0.5">Company</p>
                  <p className="font-medium">{selectedLead.company_name}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-0.5">Account</p>
                  <p className="font-medium">{selectedLead.has_account ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Lead Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} disabled={saving} onClick={() => updateStatus(selectedLead.id, s)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-all ${
                      selectedLead.status === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`} data-testid={`crm-status-${s}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Payment</p>
              <div className="flex gap-2">
                {['N/A', 'pending', 'paid'].map(ps => (
                  <button key={ps} disabled={saving} onClick={() => updatePaymentStatus(selectedLead.id, ps)}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md border transition-all ${
                      selectedLead.payment_status === ps
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`} data-testid={`crm-payment-${ps}`}>
                    {ps === 'paid' && <CreditCard className="h-3 w-3 inline mr-1" />}
                    {ps.charAt(0).toUpperCase() + ps.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Lifecycle Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" disabled={saving} className="text-xs h-8"
                  onClick={() => { updatePaymentStatus(selectedLead.id, 'paid'); updateStatus(selectedLead.id, 'paid'); }}
                  data-testid="crm-mark-paid">
                  <CreditCard className="h-3 w-3 mr-1" /> Mark Paid
                </Button>
                <Button size="sm" variant="outline" disabled={saving} className="text-xs h-8"
                  onClick={() => updateStatus(selectedLead.id, 'onboarding')}
                  data-testid="crm-mark-onboarding">
                  <Rocket className="h-3 w-3 mr-1" /> Onboarding
                </Button>
                <Button size="sm" variant="outline" disabled={saving} className="text-xs h-8 col-span-2"
                  onClick={() => updateStatus(selectedLead.id, 'active')}
                  data-testid="crm-mark-active">
                  <UserCheck className="h-3 w-3 mr-1" /> Mark Active
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <StickyNote className="h-3 w-3" /> Internal Notes
              </p>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                className="w-full h-20 text-xs bg-background border border-border rounded-lg p-2.5 resize-none focus:ring-1 focus:ring-primary"
                placeholder="Add internal notes..." data-testid="crm-notes-input" />
              <Button size="sm" className="w-full text-xs h-8" disabled={saving}
                onClick={() => saveNote(selectedLead.id)} data-testid="crm-save-notes">
                <Check className="h-3 w-3 mr-1" /> Save Note
              </Button>
            </div>

            {/* Metadata */}
            <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground space-y-0.5">
              <p>Lead ID: {selectedLead.id}</p>
              <p>Created: {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : '—'}</p>
              <p>Email notified: {selectedLead.email_sent ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 1. Company Health ─── */
function HealthSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kpiModal, setKpiModal] = useState(null);
  const [kpiBreakdown, setKpiBreakdown] = useState(null);
  const [kpiBreakdownLoading, setKpiBreakdownLoading] = useState(false);

  useEffect(() => {
    ceoAPI.getHealth().then(r => setData(r.data.kpis)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  const openKpiBreakdown = async (kpiKey, kpiLabel) => {
    setKpiModal(kpiLabel);
    setKpiBreakdownLoading(true);
    try {
      const res = await ceoAPI.getKpiBreakdown(kpiKey);
      setKpiBreakdown(res.data);
    } catch { toast.error('Failed to load breakdown'); }
    setKpiBreakdownLoading(false);
  };

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data</p>;

  const clickableKpis = { 'MRR': 'mrr', 'Gross Revenue': 'gross_revenue', 'Net Profit': 'net_profit' };

  const kpis = [
    { label: 'MRR', value: `$${(data.mrr || 0).toLocaleString()}`, icon: DollarSign, accent: 'text-green-500', status: data.mrr > 0 ? 'green' : 'red' },
    { label: 'Gross Revenue', value: `$${(data.gross_revenue || 0).toLocaleString()}`, icon: BarChart3, accent: 'text-emerald-500', status: 'green' },
    { label: 'Net Profit', value: `$${(data.net_profit || 0).toLocaleString()}`, icon: DollarSign, accent: 'text-blue-500', status: data.net_profit > 0 ? 'green' : 'yellow' },
    { label: 'Active Companies', value: data.active_companies, icon: Building2, accent: 'text-purple-500', status: 'green' },
    { label: 'Active Venues', value: data.active_venues, icon: Building2, accent: 'text-indigo-500', status: 'green' },
    { label: 'Churn Rate', value: `${data.churn_rate}%`, icon: AlertTriangle, accent: data.churn_rate > 5 ? 'text-red-500' : 'text-green-500', status: data.churn_rate > 5 ? 'red' : data.churn_rate > 2 ? 'yellow' : 'green' },
    { label: 'Activation Rate', value: `${data.activation_rate}%`, icon: Zap, accent: data.activation_rate > 50 ? 'text-green-500' : 'text-yellow-500', status: data.activation_rate > 50 ? 'green' : 'yellow' },
    { label: 'Avg Rev/Company', value: `$${(data.avg_rev_company || 0).toLocaleString()}`, icon: TrendingUp, accent: 'text-teal-500', status: 'green' },
  ];

  return (
    <div data-testid="ceo-health-section">
      <h2 className="text-xl font-bold mb-5">Company Health</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const statusColor = k.status === 'green' ? 'border-green-500/30' : k.status === 'yellow' ? 'border-yellow-500/30' : 'border-red-500/30';
          const dotColor = k.status === 'green' ? 'bg-green-500' : k.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
          const isClickable = !!clickableKpis[k.label];
          return (
            <div key={i} className={`bg-card border-2 ${statusColor} rounded-xl p-4 hover:shadow-md transition-all ${isClickable ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/30' : 'cursor-default'}`}
              data-testid={`ceo-kpi-${k.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
              onClick={() => isClickable && openKpiBreakdown(clickableKpis[k.label], k.label)}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${k.accent}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  {isClickable && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${k.accent}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}{isClickable && <span className="ml-1 opacity-50">Click for details</span>}</p>
            </div>
          );
        })}
      </div>

      {/* KPI Breakdown Modal */}
      {(kpiModal || kpiBreakdownLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setKpiModal(null); setKpiBreakdown(null); setKpiBreakdownLoading(false); }} data-testid="ceo-kpi-breakdown-modal">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{kpiModal} — Breakdown by Venue</h3>
              <Button variant="ghost" size="sm" onClick={() => { setKpiModal(null); setKpiBreakdown(null); setKpiBreakdownLoading(false); }} data-testid="close-ceo-kpi-modal"><X className="h-4 w-4" /></Button>
            </div>
            {kpiBreakdownLoading ? <p className="text-sm text-muted-foreground animate-pulse py-8 text-center">Loading...</p> : kpiBreakdown && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total {kpiBreakdown.kpi?.replace('_', ' ')}</p>
                  <p className="text-2xl font-bold text-green-500" data-testid="ceo-breakdown-total">${(kpiBreakdown.total || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  {(kpiBreakdown.venues || []).map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20" data-testid={`ceo-breakdown-venue-${i}`}>
                      <div>
                        <p className="text-sm font-medium">{v.venue_name}</p>
                        <p className="text-xs text-muted-foreground">{v.sessions_closed} sessions · ${v.tips.toFixed(2)} tips · Today: ${v.revenue_today.toFixed(2)}</p>
                      </div>
                      <p className="text-lg font-bold text-green-500">${v.value.toFixed(2)}</p>
                    </div>
                  ))}
                  {(!kpiBreakdown.venues || kpiBreakdown.venues.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No venue data available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Growth indicator */}
      <div className="mt-6 bg-card border border-border rounded-xl p-5 flex items-center justify-between" data-testid="ceo-growth-banner">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.growth_pct >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {data.growth_pct >= 0 ? <ArrowUpRight className="h-6 w-6 text-green-500" /> : <ArrowDownRight className="h-6 w-6 text-red-500" />}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Month-over-Month Growth</p>
            <p className={`text-3xl font-bold ${data.growth_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {data.growth_pct > 0 ? '+' : ''}{data.growth_pct}%
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Revenue Today</p>
          <p className="text-2xl font-bold">${(data.revenue_today || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">YTD: ${(data.revenue_ytd || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── 2. Revenue & Profit ─── */
function RevenueSection() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p) => {
    setLoading(true);
    ceoAPI.getRevenue(p || period).then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const switchPeriod = (p) => { setPeriod(p); load(p); };

  if (loading) return <Skeleton />;

  const chart = data?.chart || [];
  const maxRev = Math.max(...chart.map(c => c.revenue), 1);
  const totalRev = chart.reduce((s, c) => s + c.revenue, 0);
  const totalProfit = chart.reduce((s, c) => s + c.profit, 0);
  const totalFees = chart.reduce((s, c) => s + c.fees, 0);

  return (
    <div data-testid="ceo-revenue-section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Revenue vs Profit</h2>
        <div className="flex items-center bg-muted/50 rounded-lg p-1" data-testid="revenue-period-switcher">
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => switchPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid={`period-${p}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Gross Revenue</p>
          <p className="text-2xl font-bold text-green-500">${totalRev.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Net Revenue</p>
          <p className="text-2xl font-bold text-emerald-500">${(totalRev - totalFees).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Est. Net Profit</p>
          <p className="text-2xl font-bold text-blue-500">${totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Avg Rev/Company</p>
          <p className="text-2xl font-bold text-purple-500">${totalRev > 0 ? totalRev.toLocaleString() : '0'}</p>
        </div>
      </div>

      {/* Bar Chart */}
      {chart.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5" data-testid="revenue-chart">
          <div className="flex items-end gap-1 h-48">
            {chart.map((c, i) => {
              const revH = (c.revenue / maxRev) * 100;
              const profH = (c.profit / maxRev) * 100;
              const label = period === 'year'
                ? new Date(c.period).toLocaleDateString('en', { month: 'short' })
                : new Date(c.period).toLocaleDateString('en', { day: 'numeric', month: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5" data-testid={`chart-bar-${i}`}>
                  <div className="w-full flex gap-0.5 items-end h-40">
                    <div className="flex-1 bg-green-500/80 rounded-t" style={{ height: `${revH}%` }} title={`Rev: $${c.revenue}`} />
                    <div className="flex-1 bg-blue-500/80 rounded-t" style={{ height: `${profH}%` }} title={`Profit: $${c.profit}`} />
                  </div>
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 rounded bg-green-500/80" /> Revenue</span>
            <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 rounded bg-blue-500/80" /> Profit</span>
          </div>
        </div>
      ) : (
        <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No revenue data for this period</p>
        </div>
      )}
    </div>
  );
}

/* ─── 3. Companies & Venues ─── */
function CompaniesSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [moduleToggles, setModuleToggles] = useState({});

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
      toast.success(`Modules updated for ${venue.name}`);
      load();
    } catch { toast.error('Failed to update modules'); }
  };

  const updateStatus = async (company, newStatus) => {
    const fd = new FormData();
    fd.append('status', newStatus);
    try {
      await ceoAPI.updateCompanyStatus(company.user_id, fd);
      toast.success(`Status updated to ${newStatus}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return <Skeleton />;

  const allModules = ['pulse', 'tap', 'table', 'kds'];

  return (
    <div data-testid="ceo-companies-section">
      <h2 className="text-xl font-bold mb-5">Company Management</h2>
      <div className="space-y-3">
        {data?.companies?.map((c, i) => (
          <div key={c.user_id} className="bg-card border border-border rounded-xl overflow-hidden" data-testid={`company-card-${i}`}>
            {/* Company Row */}
            <div className="flex items-center p-4 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpandedCompany(expandedCompany === c.user_id ? null : c.user_id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{c.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'active' ? 'bg-green-500/10 text-green-600' : c.status === 'suspended' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{c.email} · {c.venue_count} venue(s)</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-green-500">${c.mrr.toLocaleString()}</p>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCompany === c.user_id ? 'rotate-90' : ''}`} />
              </div>
            </div>

            {/* Expanded Management Panel */}
            {expandedCompany === c.user_id && (
              <div className="border-t border-border p-4 bg-muted/10 space-y-4" data-testid={`company-management-${i}`}>
                {/* Status Management */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">User Status</p>
                  <div className="flex gap-2">
                    {['active', 'suspended', 'pending'].map(st => (
                      <button key={st} onClick={() => updateStatus(c, st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          c.status === st ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                        data-testid={`status-btn-${st}-${i}`}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Module Management per Venue */}
                {c.venues?.map((v, vi) => (
                  <div key={v.venue_id} data-testid={`venue-modules-${vi}`}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{v.name} — Modules</p>
                    <div className="flex gap-2 flex-wrap">
                      {allModules.map(mod => {
                        const isActive = (v.modules || []).includes(mod);
                        return (
                          <button key={mod} onClick={() => toggleModule(c, v, mod)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                              isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 opacity-50'}`}
                            data-testid={`module-toggle-${mod}-${vi}`}>
                            {isActive ? <Check className="h-3 w-3 inline mr-1" /> : null}
                            {mod.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">MRR: ${v.mrr.toLocaleString()}</p>
                  </div>
                ))}

                {/* Account Info */}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <p>User ID: {c.user_id}</p>
                  <p>Created: {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 4. Module Adoption ─── */
function ModulesSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getModules().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const modules = data?.modules || [];
  const moduleColors = { pulse: 'bg-pink-500', tap: 'bg-blue-500', table: 'bg-emerald-500', kds: 'bg-orange-500' };
  const moduleTextColors = { pulse: 'text-pink-500', tap: 'text-blue-500', table: 'text-emerald-500', kds: 'text-orange-500' };

  return (
    <div data-testid="ceo-modules-section">
      <h2 className="text-xl font-bold mb-5">Module Adoption</h2>
      <div className="grid grid-cols-2 gap-4">
        {modules.map(m => (
          <div key={m.key} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer" data-testid={`module-${m.key}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${moduleColors[m.key] || 'bg-primary'} bg-opacity-10 flex items-center justify-center`}>
                  <Layers className={`h-5 w-5 ${moduleTextColors[m.key] || 'text-primary'}`} />
                </div>
                <div>
                  <h3 className="font-bold">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">{m.active} active companies</p>
                </div>
              </div>
              <span className={`text-2xl font-bold ${moduleTextColors[m.key] || 'text-primary'}`}>{m.adoption_pct}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full">
              <div className={`h-2 rounded-full ${moduleColors[m.key] || 'bg-primary'}`} style={{ width: `${m.adoption_pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Total venues: {data?.total_venues || 0}</p>
    </div>
  );
}

/* ─── 5. User Management ─── */
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'server', venue_id: '', status: 'active' });

  const loadUsers = useCallback(() => {
    ceoAPI.getUsers().then(r => setUsers(r.data.users || [])).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreate = async () => {
    if (!form.email || !form.password) { toast.error('Email and password required'); return; }
    try {
      const fd = new FormData();
      fd.append('email', form.email); fd.append('password', form.password); fd.append('role', form.role);
      if (form.venue_id) fd.append('venue_id', form.venue_id);
      const perms = {};
      if (['server', 'host', 'bartender', 'cashier', 'kitchen'].includes(form.role)) {
        perms.pulse = true; perms.tap = true; perms.table = true; perms.kds = true;
      }
      fd.append('permissions', JSON.stringify(perms));
      await ceoAPI.createUser(fd);
      toast.success('User created'); setShowCreate(false);
      setForm({ email: '', password: '', role: 'server', venue_id: '', status: 'active' }); loadUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      const fd = new FormData();
      if (form.role) fd.append('role', form.role);
      if (form.status) fd.append('status', form.status);
      if (form.venue_id) fd.append('venue_id', form.venue_id);
      if (form.email) fd.append('email', form.email);
      const perms = {};
      if (['server', 'host', 'bartender', 'cashier', 'kitchen'].includes(form.role)) {
        perms.pulse = true; perms.tap = true; perms.table = true; perms.kds = true;
      }
      fd.append('permissions', JSON.stringify(perms));
      await ceoAPI.updateUser(editingUser, fd);
      toast.success('User updated'); setEditingUser(null); loadUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await ceoAPI.deleteUser(userId);
      toast.success('User deleted'); loadUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const startEdit = (u) => {
    setEditingUser(u.id);
    setForm({
      email: u.email,
      password: '',
      role: u.roles?.[0]?.role || 'server',
      venue_id: u.roles?.[0]?.venue_id || '',
      status: u.status,
    });
  };

  const ROLES = ['ceo', 'owner', 'manager', 'host', 'tap', 'bartender', 'server', 'kitchen', 'cashier'];
  const venueId = localStorage.getItem('active_venue_id') || '';

  if (loading) return <Skeleton />;

  return (
    <div data-testid="ceo-users-section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">User Management</h2>
        <Button size="sm" onClick={() => { setShowCreate(true); setEditingUser(null); setForm({ email: '', password: '', role: 'server', venue_id: venueId, status: 'active' }); }} data-testid="create-user-btn">
          <UserPlus className="h-4 w-4 mr-1" /> New User
        </Button>
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editingUser) && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3" data-testid="user-form">
          <h3 className="font-semibold text-sm">{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@email.com" className="h-8 text-sm" data-testid="user-email-input" />
            </div>
            {!editingUser && (
              <div>
                <label className="text-xs text-muted-foreground">Password</label>
                <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Password" className="h-8 text-sm" data-testid="user-password-input" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full h-8 text-sm bg-background border border-border rounded-md px-2" data-testid="user-role-select">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            {editingUser && (
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full h-8 text-sm bg-background border border-border rounded-md px-2" data-testid="user-status-select">
                  {['active', 'suspended', 'pending'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={editingUser ? handleUpdate : handleCreate} data-testid="user-save-btn">
              <Check className="h-3 w-3 mr-1" /> {editingUser ? 'Update' : 'Create'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowCreate(false); setEditingUser(null); }} data-testid="user-cancel-btn">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-2" data-testid="users-list">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
        ) : users.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between" data-testid={`user-row-${u.id}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{u.email}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  u.status === 'active' ? 'bg-green-500/10 text-green-600' :
                  u.status === 'suspended' ? 'bg-red-500/10 text-red-600' :
                  'bg-yellow-500/10 text-yellow-600'
                }`}>{u.status}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(u.roles || []).map((r, i) => (
                  <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {r.role}{r.venue_id ? ` (Venue)` : ''}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Last login: {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(u)} data-testid={`edit-user-${u.id}`}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)} data-testid={`delete-user-${u.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 6. Risk & Alerts ─── */
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
      <h2 className="text-xl font-bold mb-5">Risk & Alerts</h2>
      {alerts.length === 0 ? (
        <div className="bg-card border-2 border-green-500/30 rounded-xl p-8 text-center" data-testid="no-alerts">
          <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-green-500" />
          <p className="text-sm font-medium text-green-600">All clear! No risk alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${
              a.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
            }`} data-testid={`alert-${i}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                a.severity === 'critical' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${a.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.message}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.type.replace('_', ' ')} — {a.venue_name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 6. Growth Pipeline ─── */
function PipelineSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getPipeline().then(r => setData(r.data.pipeline)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const stages = [
    { key: 'leads', label: 'Leads', color: 'bg-gray-400', text: 'text-gray-500' },
    { key: 'paid', label: 'Paid', color: 'bg-blue-500', text: 'text-blue-500' },
    { key: 'activated', label: 'Activated', color: 'bg-emerald-500', text: 'text-emerald-500' },
    { key: 'active', label: 'Active', color: 'bg-green-500', text: 'text-green-500' },
    { key: 'at_risk', label: 'At Risk', color: 'bg-yellow-500', text: 'text-yellow-500' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500', text: 'text-red-500' },
  ];

  const maxVal = Math.max(...stages.map(s => data[s.key] || 0), 1);

  return (
    <div data-testid="ceo-pipeline-section">
      <h2 className="text-xl font-bold mb-5">Growth Pipeline</h2>

      {/* Funnel visualization */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6" data-testid="pipeline-funnel">
        <div className="space-y-3">
          {stages.map((s, i) => {
            const val = data[s.key] || 0;
            const width = Math.max((val / maxVal) * 100, 8);
            return (
              <div key={s.key} className="flex items-center gap-4 cursor-pointer hover:bg-muted/20 rounded-lg p-2 transition-all" data-testid={`pipeline-${s.key}`}>
                <span className="text-sm font-medium w-24 text-right text-muted-foreground">{s.label}</span>
                <div className="flex-1 relative">
                  <div className={`h-8 ${s.color} rounded-lg flex items-center justify-end px-3 transition-all`} style={{ width: `${width}%` }}>
                    <span className="text-white text-sm font-bold">{val}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{data.active || 0}</p>
          <p className="text-xs text-muted-foreground">Active Customers</p>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">{data.at_risk || 0}</p>
          <p className="text-xs text-muted-foreground">At Risk</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-500">{data.leads - data.paid}</p>
          <p className="text-xs text-muted-foreground">Unconverted Leads</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-4 gap-4">
        <div className="h-28 bg-muted rounded-xl" />
        <div className="h-28 bg-muted rounded-xl" />
        <div className="h-28 bg-muted rounded-xl" />
        <div className="h-28 bg-muted rounded-xl" />
      </div>
      <div className="h-40 bg-muted rounded-xl" />
    </div>
  );
}

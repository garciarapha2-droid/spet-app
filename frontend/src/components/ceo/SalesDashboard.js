import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import {
  DollarSign, TrendingUp, Hash, BarChart3, Search, LayoutGrid, List, Filter,
  X, Check, Grip, Clock, Building2, Mail, Phone, CreditCard, Rocket, UserCheck, Layers
} from 'lucide-react';
import { Button } from '../ui/button';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, ChartTooltip, EmptyChart } from './shared';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'paid', 'onboarding', 'active', 'lost'];
const STATUS_CFG = {
  new: { dot: '#94a3b8', label: 'New', bg: '#f1f5f9', text: '#475569' },
  contacted: { dot: '#3b82f6', label: 'Contacted', bg: '#eff6ff', text: '#2563eb' },
  qualified: { dot: '#8b5cf6', label: 'Qualified', bg: '#f5f3ff', text: '#7c3aed' },
  paid: { dot: '#10b981', label: 'Paid', bg: '#ecfdf5', text: '#059669' },
  onboarding: { dot: '#f59e0b', label: 'Onboarding', bg: '#fffbeb', text: '#d97706' },
  active: { dot: '#22c55e', label: 'Active', bg: '#f0fdf4', text: '#16a34a' },
  lost: { dot: '#ef4444', label: 'Lost', bg: '#fef2f2', text: '#dc2626' },
};
const SOURCE_CFG = { signup: { bg: '#eef2ff', text: '#4f46e5' }, contact: { bg: '#f0f9ff', text: '#0284c7' }, support: { bg: '#fff7ed', text: '#ea580c' } };

export default function SalesDashboard() {
  const [leads, setLeads] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');
  const [subTab, setSubTab] = useState('pipeline');
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const dragItem = useRef(null);
  const dragOverCol = useRef(null);

  useEffect(() => {
    Promise.all([
      ceoAPI.getLeads().then(r => setLeads(r.data.leads || [])),
      ceoAPI.getSalesPerformance().then(r => setSalesData(r.data)),
    ]).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  const updateField = async (leadId, field, value) => {
    setSaving(true);
    const fd = new FormData();
    fd.append(field, value);
    try {
      await ceoAPI.updateLeadStatus(leadId, fd);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, [field]: value }));
      toast.success('Updated');
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
      toast.success('Saved');
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleDragStart = (lead) => { dragItem.current = lead; };
  const handleDragOver = (e, status) => { e.preventDefault(); dragOverCol.current = status; };
  const handleDrop = (status) => {
    if (dragItem.current && dragItem.current.status !== status) updateField(dragItem.current.id, 'status', status);
    dragItem.current = null; dragOverCol.current = null;
  };

  const filtered = useMemo(() => {
    let r = leads;
    if (filterSource !== 'all') r = r.filter(l => l.source === filterSource);
    if (search) { const q = search.toLowerCase(); r = r.filter(l => l.full_name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)); }
    return r;
  }, [leads, filterSource, search]);

  const sm = salesData?.metrics || {};

  if (loading) return <DashboardSkeleton />;

  return (
    <div data-testid="ceo-sales">
      <PageHeader title="Sales" subtitle="Pipeline management, deal tracking, and performance">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {['pipeline', 'performance'].map(t => (
            <button key={t} onClick={() => setSubTab(t)}
              className={`px-4 py-1.5 text-[11px] font-semibold rounded-md transition-all ${subTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              data-testid={`sales-tab-${t}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </PageHeader>

      {subTab === 'pipeline' ? (
        <>
          {/* Pipeline Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
                className="h-9 w-full text-[11px] bg-white border border-slate-200 rounded-lg pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all" data-testid="sales-search" />
            </div>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="h-9 text-[11px] bg-white border border-slate-200 rounded-lg px-3 text-slate-600" data-testid="sales-filter">
              <option value="all">All Sources</option>
              <option value="signup">Signup</option>
              <option value="contact">Contact</option>
              <option value="support">Support</option>
            </select>
            <div className="flex bg-slate-100 rounded-lg p-0.5 ml-auto">
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`} data-testid="view-kanban"><LayoutGrid className="h-3.5 w-3.5 text-slate-600" /></button>
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`} data-testid="view-table"><List className="h-3.5 w-3.5 text-slate-600" /></button>
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <div className="flex gap-2 overflow-x-auto pb-4" data-testid="kanban-board">
              {LEAD_STATUSES.map(status => {
                const cfg = STATUS_CFG[status];
                const cards = filtered.filter(l => l.status === status);
                return (
                  <div key={status}
                    className="flex-shrink-0 w-[210px] min-h-[400px] rounded-xl border border-border bg-muted/30"
                    onDragOver={e => handleDragOver(e, status)} onDrop={() => handleDrop(status)} data-testid={`kanban-col-${status}`}>
                    <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                        <span className="text-[11px] font-bold text-foreground/80">{cfg.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded-md border border-border">{cards.length}</span>
                    </div>
                    <div className="p-1.5 space-y-1.5">
                      {cards.map(lead => (
                        <div key={lead.id} draggable onDragStart={() => handleDragStart(lead)}
                          onClick={() => { setSelectedLead(lead); setNoteText(lead.notes || ''); }}
                          className="bg-card border border-border/50 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-border transition-all duration-150 group"
                          data-testid={`kanban-card-${lead.id}`}>
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-[11px] font-semibold text-foreground leading-tight truncate max-w-[145px]">{lead.full_name}</p>
                            <Grip className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                          </div>
                          {lead.company_name !== 'N/A' && (
                            <p className="text-[9px] text-slate-400 mb-2 flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{lead.company_name}</p>
                          )}
                          <div className="flex items-center gap-1 flex-wrap mb-2">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: SOURCE_CFG[lead.source]?.bg, color: SOURCE_CFG[lead.source]?.text }}>{lead.source}</span>
                            {lead.product_interest && <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{lead.product_interest}</span>}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/40">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${lead.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                              {lead.payment_status === 'paid' ? 'Paid' : lead.payment_status}
                            </span>
                            <span className="text-[8px] flex items-center gap-1" style={{ color: 'hsl(var(--text-tertiary))' }}><Clock className="h-2.5 w-2.5" />{lead.created_at ? new Date(lead.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
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
            <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="leads-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Name', 'Source', 'Interest', 'Status', 'Payment', 'Company', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--text-tertiary))' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} onClick={() => { setSelectedLead(l); setNoteText(l.notes || ''); }}
                      className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`lead-row-${l.id}`}>
                      <td className="px-4 py-3"><p className="text-[11px] font-semibold text-foreground">{l.full_name}</p><p className="text-[10px] text-muted-foreground">{l.email}</p></td>
                      <td className="px-4 py-3"><span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: SOURCE_CFG[l.source]?.bg, color: SOURCE_CFG[l.source]?.text }}>{l.source}</span></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{l.product_interest || '-'}</td>
                      <td className="px-4 py-3"><span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: STATUS_CFG[l.status]?.bg, color: STATUS_CFG[l.status]?.text }}>{l.status}</span></td>
                      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${l.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{l.payment_status}</span></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{l.company_name}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-400">{l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Performance Sub-tab */
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard label="Total Sales" value={`$${(sm.total_sales || 0).toLocaleString()}`} icon={DollarSign} color="#059669" size="lg" />
            <MetricCard label="Avg. Sale" value={`$${(sm.avg_sale || 0).toLocaleString()}`} icon={TrendingUp} color="#3b82f6" />
            <MetricCard label="Number of Sales" value={sm.count_sales || 0} icon={Hash} color="#8b5cf6" />
          </div>
          <ChartCard title="Monthly Sales" subtitle="Revenue and transaction count over time">
            {salesData?.charts?.monthly_sales?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={salesData.charts.monthly_sales} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar yAxisId="rev" dataKey="sales" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="cnt" type="monotone" dataKey="count" name="Transactions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart icon={BarChart3} />}
          </ChartCard>
        </>
      )}

      {/* Lead Detail Side Panel */}
      {selectedLead && <LeadPanel lead={selectedLead} noteText={noteText} setNoteText={setNoteText} saving={saving}
        onClose={() => setSelectedLead(null)} onUpdateField={updateField} onSaveNote={saveNote} />}
    </div>
  );
}

function LeadPanel({ lead, noteText, setNoteText, saving, onClose, onUpdateField, onSaveNote }) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  }, []);

  const close = () => {
    setAnimate(false);
    setTimeout(() => { setVisible(false); onClose(); }, 250);
  };

  if (!visible) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black/15 z-40 transition-opacity duration-250 ${animate ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <div className={`fixed right-0 top-0 bottom-0 w-[420px] bg-card border-l border-border z-50 shadow-xl overflow-y-auto transition-transform duration-250 ease-out ${animate ? 'translate-x-0' : 'translate-x-full'}`} data-testid="lead-panel">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-3.5 flex items-center justify-between z-10">
          <h3 className="font-semibold text-[15px] text-foreground">Lead Details</h3>
          <button onClick={close} className="p-1.5 rounded-md hover:bg-muted transition-colors" data-testid="close-panel"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-lg font-bold text-foreground">{lead.full_name}</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Mail className="h-3.5 w-3.5" />{lead.email}</div>
              {lead.phone && <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Phone className="h-3.5 w-3.5" />{lead.phone}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 'Source', v: lead.source }, { l: 'Interest', v: lead.product_interest || '-' }, { l: 'Company', v: lead.company_name }, { l: 'Account', v: lead.has_account ? 'Created' : 'None' }].map(i => (
              <div key={i.l} className="bg-muted rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-[0.1em] font-bold mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>{i.l}</p>
                <p className="text-[12px] font-semibold text-foreground/80">{i.v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>Status</p>
            <div className="flex flex-wrap gap-1.5">
              {LEAD_STATUSES.map(s => (
                <button key={s} disabled={saving} onClick={() => onUpdateField(lead.id, 'status', s)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${lead.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-border/80'}`}
                  data-testid={`status-${s}`}>{STATUS_CFG[s].label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>Payment</p>
            <div className="flex gap-2">
              {['N/A', 'pending', 'paid'].map(ps => (
                <button key={ps} disabled={saving} onClick={() => onUpdateField(lead.id, 'payment_status', ps)}
                  className={`flex-1 py-2 text-[10px] font-semibold rounded-lg border transition-all ${lead.payment_status === ps ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                  data-testid={`payment-${ps}`}>{ps.charAt(0).toUpperCase() + ps.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" disabled={saving} className="text-[10px] h-8" onClick={() => { onUpdateField(lead.id, 'payment_status', 'paid'); onUpdateField(lead.id, 'status', 'paid'); }} data-testid="mark-paid"><CreditCard className="h-3 w-3 mr-1" />Paid</Button>
            <Button size="sm" variant="outline" disabled={saving} className="text-[10px] h-8" onClick={() => onUpdateField(lead.id, 'status', 'onboarding')} data-testid="mark-onboarding"><Rocket className="h-3 w-3 mr-1" />Onboard</Button>
            <Button size="sm" variant="outline" disabled={saving} className="text-[10px] h-8" onClick={() => onUpdateField(lead.id, 'status', 'active')} data-testid="mark-active"><UserCheck className="h-3 w-3 mr-1" />Active</Button>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>Internal Notes</p>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              className="w-full h-20 text-[12px] bg-muted border border-border rounded-lg p-3 resize-none focus:ring-1 focus:ring-ring text-foreground" placeholder="Add notes..." data-testid="notes-input" />
            <Button size="sm" className="w-full text-[11px] h-8 mt-2 bg-slate-900 hover:bg-slate-800" disabled={saving} onClick={() => onSaveNote(lead.id)} data-testid="save-note">
              <Check className="h-3 w-3 mr-1" />Save Note
            </Button>
          </div>
          <div className="text-[10px] pt-3 border-t border-border space-y-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
            <p>ID: <span className="font-mono" style={{ color: 'hsl(var(--text-secondary))' }}>{lead.id?.slice(0, 8)}</span></p>
            <p>Created: {lead.created_at ? new Date(lead.created_at).toLocaleString() : '-'}</p>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerAPI, tapAPI, staffAPI, venueAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Home, LogOut, Users, UtensilsCrossed, Settings,
  Plus, Pencil, Trash2, Check, X, BarChart3, DollarSign,
  Search, Calendar, Shield, Clock, AlertTriangle, Download,
  ChevronDown, ChevronRight, Gift, Nfc, FileText, Activity,
  TrendingUp, Eye, LayoutGrid, User, Lightbulb, Zap, Copy, ClipboardCheck
} from 'lucide-react';

const VID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const VNAME = () => localStorage.getItem('active_venue_name') || 'Demo Club';

/* ─── Tab definitions ─── */
const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'staff', label: 'Staff & Roles', icon: Users },
  { key: 'tables-server', label: 'Tables by Server', icon: LayoutGrid },
  { key: 'menu', label: 'Menu / Products', icon: UtensilsCrossed },
  { key: 'shifts', label: 'Shifts & Ops', icon: Clock },
  { key: 'shift-ops', label: 'Shift vs Ops', icon: TrendingUp },
  { key: 'tips', label: 'Tips', icon: DollarSign },
  { key: 'guests', label: 'NFC & Guests', icon: Nfc },
  { key: 'reports', label: 'Reports & Finance', icon: BarChart3 },
  { key: 'loyalty', label: 'Loyalty & Rewards', icon: Gift },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const ManagerPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background" data-testid="manager-page">
      {/* Header */}
      <header className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-md px-6 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-bold tracking-tight">Manager Dashboard</h1>
          <span className="text-sm text-muted-foreground">{VNAME()}</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={async () => { const { handleFullLogout } = await import('../utils/logout'); await handleFullLogout(logout); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-56 border-r border-border/60 bg-card/50 min-h-[calc(100vh-56px)] p-3 space-y-0.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-foreground/[0.06] text-foreground font-semibold border-l-2 border-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                data-testid={`manager-tab-${tab.key}`}>
                <Icon className="h-4 w-4 shrink-0" /> {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-56px)]">
          {activeTab === 'overview' && <OverviewSection onNavigate={setActiveTab} />}
          {activeTab === 'staff' && <StaffSection />}
          {activeTab === 'tables-server' && <TablesByServerSection />}
          {activeTab === 'menu' && <MenuSection />}
          {activeTab === 'shifts' && <ShiftsSection />}
          {activeTab === 'shift-ops' && <ShiftOpsSection />}
          {activeTab === 'tips' && <TipsSection />}
          {activeTab === 'guests' && <GuestsSection />}
          {activeTab === 'reports' && <ReportsSection />}
          {activeTab === 'loyalty' && <LoyaltySection />}
          {activeTab === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   1. OVERVIEW
   ═══════════════════════════════════════════════════════════════════ */
function OverviewSection({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [funnelModal, setFunnelModal] = useState(null);
  const [funnelData, setFunnelData] = useState([]);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [revBreakdown, setRevBreakdown] = useState(null);
  const [revBreakdownLoading, setRevBreakdownLoading] = useState(false);

  const refreshData = useCallback(() => {
    managerAPI.getOverview(VID()).then(r => setData(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    managerAPI.getOverview(VID()).then(r => setData(r.data)).catch(() => toast.error('Failed to load overview')).finally(() => setLoading(false));
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/api/ws/manager/${VID()}`;
    let ws = null;
    let reconnectTimer = null;

    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => console.log('[WS] Manager connected');
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log('[WS] Event:', msg.type);
          refreshData();
        } catch {}
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [refreshData]);

  const openFunnelDrilldown = async (stage) => {
    setFunnelModal(stage);
    setFunnelLoading(true);
    try {
      const res = await managerAPI.getFunnelDetail(VID(), stage);
      setFunnelData(res.data.results || []);
    } catch { toast.error('Failed to load detail'); }
    setFunnelLoading(false);
  };

  const openRevenueBreakdown = async () => {
    setRevBreakdownLoading(true);
    try {
      const res = await managerAPI.getRevenueBreakdown(VID());
      setRevBreakdown(res.data);
    } catch { toast.error('Failed to load revenue breakdown'); }
    setRevBreakdownLoading(false);
  };

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data available</p>;

  const { kpis, charts, alerts } = data;

  return (
    <div data-testid="overview-section">
      <h2 className="text-xl font-bold mb-4">Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={DollarSign} label="Revenue Today" value={`$${kpis.revenue_today.toFixed(0)}`} accent="text-green-500" testid="kpi-rev-today" onClick={openRevenueBreakdown} />
        <KPICard icon={DollarSign} label="Revenue Week" value={`$${kpis.revenue_week.toFixed(0)}`} accent="text-emerald-500" testid="kpi-rev-week" />
        <KPICard icon={DollarSign} label="Revenue Month" value={`$${kpis.revenue_month.toFixed(0)}`} accent="text-teal-500" testid="kpi-rev-month" />
        <KPICard icon={TrendingUp} label="Avg Ticket" value={`$${kpis.avg_ticket.toFixed(2)}`} accent="text-blue-500" testid="kpi-avg-ticket" />
        <KPICard icon={Users} label="Unique Guests" value={kpis.unique_guests} accent="text-purple-500" testid="kpi-guests" />
        <KPICard icon={FileText} label="Open Tabs" value={kpis.open_tabs} sub={`$${kpis.running_total.toFixed(0)} running`} testid="kpi-open-tabs" />
        <KPICard icon={Check} label="Tabs Closed" value={kpis.closed_today} testid="kpi-closed" />
        <KPICard icon={AlertTriangle} label="Voids Today" value={kpis.void_count} accent={kpis.void_count > 5 ? 'text-red-500' : ''} testid="kpi-voids" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Hour */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Revenue by Hour</h3>
          <div className="h-40 flex items-end gap-1">
            {charts.revenue_by_hour.length > 0 ? charts.revenue_by_hour.map((h, i) => {
              const max = Math.max(...charts.revenue_by_hour.map(x => x.total), 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-emerald-500/80 rounded-t" style={{ height: `${(h.total / max) * 120}px` }} title={`$${h.total.toFixed(0)}`} />
                  <span className="text-[10px] text-muted-foreground">{h.hour}h</span>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground m-auto">No data yet</p>}
          </div>
        </div>

        {/* Top 10 Items */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Top 10 Items</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {charts.top_items.length > 0 ? charts.top_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="text-primary font-bold">${item.revenue.toFixed(0)} <span className="text-muted-foreground text-xs font-normal">({item.qty}x)</span></span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No sales yet</p>}
          </div>
        </div>
      </div>

      {/* Guest Funnel — clickable drill-down */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Guest Funnel (Today)</h3>
          <button onClick={() => onNavigate && onNavigate('tables-server')} className="text-xs text-primary hover:underline" data-testid="goto-tables-server">View Tables by Server</button>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Entries', val: charts.guest_funnel.entries, stage: 'entries' },
            { label: 'Allowed', val: charts.guest_funnel.allowed, stage: 'allowed' },
            { label: 'Tabs Opened', val: charts.guest_funnel.tabs_opened, stage: 'tabs_open' },
            { label: 'Tabs Closed', val: charts.guest_funnel.tabs_closed, stage: 'tabs_closed' },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <button onClick={() => openFunnelDrilldown(step.stage)}
                className="flex-1 text-center p-3 bg-muted/40 rounded-lg cursor-pointer hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 transition-all"
                data-testid={`funnel-${step.stage}`}>
                <p className="text-2xl font-bold">{step.val}</p>
                <p className="text-xs text-muted-foreground">{step.label}</p>
                <Eye className="h-3 w-3 mx-auto mt-1 text-primary opacity-50" />
              </button>
              {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Funnel Drill-down Modal */}
      {funnelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setFunnelModal(null)} data-testid="funnel-modal">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold capitalize">{funnelModal.replace('_', ' ')} — Detail</h3>
              <Button variant="ghost" size="sm" onClick={() => setFunnelModal(null)}><X className="h-4 w-4" /></Button>
            </div>
            {funnelLoading ? <p className="text-sm text-muted-foreground animate-pulse">Loading...</p> : (
              <div className="space-y-1">
                {funnelData.length === 0 ? <p className="text-sm text-muted-foreground">No records</p> : funnelData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{item.name?.[0] || '?'}</div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.tab_number ? `#${item.tab_number}` : item.entry_type || ''} {item.server_name ? `— ${item.server_name}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.total !== undefined && <span className="text-sm font-bold text-green-500">${item.total.toFixed(2)}</span>}
                      {item.decision && <span className={`text-xs px-2 py-0.5 rounded-full ${item.decision === 'allowed' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>{item.decision}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Breakdown Modal */}
      {(revBreakdown || revBreakdownLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setRevBreakdown(null); setRevBreakdownLoading(false); }} data-testid="revenue-breakdown-modal">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Revenue Today — Breakdown</h3>
              <Button variant="ghost" size="sm" onClick={() => { setRevBreakdown(null); setRevBreakdownLoading(false); }} data-testid="close-revenue-modal"><X className="h-4 w-4" /></Button>
            </div>
            {revBreakdownLoading ? <p className="text-sm text-muted-foreground animate-pulse py-8 text-center">Loading breakdown...</p> : revBreakdown && (
              <div className="space-y-5">
                {/* Summary Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold text-green-500" data-testid="breakdown-total-revenue">${revBreakdown.total_revenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Tips</p>
                    <p className="text-xl font-bold text-blue-500" data-testid="breakdown-total-tips">${revBreakdown.total_tips.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Sessions Closed</p>
                    <p className="text-xl font-bold" data-testid="breakdown-sessions-count">{revBreakdown.sessions_count}</p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Payment Methods</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/20 rounded-lg p-3 flex items-center justify-between border border-border/50">
                      <span className="text-sm">Pay Here</span>
                      <span className="font-bold text-green-500" data-testid="breakdown-pay-here">${(revBreakdown.payment_methods.pay_here || 0).toFixed(2)}</span>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-3 flex items-center justify-between border border-border/50">
                      <span className="text-sm">Pay at Register</span>
                      <span className="font-bold text-emerald-500" data-testid="breakdown-pay-register">${(revBreakdown.payment_methods.pay_at_register || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Top Items */}
                {revBreakdown.top_items?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Top Items</h4>
                    <div className="space-y-1">
                      {revBreakdown.top_items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/20">
                          <span className="text-sm"><span className="text-xs text-muted-foreground mr-2">{i + 1}.</span>{item.name} <span className="text-xs text-muted-foreground">x{item.qty}</span></span>
                          <span className="text-sm font-bold text-green-500">${item.revenue.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closed Sessions */}
                {revBreakdown.sessions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Closed Sessions</h4>
                    <div className="space-y-1">
                      {revBreakdown.sessions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/20" data-testid={`breakdown-session-${i}`}>
                          <div>
                            <p className="text-sm font-medium">Tab #{s.tab_number}</p>
                            <p className="text-xs text-muted-foreground">{s.bartender} — {s.payment_location === 'pay_here' ? 'Paid Here' : s.payment_location === 'pay_at_register' ? 'Register' : s.payment_location} — {s.closed_at ? new Date(s.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-500">${s.total.toFixed(2)}</p>
                            {s.tip > 0 && <p className="text-[10px] text-blue-500">+ ${s.tip.toFixed(2)} tip</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Alerts</h3>
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${a.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-blue-500/30 bg-blue-500/5'}`} data-testid={`alert-${i}`}>
              <AlertTriangle className={`h-4 w-4 ${a.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
              <div><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.message}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. STAFF & ROLES
   ═══════════════════════════════════════════════════════════════════ */
function StaffSection() {
  const [staffData, setStaffData] = useState({ staff: [], barmen: [], schedules: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('server');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [scheduleForm, setScheduleForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    managerAPI.getStaff(VID()).then(r => setStaffData(r.data)).catch(() => toast.error('Failed to load staff')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMember = async () => {
    if (!newName.trim()) return;
    const fd = new FormData();
    fd.append('venue_id', VID()); fd.append('name', newName.trim()); fd.append('role', newRole);
    await managerAPI.addStaff(fd);
    setNewName(''); setShowAdd(false); load(); toast.success('Staff added');
  };

  const updateMember = async (id) => {
    if (!editName.trim()) return;
    const fd = new FormData(); fd.append('name', editName.trim());
    await managerAPI.updateStaff(id, fd);
    setEditing(null); load();
  };

  const deleteMember = async (id) => {
    await managerAPI.deleteStaff(id);
    load(); toast.success('Removed');
  };

  const saveSchedule = async () => {
    if (!scheduleForm) return;
    const fd = new FormData();
    fd.append('venue_id', VID());
    fd.append('staff_id', scheduleForm.staff_id);
    fd.append('staff_name', scheduleForm.staff_name);
    fd.append('day', scheduleForm.day);
    fd.append('start_time', scheduleForm.start_time);
    fd.append('end_time', scheduleForm.end_time);
    await managerAPI.saveSchedule(fd);
    setScheduleForm(null); load(); toast.success('Schedule saved');
  };

  if (loading) return <Skeleton />;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div data-testid="staff-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Staff & Roles</h2>
          <p className="text-sm text-muted-foreground">{staffData.barmen.length} active members</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} data-testid="add-staff-btn"><Plus className="h-4 w-4 mr-2" /> Add Staff</Button>
      </div>

      {showAdd && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 flex gap-3 items-end" data-testid="add-staff-form">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="max-w-xs" />
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="server">Server</option><option value="bartender">Bartender</option><option value="host">Host</option><option value="kitchen">Kitchen</option><option value="manager">Manager</option>
          </select>
          <Button onClick={addMember} disabled={!newName.trim()}>Add</Button>
        </div>
      )}

      {/* RBAC Users */}
      {staffData.staff.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Users</h3>
          <div className="space-y-1">
            {staffData.staff.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Shield className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium">{s.email}</p>
                    <p className="text-xs text-muted-foreground">{s.role}{s.is_protected ? ' — Protected' : ''}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barmen/Servers */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operational Staff</h3>
      <div className="space-y-1 mb-6">
        {staffData.barmen.map(b => (
          <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20">
            {editing === b.id ? (
              <div className="flex items-center gap-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="max-w-xs" autoFocus onKeyDown={e => e.key === 'Enter' && updateMember(b.id)} />
                <Button size="sm" onClick={() => updateMember(b.id)}><Check className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Users className="h-4 w-4 text-blue-500" /></div>
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.role || 'Server'}</p>
                </div>
              </div>
            )}
            {editing !== b.id && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setScheduleForm({ staff_id: b.id, staff_name: b.name, day: 'Mon', start_time: '18:00', end_time: '02:00' })} title="Schedule"><Calendar className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(b.id); setEditName(b.name); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMember(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Form */}
      {scheduleForm && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4" data-testid="schedule-form">
          <h4 className="text-sm font-semibold mb-3">Schedule for {scheduleForm.staff_name}</h4>
          <div className="flex gap-3 items-end">
            <select value={scheduleForm.day} onChange={e => setScheduleForm(p => ({ ...p, day: e.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div><label className="text-xs text-muted-foreground">Start</label><Input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm(p => ({ ...p, start_time: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">End</label><Input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm(p => ({ ...p, end_time: e.target.value }))} /></div>
            <Button onClick={saveSchedule}>Save</Button>
            <Button variant="ghost" onClick={() => setScheduleForm(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Existing Schedules */}
      {staffData.schedules.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Schedules</h3>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {DAYS.map(d => <div key={d} className="font-semibold text-center p-1 bg-muted rounded">{d}</div>)}
            {DAYS.map(d => {
              const daySchedules = staffData.schedules.filter(s => s.day === d);
              return (
                <div key={d} className="min-h-[60px] p-1 border border-border/50 rounded">
                  {daySchedules.map(s => (
                    <div key={s.id} className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 mb-0.5 truncate" title={`${s.staff_name}: ${s.start_time}-${s.end_time}`}>
                      {s.staff_name?.split(' ')[0]} {s.start_time}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. MENU / PRODUCTS
   ═══════════════════════════════════════════════════════════════════ */
function MenuSection() {
  const [catalog, setCatalog] = useState([]);
  const [filterCat, setFilterCat] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Snacks', is_alcohol: false });
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  const load = useCallback(() => {
    tapAPI.getCatalog(VID()).then(r => setCatalog(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCatalogItem = async () => {
    if (!newItem.name.trim() || !newItem.price) return;
    const fd = new FormData();
    fd.append('venue_id', VID()); fd.append('name', newItem.name.trim());
    fd.append('category', newItem.category); fd.append('price', parseFloat(newItem.price).toString());
    fd.append('is_alcohol', newItem.is_alcohol.toString());
    await tapAPI.addCatalogItem(fd);
    setNewItem({ name: '', price: '', category: 'Snacks', is_alcohol: false }); setShowAdd(false); load(); toast.success('Item added');
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const fd = new FormData();
    fd.append('name', editItem.name); fd.append('price', editItem.price.toString()); fd.append('category', editItem.category);
    await tapAPI.updateCatalogItem(editItem.id, fd);
    setEditItem(null); load(); toast.success('Updated');
  };

  const deleteItem = async (id) => {
    await tapAPI.deleteCatalogItem(id);
    load(); toast.success('Deleted');
  };

  if (loading) return <Skeleton />;

  const categories = ['All', ...new Set(catalog.map(i => i.category))];
  const filtered = catalog.filter(i => {
    if (filterCat !== 'All' && i.category !== filterCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div data-testid="menu-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Menu / Products</h2>
          <p className="text-sm text-muted-foreground">{catalog.length} items across {categories.length - 1} categories</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden" data-testid="menu-view-toggle">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="menu-view-list">List</button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="menu-view-kanban">Kanban</button>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} data-testid="add-menu-item-btn"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 space-y-3" data-testid="add-item-form">
          <div className="grid grid-cols-4 gap-3">
            <Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" />
            <Input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" />
            <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>Snacks</option><option>Starters</option><option>Mains</option><option>Cocktails</option><option>Beers</option><option>Spirits</option><option>Non-alcoholic</option>
            </select>
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={newItem.is_alcohol} onChange={e => setNewItem(p => ({ ...p, is_alcohol: e.target.checked }))} /> Alcohol</label>
              <Button onClick={addCatalogItem} disabled={!newItem.name || !newItem.price}>Add</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu..." className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCat === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 gap-px">
          <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase"><span>Item</span><span>Category</span><span>Price</span><span>Type</span><span>Photo</span><span></span></div>
          {filtered.map(item => (
            <div key={item.id} className="grid grid-cols-6 gap-4 px-4 py-2.5 rounded-lg hover:bg-muted/20 items-center text-sm border-b border-border/30">
              {editItem?.id === item.id ? (
                <>
                  <Input value={editItem.name} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
                  <select value={editItem.category} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                    <option>Snacks</option><option>Starters</option><option>Mains</option><option>Cocktails</option><option>Beers</option><option>Spirits</option><option>Non-alcoholic</option>
                  </select>
                  <Input type="number" step="0.01" value={editItem.price} onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))} className="h-8 text-sm" />
                  <span />
                  <span />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={saveEdit}><Check className="h-3.5 w-3.5 text-green-500" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditItem(null)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.category}</span>
                  <span className="font-bold">${item.price?.toFixed(2)}</span>
                  <span>{item.is_alcohol ? <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">Alcohol</span> : <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">No Alcohol</span>}</span>
                  <span>{item.image_url ? <span className="text-xs text-green-500">Has photo</span> : <span className="text-xs text-muted-foreground">No photo</span>}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditItem({ ...item })}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Kanban View — grouped by category */
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.filter(c => c !== 'All').map(cat => {
            const catItems = filtered.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden" data-testid={`menu-kanban-${cat}`}>
                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                  <h4 className="text-sm font-bold">{cat}</h4>
                  <span className="text-xs text-muted-foreground">{catItems.length} items</span>
                </div>
                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{item.name}</span>
                        <span className="text-xs font-bold">${item.price?.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-0.5 ml-2">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditItem({ ...item })}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   4. SHIFTS & OPS
   ═══════════════════════════════════════════════════════════════════ */
function ShiftsSection() {
  const [shifts, setShifts] = useState([]);
  const [audit, setAudit] = useState([]);
  const [showClose, setShowClose] = useState(false);
  const [form, setForm] = useState({ shift_name: 'Evening Shift', cash_expected: '', cash_actual: '', notes: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      managerAPI.getShifts(VID()),
      managerAPI.getAudit(VID()),
    ]).then(([s, a]) => { setShifts(s.data.shifts || []); setAudit(a.data.events || []); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeShift = async () => {
    const fd = new FormData();
    fd.append('venue_id', VID());
    fd.append('shift_name', form.shift_name);
    fd.append('cash_expected', form.cash_expected || '0');
    fd.append('cash_actual', form.cash_actual || '0');
    if (form.notes) fd.append('notes', form.notes);
    await managerAPI.closeShift(fd);
    setShowClose(false); load(); toast.success('Shift closed');
  };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="shifts-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Shifts & Operations</h2>
        <Button onClick={() => setShowClose(!showClose)} data-testid="close-shift-btn"><Clock className="h-4 w-4 mr-2" /> Close Shift</Button>
      </div>

      {showClose && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 space-y-3" data-testid="close-shift-form">
          <h3 className="text-sm font-semibold">Close Current Shift</h3>
          <div className="grid grid-cols-4 gap-3">
            <Input value={form.shift_name} onChange={e => setForm(p => ({ ...p, shift_name: e.target.value }))} placeholder="Shift name" />
            <Input type="number" value={form.cash_expected} onChange={e => setForm(p => ({ ...p, cash_expected: e.target.value }))} placeholder="Cash Expected $" />
            <Input type="number" value={form.cash_actual} onChange={e => setForm(p => ({ ...p, cash_actual: e.target.value }))} placeholder="Cash Actual $" />
            <Button onClick={closeShift}>Close Shift</Button>
          </div>
          <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" />
        </div>
      )}

      {/* Shift History */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shift History</h3>
        {shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg">No shifts closed yet</p>
        ) : (
          <div className="space-y-2">
            {shifts.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{s.shift_name}</p>
                  <span className="text-xs text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Revenue</p><p className="font-bold text-green-500">${(s.revenue || 0).toFixed(0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Tabs Closed</p><p className="font-bold">{s.tabs_closed || 0}</p></div>
                  <div><p className="text-xs text-muted-foreground">Cash Diff</p><p className={`font-bold ${(s.cash_difference || 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>${(s.cash_difference || 0).toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Voids</p><p className="font-bold">{s.voids || 0}</p></div>
                </div>
                {s.notes && <p className="text-xs text-muted-foreground mt-2 italic">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Audit Trail</h3>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg">No audit events</p>
        ) : (
          <div className="space-y-1">
            {audit.map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-2 text-xs rounded hover:bg-muted/20">
                <span className="text-muted-foreground w-36 shrink-0">{e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}</span>
                <span className="font-medium">{e.event_type}</span>
                <span className="text-muted-foreground">{e.user}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. NFC & GUESTS — Sorted by Highest Spender + Profile Modal
   ═══════════════════════════════════════════════════════════════════ */
function GuestsSection() {
  const [guests, setGuests] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback((q) => {
    managerAPI.getGuests(VID(), q || undefined).then(r => { setGuests(r.data.guests || []); setTotal(r.data.total || 0); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (guestId) => {
    setSelected(guestId);
    setDetailLoading(true);
    try {
      const r = await managerAPI.getGuestDetail(guestId, VID());
      setDetail(r.data);
    } catch { toast.error('Failed to load guest profile'); }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  const doSearch = () => { setLoading(true); load(search); };

  if (loading && guests.length === 0) return <Skeleton />;

  return (
    <div data-testid="guests-section">
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-bold">NFC & Guests</h2><p className="text-sm text-muted-foreground">{total} total guests — sorted by highest spender</p></div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Search guests..." className="pl-9" />
        </div>
        <Button variant="outline" onClick={doSearch} data-testid="search-guests-btn">Search</Button>
      </div>

      {/* Guest List */}
      <div className="space-y-1">
        {guests.map((g, idx) => (
          <div key={g.id} onClick={() => loadDetail(g.id)}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selected === g.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/20'}`}
            data-testid={`guest-row-${g.id}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary relative">
                {g.name?.[0] || '?'}
                {idx < 3 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-white text-[8px] flex items-center justify-center font-bold">{idx + 1}</span>}
              </div>
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.email} — {g.visits || 0} visits</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {g.tags?.includes('vip') && <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">VIP</span>}
              {g.wristband_blocked && <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">Blocked</span>}
              <span className="text-sm text-green-500 font-bold">${(g.spend_total || 0).toFixed(0)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Guest Profile Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={closeDetail} data-testid="guest-profile-modal">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-8 text-center animate-pulse"><p className="text-sm text-muted-foreground">Loading profile...</p></div>
            ) : detail ? (
              <>
                {/* Profile Header */}
                <div className="p-5 border-b border-border bg-primary/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{detail.guest?.name?.[0] || '?'}</div>
                      <div>
                        <h3 className="font-bold text-base">{detail.guest?.name}</h3>
                        <p className="text-xs text-muted-foreground">{detail.guest?.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={closeDetail} data-testid="close-guest-modal"><X className="h-4 w-4" /></Button>
                  </div>
                  {detail.guest?.tags?.includes('vip') && <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">VIP</span>}
                </div>

                {/* Spend Summary */}
                <div className="p-5 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Spend Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/20" data-testid="guest-total-spend">
                      <p className="text-xl font-bold text-green-500">${(detail.spend_summary?.total_spend || 0).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total Spend</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg" data-testid="guest-total-tabs">
                      <p className="text-xl font-bold">{detail.spend_summary?.total_sessions || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Total Tabs</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg" data-testid="guest-avg-spend">
                      <p className="text-xl font-bold text-primary">${(detail.spend_summary?.avg_spend || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Avg Spend</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <p className="text-sm font-bold">{detail.guest?.visits || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Visits</p>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <p className="text-sm font-bold">{detail.guest?.reward_points || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Points</p>
                    </div>
                  </div>
                </div>

                {/* Event History */}
                <div className="p-5 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Event History ({detail.events?.length || 0})</h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {detail.events?.length > 0 ? detail.events.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-xs" data-testid={`guest-event-${i}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span className="font-medium">{ev.event_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-full ${ev.event_status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>{ev.event_status}</span>
                          <span className="text-muted-foreground">{ev.event_date ? new Date(ev.event_date).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">No events attended</p>}
                  </div>
                </div>

                {/* Recent Tabs */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Tabs ({detail.sessions?.length || 0})</h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {detail.sessions?.length > 0 ? detail.sessions.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-xs">
                        <span className={`font-medium ${s.status === 'open' ? 'text-blue-500' : 'text-green-500'}`}>{s.status}</span>
                        <span className="font-bold">${s.total.toFixed(2)}</span>
                        <span className="text-muted-foreground">{s.opened_at ? new Date(s.opened_at).toLocaleDateString() : ''}</span>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">No tabs</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Guest not found</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   6. REPORTS & FINANCE
   ═══════════════════════════════════════════════════════════════════ */
function ReportsSection() {
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p) => {
    managerAPI.getSalesReport(VID(), p || period).then(r => setReport(r.data)).finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const changePeriod = (p) => { setPeriod(p); setLoading(true); load(p); };

  const exportCSV = async () => {
    try {
      const res = await managerAPI.exportReport(VID(), period);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `sales_${period}.csv`; a.click();
      toast.success('Export downloaded');
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="reports-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Reports & Finance</h2>
        <div className="flex items-center gap-2">
          {['today', 'week', 'month'].map(p => (
            <button key={p} onClick={() => changePeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="export-csv-btn"><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
        </div>
      </div>

      {report && (
        <>
          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {report.by_method?.map(m => (
              <div key={m.method} className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground capitalize">{m.method}</p>
                <p className="text-2xl font-bold text-green-500">${m.total.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{m.count} transactions</p>
              </div>
            ))}
          </div>

          {/* Sales by Hour */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-3">Sales by Hour</h3>
            <div className="h-32 flex items-end gap-1">
              {report.by_hour?.length > 0 ? report.by_hour.map((h, i) => {
                const max = Math.max(...report.by_hour.map(x => x.revenue), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-emerald-500/80 rounded-t" style={{ height: `${(h.revenue / max) * 100}px` }} title={`$${h.revenue.toFixed(0)}`} />
                    <span className="text-[10px] text-muted-foreground">{h.hour}h</span>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground m-auto">No data</p>}
            </div>
          </div>

          {/* Sales by Item */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-3">Sales by Item</h3>
            <div className="grid grid-cols-5 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground uppercase"><span>Item</span><span>Category</span><span>Qty</span><span>Revenue</span><span></span></div>
            {report.by_item?.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 px-3 py-2 text-sm border-b border-border/20">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.category}</span>
                <span>{item.qty}</span>
                <span className="text-green-500 font-bold">${item.revenue.toFixed(2)}</span>
                <span />
              </div>
            ))}
          </div>

          {/* Exceptions */}
          {report.exceptions?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Exceptions (Voids)</h3>
              {report.exceptions.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-2 text-sm border-b border-border/20">
                  <span className="text-red-500">{e.name}</span>
                  <span className="text-muted-foreground">{e.reason || 'No reason'}</span>
                  <span className="font-bold">${e.amount.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{e.voided_by}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   7. LOYALTY & REWARDS
   ═══════════════════════════════════════════════════════════════════ */
function LoyaltySection() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerAPI.getLoyalty(VID()).then(r => setConfig(r.data)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!config) return;
    const fd = new FormData();
    fd.append('venue_id', VID());
    fd.append('enabled', config.enabled.toString());
    fd.append('points_per_dollar', config.points_per_dollar.toString());
    fd.append('daily_limit', config.daily_limit.toString());
    fd.append('anti_fraud_max', config.anti_fraud_max_per_visit.toString());
    await managerAPI.saveLoyalty(fd);
    toast.success('Loyalty config saved');
  };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="loyalty-section">
      <h2 className="text-xl font-bold mb-4">Loyalty & Rewards</h2>

      {config && (
        <div className="max-w-lg space-y-5">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={config.enabled} onChange={e => setConfig(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4" />
            <label className="text-sm font-medium">Loyalty Program Enabled</label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Points per Dollar</label>
            <Input type="number" value={config.points_per_dollar} onChange={e => setConfig(p => ({ ...p, points_per_dollar: parseInt(e.target.value) || 1 }))} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Daily Points Limit</label>
            <Input type="number" value={config.daily_limit} onChange={e => setConfig(p => ({ ...p, daily_limit: parseInt(e.target.value) || 500 }))} />
            <p className="text-xs text-muted-foreground">Anti-fraud: max points a guest can earn per day</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Points per Visit</label>
            <Input type="number" value={config.anti_fraud_max_per_visit} onChange={e => setConfig(p => ({ ...p, anti_fraud_max_per_visit: parseInt(e.target.value) || 200 }))} />
          </div>

          {/* Tiers */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Tiers</h3>
            <div className="space-y-2">
              {config.tiers?.map((tier, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <Gift className={`h-4 w-4 ${i === 0 ? 'text-amber-700' : i === 1 ? 'text-gray-400' : 'text-yellow-500'}`} />
                  <span className="font-medium text-sm flex-1">{tier.name}</span>
                  <span className="text-xs text-muted-foreground">{tier.min_points} pts</span>
                  <span className="text-xs text-primary font-bold">{tier.discount_pct}% off</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={save} data-testid="save-loyalty-btn">Save Configuration</Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   8. SETTINGS
   ═══════════════════════════════════════════════════════════════════ */
function SettingsSection() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateVenue, setShowCreateVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueMode, setNewVenueMode] = useState('disco');

  useEffect(() => {
    managerAPI.getSettings(VID()).then(r => setSettings(r.data)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const fd = new FormData();
    fd.append('venue_id', VID());
    if (settings.venue_name) fd.append('venue_name', settings.venue_name);
    if (settings.bar_mode) fd.append('bar_mode', settings.bar_mode);
    if (settings.kds_enabled !== undefined) fd.append('kds_enabled', settings.kds_enabled.toString());
    if (settings.currency) fd.append('currency', settings.currency);
    await managerAPI.updateSettings(fd);
    // Update local storage with new name
    if (settings.venue_name) localStorage.setItem('active_venue_name', settings.venue_name);
    toast.success('Settings saved');
  };

  const handleCreateVenue = async () => {
    if (!newVenueName.trim()) { toast.error('Enter venue name'); return; }
    try {
      const { venueAPI: vAPI } = await import('../services/api');
      const fd = new FormData();
      fd.append('name', newVenueName.trim());
      fd.append('bar_mode', newVenueMode);
      await vAPI.createVenue(fd);
      setNewVenueName(''); setShowCreateVenue(false);
      toast.success('Venue created! Refresh to see it.');
    } catch { toast.error('Failed to create venue'); }
  };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="settings-section">
      <h2 className="text-xl font-bold mb-5">Settings</h2>
      <div className="max-w-lg space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Venue Name</label>
          <Input value={settings.venue_name || VNAME()} onChange={e => setSettings(p => ({ ...p, venue_name: e.target.value }))} data-testid="setting-venue-name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Operating Mode</label>
          <select value={settings.bar_mode || 'disco'} onChange={e => setSettings(p => ({ ...p, bar_mode: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="setting-bar-mode">
            <option value="disco">Club / Disco</option><option value="restaurant">Restaurant</option><option value="bar">Bar</option><option value="event">Event Space</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <Input value={settings.currency || 'USD'} onChange={e => setSettings(p => ({ ...p, currency: e.target.value }))} data-testid="setting-currency" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={settings.kds_enabled !== false} onChange={e => setSettings(p => ({ ...p, kds_enabled: e.target.checked }))} className="w-4 h-4" data-testid="setting-kds" />
          <label className="text-sm font-medium">KDS Enabled</label>
        </div>

        <div className="pt-2 border-t border-border">
          <h3 className="text-sm font-semibold mb-3">Integrations</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div><p className="text-sm font-medium">Stripe Payments</p><p className="text-xs text-muted-foreground">Accept card payments</p></div>
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div><p className="text-sm font-medium">NFC Wristbands</p><p className="text-xs text-muted-foreground">Cashless event mode</p></div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Available</span>
            </div>
          </div>
        </div>

        <Button onClick={save} data-testid="save-settings-btn">Save Settings</Button>

        {/* Create New Venue */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Venue Management</h3>
            <Button size="sm" variant="outline" onClick={() => setShowCreateVenue(!showCreateVenue)} data-testid="create-venue-toggle">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Venue
            </Button>
          </div>
          {showCreateVenue && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3" data-testid="create-venue-form">
              <Input value={newVenueName} onChange={e => setNewVenueName(e.target.value)} placeholder="Venue name" data-testid="new-venue-name" />
              <select value={newVenueMode} onChange={e => setNewVenueMode(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="new-venue-mode">
                <option value="disco">Club / Disco</option><option value="restaurant">Restaurant</option><option value="bar">Bar</option><option value="event">Event Space</option>
              </select>
              <div className="flex gap-2">
                <Button onClick={handleCreateVenue} disabled={!newVenueName.trim()} data-testid="create-venue-submit">Create Venue</Button>
                <Button variant="outline" onClick={() => setShowCreateVenue(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TABLES BY SERVER
   ═══════════════════════════════════════════════════════════════════ */
function TablesByServerSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    managerAPI.getTablesByServer(VID()).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time WebSocket refresh
  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/api/ws/manager/${VID()}`;
    let ws = null;
    let timer = null;
    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onmessage = () => load();
      ws.onclose = () => { timer = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    }
    connect();
    // Also poll every 10s as fallback
    const poll = setInterval(load, 10000);
    return () => { clearInterval(poll); if (timer) clearTimeout(timer); if (ws) { ws.onclose = null; ws.close(); } };
  }, [load]);

  const handleTableClick = async (tableId) => {
    setSelectedTableId(tableId);
    setDetailLoading(true);
    try {
      const res = await managerAPI.getTableDetail(tableId);
      setTableDetail(res.data);
    } catch { toast.error('Failed to load table'); setTableDetail(null); }
    setDetailLoading(false);
  };

  const handleVoidItem = async (sessionId, itemId) => {
    try {
      const fd = new FormData();
      fd.append('session_id', sessionId);
      fd.append('item_id', itemId);
      await managerAPI.voidTableItem(fd);
      toast.success('Item voided');
      // Refresh detail
      const res = await managerAPI.getTableDetail(selectedTableId);
      setTableDetail(res.data);
    } catch { toast.error('Failed to void item'); }
  };

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data</p>;

  const TableCard = ({ t, borderClass = 'border-border' }) => (
    <div key={t.table_id}
      onClick={() => handleTableClick(t.table_id)}
      className={`bg-card border ${borderClass} rounded-xl p-3 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${selectedTableId === t.table_id ? 'ring-2 ring-primary' : ''}`}
      data-testid={`server-table-${t.table_number}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm">Table #{t.table_number}</span>
        {t.tab_number && <span className="text-xs text-primary font-bold">#{t.tab_number}</span>}
      </div>
      <p className="text-xs text-muted-foreground truncate">{t.guest_name}</p>
      <p className="text-sm font-bold text-green-500 mt-1">${t.total.toFixed(2)}</p>
    </div>
  );

  return (
    <div data-testid="tables-server-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Tables by Server</h2>
          <p className="text-sm text-muted-foreground">{data.total_tables} occupied tables — click a table to see order</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Server groups */}
        <div className="col-span-7 space-y-6">
          {data.servers?.map(server => (
            <div key={server.server_name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">{server.server_name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{server.table_count} tables</span>
                </div>
                <span className="text-sm font-bold text-green-500">${server.total_revenue.toFixed(0)} running</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {server.tables.map(t => <TableCard key={t.table_id} t={t} />)}
              </div>
            </div>
          ))}

          {data.unassigned?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-bold text-sm text-red-500">Unassigned Tables</span>
                <span className="text-xs text-muted-foreground bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">{data.unassigned.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {data.unassigned.map(t => <TableCard key={t.table_id} t={t} borderClass="border-2 border-red-500/30" />)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Table Detail Drill-down */}
        <div className="col-span-5 border-l border-border pl-6">
          {selectedTableId ? (
            detailLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading...</div>
            ) : tableDetail ? (
              <div data-testid="table-drilldown-detail">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">Table #{tableDetail.table_number}</h3>
                    <p className="text-xs text-muted-foreground">{tableDetail.zone} — {tableDetail.capacity} seats — {tableDetail.status}</p>
                  </div>
                  <button onClick={() => { setSelectedTableId(null); setTableDetail(null); }}
                    className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
                </div>

                {tableDetail.session ? (
                  <>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{tableDetail.session.guest_name}</span>
                          {tableDetail.session.tab_number && <span className="text-primary font-bold ml-2">#{tableDetail.session.tab_number}</span>}
                        </div>
                        <span className="text-lg font-bold text-primary">${tableDetail.session.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>Server: {tableDetail.session.server_name || '—'}</span>
                        <span>Opened: {tableDetail.session.opened_at ? new Date(tableDetail.session.opened_at).toLocaleTimeString() : '—'}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold mb-2">Order Items ({tableDetail.items.length})</h4>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {tableDetail.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No items</p>
                      ) : tableDetail.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 text-sm border border-transparent hover:border-border">
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">x{item.qty}</span>
                            <span className="font-medium w-16 text-right">${item.line_total.toFixed(2)}</span>
                            <button onClick={() => handleVoidItem(tableDetail.session.id, item.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              data-testid={`mgr-void-${item.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    <p className="text-sm">Table is available — no active session</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">Failed to load</div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Eye className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Click a table to view order details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   SHIFT VS OPERATIONS
   ═══════════════════════════════════════════════════════════════════ */
function ShiftOpsSection() {
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [overview, setOverview] = useState(null);
  const [staffCosts, setStaffCosts] = useState(null);
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomize, setShowCustomize] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [editRole, setEditRole] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleRate, setNewRoleRate] = useState('');
  const [aiConversations, setAiConversations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');

  const getDateRange = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (period === 'today') return [today, today];
    if (period === '7d') { const d = new Date(); d.setDate(d.getDate() - 7); return [d.toISOString().slice(0, 10), today]; }
    if (period === '30d') { const d = new Date(); d.setDate(d.getDate() - 30); return [d.toISOString().slice(0, 10), today]; }
    if (period === 'year') { return [new Date().getFullYear() + '-01-01', today]; }
    if (period === 'custom') return [dateFrom, dateTo];
    return [today, today];
  }, [period, dateFrom, dateTo]);

  const load = useCallback(() => {
    const [df, dt] = getDateRange();
    setLoading(true);
    Promise.all([
      managerAPI.getShiftOverview(VID(), df, dt),
      managerAPI.getStaffCosts(VID(), df, dt),
      managerAPI.getShiftHistory(VID(), period === 'year' ? 365 : 30),
      managerAPI.getShiftChart(VID(), period, df, dt),
      managerAPI.getStaffRoles(VID()),
    ]).then(([ov, sc, hist, chart, rl]) => {
      setOverview(ov.data);
      setStaffCosts(sc.data);
      setHistory(hist.data.history || []);
      setChartData(chart.data.data || []);
      setRoles(rl.data.roles || []);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [getDateRange, period]);

  useEffect(() => { load(); }, [load]);

  // WebSocket: auto-refresh Shift data when Tap/Bar events happen
  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/api/ws/manager/${VID()}`;
    let ws = null;
    let timer = null;
    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onmessage = () => load();
      ws.onclose = () => { timer = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { if (timer) clearTimeout(timer); if (ws) { ws.onclose = null; ws.close(); } };
  }, [load]);

  const customizeStaffMember = async (id) => {
    if (!editRate && !editRole) return;
    const fd = new FormData();
    if (editRole) fd.append('role', editRole);
    if (editRate) fd.append('hourly_rate', editRate);
    await managerAPI.customizeStaff(id, fd);
    setEditingStaff(null); setEditRate(''); setEditRole(''); load(); toast.success('Updated');
  };

  const saveRole = async () => {
    if (!newRoleName.trim() || !newRoleRate) return;
    const fd = new FormData();
    fd.append('venue_id', VID()); fd.append('name', newRoleName.trim()); fd.append('hourly_rate', newRoleRate);
    await managerAPI.saveStaffRole(fd);
    setNewRoleName(''); setNewRoleRate(''); load(); toast.success('Role created');
  };

  const deleteRole = async (id) => {
    await managerAPI.deleteStaffRole(id, VID());
    load(); toast.success('Role removed');
  };

  const snapshotToday = async () => {
    const fd = new FormData(); fd.append('venue_id', VID());
    await managerAPI.saveShiftSnapshot(fd);
    toast.success('Shift costs snapshotted for today');
  };

  const runAI = async (questionText) => {
    const q = questionText || aiQuestion.trim();
    if (!q && aiConversations.length > 0) return;
    const [df, dt] = getDateRange();
    setAiLoading(true);
    setAiQuestion('');
    try {
      const fd = new FormData();
      fd.append('venue_id', VID()); fd.append('date_from', df); fd.append('date_to', dt);
      if (q) fd.append('question', q);
      const res = await managerAPI.shiftAI(fd);
      const entry = {
        id: Date.now(),
        question: q || null,
        insight: res.data.insight,
        data: res.data.data,
        timestamp: new Date().toISOString(),
      };
      setAiConversations(prev => [...prev, entry]);
    } catch { toast.error('AI analysis failed'); }
    setAiLoading(false);
  };

  const removeAiCard = (id) => {
    setAiConversations(prev => prev.filter(c => c.id !== id));
  };

  const handleAiNextStep = (step) => {
    setAiQuestion(step);
  };

  const [copiedId, setCopiedId] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);

  const handleKpiDrilldown = async (kpi) => {
    try {
      const res = await managerAPI.getShiftDrilldown(VID(), kpi, dateFrom || undefined, dateTo || undefined);
      setDrilldownData(res.data);
    } catch { toast.error('Failed to load drill-down'); }
  };
  const copyInsight = (conv) => {
    const insight = conv.insight;
    const text = [
      `Classification: ${insight.classification?.toUpperCase()}`,
      `\nSummary:\n${insight.summary}`,
      `\nWhat We See:\n${insight.what_we_see}`,
      `\nRecommended Actions:\n${(insight.recommended_actions || []).map((a, i) => `  ${i+1}. ${a}`).join('\n')}`,
      insight.reference ? `\nReference: ${insight.reference}` : '',
      insight.next_steps?.length ? `\nNext Steps:\n${insight.next_steps.map((s, i) => `  ${i+1}. ${s}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(conv.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Insight copied');
  };

  // Categorize next steps with labels
  const categorizeStep = (step) => {
    const lower = step.toLowerCase();
    if (lower.includes('revenue') || lower.includes('ticket') || lower.includes('price') || lower.includes('margin') || lower.includes('sales'))
      return { label: 'Revenue', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
    if (lower.includes('staff') || lower.includes('team') || lower.includes('bartender') || lower.includes('server') || lower.includes('hire'))
      return { label: 'Staff', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    return { label: 'Ops', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
  };

  if (loading) return <Skeleton />;

  const statusColors = { positive: 'text-green-500', tight: 'text-yellow-500', negative: 'text-red-500' };
  const statusBg = { positive: 'bg-green-500/10', tight: 'bg-yellow-500/10', negative: 'bg-red-500/10' };
  const classColors = { healthy: 'text-green-500', tight: 'text-yellow-500', underperforming: 'text-red-500' };

  return (
    <div data-testid="shift-ops-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Shift vs Operations</h2>
          <p className="text-sm text-muted-foreground">Revenue, cost, and performance analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {['today', '7d', '30d', 'year', 'custom'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} data-testid={`period-${p}`}>
              {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === 'year' ? 'Year' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex gap-3 items-center mb-4 bg-card border border-border rounded-lg p-3">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
          <Button size="sm" onClick={load}>Apply</Button>
        </div>
      )}

      {/* 1: Shift Overview KPIs — clickable with drill-down */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div onClick={() => handleKpiDrilldown('revenue')} className="cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
            <KPICard icon={DollarSign} label="Revenue" value={`$${overview.revenue.toFixed(0)}`} accent="text-green-500" testid="shift-revenue" />
          </div>
          <div onClick={() => handleKpiDrilldown('tables')} className="cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
            <KPICard icon={Check} label="Tables Closed" value={overview.tables_closed} testid="shift-tables" />
          </div>
          <div onClick={() => handleKpiDrilldown('staff_cost')} className="cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
            <KPICard icon={Users} label="Staff Cost" value={`$${overview.staff_cost.toFixed(0)}`} accent="text-orange-500" testid="shift-cost" />
          </div>
          <div onClick={() => handleKpiDrilldown('tips')} className="cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-xl transition-all">
            <KPICard icon={TrendingUp} label="Tips" value={`$${(overview.tips || 0).toFixed(0)}`} accent="text-blue-500" testid="shift-tips" />
          </div>
          <div className={`bg-card border-2 rounded-xl p-4 ${overview.status === 'positive' ? 'border-green-500/40' : overview.status === 'tight' ? 'border-yellow-500/40' : 'border-red-500/40'}`} data-testid="shift-result">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><Activity className="h-3.5 w-3.5" /><span className="text-xs">Net Result</span></div>
            <p className={`text-2xl font-bold ${statusColors[overview.status]}`}>${overview.result.toFixed(0)}</p>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBg[overview.status]} ${statusColors[overview.status]}`}>{overview.status}</span>
          </div>
        </div>
      )}

      {/* KPI Drilldown Modal */}
      {drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="kpi-drilldown-modal">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg capitalize">{drilldownData.kpi} Drill-down ({drilldownData.count} items)</h3>
              <Button variant="ghost" size="icon" onClick={() => setDrilldownData(null)} data-testid="close-drilldown"><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {drilldownData.items?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <div className="space-y-2">
                  {drilldownData.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-muted/20 border border-border/50 text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.guest_name || item.name || `Item ${i+1}`}</span>
                        {item.tab_number && <span className="text-primary font-bold ml-2">#{item.tab_number}</span>}
                        {item.table_number && <span className="text-muted-foreground ml-2">T{item.table_number}</span>}
                        {item.server_name && <span className="text-muted-foreground ml-2">{item.server_name}</span>}
                        {item.role && <span className="text-muted-foreground ml-2 text-xs">{item.role}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {item.total !== undefined && <span className="font-bold text-green-500">${item.total?.toFixed?.(2) || item.total}</span>}
                        {item.tip_amount !== undefined && <span className="font-bold text-blue-500">${item.tip_amount?.toFixed?.(2) || item.tip_amount}</span>}
                        {item.wages !== undefined && <span className="text-orange-500">${item.wages?.toFixed?.(2) || item.wages}</span>}
                        {item.closed_at && <span className="text-xs text-muted-foreground">{new Date(item.closed_at).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2: Staff Earnings / Cost Breakdown */}
      {staffCosts && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Staff Earnings / Cost Breakdown</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={snapshotToday} data-testid="snapshot-btn"><Clock className="h-3.5 w-3.5 mr-1" /> Snapshot</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCustomize(!showCustomize)} data-testid="customize-btn"><Settings className="h-3.5 w-3.5 mr-1" /> Customize</Button>
            </div>
          </div>
          <div className="text-sm mb-3 font-bold text-orange-500">Total Cost: ${staffCosts.total_cost.toFixed(2)}</div>
          <div className="grid grid-cols-8 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase"><span>Name</span><span>Role</span><span>$/Hour</span><span>Hours</span><span>Wages</span><span>Tips</span><span>Total</span><span></span></div>
          {staffCosts.staff?.map(s => (
            <div key={s.id} className="grid grid-cols-8 gap-3 px-3 py-2.5 text-sm border-b border-border/20 items-center">
              {editingStaff === s.id ? (
                <>
                  <span className="font-medium">{s.name}</span>
                  <Input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder={s.role} className="h-7 text-xs" />
                  <Input type="number" step="0.5" value={editRate} onChange={e => setEditRate(e.target.value)} placeholder={s.hourly_rate.toString()} className="h-7 text-xs" />
                  <span className="text-muted-foreground">{s.hours_worked}h</span>
                  <span />
                  <span />
                  <span />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => customizeStaffMember(s.id)}><Check className="h-3 w-3 text-green-500" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingStaff(null)}><X className="h-3 w-3" /></Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground capitalize">{s.role}</span>
                  <span className="font-medium">${s.hourly_rate.toFixed(2)}</span>
                  <span className="text-muted-foreground">{s.hours_worked}h</span>
                  <span className="text-orange-500">${(s.wages ?? s.earned ?? 0).toFixed(2)}</span>
                  <span className="text-blue-500">${(s.tips ?? 0).toFixed(2)}</span>
                  <span className="font-bold text-orange-500">${(s.total ?? s.earned ?? 0).toFixed(2)}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingStaff(s.id); setEditRate(s.hourly_rate.toString()); setEditRole(s.role); }}><Pencil className="h-3 w-3" /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3: Customize Staff Roles */}
      {showCustomize && (
        <div className="bg-card border border-primary/20 rounded-xl p-5 mb-6" data-testid="customize-roles">
          <h3 className="text-sm font-semibold mb-3">Custom Roles</h3>
          <div className="space-y-1 mb-3">
            {roles.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/20">
                <div><span className="font-medium text-sm">{r.name}</span><span className="text-xs text-muted-foreground ml-2">${r.hourly_rate}/hr</span></div>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRole(r.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Role name" className="max-w-xs" />
            <Input type="number" step="0.5" value={newRoleRate} onChange={e => setNewRoleRate(e.target.value)} placeholder="$/hour" className="w-24" />
            <Button onClick={saveRole} disabled={!newRoleName || !newRoleRate} data-testid="add-role-btn"><Plus className="h-4 w-4 mr-1" /> Add Role</Button>
          </div>
        </div>
      )}

      {/* 4: Shift History / Day Performance */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">Day Performance History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shift data available</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase"><span>Date</span><span>Day</span><span>Revenue</span><span>Staff Cost</span><span>Tabs</span><span>Result</span><span>Status</span></div>
            <div className="max-h-60 overflow-y-auto">
              {history.map(h => (
                <div key={h.date} className="grid grid-cols-7 gap-3 px-3 py-2 text-sm border-b border-border/20 items-center" data-testid={`day-${h.date}`}>
                  <span className="font-medium">{h.date}</span>
                  <span className="text-muted-foreground">{h.day_name?.slice(0, 3)}</span>
                  <span className="text-green-500 font-bold">${h.revenue.toFixed(0)}</span>
                  <span className="text-orange-500">${h.staff_cost.toFixed(0)}</span>
                  <span>{h.tabs_closed}</span>
                  <span className={`font-bold ${statusColors[h.status]}`}>${h.result.toFixed(0)}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block w-fit ${statusBg[h.status]} ${statusColors[h.status]}`}>{h.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 5: Chart — Revenue × Cost */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">Revenue vs Operation Cost</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chart data</p>
        ) : (
          <div className="h-48 flex items-end gap-0.5">
            {chartData.map((d, i) => {
              const maxVal = Math.max(...chartData.map(x => Math.max(x.revenue, x.cost)), 1);
              const revH = (d.revenue / maxVal) * 160;
              const costH = (d.cost / maxVal) * 160;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.label}: Rev $${d.revenue} | Cost $${d.cost}`}>
                  <div className="w-full flex gap-px justify-center">
                    <div className="w-1/2 bg-green-500/80 rounded-t" style={{ height: `${revH}px` }} />
                    <div className="w-1/2 bg-orange-500/60 rounded-t" style={{ height: `${costH}px` }} />
                  </div>
                  <span className="text-[8px] text-muted-foreground truncate w-full text-center">{d.label?.slice(0, 6)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-4 mt-3 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-500/80 rounded" /> Revenue</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-orange-500/60 rounded" /> Staff Cost</span>
        </div>
      </div>

      {/* 6: AI Analysis — Conversational */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6" data-testid="shift-ai-section">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">AI Operations Partner</h3>
            <p className="text-xs text-muted-foreground">Powered by GPT-5.2 — ask about this shift</p>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="space-y-3 mb-3 max-h-[500px] overflow-y-auto pr-1">
          {/* Empty State */}
          {aiConversations.length === 0 && !aiLoading && (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center" data-testid="shift-ai-empty">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">AI Shift Analysis</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                Get an AI analysis of this shift or ask specific questions about staffing, costs, and performance.
              </p>
              <Button size="sm" onClick={() => runAI(null)} data-testid="shift-initial-ai-btn">
                <Zap className="h-3.5 w-3.5 mr-1" /> Analyze This Shift
              </Button>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {[
                  "Am I overstaffed for this shift?",
                  "What is the cost per table?",
                  "How can I improve margins?",
                ].map((s, i) => (
                  <button key={i} onClick={() => setAiQuestion(s)}
                    className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    data-testid={`shift-suggestion-${i}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Cards */}
          {aiConversations.map((conv) => (
            <div key={conv.id} className="space-y-2" data-testid={`shift-ai-conv-${conv.id}`}>
              {/* User question */}
              {conv.question && (
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 max-w-md">
                    <p className="text-sm font-medium">{conv.question}</p>
                  </div>
                </div>
              )}

              {/* AI Response — Redesigned */}
              {conv.insight && (
                <div className={`border rounded-xl overflow-hidden ${
                  conv.insight.classification === 'healthy' ? 'border-green-500/30' :
                  conv.insight.classification === 'tight' ? 'border-yellow-500/30' :
                  'border-red-500/30'
                }`} data-testid={`shift-ai-result-${conv.id}`}>

                  {/* Card Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    conv.insight.classification === 'healthy' ? 'bg-green-500/8' :
                    conv.insight.classification === 'tight' ? 'bg-yellow-500/8' :
                    'bg-red-500/8'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Lightbulb className={`h-4 w-4 ${classColors[conv.insight.classification] || 'text-blue-500'}`} />
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        conv.insight.classification === 'healthy' ? 'bg-green-500/15 text-green-600' :
                        conv.insight.classification === 'tight' ? 'bg-yellow-500/15 text-yellow-600' :
                        'bg-red-500/15 text-red-600'
                      }`}>{conv.insight.classification}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => copyInsight(conv)}
                        className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                        title="Copy insight"
                        data-testid={`copy-shift-ai-${conv.id}`}>
                        {copiedId === conv.id
                          ? <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => removeAiCard(conv.id)}
                        className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                        data-testid={`delete-shift-ai-${conv.id}`}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4 space-y-4 bg-card">
                    {/* Summary */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-sm font-semibold leading-relaxed">{conv.insight.summary}</p>
                    </div>

                    {/* What We See */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">What We See</p>
                      <p className="text-sm leading-relaxed text-foreground/90">{conv.insight.what_we_see}</p>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Recommended Actions</p>
                      <div className="space-y-1.5">
                        {(conv.insight.recommended_actions || []).map((a, i) => (
                          <div key={i} className="flex items-start gap-2.5 pl-1">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>
                            <span className="text-sm leading-relaxed">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {conv.insight.reference && (
                      <div className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
                        {conv.insight.reference}
                      </div>
                    )}

                    {/* Next Steps — Clean, contextual */}
                    {conv.insight.next_steps && conv.insight.next_steps.length > 0 && (
                      <div className="pt-3 border-t border-border/50" data-testid={`shift-next-steps-${conv.id}`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Next Steps</p>
                        <div className="space-y-1.5">
                          {conv.insight.next_steps.map((step, si) => (
                            <button key={si} onClick={() => handleAiNextStep(step)}
                              className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                              data-testid={`shift-next-step-${conv.id}-${si}`}>
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{si+1}</span>
                              <p className="text-sm leading-relaxed group-hover:text-primary transition-colors flex-1">{step}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {aiLoading && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center animate-pulse" data-testid="shift-ai-loading">
              <Zap className="h-5 w-5 text-primary mx-auto mb-1 animate-spin" />
              <p className="text-xs text-primary font-medium">Analyzing shift data...</p>
            </div>
          )}
        </div>

        {/* Always-visible Input */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <textarea
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { /* allow newline */ } }}
            placeholder="Ask about this shift — staffing, costs, performance..."
            className="flex-1 min-h-[36px] max-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={aiLoading}
            rows={1}
            data-testid="shift-ai-input"
          />
          <Button size="sm" onClick={() => runAI()} disabled={aiLoading || (!aiQuestion.trim() && aiConversations.length > 0)} data-testid="shift-ai-btn">
            {aiLoading ? <><Zap className="h-3.5 w-3.5 mr-1 animate-spin" /> ...</> : <><Zap className="h-3.5 w-3.5 mr-1" /> Ask</>}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">AI insights are read-only. Always validate decisions with your team.</p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TIPS VIEW
   ═══════════════════════════════════════════════════════════════════ */
function TipsSection() {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(() => {
    setLoading(true);
    managerAPI.getTipsDetail(VID(), dateFrom, dateTo)
      .then(r => setTips(r.data))
      .catch(() => toast.error('Failed to load tips'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton />;
  if (!tips) return <p className="text-muted-foreground">No data</p>;

  return (
    <div data-testid="tips-section">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Tips</h2>
          <p className="text-sm text-muted-foreground">{tips.count} tips recorded &mdash; Total: ${tips.total_tips.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-9 text-sm" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-9 text-sm" />
        </div>
      </div>

      {/* Summary by Server */}
      {tips.by_server?.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {tips.by_server.map(s => (
            <div key={s.server_name} className="bg-card border border-border rounded-xl p-4" data-testid={`tips-server-${s.server_name}`}>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-bold">{s.server_name}</span>
              </div>
              <p className="text-2xl font-extrabold text-blue-500">${s.total_tips.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{s.count} tip{s.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detail Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 gap-3 px-5 py-3 text-xs font-medium text-muted-foreground uppercase border-b border-border bg-muted/30">
          <span>Server</span>
          <span>Guest</span>
          <span>Tab #</span>
          <span className="text-right">Total Spent</span>
          <span className="text-right">Tip</span>
          <span className="text-right">%</span>
          <span className="text-right">Time</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-border/30">
          {tips.tips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No tips recorded for this period</p>
          ) : tips.tips.map((t, i) => (
            <div key={i} className="grid grid-cols-7 gap-3 px-5 py-3 text-sm items-center hover:bg-muted/20 transition-colors" data-testid={`tip-row-${i}`}>
              <span className="font-medium text-blue-600">{t.server_name}</span>
              <span className="truncate">{t.guest_name}</span>
              <span className="font-bold">{t.tab_number ? `#${t.tab_number}` : '-'}</span>
              <span className="text-right font-medium">${t.total_spent.toFixed(2)}</span>
              <span className="text-right font-bold text-blue-500">${t.tip_amount.toFixed(2)}</span>
              <span className="text-right text-muted-foreground">{t.tip_percent > 0 ? `${t.tip_percent}%` : '-'}</span>
              <span className="text-right text-xs text-muted-foreground">{t.closed_at ? new Date(t.closed_at).toLocaleTimeString() : '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function KPICard({ icon: Icon, label, value, accent = '', sub, testid, onClick }) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all' : ''}`}
      data-testid={testid}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1"><Icon className="h-3.5 w-3.5" /><span className="text-xs">{label}</span>{onClick && <Eye className="h-3 w-3 ml-auto opacity-40" />}</div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
      <div className="h-40 bg-muted rounded-xl" />
    </div>
  );
}

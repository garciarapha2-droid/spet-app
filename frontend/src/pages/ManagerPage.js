import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerAPI, tapAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Home, LogOut, Users, UtensilsCrossed, Settings,
  Plus, Pencil, Trash2, Check, X, BarChart3, DollarSign,
  Search, Calendar, Shield, Clock, AlertTriangle, Download,
  ChevronDown, ChevronRight, Gift, Nfc, FileText, Activity,
  TrendingUp, Eye, LayoutGrid, User
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
  { key: 'guests', label: 'NFC & Guests', icon: Nfc },
  { key: 'reports', label: 'Reports & Finance', icon: BarChart3 },
  { key: 'loyalty', label: 'Loyalty & Rewards', icon: Gift },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const ManagerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background" data-testid="manager-page">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">Manager Dashboard</h1>
          <span className="text-sm text-muted-foreground">{VNAME()}</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-56 border-r border-border bg-card min-h-[calc(100vh-56px)] p-3 space-y-0.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
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

  useEffect(() => {
    managerAPI.getOverview(VID()).then(r => setData(r.data)).catch(() => toast.error('Failed to load overview')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data available</p>;

  const { kpis, charts, alerts } = data;

  return (
    <div data-testid="overview-section">
      <h2 className="text-xl font-bold mb-4">Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={DollarSign} label="Revenue Today" value={`$${kpis.revenue_today.toFixed(0)}`} accent="text-green-500" testid="kpi-rev-today" />
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
                  <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(h.total / max) * 120}px` }} title={`$${h.total.toFixed(0)}`} />
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
        <Button onClick={() => setShowAdd(!showAdd)} data-testid="add-menu-item-btn"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
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
                <span className="font-bold text-primary">${item.price?.toFixed(2)}</span>
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
   5. NFC & GUESTS
   ═══════════════════════════════════════════════════════════════════ */
function GuestsSection() {
  const [guests, setGuests] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((q) => {
    managerAPI.getGuests(VID(), q || undefined).then(r => { setGuests(r.data.guests || []); setTotal(r.data.total || 0); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (guestId) => {
    setSelected(guestId);
    const r = await managerAPI.getGuestDetail(guestId, VID());
    setDetail(r.data);
  };

  const doSearch = () => { setLoading(true); load(search); };

  if (loading && guests.length === 0) return <Skeleton />;

  return (
    <div data-testid="guests-section">
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-bold">NFC & Guests</h2><p className="text-sm text-muted-foreground">{total} total guests</p></div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Search guests..." className="pl-9" />
        </div>
        <Button variant="outline" onClick={doSearch}>Search</Button>
      </div>

      <div className="flex gap-4">
        {/* Guest List */}
        <div className="flex-1 space-y-1">
          {guests.map(g => (
            <div key={g.id} onClick={() => loadDetail(g.id)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selected === g.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/20'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{g.name?.[0] || '?'}</div>
                <div>
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.email} — {g.visits || 0} visits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {g.tags?.includes('vip') && <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">VIP</span>}
                {g.wristband_blocked && <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">Blocked</span>}
                <span className="text-xs text-green-500 font-medium">${(g.spend_total || 0).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Detail */}
        {detail && (
          <div className="w-80 bg-card border border-border rounded-xl p-4 self-start" data-testid="guest-detail">
            <h3 className="font-bold mb-3">{detail.guest?.name}</h3>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-muted-foreground">Email:</span> {detail.guest?.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {detail.guest?.phone}</p>
              <p><span className="text-muted-foreground">Visits:</span> {detail.guest?.visits}</p>
              <p><span className="text-muted-foreground">Total Spend:</span> <span className="text-green-500 font-bold">${(detail.guest?.spend_total || 0).toFixed(2)}</span></p>
              <p><span className="text-muted-foreground">Points:</span> {detail.guest?.reward_points || 0}</p>
            </div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Recent Entries</h4>
            <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
              {detail.entries?.map((e, i) => (
                <div key={i} className="text-xs flex justify-between p-1 bg-muted/20 rounded">
                  <span>{e.entry_type} — {e.decision}</span>
                  <span className="text-muted-foreground">{e.date ? new Date(e.date).toLocaleDateString() : ''}</span>
                </div>
              ))}
            </div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Recent Tabs</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {detail.sessions?.map((s, i) => (
                <div key={i} className="text-xs flex justify-between p-1 bg-muted/20 rounded">
                  <span className={s.status === 'open' ? 'text-blue-500' : 'text-green-500'}>{s.status}</span>
                  <span className="font-bold">${s.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

  useEffect(() => {
    managerAPI.getSettings(VID()).then(r => setSettings(r.data)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const fd = new FormData();
    fd.append('venue_id', VID());
    if (settings.venue_name) fd.append('venue_name', settings.venue_name);
    if (settings.bar_mode) fd.append('bar_mode', settings.bar_mode);
    if (settings.kds_enabled !== undefined) fd.append('kds_enabled', settings.kds_enabled.toString());
    await managerAPI.updateSettings(fd);
    toast.success('Settings saved');
  };

  if (loading) return <Skeleton />;

  return (
    <div data-testid="settings-section">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="max-w-lg space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Venue Name</label>
          <Input value={settings.venue_name || VNAME()} onChange={e => setSettings(p => ({ ...p, venue_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Operating Mode</label>
          <select value={settings.bar_mode || 'disco'} onChange={e => setSettings(p => ({ ...p, bar_mode: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="disco">Club / Disco</option><option value="restaurant">Restaurant</option><option value="bar">Bar</option><option value="event">Event Space</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <Input value={settings.currency || 'USD'} onChange={e => setSettings(p => ({ ...p, currency: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={settings.kds_enabled !== false} onChange={e => setSettings(p => ({ ...p, kds_enabled: e.target.checked }))} className="w-4 h-4" />
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
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function KPICard({ icon: Icon, label, value, accent = '', sub, testid }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4" data-testid={testid}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1"><Icon className="h-3.5 w-3.5" /><span className="text-xs">{label}</span></div>
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

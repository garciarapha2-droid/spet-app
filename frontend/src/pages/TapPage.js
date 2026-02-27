import React, { useState, useEffect, useCallback } from 'react';
import { tapAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Beer, Plus, X, CreditCard, Banknote, Receipt,
  DollarSign, Users, ArrowLeft, ShoppingCart, Minus,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENUE_ID = '40a24e04-75b6-435d-bfff-ab0d469ce543';

// ── Tab Card ──
const TabCard = ({ session, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg border cursor-pointer transition-all ${
      isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
    }`}
    data-testid={`tab-card-${session.id}`}
  >
    <div className="flex items-center justify-between">
      <p className="font-semibold truncate">{session.guest_name}</p>
      <span className="text-lg font-bold text-primary">R${session.total.toFixed(2)}</span>
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      {session.session_type} — {new Date(session.opened_at).toLocaleTimeString()}
    </p>
  </div>
);

// ── Catalog Item ──
const CatalogItem = ({ item, onAdd }) => (
  <button
    onClick={() => onAdd(item)}
    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left w-full"
    data-testid={`catalog-item-${item.id}`}
  >
    <div>
      <p className="font-medium text-sm">{item.name}</p>
      <p className="text-xs text-muted-foreground">{item.category}</p>
    </div>
    <span className="text-sm font-semibold text-primary">R${item.price.toFixed(2)}</span>
  </button>
);

export const TapPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState({ open_tabs: 0, running_total: 0, closed_today: 0, revenue_today: 0 });
  const [catalog, setCatalog] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [showNewTab, setShowNewTab] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const [cfgRes, statsRes, catRes, sessRes] = await Promise.all([
          tapAPI.getConfig(VENUE_ID),
          tapAPI.getStats(VENUE_ID),
          tapAPI.getCatalog(VENUE_ID),
          tapAPI.listSessions(VENUE_ID, 'open'),
        ]);
        setConfig(cfgRes.data);
        setStats(statsRes.data);
        setCatalog(catRes.data.items || []);
        setSessions(sessRes.data.sessions || []);
      } catch (err) {
        console.error('TAP load error:', err);
      }
    };
    load();
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const [statsRes, sessRes] = await Promise.all([
        tapAPI.getStats(VENUE_ID),
        tapAPI.listSessions(VENUE_ID, 'open'),
      ]);
      setStats(statsRes.data);
      setSessions(sessRes.data.sessions || []);
    } catch {}
  }, []);

  // Load session details when active tab changes
  useEffect(() => {
    if (!activeSessionId) { setActiveSession(null); return; }
    const loadSession = async () => {
      try {
        const res = await tapAPI.getSession(activeSessionId);
        setActiveSession(res.data);
      } catch {
        setActiveSession(null);
      }
    };
    loadSession();
  }, [activeSessionId]);

  // ── Open new tab ──
  const handleOpenTab = async () => {
    if (!newTabName.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID);
      fd.append('guest_name', newTabName.trim());
      const res = await tapAPI.openSession(fd);
      toast.success(`Tab opened for ${newTabName}`);
      setActiveSessionId(res.data.session_id);
      setNewTabName('');
      setShowNewTab(false);
      await refreshStats();
    } catch (err) {
      toast.error('Failed to open tab');
    }
    setLoading(false);
  };

  // ── Add item to active tab ──
  const handleAddItem = async (catalogItem) => {
    if (!activeSessionId) { toast.error('Select a tab first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('item_id', catalogItem.id);
      fd.append('qty', '1');
      await tapAPI.addItem(activeSessionId, fd);
      // Refresh session details
      const res = await tapAPI.getSession(activeSessionId);
      setActiveSession(res.data);
      await refreshStats();
    } catch (err) {
      toast.error('Failed to add item');
    }
    setLoading(false);
  };

  // ── Close tab ──
  const handleCloseTab = async (method) => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('payment_method', method);
      await tapAPI.closeSession(activeSessionId, fd);
      toast.success('Tab closed');
      setActiveSessionId(null);
      setActiveSession(null);
      await refreshStats();
    } catch (err) {
      toast.error('Failed to close tab');
    }
    setLoading(false);
  };

  const categories = ['All', ...new Set(catalog.map(i => i.category))];
  const filteredCatalog = filterCategory === 'All' ? catalog : catalog.filter(i => i.category === filterCategory);

  return (
    <div className="min-h-screen bg-background" data-testid="tap-page">
      {/* Header */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pulse/entry')} data-testid="back-to-pulse">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">SPETAP</h1>
          <span className="text-sm text-muted-foreground">TAP — {config?.bar_mode?.toUpperCase() || 'DISCO'} Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/login')} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-8 py-8">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-8 mb-10">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Open Tabs
            </p>
            <p className="text-5xl font-semibold" data-testid="kpi-open-tabs">{stats.open_tabs}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" /> Running Total
            </p>
            <p className="text-5xl font-semibold" data-testid="kpi-running-total">R${stats.running_total.toFixed(0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Closed Today
            </p>
            <p className="text-5xl font-semibold" data-testid="kpi-closed-today">{stats.closed_today}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Revenue Today
            </p>
            <p className="text-5xl font-semibold" data-testid="kpi-revenue">R${stats.revenue_today.toFixed(0)}</p>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Open Tabs List */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Open Tabs</h2>
              <Button size="sm" onClick={() => setShowNewTab(true)} data-testid="new-tab-btn">
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>

            {showNewTab && (
              <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2" data-testid="new-tab-form">
                <Input value={newTabName} onChange={e => setNewTabName(e.target.value)}
                  placeholder="Guest name" autoFocus onKeyDown={e => e.key === 'Enter' && handleOpenTab()}
                  data-testid="new-tab-name-input" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleOpenTab} disabled={!newTabName.trim() || loading}
                    data-testid="confirm-new-tab-btn">Open</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewTab(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No open tabs</p>
              ) : (
                sessions.map(s => (
                  <TabCard key={s.id} session={s} isActive={s.id === activeSessionId}
                    onClick={() => setActiveSessionId(s.id)} />
                ))
              )}
            </div>
          </div>

          {/* Center: Catalog */}
          <div className="col-span-5">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            {/* Category filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {categories.map(cat => (
                <button key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`filter-${cat.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredCatalog.map(item => (
                <CatalogItem key={item.id} item={item} onAdd={handleAddItem} />
              ))}
            </div>
          </div>

          {/* Right: Active Tab Details */}
          <div className="col-span-4 border-l border-border pl-8">
            {activeSession ? (
              <div data-testid="active-tab-detail">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{activeSession.guest_name}</h2>
                    <p className="text-xs text-muted-foreground">{activeSession.session_type} — opened {new Date(activeSession.opened_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-2xl font-bold text-primary" data-testid="tab-total">
                    R${activeSession.total.toFixed(2)}
                  </span>
                </div>

                {/* Items list */}
                <div className="space-y-1 mb-6 max-h-[400px] overflow-y-auto">
                  {(activeSession.items || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No items yet — add from menu</p>
                  ) : (
                    activeSession.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground ml-2">x{item.qty}</span>
                        </div>
                        <span className="font-medium">R${item.line_total.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Checkout buttons */}
                {activeSession.status === 'open' && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Close Tab</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="h-12" onClick={() => handleCloseTab('card')} disabled={loading}
                        data-testid="pay-card-btn">
                        <CreditCard className="h-4 w-4 mr-1" /> Card
                      </Button>
                      <Button variant="outline" className="h-12" onClick={() => handleCloseTab('cash')} disabled={loading}
                        data-testid="pay-cash-btn">
                        <Banknote className="h-4 w-4 mr-1" /> Cash
                      </Button>
                      <Button variant="outline" className="h-12" onClick={() => handleCloseTab('comp')} disabled={loading}
                        data-testid="pay-comp-btn">
                        <Beer className="h-4 w-4 mr-1" /> Comp
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg">Select a tab to view details</p>
                <p className="text-sm">or open a new one</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

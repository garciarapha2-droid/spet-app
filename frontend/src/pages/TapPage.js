import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI, pulseAPI, rewardsAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  CreditCard, Banknote, Beer, Plus, X, Receipt,
  ScanLine, User, Search, ArrowLeft, LayoutGrid,
  LogOut, DollarSign, Star, ChevronDown, Home,
  Pencil, Trash2, Check
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const TabCard = ({ session, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
      isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
    }`}
    data-testid={`tab-card-${session.id}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium truncate text-sm">{session.guest_name}</span>
      </div>
      <span className="text-sm font-bold text-primary ml-2">R${(session.total || 0).toFixed(2)}</span>
    </div>
    <p className="text-xs text-muted-foreground mt-1">{session.session_type} — {new Date(session.opened_at).toLocaleTimeString()}</p>
  </button>
);

const CatalogItem = ({ item, onAdd }) => (
  <button
    onClick={() => onAdd(item)}
    className="p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
    data-testid={`catalog-item-${item.id}`}>
    <p className="font-medium text-sm truncate">{item.name}</p>
    <p className="text-primary font-bold text-sm mt-0.5">R${item.price?.toFixed(2)}</p>
  </button>
);

export const TapPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showNewTab, setShowNewTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [tableEnabled, setTableEnabled] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [selectedBarman, setSelectedBarman] = useState('');
  const [showBarmanMenu, setShowBarmanMenu] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Drinks' });

  // Barmen list (demo - in real app comes from manager config)
  const barmen = ['Carlos', 'Maria', 'João', 'Ana'];

  const loadData = useCallback(async () => {
    try {
      const [cfgRes, catRes, sessRes, statsRes] = await Promise.all([
        tapAPI.getConfig(VENUE_ID()).catch(() => ({ data: { bar_mode: 'disco' } })),
        tapAPI.getCatalog(VENUE_ID()),
        tapAPI.getActiveSessions(VENUE_ID()),
        tapAPI.getStats(VENUE_ID()),
      ]);
      setConfig(cfgRes.data);
      setCatalog(catRes.data.items || []);
      setSessions(sessRes.data.sessions || []);
      setStats(statsRes.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load active session detail
  useEffect(() => {
    if (!activeSessionId) { setActiveSession(null); return; }
    const load = async () => {
      try {
        const res = await tapAPI.getSession(activeSessionId);
        setActiveSession(res.data);
      } catch { setActiveSession(null); }
    };
    load();
  }, [activeSessionId]);

  const handleOpenTab = async () => {
    if (!newTabName.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('guest_name', newTabName.trim());
      const res = await tapAPI.openSession(fd);
      toast.success(`Tab opened for ${newTabName}`);
      setShowNewTab(false);
      setNewTabName('');
      await loadData();
      setActiveSessionId(res.data.session_id);
    } catch (err) { toast.error('Failed to open tab'); }
    setLoading(false);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    try {
      const res = await pulseAPI.getTodayEntries(VENUE_ID());
      const match = (res.data.entries || []).find(
        en => en.guest_name.toLowerCase().includes(scanInput.toLowerCase()) || en.guest_id === scanInput
      );
      if (match) {
        // Check if guest already has an open tab
        const existing = sessions.find(s => s.guest_name === match.guest_name);
        if (existing) {
          setActiveSessionId(existing.session_id);
          toast.info(`Found open tab for ${match.guest_name}`);
        } else {
          setNewTabName(match.guest_name);
          setShowNewTab(true);
          toast.info(`Guest found: ${match.guest_name}. Open a tab?`);
        }
      } else {
        toast.error('Guest not found');
      }
    } catch { toast.error('Scan failed'); }
    setScanInput('');
  };

  const handleAddItem = async (item) => {
    if (!activeSessionId) { toast.error('Select or open a tab first'); return; }
    if (!selectedBarman) { toast.error('Select a barman first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('item_id', item.id);
      fd.append('qty', '1');
      await tapAPI.addItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId);
      setActiveSession(res.data);
      await loadData();
    } catch (err) { toast.error('Failed to add item'); }
    setLoading(false);
  };

  const handleAddCustomItem = async () => {
    if (!activeSessionId) { toast.error('Select or open a tab first'); return; }
    if (!selectedBarman) { toast.error('Select a barman first'); return; }
    if (!customItem.name || !customItem.price) { toast.error('Name and price required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('item_name', customItem.name);
      fd.append('category', customItem.category);
      fd.append('unit_price', customItem.price);
      fd.append('qty', '1');
      await tapAPI.addCustomItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId);
      setActiveSession(res.data);
      setCustomItem({ name: '', price: '', category: 'Drinks' });
      setShowCustomItem(false);
      toast.success(`Added ${customItem.name}`);
      await loadData();
    } catch { toast.error('Failed to add item'); }
    setLoading(false);
  };

  const handleCloseTab = async (method) => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('payment_method', method);
      await tapAPI.closeSession(activeSessionId, fd);
      toast.success(`Tab closed (${method})`);
      setActiveSessionId(null);
      setActiveSession(null);
      await loadData();
    } catch (err) { toast.error('Failed to close tab'); }
    setLoading(false);
  };

  const handleVoidItem = async (itemId) => {
    if (!activeSessionId) return;
    try {
      const fd = new FormData();
      fd.append('item_id', itemId);
      await tapAPI.voidItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId);
      setActiveSession(res.data);
      await loadData();
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
  };

  const categories = ['All', ...new Set(catalog.map(i => i.category))];
  const filteredCatalog = filterCategory === 'All' ? catalog : catalog.filter(i => i.category === filterCategory);

  return (
    <div className="min-h-screen bg-background" data-testid="tap-page">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold tracking-tight">TAP</span>
          <div className="h-5 w-px bg-border" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider" data-testid="bar-mode">
            {config?.bar_mode || 'Disco'} Mode
          </span>
          <div className="h-5 w-px bg-border" />

          {/* Table Mode Toggle */}
          <label className="flex items-center gap-2 cursor-pointer" data-testid="table-toggle">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Table</span>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${tableEnabled ? 'bg-primary' : 'bg-muted'}`}
              onClick={() => { setTableEnabled(!tableEnabled); if (!tableEnabled) navigate('/table'); }}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${tableEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>

          {/* Barman Selector */}
          <div className="h-5 w-px bg-border" />
          <div className="relative">
            <button onClick={() => setShowBarmanMenu(!showBarmanMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors"
              data-testid="barman-selector">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{selectedBarman || 'Select barman'}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showBarmanMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                {barmen.map(b => (
                  <button key={b} onClick={() => { setSelectedBarman(b); setShowBarmanMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${selectedBarman === b ? 'text-primary font-medium' : ''}`}>
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats badges */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Tabs: <strong className="text-foreground">{stats.open_tabs || 0}</strong></span>
          </div>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn">
            <Home className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scanner + Tabs */}
          <div className="col-span-3 space-y-4">
            {/* NFC Scanner */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ScanLine className="h-3.5 w-3.5" /> Scan NFC / Search
              </h3>
              <form onSubmit={handleScan}>
                <Input value={scanInput} onChange={e => setScanInput(e.target.value)}
                  placeholder="NFC or guest name / number..."
                  className="h-10 text-sm mb-2" data-testid="tap-scan-input" />
                <Button type="submit" size="sm" className="w-full" data-testid="tap-scan-btn">Scan</Button>
              </form>
            </div>

            {/* Open Tabs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Open Tabs ({sessions.length})</h3>
                <Button size="sm" variant="outline" onClick={() => setShowNewTab(true)} data-testid="new-tab-btn">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              </div>

              {showNewTab && (
                <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2" data-testid="new-tab-form">
                  <Input value={newTabName} onChange={e => setNewTabName(e.target.value)}
                    placeholder="Guest name" autoFocus onKeyDown={e => e.key === 'Enter' && handleOpenTab()}
                    data-testid="new-tab-name-input" />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={handleOpenTab} disabled={!newTabName.trim() || loading}>Open</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewTab(false)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No open tabs</p>
                ) : sessions.map(s => (
                  <TabCard key={s.session_id} session={{ ...s, id: s.session_id }} isActive={s.session_id === activeSessionId}
                    onClick={() => setActiveSessionId(s.session_id)} />
                ))}
              </div>
            </div>
          </div>

          {/* Center: Menu */}
          <div className="col-span-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Menu</h2>
              <Button size="sm" variant="outline" onClick={() => setShowCustomItem(!showCustomItem)} data-testid="add-custom-menu-btn">
                <Plus className="h-3.5 w-3.5 mr-1" /> Custom Item
              </Button>
            </div>

            {/* Custom item form */}
            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-3 mb-3 flex gap-2 items-end" data-testid="custom-item-form">
                <div className="flex-1">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="Item name..." className="text-sm" />
                </div>
                <div className="w-24">
                  <Input type="number" step="0.01" value={customItem.price}
                    onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="R$" className="text-sm" />
                </div>
                <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm w-28">
                  <option>Drinks</option><option>Cervejas</option><option>Sem Alcool</option><option>Spirits</option><option>Cocktails</option><option>Other</option>
                </select>
                <Button size="sm" onClick={handleAddCustomItem}>Add</Button>
              </div>
            )}

            {/* Category filter */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {filteredCatalog.map(item => (
                <CatalogItem key={item.id} item={item} onAdd={handleAddItem} />
              ))}
            </div>
          </div>

          {/* Right: Active Tab */}
          <div className="col-span-4 border-l border-border pl-6">
            {activeSession ? (
              <div data-testid="active-tab-detail">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{activeSession.guest_name}</h2>
                    <p className="text-xs text-muted-foreground">{activeSession.session_type} — opened {new Date(activeSession.opened_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-2xl font-bold text-primary" data-testid="tab-total">R${activeSession.total.toFixed(2)}</span>
                </div>

                <div className="space-y-1 mb-6 max-h-[350px] overflow-y-auto">
                  {(activeSession.items || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No items yet — add from menu</p>
                  ) : activeSession.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 text-sm group">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.qty}</span>
                      </div>
                      <span className="font-medium mr-2">R${item.line_total.toFixed(2)}</span>
                      {activeSession.status === 'open' && (
                        <button onClick={() => handleVoidItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          data-testid={`void-item-${item.id}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {activeSession.status === 'open' && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Close Tab</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="h-12" onClick={() => handleCloseTab('card')} disabled={loading} data-testid="pay-card-btn">
                        <CreditCard className="h-4 w-4 mr-1" /> Card
                      </Button>
                      <Button variant="outline" className="h-12" onClick={() => handleCloseTab('cash')} disabled={loading} data-testid="pay-cash-btn">
                        <Banknote className="h-4 w-4 mr-1" /> Cash
                      </Button>
                      <Button variant="outline" className="h-12" onClick={() => handleCloseTab('comp')} disabled={loading} data-testid="pay-comp-btn">
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
                <p className="text-sm">or scan a wristband</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

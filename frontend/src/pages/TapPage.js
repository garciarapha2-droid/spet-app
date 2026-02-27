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
  Pencil, Trash2, Check, Camera
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const TabCard = ({ session, isActive, onClick }) => (
  <button onClick={onClick}
    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
      isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
    data-testid={`tab-card-${session.id}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full" data-testid="tab-number">
          #{session.tab_number || '—'}
        </span>
        <span className="font-medium text-sm truncate">{session.guest_name}</span>
      </div>
      <span className="text-sm font-bold text-primary">${session.total?.toFixed(2)}</span>
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      {session.session_type} — {new Date(session.opened_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
    </p>
  </button>
);

const CatalogItem = ({ item, onAdd }) => (
  <button onClick={() => onAdd(item)}
    className="p-3 rounded-xl border-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
    data-testid={`catalog-item-${item.id}`}>
    <p className="font-medium text-sm truncate">{item.name}</p>
    <div className="flex items-center justify-between mt-1">
      <span className="text-xs text-muted-foreground">{item.category}</span>
      <span className="text-sm font-bold text-primary">${item.price?.toFixed(2)}</span>
    </div>
  </button>
);

export const TapPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stats, setStats] = useState({});
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedBarman, setSelectedBarman] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [showNewTab, setShowNewTab] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBarmanMenu, setShowBarmanMenu] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Drinks', is_alcohol: false });

  // Barmen from API
  const [barmen, setBarmen] = useState([]);
  const [newBarmanName, setNewBarmanName] = useState('');
  const [editingBarman, setEditingBarman] = useState(null);
  const [editBarmanName, setEditBarmanName] = useState('');
  const [showAddBarman, setShowAddBarman] = useState(false);

  const loadBarmen = useCallback(async () => {
    try { const res = await staffAPI.getBarmen(VENUE_ID()); setBarmen(res.data.barmen || []); } catch {}
  }, []);

  const handleAddBarman = async () => {
    if (!newBarmanName.trim()) return;
    try {
      const fd = new FormData(); fd.append('venue_id', VENUE_ID()); fd.append('name', newBarmanName.trim());
      await staffAPI.addBarman(fd); setNewBarmanName(''); setShowAddBarman(false); await loadBarmen(); toast.success('Barman added');
    } catch { toast.error('Failed to add'); }
  };

  const handleEditBarman = async (id) => {
    if (!editBarmanName.trim()) return;
    try {
      const fd = new FormData(); fd.append('name', editBarmanName.trim());
      await staffAPI.updateBarman(id, fd); setEditingBarman(null); await loadBarmen();
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteBarman = async (id) => {
    try {
      await staffAPI.deleteBarman(id);
      if (selectedBarman && barmen.find(b => b.id === id)?.name === selectedBarman) setSelectedBarman('');
      await loadBarmen(); toast.success('Barman removed');
    } catch { toast.error('Failed to delete'); }
  };

  const loadData = useCallback(async () => {
    try {
      const [sessRes, catRes, stRes] = await Promise.all([
        tapAPI.getSessions(VENUE_ID()), tapAPI.getCatalog(VENUE_ID()), tapAPI.getStats(VENUE_ID()),
      ]);
      setSessions(sessRes.data.sessions || []); setCatalog(catRes.data.items || []); setStats(stRes.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); loadBarmen(); }, [loadData, loadBarmen]);
  useEffect(() => {
    const iv = setInterval(loadData, 15000); return () => clearInterval(iv);
  }, [loadData]);

  useEffect(() => {
    if (!activeSessionId) { setActiveSession(null); return; }
    (async () => {
      try { const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data); }
      catch { setActiveSession(null); }
    })();
  }, [activeSessionId]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const match = sessions.find(s =>
      s.guest_name.toLowerCase().includes(scanInput.toLowerCase()) ||
      (s.tab_number && s.tab_number.toString() === scanInput.trim())
    );
    if (match) { setActiveSessionId(match.session_id || match.id); setScanInput(''); }
    else toast.error('No matching tab found');
  };

  const handleOpenTab = async () => {
    if (!newTabName.trim() || !selectedBarman) {
      toast.error(!selectedBarman ? 'Select a barman first' : 'Enter guest name');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('guest_name', newTabName.trim());
      const res = await tapAPI.openSession(fd);
      setActiveSessionId(res.data.session_id); setNewTabName(''); setShowNewTab(false);
      await loadData(); toast.success(`Tab #${res.data.tab_number} opened`);
    } catch { toast.error('Failed to open tab'); }
    setLoading(false);
  };

  const handleAddItem = async (item) => {
    if (!activeSessionId) { toast.error('Select a tab first'); return; }
    if (!selectedBarman) { toast.error('Select a barman first'); return; }
    try {
      const fd = new FormData();
      fd.append('item_id', item.id); fd.append('qty', '1');
      await tapAPI.addItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data);
      await loadData();
    } catch { toast.error('Failed to add item'); }
  };

  const handleAddCustomItem = async () => {
    if (!customItem.name.trim() || !customItem.price) { toast.error('Enter name and price'); return; }
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('name', customItem.name.trim());
      fd.append('category', customItem.category);
      fd.append('price', parseFloat(customItem.price).toString());
      fd.append('is_alcohol', customItem.is_alcohol.toString());
      await tapAPI.addCatalogItem(fd);
      setCustomItem({ name: '', price: '', category: 'Drinks', is_alcohol: false });
      setShowCustomItem(false);
      await loadData();
      toast.success('Custom item added to menu');
    } catch { toast.error('Failed to add custom item'); }
  };

  const handleVoidItem = async (itemId) => {
    if (!activeSessionId) return;
    try {
      const fd = new FormData(); fd.append('item_id', itemId);
      await tapAPI.voidItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data);
      await loadData(); toast.success('Item voided');
    } catch { toast.error('Failed to void'); }
  };

  const handleCloseTab = async (method) => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('payment_method', method);
      await tapAPI.closeSession(activeSessionId, fd);
      setActiveSessionId(null); setActiveSession(null);
      await loadData(); toast.success('Tab closed');
    } catch { toast.error('Failed to close'); }
    setLoading(false);
  };

  const categories = ['All', ...new Set(catalog.map(i => i.category))];
  const filteredCatalog = filterCategory === 'All' ? catalog : catalog.filter(i => i.category === filterCategory);

  return (
    <div className="min-h-screen bg-background" data-testid="tap-page">
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold tracking-tight">TAP</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">DISCO MODE</span>

          {/* Table Mode toggle */}
          <div className="h-5 w-px bg-border" />
          <label className="flex items-center gap-2 cursor-pointer" data-testid="table-toggle">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Table</span>
            <div className="w-10 h-5 rounded-full bg-muted relative transition-colors"
              onClick={() => navigate('/table')}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 translate-x-0.5" />
            </div>
          </label>

          <div className="h-5 w-px bg-border" />

          {/* Barman Selector */}
          <div className="relative">
            <button onClick={() => setShowBarmanMenu(!showBarmanMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors"
              data-testid="barman-selector">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{selectedBarman || 'Select barman'}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showBarmanMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[220px] py-1" data-testid="barman-dropdown">
                {barmen.map(b => (
                  <div key={b.id} className="flex items-center group">
                    {editingBarman === b.id ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 w-full">
                        <input value={editBarmanName} onChange={e => setEditBarmanName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background"
                          autoFocus onKeyDown={e => e.key === 'Enter' && handleEditBarman(b.id)} />
                        <button onClick={() => handleEditBarman(b.id)} className="p-1 hover:text-green-500"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingBarman(null)} className="p-1 hover:text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { setSelectedBarman(b.name); setShowBarmanMenu(false); }}
                          className={`flex-1 text-left px-4 py-2 text-sm hover:bg-muted ${selectedBarman === b.name ? 'text-primary font-medium' : ''}`}>
                          {b.name}
                        </button>
                        <button onClick={() => { setEditingBarman(b.id); setEditBarmanName(b.name); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => handleDeleteBarman(b.id)}
                          className="p-1.5 mr-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                      </>
                    )}
                  </div>
                ))}
                {showAddBarman ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 border-t border-border">
                    <input value={newBarmanName} onChange={e => setNewBarmanName(e.target.value)} placeholder="Name..."
                      className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background"
                      autoFocus onKeyDown={e => e.key === 'Enter' && handleAddBarman()} />
                    <button onClick={handleAddBarman} className="p-1 hover:text-green-500"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setShowAddBarman(false); setNewBarmanName(''); }} className="p-1 hover:text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddBarman(true)}
                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted border-t border-border flex items-center gap-1.5"
                    data-testid="add-barman-btn"><Plus className="h-3.5 w-3.5" /> Add barman</button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Tabs: <strong className="text-foreground">{stats.open_tabs || 0}</strong></span>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scanner + Tabs */}
          <div className="col-span-3 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ScanLine className="h-3.5 w-3.5" /> Scan NFC / Search
              </h3>
              <form onSubmit={handleScan}>
                <Input value={scanInput} onChange={e => setScanInput(e.target.value)}
                  placeholder="NFC or name / tab #..." className="h-10 text-sm mb-2" data-testid="tap-scan-input" />
                <Button type="submit" size="sm" className="w-full" data-testid="tap-scan-btn">Scan</Button>
              </form>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Open Tabs ({sessions.length})</h3>
                <Button size="sm" variant="outline" onClick={() => setShowNewTab(true)} data-testid="new-tab-btn"><Plus className="h-3.5 w-3.5 mr-1" /> New</Button>
              </div>
              {showNewTab && (
                <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2" data-testid="new-tab-form">
                  <Input value={newTabName} onChange={e => setNewTabName(e.target.value)}
                    placeholder="Guest name" autoFocus onKeyDown={e => e.key === 'Enter' && handleOpenTab()} data-testid="new-tab-name-input" />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={handleOpenTab} disabled={!newTabName.trim() || !selectedBarman || loading}>Open</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewTab(false)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                  {!selectedBarman && <p className="text-xs text-red-500">Select a barman first</p>}
                </div>
              )}
              <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No open tabs</p>
                ) : sessions.map(s => (
                  <TabCard key={s.session_id || s.id} session={{ ...s, id: s.session_id || s.id }} isActive={(s.session_id || s.id) === activeSessionId}
                    onClick={() => setActiveSessionId(s.session_id || s.id)} />
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

            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-3 space-y-3" data-testid="custom-item-form">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm" />
                  <Input type="number" step="0.01" value={customItem.price}
                    onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm flex-1">
                    <option>Snacks</option><option>Starters</option><option>Mains</option>
                    <option>Drinks</option><option>Cocktails</option><option>Beers</option><option>No Alcohol</option><option>Other</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={customItem.is_alcohol} onChange={e => setCustomItem(p => ({ ...p, is_alcohol: e.target.checked }))} />
                    Alcohol
                  </label>
                  <Button size="sm" onClick={handleAddCustomItem} disabled={!customItem.name.trim() || !customItem.price} data-testid="custom-item-submit">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-3 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-[calc(100vh-300px)] overflow-y-auto">
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg" data-testid="active-tab-number">
                        #{activeSession.tab_number || '—'}
                      </span>
                      <h2 className="text-lg font-semibold">{activeSession.guest_name}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activeSession.session_type} — opened {new Date(activeSession.opened_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-2xl font-bold text-primary" data-testid="tab-total">${activeSession.total.toFixed(2)}</span>
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
                      <span className="font-medium mr-2">${item.line_total.toFixed(2)}</span>
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
                <p className="text-sm">or scan a wristband / tab #</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

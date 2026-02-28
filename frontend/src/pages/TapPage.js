import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Plus, X, CreditCard, Banknote, Beer, User, ChevronDown, ScanLine,
  Home, LogOut, LayoutGrid, Pencil, Trash2, Check, Receipt, Camera, Upload, ShieldCheck
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const CATEGORIES = ['Beers', 'Cocktails', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters', 'Mains', 'Plates'];

/* ─── Guest Confirmation Modal (Bar/Tap ONLY — NOT ID verification) ── */
function GuestConfirmModal({ session, onConfirm, onCancel }) {
  if (!session) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="guest-confirm-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        {/* Guest Photo */}
        {session.guest_photo ? (
          <img src={session.guest_photo} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary/20" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 border-4 border-primary/20">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <h2 className="text-xl font-bold mb-1" data-testid="confirm-guest-name">{session.guest_name}</h2>
        {session.tab_number && (
          <span className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm mb-4" data-testid="confirm-tab-number">Tab #{session.tab_number}</span>
        )}

        <p className="text-sm text-muted-foreground mb-6">Confirm this is the correct guest before proceeding.</p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} data-testid="confirm-cancel-btn">
            Cancel
          </Button>
          <Button className="flex-1 h-11" onClick={onConfirm} data-testid="confirm-guest-btn">
            <ShieldCheck className="h-4 w-4 mr-2" /> Confirm this guest
          </Button>
        </div>
      </div>
    </div>
  );
}

export const TapPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stats, setStats] = useState({});
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Beers');
  const [selectedBarman, setSelectedBarman] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [showNewTab, setShowNewTab] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBarmanMenu, setShowBarmanMenu] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Beers', is_alcohol: false });
  const [customPhoto, setCustomPhoto] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [barmen, setBarmen] = useState([]);
  const [newBarmanName, setNewBarmanName] = useState('');
  const [editingBarman, setEditingBarman] = useState(null);
  const [editBarmanName, setEditBarmanName] = useState('');
  const [showAddBarman, setShowAddBarman] = useState(false);
  const [confirmedSessions, setConfirmedSessions] = useState(new Set());
  const [pendingConfirmSession, setPendingConfirmSession] = useState(null);

  const loadBarmen = useCallback(async () => {
    try { const res = await staffAPI.getBarmen(VENUE_ID()); setBarmen(res.data.barmen || []); } catch {}
  }, []);

  const handleAddBarman = async () => {
    if (!newBarmanName.trim()) return;
    try {
      const fd = new FormData(); fd.append('venue_id', VENUE_ID()); fd.append('name', newBarmanName.trim());
      await staffAPI.addBarman(fd); setNewBarmanName(''); setShowAddBarman(false); await loadBarmen(); toast.success('Barman added');
    } catch { toast.error('Failed'); }
  };

  const handleEditBarman = async (id) => {
    if (!editBarmanName.trim()) return;
    try {
      const fd = new FormData(); fd.append('name', editBarmanName.trim());
      await staffAPI.updateBarman(id, fd); setEditingBarman(null); await loadBarmen();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteBarman = async (id) => {
    try { await staffAPI.deleteBarman(id); await loadBarmen(); toast.success('Removed'); } catch { toast.error('Failed'); }
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
  useEffect(() => { const iv = setInterval(loadData, 15000); return () => clearInterval(iv); }, [loadData]);

  useEffect(() => {
    if (!activeSessionId) { setActiveSession(null); return; }
    (async () => {
      try {
        const res = await tapAPI.getSession(activeSessionId);
        setActiveSession(res.data);
        // If session not confirmed yet, trigger modal
        if (!confirmedSessions.has(activeSessionId)) {
          setPendingConfirmSession(res.data);
        }
      }
      catch { setActiveSession(null); }
    })();
  }, [activeSessionId, confirmedSessions]);

  const handleConfirmGuest = () => {
    if (pendingConfirmSession) {
      setConfirmedSessions(prev => new Set(prev).add(activeSessionId));
      setPendingConfirmSession(null);
    }
  };

  const handleCancelConfirm = () => {
    setPendingConfirmSession(null);
    setActiveSessionId(null);
    setActiveSession(null);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const raw = scanInput.trim();
    // Strip leading "#" if present, check if numeric for tab_number lookup
    const cleaned = raw.startsWith('#') ? raw.slice(1) : raw;
    const isNumeric = /^\d+$/.test(cleaned);

    let match;
    if (isNumeric) {
      // Priority: match by tab_number first
      match = sessions.find(s => s.tab_number && s.tab_number.toString() === cleaned);
    }
    if (!match) {
      // Fallback: match by guest name or NFC
      match = sessions.find(s =>
        s.guest_name?.toLowerCase().includes(raw.toLowerCase()) ||
        (s.tab_number && s.tab_number.toString() === cleaned)
      );
    }
    if (match) { setActiveSessionId(match.session_id || match.id); setScanInput(''); }
    else toast.error('No matching tab');
  };

  const handleOpenTab = async () => {
    if (!newTabName.trim() || !selectedBarman) { toast.error(!selectedBarman ? 'Select barman' : 'Enter name'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('guest_name', newTabName.trim());
      const res = await tapAPI.openSession(fd);
      setActiveSessionId(res.data.session_id); setNewTabName(''); setShowNewTab(false);
      await loadData(); toast.success(`Tab #${res.data.tab_number} opened`);
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleAddItem = async (item) => {
    if (!activeSessionId) { toast.error('Select a tab first'); return; }
    if (!selectedBarman) { toast.error('Select barman first'); return; }
    if (!confirmedSessions.has(activeSessionId)) { toast.error('Confirm guest first'); return; }
    try {
      const fd = new FormData(); fd.append('item_id', item.id); fd.append('qty', '1');
      await tapAPI.addItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data);
      await loadData();
    } catch { toast.error('Failed'); }
  };

  const handleAddCustomItem = async () => {
    if (!customItem.name.trim() || !customItem.price) { toast.error('Name & price required'); return; }
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('name', customItem.name.trim());
      fd.append('category', customItem.category); fd.append('price', parseFloat(customItem.price).toString());
      fd.append('is_alcohol', customItem.is_alcohol.toString());
      const res = await tapAPI.addCatalogItem(fd);
      if (customPhoto && res.data.id) {
        const pFd = new FormData(); pFd.append('photo', customPhoto);
        await tapAPI.uploadCatalogPhoto(res.data.id, pFd);
      }
      setCustomItem({ name: '', price: '', category: 'Beers', is_alcohol: false }); setCustomPhoto(null); setShowCustomItem(false);
      await loadData(); toast.success(`"${customItem.name}" added to menu`);
    } catch { toast.error('Failed'); }
  };

  const handleDeleteItem = async (itemId) => {
    try { await tapAPI.deleteCatalogItem(itemId); await loadData(); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const handleEditItem = async (itemId) => {
    if (!editForm.name.trim()) return;
    try {
      const fd = new FormData(); fd.append('name', editForm.name); fd.append('price', editForm.price); fd.append('category', editForm.category);
      await tapAPI.updateCatalogItem(itemId, fd); setEditingItem(null); await loadData(); toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const handleVoidItem = async (itemId) => {
    if (!activeSessionId) return;
    try {
      const fd = new FormData(); fd.append('item_id', itemId);
      await tapAPI.voidItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data);
      await loadData(); toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const [closeStep, setCloseStep] = useState(null); // null, 'choose', 'tip'
  const [closedSessionForTip, setClosedSessionForTip] = useState(null);
  const [tipInput, setTipInput] = useState('');
  const [tipType, setTipType] = useState('percent'); // 'percent' or 'amount'
  const [tipResult, setTipResult] = useState(null);

  const handleCloseTab = async (method, location) => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('payment_method', method);
      fd.append('payment_location', location);
      const res = await tapAPI.closeSession(activeSessionId, fd);
      if (location === 'pay_here') {
        setClosedSessionForTip({ id: activeSessionId, total: res.data.total, guest_name: activeSession?.guest_name, tab_number: activeSession?.tab_number });
        setCloseStep('tip');
      } else {
        setActiveSessionId(null); setActiveSession(null);
        toast.success('Tab closed — payment at register');
      }
      await loadData();
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleRecordTip = async () => {
    if (!closedSessionForTip) return;
    setLoading(true);
    try {
      const fd = new FormData();
      if (tipType === 'amount') fd.append('tip_amount', parseFloat(tipInput).toString());
      else fd.append('tip_percent', parseFloat(tipInput).toString());
      const res = await tapAPI.recordTip(closedSessionForTip.id, fd);
      setTipResult(res.data);
      toast.success(`Tip $${res.data.tip_amount} recorded`);
    } catch { toast.error('Failed to record tip'); }
    setLoading(false);
  };

  const handleCloseTipFlow = () => {
    setCloseStep(null); setClosedSessionForTip(null); setTipInput(''); setTipResult(null);
    setActiveSessionId(null); setActiveSession(null);
    setSelectedBarman(''); // Clean slate: clear bartender for next order
    setConfirmedSessions(new Set()); // Clear confirmed sessions
  };

  const handleConfirmOrder = () => {
    // Confirm order flow: clear ALL context for clean slate
    setActiveSessionId(null); setActiveSession(null);
    setSelectedBarman(''); setConfirmedSessions(new Set());
    setCloseStep(null); setClosedSessionForTip(null); setTipInput(''); setTipResult(null);
    toast.success('Order confirmed — ready for next customer');
  };

  const handleCancelOrder = () => {
    // Cancel the current order interaction (deselect tab, go back)
    setActiveSessionId(null); setActiveSession(null);
    setConfirmedSessions(prev => { const next = new Set(prev); if (activeSessionId) next.delete(activeSessionId); return next; });
    toast('Order cancelled');
  };

  const filteredItems = catalog.filter(i => i.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background" data-testid="tap-page">
      {/* Guest Confirmation Modal */}
      {pendingConfirmSession && (
        <GuestConfirmModal
          session={pendingConfirmSession}
          onConfirm={handleConfirmGuest}
          onCancel={handleCancelConfirm}
        />
      )}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pulse/bar')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold tracking-tight">TAP</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">DISCO</span>
          <div className="h-5 w-px bg-border" />
          <label className="flex items-center gap-2 cursor-pointer" data-testid="table-toggle">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" onClick={() => navigate('/table')}>Table</span>
          </label>
          <div className="h-5 w-px bg-border" />
          {/* Barman Selector */}
          <div className="relative">
            <button onClick={() => setShowBarmanMenu(!showBarmanMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-muted"
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
                        <button onClick={() => setEditingBarman(null)} className="p-1"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { setSelectedBarman(b.name); setShowBarmanMenu(false); }}
                          className={`flex-1 text-left px-4 py-2 text-sm hover:bg-muted ${selectedBarman === b.name ? 'text-primary font-medium' : ''}`}>
                          {b.name}
                        </button>
                        <button onClick={() => { setEditingBarman(b.id); setEditBarmanName(b.name); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-primary"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => handleDeleteBarman(b.id)}
                          className="p-1.5 mr-1 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
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
                    <button onClick={() => setShowAddBarman(false)} className="p-1"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddBarman(true)}
                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted border-t border-border"
                    data-testid="add-barman-btn"><Plus className="h-3.5 w-3.5 inline mr-1" /> Add barman</button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Tabs: <strong className="text-foreground">{stats.open_tabs || 0}</strong></span>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="w-full px-6 py-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scan + Tabs */}
          <div className="col-span-2 space-y-4">
            <form onSubmit={handleScan} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ScanLine className="h-3.5 w-3.5" /> Scan NFC</div>
              <Input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Name or tab number..." className="h-9 text-sm" data-testid="tap-scan-input" />
            </form>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Tabs ({sessions.length})</h3>
              <button onClick={() => setShowNewTab(true)} className="text-primary hover:text-primary/80" data-testid="new-tab-btn"><Plus className="h-4 w-4" /></button>
            </div>
            {showNewTab && (
              <div className="p-2 rounded-lg border border-primary/30 bg-primary/5 space-y-2" data-testid="new-tab-form">
                <Input value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="Guest name" className="h-8 text-sm" autoFocus data-testid="new-tab-name-input" />
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleOpenTab} disabled={!newTabName.trim() || !selectedBarman || loading}>Open</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewTab(false)}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            )}
            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
              {sessions.map(s => (
                <button key={s.session_id || s.id}
                  onClick={() => setActiveSessionId(s.session_id || s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm ${
                    (s.session_id || s.id) === activeSessionId ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-card'
                  }`} data-testid={`tab-${s.tab_number || s.session_id || s.id}`}>
                  <div className="flex justify-between items-center">
                    <div className="truncate">
                      <span className="font-medium">{s.guest_name}</span>
                      <span className="text-primary font-bold ml-1">#{s.tab_number}</span>
                    </div>
                    <span className="font-bold text-xs">${(s.total || 0).toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Center: Kanban Menu */}
          <div className="col-span-6">
            {/* Horizontal Category Tabs */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" data-testid="category-tabs">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setEditingItem(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  }`} data-testid={`cat-tab-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {cat}
                </button>
              ))}
              <button onClick={() => setShowCustomItem(!showCustomItem)}
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-card border border-dashed border-primary/40 text-primary hover:bg-primary/5"
                data-testid="add-custom-menu-btn">
                <Plus className="h-3.5 w-3.5 inline mr-1" /> Custom
              </button>
            </div>

            {/* Custom Item Form */}
            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 space-y-3" data-testid="custom-item-form">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm col-span-2" data-testid="custom-item-name" />
                  <Input type="number" step="0.01" value={customItem.price} onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" data-testid="custom-item-price" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1" data-testid="custom-item-category">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={customItem.is_alcohol} onChange={e => setCustomItem(p => ({ ...p, is_alcohol: e.target.checked }))} /> Alcohol
                  </label>
                </div>
                <div className="flex gap-2 items-center">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} data-testid="take-photo-btn"><Camera className="h-3.5 w-3.5 mr-1" /> Photo</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="upload-photo-btn"><Upload className="h-3.5 w-3.5 mr-1" /> Upload</Button>
                  {customPhoto && <span className="text-xs text-green-600 truncate max-w-[100px]">{customPhoto.name}</span>}
                </div>
                <Button size="sm" onClick={handleAddCustomItem} disabled={!customItem.name.trim() || !customItem.price} className="w-full" data-testid="custom-item-submit">Add to Menu</Button>
              </div>
            )}

            {/* Category Title + Items List */}
            <h3 className="text-center font-bold text-lg mb-3" data-testid="category-title">{selectedCategory}</h3>
            <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto" data-testid="items-list">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No items in {selectedCategory}</p>
              ) : filteredItems.map(item => (
                editingItem === item.id ? (
                  <div key={item.id} className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="text-sm col-span-2" />
                      <Input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditItem(item.id)}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <div key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card hover:border-primary/30 transition-all group"
                    data-testid={`item-${item.id}`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Beer className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <button className="flex-1 text-left" onClick={() => handleAddItem(item)}>
                      <span className="font-medium text-sm">{item.name}</span>
                    </button>
                    <span className="text-primary font-bold text-sm">${item.price.toFixed(2)}</span>
                    <button onClick={() => { setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted" data-testid={`edit-item-${item.id}`}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10" data-testid={`delete-item-${item.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Right: Active Tab */}
          <div className="col-span-4 border-l border-border pl-6 flex flex-col">
            {activeSession ? (
              <div data-testid="active-tab-detail" className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg" data-testid="active-tab-number">#{activeSession.tab_number || '—'}</span>
                      <h2 className="text-lg font-semibold">{activeSession.guest_name}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">opened {new Date(activeSession.opened_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-2xl font-bold text-primary" data-testid="tab-total">${activeSession.total.toFixed(2)}</span>
                </div>

                <div className="space-y-1 mb-4 flex-1 max-h-[350px] overflow-y-auto">
                  {(activeSession.items || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No items — add from menu</p>
                  ) : activeSession.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 text-sm border border-transparent hover:border-border">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">x{item.qty}</span>
                        <span className="font-medium w-16 text-right">${item.line_total.toFixed(2)}</span>
                        {activeSession.status === 'open' && (
                          <button onClick={() => handleVoidItem(item.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            data-testid={`void-item-${item.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {activeSession.status === 'open' && !closeStep && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Pay Now</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-11" onClick={() => handleCloseTab('card', 'pay_here')} disabled={loading} data-testid="pay-here-btn">
                        <CreditCard className="h-4 w-4 mr-1" /> Pay here
                      </Button>
                      <Button variant="outline" className="h-11" onClick={() => handleCloseTab('card', 'pay_at_register')} disabled={loading} data-testid="pay-register-btn">
                        <Banknote className="h-4 w-4 mr-1" /> Pay at register
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tip Recording */}
                {closeStep === 'tip' && closedSessionForTip && !tipResult && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="border border-primary/30 rounded-xl p-4 bg-primary/5" data-testid="tip-recording">
                      <h4 className="font-semibold text-sm mb-1">Enter tip from receipt</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {closedSessionForTip.guest_name} — Tab #{closedSessionForTip.tab_number} — Total: ${closedSessionForTip.total?.toFixed(2)}
                      </p>
                      <div className="flex gap-2 mb-3">
                        {[18, 20, 22].map(pct => (
                          <Button key={pct} size="sm" variant={tipType === 'percent' && tipInput === pct.toString() ? 'default' : 'outline'}
                            onClick={() => { setTipType('percent'); setTipInput(pct.toString()); }}
                            data-testid={`tip-${pct}-btn`}>
                            {pct}%
                          </Button>
                        ))}
                        <Button size="sm" variant="outline" onClick={() => { setTipType('amount'); setTipInput(''); }}
                          data-testid="tip-custom-btn">Custom</Button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-1">
                          <span className="text-sm font-medium text-muted-foreground">{tipType === 'amount' ? '$' : '%'}</span>
                          <Input value={tipInput} onChange={e => setTipInput(e.target.value)} type="number" step="0.01"
                            placeholder={tipType === 'amount' ? '0.00' : '20'} className="h-9" data-testid="tip-input" />
                        </div>
                        <Button onClick={handleRecordTip} disabled={!tipInput || loading} data-testid="record-tip-btn">Record Tip</Button>
                      </div>
                      <button onClick={handleCloseTipFlow} className="text-xs text-muted-foreground mt-2 hover:underline" data-testid="skip-tip-btn">Skip (no tip)</button>
                    </div>
                  </div>
                )}

                {/* Tip Result */}
                {tipResult && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="border border-green-500/30 rounded-xl p-4 bg-green-500/5" data-testid="tip-result">
                      <h4 className="font-semibold text-sm text-green-600 mb-2">Tip Recorded: ${tipResult.tip_amount.toFixed(2)} ({tipResult.tip_percent}%)</h4>
                      {tipResult.distribution?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Distribution</p>
                          {tipResult.distribution.map((d, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Staff (sold ${d.sold.toFixed(2)} — {(d.proportion * 100).toFixed(0)}%)</span>
                              <span className="font-bold text-green-600">${d.tip.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button size="sm" className="mt-3 w-full" onClick={handleCloseTipFlow} data-testid="done-tip-btn">Done</Button>
                    </div>
                  </div>
                )}

                {/* Always visible: Cancel Order (red) + Confirm Order (green) */}
                {activeSession.status === 'open' && !closeStep && !tipResult && (
                  <div className="grid grid-cols-2 gap-3 pt-4 mt-auto border-t border-border" data-testid="order-action-buttons">
                    <Button variant="destructive" className="h-12 text-sm font-semibold" onClick={handleCancelOrder} data-testid="cancel-order-btn">
                      <X className="h-4 w-4 mr-1.5" /> Cancel Order
                    </Button>
                    <Button className="h-12 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmOrder} data-testid="confirm-order-btn">
                      <Check className="h-4 w-4 mr-1.5" /> Confirm Order
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg">Select a tab</p>
                <p className="text-sm">Scan NFC or click a tab</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

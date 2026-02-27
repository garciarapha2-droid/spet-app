import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Plus, X, CreditCard, Banknote, Beer, User, ChevronDown, ScanLine,
  Home, LogOut, LayoutGrid, Pencil, Trash2, Check, Receipt, Camera, Upload, ChevronRight
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const CATEGORIES = ['Beers', 'Cocktails', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters', 'Mains', 'Plates'];

export const TapPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stats, setStats] = useState({});
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
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
  useEffect(() => { const iv = setInterval(loadData, 15000); return () => clearInterval(iv); }, [loadData]);

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
      toast.error(!selectedBarman ? 'Select a barman first' : 'Enter guest name'); return;
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
      const res = await tapAPI.addCatalogItem(fd);
      if (customPhoto && res.data.id) {
        const photoFd = new FormData();
        photoFd.append('photo', customPhoto);
        await tapAPI.uploadCatalogPhoto(res.data.id, photoFd);
      }
      setCustomItem({ name: '', price: '', category: 'Beers', is_alcohol: false });
      setCustomPhoto(null);
      setShowCustomItem(false);
      await loadData();
      toast.success(`"${customItem.name}" added to menu`);
    } catch { toast.error('Failed to add custom item'); }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await tapAPI.deleteCatalogItem(itemId);
      await loadData();
      toast.success('Item deleted from menu');
    } catch { toast.error('Failed to delete'); }
  };

  const handleEditItem = async (itemId) => {
    if (!editForm.name.trim()) return;
    try {
      const fd = new FormData();
      fd.append('name', editForm.name); fd.append('price', editForm.price); fd.append('category', editForm.category);
      await tapAPI.updateCatalogItem(itemId, fd);
      setEditingItem(null); await loadData(); toast.success('Item updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleVoidItem = async (itemId) => {
    if (!activeSessionId) return;
    try {
      const fd = new FormData(); fd.append('item_id', itemId);
      await tapAPI.voidItem(activeSessionId, fd);
      const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data);
      await loadData(); toast.success('Item removed');
    } catch { toast.error('Failed to remove'); }
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

  const categoryCounts = {};
  catalog.forEach(item => { categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1; });
  const filteredItems = selectedCategory ? catalog.filter(i => i.category === selectedCategory) : [];

  return (
    <div className="min-h-screen bg-background" data-testid="tap-page">
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pulse/bar')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold tracking-tight">TAP</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">DISCO MODE</span>
          <div className="h-5 w-px bg-border" />
          <label className="flex items-center gap-2 cursor-pointer" data-testid="table-toggle">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Table</span>
            <div className="w-10 h-5 rounded-full bg-muted relative transition-colors cursor-pointer"
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
              <div className="space-y-1.5 max-h-[calc(100vh-360px)] overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No open tabs</p>
                ) : sessions.map(s => (
                  <button key={s.session_id || s.id}
                    onClick={() => setActiveSessionId(s.session_id || s.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      (s.session_id || s.id) === activeSessionId
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                    data-testid={`tab-${s.tab_number || s.session_id || s.id}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-sm">{s.guest_name}</span>
                        <span className="text-primary font-bold text-sm ml-2" data-testid={`tab-number-${s.tab_number}`}>#{s.tab_number}</span>
                      </div>
                      <span className="font-bold text-sm">${(s.total || 0).toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Menu as List → Category → Items */}
          <div className="col-span-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} data-testid="menu-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Categories
                  </Button>
                )}
                <h2 className="text-sm font-semibold">{selectedCategory ? selectedCategory : 'Menu'}</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowCustomItem(!showCustomItem)} data-testid="add-custom-menu-btn">
                <Plus className="h-3.5 w-3.5 mr-1" /> Custom Item
              </Button>
            </div>

            {/* Custom Item Form */}
            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-3 space-y-3" data-testid="custom-item-form">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm" data-testid="custom-item-name" />
                  <Input type="number" step="0.01" value={customItem.price}
                    onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" data-testid="custom-item-price" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm flex-1" data-testid="custom-item-category">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={customItem.is_alcohol} onChange={e => setCustomItem(p => ({ ...p, is_alcohol: e.target.checked }))} />
                    Alcohol
                  </label>
                </div>
                {/* Photo Upload */}
                <div className="flex gap-2 items-center">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} data-testid="take-photo-btn">
                    <Camera className="h-3.5 w-3.5 mr-1" /> Take Photo
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="upload-photo-btn">
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                  </Button>
                  {customPhoto && <span className="text-xs text-green-600 truncate max-w-[120px]">{customPhoto.name}</span>}
                </div>
                <Button size="sm" onClick={handleAddCustomItem} disabled={!customItem.name.trim() || !customItem.price} className="w-full" data-testid="custom-item-submit">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add to Menu
                </Button>
              </div>
            )}

            {!selectedCategory ? (
              /* Category List */
              <div className="space-y-1" data-testid="category-list">
                {CATEGORIES.map(cat => {
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                      data-testid={`category-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                      <span className="font-medium text-sm">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{count} items</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Items List */
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto" data-testid="items-list">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No items in this category</p>
                ) : filteredItems.map(item => (
                  editingItem === item.id ? (
                    <div key={item.id} className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="text-sm col-span-2" />
                        <Input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditItem(item.id)} data-testid={`save-edit-${item.id}`}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ) : (
                    <div key={item.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all group"
                      data-testid={`item-${item.id}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Beer className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <button className="flex-1 text-left" onClick={() => handleAddItem(item)}>
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-primary font-bold text-sm ml-3">${item.price.toFixed(2)}</span>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                          className="p-1.5 rounded hover:bg-muted" data-testid={`edit-item-${item.id}`}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded hover:bg-destructive/10" data-testid={`delete-item-${item.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
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
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 text-sm border border-transparent hover:border-border">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.qty}</span>
                      </div>
                      <span className="font-medium mr-3">${item.line_total.toFixed(2)}</span>
                      {activeSession.status === 'open' && (
                        <button onClick={() => handleVoidItem(item.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          data-testid={`void-item-${item.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
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

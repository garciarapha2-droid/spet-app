import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI, tapAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  ShoppingCart, User, ScanLine, Plus, X, Check, Beer, Trash2, Pencil,
  CreditCard, Banknote, Camera, Upload, ShieldCheck
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const BAR_CATEGORIES = ['Cocktails', 'Beers', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters'];

/* ─── Guest Confirmation Modal (Pulse Bar — photo + name + tab#) ── */
function BarGuestConfirmModal({ result, onConfirm, onCancel }) {
  if (!result) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="bar-guest-confirm-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        {result.guest_photo ? (
          <img src={result.guest_photo} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary/20" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 border-4 border-primary/20">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <h2 className="text-xl font-bold mb-1" data-testid="bar-confirm-guest-name">{result.guest_name}</h2>
        {result.tab_number && (
          <span className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm mb-4" data-testid="bar-confirm-tab-number">Tab #{result.tab_number}</span>
        )}
        <p className="text-sm text-muted-foreground mb-6">Confirm this is the correct guest before proceeding.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} data-testid="bar-confirm-cancel-btn">Cancel</Button>
          <Button className="flex-1 h-11" onClick={onConfirm} data-testid="bar-confirm-guest-btn">
            <ShieldCheck className="h-4 w-4 mr-2" /> Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export const PulseBarPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Cocktails');
  const [cart, setCart] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [confirmedGuest, setConfirmedGuest] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Cocktails' });
  const [customPhoto, setCustomPhoto] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await tapAPI.getCatalog(VENUE_ID());
      setCatalog((res.data.items || []).filter(i => BAR_CATEGORIES.includes(i.category)));
    } catch { }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await tapAPI.getSessions(VENUE_ID());
      setActiveSessions(res.data.sessions || []);
    } catch { }
  }, []);

  useEffect(() => { loadCatalog(); loadSessions(); }, [loadCatalog, loadSessions]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added`);
  };

  const updateQty = (itemId, delta) => {
    setCart(prev => prev.map(c => c.id !== itemId ? c : { ...c, qty: Math.max(1, c.qty + delta) }));
  };

  const removeFromCart = (itemId) => { setCart(prev => prev.filter(c => c.id !== itemId)); toast.success('Removed'); };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const raw = scanInput.trim();
    try {
      const res = await pulseAPI.barSearch(VENUE_ID(), raw);
      if (res.data.results?.length > 0) {
        const match = res.data.results[0];
        setPendingConfirm(match);
      } else {
        toast.error('No matching tab found');
      }
    } catch { toast.error('Search failed'); }
    setScanInput('');
  };

  const handleConfirmGuest = () => {
    setConfirmedGuest(pendingConfirm);
    setPendingConfirm(null);
  };

  const handleCancelConfirm = () => {
    setPendingConfirm(null);
  };

  const handleAddCustom = async () => {
    if (!customItem.name || !customItem.price) { toast.error('Name & price required'); return; }
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('name', customItem.name); fd.append('price', parseFloat(customItem.price).toString());
      fd.append('category', customItem.category); fd.append('is_alcohol', customItem.category !== 'Non-alcoholic' ? 'true' : 'false');
      const res = await tapAPI.addCatalogItem(fd);
      if (customPhoto && res.data.id) { const pFd = new FormData(); pFd.append('photo', customPhoto); await tapAPI.uploadCatalogPhoto(res.data.id, pFd); }
      setCustomItem({ name: '', price: '', category: 'Cocktails' }); setCustomPhoto(null); setShowCustom(false);
      await loadCatalog(); toast.success(`"${customItem.name}" added to menu`);
    } catch { toast.error('Failed'); }
  };

  const handleDeleteItem = async (itemId) => {
    try { await tapAPI.deleteCatalogItem(itemId); await loadCatalog(); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const handleEditItem = async (itemId) => {
    if (!editForm.name.trim()) return;
    try {
      const fd = new FormData(); fd.append('name', editForm.name); fd.append('price', editForm.price); fd.append('category', editForm.category);
      await tapAPI.updateCatalogItem(itemId, fd); setEditingItem(null); await loadCatalog(); toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const filteredItems = catalog.filter(i => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background" data-testid="bar-page">
      <PulseHeader title="BAR" activeTab="bar" />

      <main className="w-full px-6 py-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scan + Guest + Tabs */}
          <div className="col-span-2 space-y-4">
            <form onSubmit={handleScan} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ScanLine className="h-3.5 w-3.5" /> Scan NFC</div>
              <Input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Name..." className="h-9 text-sm" data-testid="bar-scan-input" />
            </form>

            {/* Identity Confirm */}
            {confirmingIdentity && scanResult && (
              <div className="bg-card border-2 border-yellow-500/30 rounded-xl p-3" data-testid="identity-confirmation">
                <p className="text-sm font-medium mb-1">Confirm:</p>
                <p className="font-bold">{scanResult.name}</p>
                {scanResult.tab_number && <p className="text-primary font-semibold text-sm">Tab #{scanResult.tab_number}</p>}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => setConfirmingIdentity(false)}><Check className="h-3.5 w-3.5 mr-1" /> Yes</Button>
                  <Button size="sm" variant="outline" onClick={() => { setScanResult(null); setConfirmingIdentity(false); }}><X className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}

            {/* Confirmed Guest */}
            {scanResult && !confirmingIdentity && !scanResult.blocked && (
              <div className="bg-card border-2 border-primary/30 rounded-xl p-3" data-testid="current-guest-card">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight" data-testid="guest-name">{scanResult.name}</p>
                    {scanResult.tab_number && <p className="text-primary font-semibold text-xs" data-testid="guest-tab-number">Tab #{scanResult.tab_number}</p>}
                  </div>
                </div>
                <div className="flex gap-1 text-xs mt-1">
                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{scanResult.visits || 0} visits</span>
                  {scanResult.tags?.includes('vip') && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600">VIP</span>}
                </div>
              </div>
            )}

            {/* Open Tabs */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tabs ({activeSessions.length})</h3>
              <div className="space-y-1 max-h-[250px] overflow-y-auto">
                {activeSessions.map(s => (
                  <div key={s.id || s.session_id} className="px-2 py-1.5 bg-card border border-border rounded-lg text-sm" data-testid={`session-${s.tab_number || s.id}`}>
                    <div className="flex justify-between items-center">
                      <div className="truncate">
                        <span className="font-medium text-xs">{s.guest_name || 'Tab'}</span>
                        <span className="text-primary font-bold text-xs ml-1">#{s.tab_number}</span>
                      </div>
                      <span className="text-xs font-bold">${(s.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Kanban Menu */}
          <div className="col-span-6">
            {/* Horizontal Category Tabs */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" data-testid="bar-category-tabs">
              {BAR_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setEditingItem(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  }`} data-testid={`bar-cat-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {cat}
                </button>
              ))}
              <button onClick={() => setShowCustom(!showCustom)}
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-card border border-dashed border-primary/40 text-primary hover:bg-primary/5"
                data-testid="bar-custom-btn">
                <Plus className="h-3.5 w-3.5 inline mr-1" /> Custom
              </button>
            </div>

            {/* Custom Item Form */}
            {showCustom && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 space-y-3" data-testid="bar-custom-form">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm col-span-2" data-testid="bar-custom-name" />
                  <Input type="number" step="0.01" value={customItem.price} onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" data-testid="bar-custom-price" />
                </div>
                <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="bar-custom-category">
                  {BAR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="flex gap-2 items-center">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} data-testid="bar-take-photo-btn"><Camera className="h-3.5 w-3.5 mr-1" /> Photo</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="bar-upload-photo-btn"><Upload className="h-3.5 w-3.5 mr-1" /> Upload</Button>
                  {customPhoto && <span className="text-xs text-green-600 truncate max-w-[100px]">{customPhoto.name}</span>}
                </div>
                <Button size="sm" onClick={handleAddCustom} disabled={!customItem.name || !customItem.price} className="w-full" data-testid="bar-custom-submit">Add to Menu</Button>
              </div>
            )}

            {/* Category Title + Items */}
            <h3 className="text-center font-bold text-lg mb-3" data-testid="bar-category-title">{selectedCategory}</h3>
            <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto" data-testid="bar-items-list">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No items</p>
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
                    data-testid={`bar-item-${item.id}`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Beer className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <button className="flex-1 text-left" onClick={() => addToCart(item)}>
                      <span className="font-medium text-sm">{item.name}</span>
                    </button>
                    <span className="text-primary font-bold text-sm">${item.price.toFixed(2)}</span>
                    <button onClick={() => { setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Right: Cart */}
          <div className="col-span-4 border-l border-border pl-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Order</h2>
              {cart.length > 0 && <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">{cart.length}</span>}
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No items — add from menu</p>
            ) : (
              <>
                <div className="space-y-1 mb-4 max-h-[350px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-card text-sm">
                      <div className="flex-1 truncate">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-primary font-bold ml-2">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold">-</button>
                        <span className="w-5 text-center text-sm font-medium">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold">+</button>
                        <button onClick={() => removeFromCart(item.id)}
                          className="p-1 ml-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          data-testid={`cart-remove-${item.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-xl font-bold text-primary" data-testid="cart-total">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="h-11" data-testid="pay-card-btn"><CreditCard className="h-4 w-4 mr-1" /> Card</Button>
                    <Button variant="outline" className="h-11" data-testid="pay-cash-btn"><Banknote className="h-4 w-4 mr-1" /> Cash</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

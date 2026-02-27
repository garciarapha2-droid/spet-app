import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI, tapAPI, staffAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  ShoppingCart, User, ScanLine, Plus, X, Check, Beer, Trash2, Pencil,
  CreditCard, Banknote, Camera, Upload, ChevronRight, ArrowLeft
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const BAR_CATEGORIES = ['Cocktails', 'Beers', 'Spirits', 'Non-alcoholic'];

export const PulseBarPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [confirmingIdentity, setConfirmingIdentity] = useState(false);
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
    setCart(prev => prev.map(c => {
      if (c.id !== itemId) return c;
      const newQty = c.qty + delta;
      return newQty > 0 ? { ...c, qty: newQty } : c;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
    toast.success('Item removed');
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    try {
      const res = await pulseAPI.dedupeSearch((() => { const fd = new FormData(); fd.append('venue_id', VENUE_ID()); fd.append('query', scanInput.trim()); return fd; })());
      if (res.data.matches?.length > 0) {
        const guestId = res.data.matches[0].id;
        const gRes = await pulseAPI.getGuest(guestId, VENUE_ID());
        setScanResult(gRes.data);
        setConfirmingIdentity(true);
      } else { toast.error('Guest not found'); }
    } catch { toast.error('Search failed'); }
    setScanInput('');
  };

  const confirmIdentity = () => { setConfirmingIdentity(false); };
  const rejectIdentity = () => { setScanResult(null); setConfirmingIdentity(false); };

  const handleAddCustom = async () => {
    if (!customItem.name || !customItem.price) { toast.error('Name and price required'); return; }
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('name', customItem.name);
      fd.append('price', parseFloat(customItem.price).toString());
      fd.append('category', customItem.category);
      fd.append('is_alcohol', customItem.category !== 'Non-alcoholic' ? 'true' : 'false');
      const res = await tapAPI.addCatalogItem(fd);
      if (customPhoto && res.data.id) {
        const photoFd = new FormData();
        photoFd.append('photo', customPhoto);
        await tapAPI.uploadCatalogPhoto(res.data.id, photoFd);
      }
      setCustomItem({ name: '', price: '', category: 'Cocktails' });
      setCustomPhoto(null);
      setShowCustom(false);
      await loadCatalog();
      toast.success(`"${customItem.name}" added to menu. Click to add to order.`);
    } catch {
      toast.error('Failed to create menu item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await tapAPI.deleteCatalogItem(itemId);
      await loadCatalog();
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleEditItem = async (itemId) => {
    if (!editForm.name.trim()) return;
    try {
      const fd = new FormData();
      fd.append('name', editForm.name); fd.append('price', editForm.price); fd.append('category', editForm.category);
      await tapAPI.updateCatalogItem(itemId, fd);
      setEditingItem(null); await loadCatalog(); toast.success('Item updated');
    } catch { toast.error('Failed to update'); }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const categoryCounts = {};
  catalog.forEach(item => { categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1; });
  const filteredItems = selectedCategory ? catalog.filter(i => i.category === selectedCategory) : [];

  return (
    <div className="min-h-screen bg-background" data-testid="bar-page">
      <PulseHeader title="BAR" activeTab="bar" />

      <main className="w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scan + Guest + Active Tabs */}
          <div className="col-span-3 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ScanLine className="h-3.5 w-3.5" /> Scan NFC / Search
              </h3>
              <form onSubmit={handleScan}>
                <Input value={scanInput} onChange={e => setScanInput(e.target.value)}
                  placeholder="NFC or name..." className="h-10 text-sm mb-2" data-testid="bar-scan-input" />
                <Button type="submit" size="sm" className="w-full" data-testid="bar-scan-btn">Scan</Button>
              </form>
            </div>

            {/* Identity Confirmation */}
            {confirmingIdentity && scanResult && (
              <div className="bg-card border-2 border-yellow-500/30 rounded-xl p-4" data-testid="identity-confirmation">
                <p className="text-sm font-medium mb-2">Confirm identity:</p>
                <p className="text-lg font-bold">{scanResult.name}</p>
                {scanResult.tab_number && <p className="text-primary font-semibold text-sm">Tab #{scanResult.tab_number}</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={confirmIdentity} data-testid="confirm-identity-btn"><Check className="h-3.5 w-3.5 mr-1" /> Confirm</Button>
                  <Button size="sm" variant="outline" onClick={rejectIdentity}><X className="h-3.5 w-3.5 mr-1" /> Reject</Button>
                </div>
              </div>
            )}

            {/* Current Guest + Tab # */}
            {scanResult && !confirmingIdentity && !scanResult.blocked && (
              <div className="bg-card border-2 border-primary/30 rounded-xl p-4" data-testid="current-guest-card">
                <div className="flex items-center gap-3 mb-2">
                  {scanResult.photo ? (
                    <img src={scanResult.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-lg leading-tight" data-testid="guest-name">{scanResult.name}</p>
                    {scanResult.tab_number && (
                      <p className="text-primary font-semibold text-sm" data-testid="guest-tab-number">Tab #{scanResult.tab_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{scanResult.visits || 0} visits</span>
                  {scanResult.tags?.includes('vip') && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">VIP</span>
                  )}
                </div>
              </div>
            )}

            {/* Active Tabs List */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Open Tabs ({activeSessions.length})</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {activeSessions.map((s) => (
                  <div key={s.id || s.session_id} className="p-3 bg-card border border-border rounded-lg text-sm" data-testid={`session-${s.tab_number || s.id}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{s.guest_name || 'Tab'}</p>
                        <p className="text-xs text-primary font-semibold">Tab #{s.tab_number}</p>
                      </div>
                      <p className="text-sm font-bold">${(s.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Menu (List → Category → Items) */}
          <div className="col-span-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} data-testid="bar-menu-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Categories
                  </Button>
                )}
                <h2 className="text-sm font-semibold">{selectedCategory || 'Bar Menu'}</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowCustom(!showCustom)} data-testid="bar-custom-btn">
                <Plus className="h-3.5 w-3.5 mr-1" /> Custom Item
              </Button>
            </div>

            {/* Custom Item Form with Photo */}
            {showCustom && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-3 space-y-3" data-testid="bar-custom-form">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm" data-testid="bar-custom-name" />
                  <Input type="number" step="0.01" value={customItem.price} onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" data-testid="bar-custom-price" />
                </div>
                <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="bar-custom-category">
                  {BAR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="flex gap-2 items-center">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} data-testid="bar-take-photo-btn">
                    <Camera className="h-3.5 w-3.5 mr-1" /> Take Photo
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="bar-upload-photo-btn">
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                  </Button>
                  {customPhoto && <span className="text-xs text-green-600 truncate max-w-[120px]">{customPhoto.name}</span>}
                </div>
                <Button size="sm" onClick={handleAddCustom} disabled={!customItem.name || !customItem.price} className="w-full" data-testid="bar-custom-submit">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add to Menu
                </Button>
              </div>
            )}

            {!selectedCategory ? (
              <div className="space-y-1" data-testid="bar-category-list">
                {BAR_CATEGORIES.map(cat => {
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                      data-testid={`bar-cat-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}>
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
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto" data-testid="bar-items-list">
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
                        <Button size="sm" onClick={() => handleEditItem(item.id)}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ) : (
                    <div key={item.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all group"
                      data-testid={`bar-item-${item.id}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Beer className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <button className="flex-1 text-left" onClick={() => addToCart(item)}>
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-primary font-bold text-sm ml-3">${item.price.toFixed(2)}</span>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                          className="p-1.5 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" /></button>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="col-span-4 border-l border-border pl-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Current Order</h2>
              {cart.length > 0 && <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">{cart.length}</span>}
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No items — add from menu</p>
            ) : (
              <>
                <div className="space-y-1 mb-4 max-h-[350px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-card text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-primary font-bold ml-2">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold hover:bg-muted/80">-</button>
                        <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold hover:bg-muted/80">+</button>
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

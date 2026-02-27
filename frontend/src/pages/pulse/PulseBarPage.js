import React, { useState, useEffect, useCallback } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { tapAPI, pulseAPI, rewardsAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  ScanLine, User, Check, X, Plus, Minus, Search, Beer,
  Wine, Coffee, Martini, Star, DollarSign
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseBarPage = () => {
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [confirmingIdentity, setConfirmingIdentity] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [cart, setCart] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Drinks' });
  const [rewardPoints, setRewardPoints] = useState(0);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load catalog + active sessions on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, sessRes] = await Promise.all([
          tapAPI.getCatalog(VENUE_ID()),
          tapAPI.getActiveSessions(VENUE_ID()).catch(() => ({ data: { sessions: [] } })),
        ]);
        setCatalog(catRes.data.items || []);
        setActiveSessions(sessRes.data.sessions || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const res = await tapAPI.getActiveSessions(VENUE_ID());
      setActiveSessions(res.data.sessions || []);
    } catch {}
  }, []);

  // NFC Scan — lookup guest
  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setLoading(true);
    try {
      // Search for guest by name/NFC in today's entries
      const res = await pulseAPI.getTodayEntries(VENUE_ID());
      const entries = res.data.entries || [];
      const match = entries.find(
        (e) => e.guest_name.toLowerCase().includes(scanInput.toLowerCase()) || e.guest_id === scanInput
      );
      if (match) {
        const guestRes = await pulseAPI.getGuest(match.guest_id, VENUE_ID());
        setScanResult(guestRes.data);
        setConfirmingIdentity(true);
      } else {
        toast.error('Guest not found. Try searching by name.');
      }
    } catch (err) {
      toast.error('Scan failed');
    }
    setLoading(false);
    setScanInput('');
  };

  const handleConfirmIdentity = () => {
    setConfirmingIdentity(false);
    toast.success(`Identity confirmed: ${scanResult.name}`);
  };

  const handleRejectIdentity = () => {
    setConfirmingIdentity(false);
    setScanResult(null);
    toast.info('Identity rejected. Scan again.');
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(c => c.id === itemId);
    if (existing && existing.qty > 1) {
      setCart(cart.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c));
    } else {
      setCart(cart.filter(c => c.id !== itemId));
    }
  };

  const handleAddCustom = () => {
    if (!customItem.name || !customItem.price) { toast.error('Name and price required'); return; }
    const item = {
      id: `custom-${Date.now()}`,
      name: customItem.name,
      price: parseFloat(customItem.price),
      category: customItem.category,
      is_custom: true,
    };
    addToCart(item);
    setCustomItem({ name: '', price: '', category: 'Drinks' });
    setShowCustom(false);
    toast.success(`Added ${item.name}`);
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const handleSubmitOrder = async () => {
    if (!scanResult) { toast.error('Scan a guest first'); return; }
    if (cart.length === 0) { toast.error('Add items to the order'); return; }
    setLoading(true);
    try {
      // Open a session for this guest (or use existing)
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('guest_name', scanResult.name);
      fd.append('guest_id', scanResult.guest_id);
      const sessRes = await tapAPI.openSession(fd);
      const sessionId = sessRes.data.session_id;

      // Add items
      for (const item of cart) {
        for (let i = 0; i < item.qty; i++) {
          const itemFd = new FormData();
          if (item.is_custom) {
            itemFd.append('item_name', item.name);
            itemFd.append('category', item.category);
            itemFd.append('unit_price', item.price.toString());
          } else {
            itemFd.append('item_id', item.id);
          }
          itemFd.append('qty', '1');
          await tapAPI.addItem(sessionId, itemFd);
        }
      }

      // Award points
      if (rewardPoints > 0) {
        const ptsFd = new FormData();
        ptsFd.append('venue_id', VENUE_ID());
        ptsFd.append('guest_id', scanResult.guest_id);
        ptsFd.append('points', rewardPoints.toString());
        ptsFd.append('reason', 'bar_purchase');
        await rewardsAPI.addPoints(ptsFd);
      }

      toast.success(`Order added! R$${cartTotal.toFixed(2)} for ${scanResult.name}`);
      setCart([]);
      setRewardPoints(0);
      await refreshSessions();
    } catch (err) {
      toast.error('Failed to submit order');
      console.error(err);
    }
    setLoading(false);
  };

  const categories = ['all', ...new Set(catalog.map(i => i.category))];
  const filteredCatalog = catalog.filter(i => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (searchFilter && !i.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const getCategoryIcon = (cat) => {
    const lc = (cat || '').toLowerCase();
    if (lc.includes('cerveja') || lc.includes('beer')) return Beer;
    if (lc.includes('drink') || lc.includes('cocktail')) return Martini;
    if (lc.includes('wine') || lc.includes('vinho')) return Wine;
    if (lc.includes('sem') || lc.includes('no')) return Coffee;
    return Beer;
  };

  return (
    <div className="min-h-screen bg-background" data-testid="bar-page">
      <PulseHeader />

      {/* Identity Confirmation Modal */}
      {confirmingIdentity && scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" data-testid="identity-modal">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            {scanResult.photo ? (
              <img src={scanResult.photo} alt="" className="w-40 h-40 rounded-2xl object-cover mx-auto mb-6 border-4 border-border" />
            ) : (
              <div className="w-40 h-40 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <User className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
            <h3 className="text-2xl font-bold mb-2">{scanResult.name}</h3>
            <p className="text-muted-foreground mb-8">Confirm this is the correct person</p>
            <div className="flex gap-4">
              <Button className="flex-1 h-14 text-lg" onClick={handleConfirmIdentity} data-testid="confirm-identity-btn">
                <Check className="h-6 w-6 mr-2" /> Confirm
              </Button>
              <Button variant="destructive" className="flex-1 h-14 text-lg" onClick={handleRejectIdentity} data-testid="reject-identity-btn">
                <X className="h-6 w-6 mr-2" /> Not them
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Scanner + Active tabs */}
          <div className="col-span-3 space-y-6">
            {/* Scanner */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <ScanLine className="h-4 w-4" /> Scan / Search Guest
              </h3>
              <form onSubmit={handleScan}>
                <Input value={scanInput} onChange={e => setScanInput(e.target.value)}
                  placeholder="NFC or guest name..."
                  className="h-12 text-lg mb-2"
                  data-testid="bar-scan-input" />
                <Button type="submit" className="w-full" disabled={loading} data-testid="bar-scan-btn">
                  Scan
                </Button>
              </form>
            </div>

            {/* Current guest */}
            {scanResult && !confirmingIdentity && (
              <div className="bg-card border-2 border-primary/30 rounded-xl p-5" data-testid="current-guest-card">
                <div className="flex items-center gap-3 mb-3">
                  {scanResult.photo ? (
                    <img src={scanResult.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{scanResult.name}</p>
                    <p className="text-xs text-muted-foreground">{scanResult.visits} visits</p>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  {scanResult.value_chips?.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">{c.label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Sessions */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Open Tabs ({activeSessions.length})
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activeSessions.map((s) => (
                  <div key={s.id || s.session_id} className="p-3 bg-card border border-border rounded-lg text-sm">
                    <p className="font-medium">{s.guest_name || 'Tab'}</p>
                    <p className="text-xs text-muted-foreground">R${(s.total || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Catalog */}
          <div className="col-span-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Search menu..." className="pl-10" data-testid="menu-search" />
              </div>
              <Button variant="outline" onClick={() => setShowCustom(!showCustom)} data-testid="add-custom-btn">
                <Plus className="h-4 w-4 mr-1" /> Custom
              </Button>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:bg-muted'
                  }`}>
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            {/* Custom item form */}
            {showCustom && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 flex gap-3 items-end" data-testid="custom-item-form">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="Drink name..." data-testid="custom-name" />
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground">Price (R$)</label>
                  <Input type="number" step="0.01" value={customItem.price}
                    onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))}
                    placeholder="0.00" data-testid="custom-price" />
                </div>
                <div className="w-32">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select value={customItem.category}
                    onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option>Drinks</option>
                    <option>Cervejas</option>
                    <option>Sem Alcool</option>
                    <option>Spirits</option>
                    <option>Cocktails</option>
                    <option>Other</option>
                  </select>
                </div>
                <Button onClick={handleAddCustom} data-testid="add-custom-confirm">Add</Button>
              </div>
            )}

            {/* Catalog Grid */}
            <div className="grid grid-cols-3 gap-3">
              {filteredCatalog.map((item) => {
                const CatIcon = getCategoryIcon(item.category);
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button key={item.id}
                    onClick={() => addToCart(item)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                      inCart ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                    }`}
                    data-testid={`catalog-item-${item.id}`}>
                    {inCart && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {inCart.qty}
                      </span>
                    )}
                    <CatIcon className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-primary font-bold">R${item.price?.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Cart / Order */}
          <div className="col-span-3">
            <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
              <h3 className="font-semibold mb-4">Current Order</h3>

              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No items yet</p>
              ) : (
                <div className="space-y-2 mb-4 max-h-[350px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">R${item.price?.toFixed(2)} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reward Points */}
              {scanResult && cart.length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm flex-1">Reward pts</span>
                  <Input type="number" value={rewardPoints} min={0}
                    onChange={e => setRewardPoints(parseInt(e.target.value) || 0)}
                    className="w-20 h-8 text-sm text-center" data-testid="reward-points-input" />
                </div>
              )}

              {/* Total + Submit */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total</span>
                  <span data-testid="cart-total">R${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full h-12 text-base font-semibold" disabled={!scanResult || cart.length === 0 || loading}
                  onClick={handleSubmitOrder} data-testid="submit-order-btn">
                  <DollarSign className="h-5 w-5 mr-1" />
                  Add to Tab
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

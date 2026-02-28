import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI, tapAPI, staffAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  ShoppingCart, User, ScanLine, Plus, X, Check, Beer, Trash2, Pencil,
  CreditCard, Banknote, Camera, Upload, ShieldCheck, ChevronDown, Video
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const BAR_CATEGORIES = ['Cocktails', 'Beers', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters'];

/* ─── Camera Capture Modal (getUserMedia) ────────────────────────── */
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let mediaStream = null;
    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        toast.error('Camera access denied or unavailable');
        onClose();
      }
    };
    startCamera();
    return () => { if (mediaStream) mediaStream.getTracks().forEach(t => t.stop()); };
  }, [onClose]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.8);
    if (stream) stream.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="camera-modal">
      <div className="bg-card rounded-2xl p-4 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Video className="h-4 w-4" /> Take Photo</h3>
          <Button variant="ghost" size="icon" onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onClose(); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-black mb-3">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <Button className="w-full h-12" onClick={handleCapture} data-testid="camera-capture-btn">
          <Camera className="h-5 w-5 mr-2" /> Capture
        </Button>
      </div>
    </div>
  );
}

/* ─── Guest Confirmation Modal ───────────────────────────────────── */
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
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [confirmedGuest, setConfirmedGuest] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Cocktails' });
  const [customPhoto, setCustomPhoto] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // Bartender selector state (Item 6)
  const [barmen, setBarmen] = useState([]);
  const [selectedBarman, setSelectedBarman] = useState('');

  // Tip flow state (Item 7)
  const [checkoutStep, setCheckoutStep] = useState(null); // 'tip' | 'done'
  const [tipType, setTipType] = useState('percent');
  const [tipInput, setTipInput] = useState('');
  const [tipResult, setTipResult] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await tapAPI.getCatalog(VENUE_ID());
      setCatalog((res.data.items || []).filter(i => BAR_CATEGORIES.includes(i.category)));
    } catch { }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      // Only show guests who are "Inside" the current event (Item 4 & 5)
      const [sessRes, insideRes] = await Promise.all([
        tapAPI.getSessions(VENUE_ID()),
        pulseAPI.getInsideGuests(VENUE_ID()).catch(() => ({ data: { guests: [] } })),
      ]);
      const allSessions = sessRes.data.sessions || [];
      const insideGuests = insideRes.data?.guests || [];
      const insideNames = new Set(insideGuests.map(g => g.name?.toLowerCase()));

      // Filter: only show sessions for guests who are "Inside" OR show all if no event filtering
      const filtered = insideNames.size > 0
        ? allSessions.filter(s => insideNames.has(s.guest_name?.toLowerCase()) || insideNames.size === 0)
        : allSessions;
      setActiveSessions(filtered.length > 0 ? filtered : allSessions);
    } catch { }
  }, []);

  const loadBarmen = useCallback(async () => {
    try {
      const res = await staffAPI.getBarmen(VENUE_ID());
      setBarmen(res.data.barmen || []);
    } catch { }
  }, []);

  useEffect(() => { loadCatalog(); loadSessions(); loadBarmen(); }, [loadCatalog, loadSessions, loadBarmen]);

  const addToCart = (item) => {
    if (!selectedBarman) { toast.error('Select a bartender/server first'); return; }
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
    try {
      const res = await pulseAPI.barSearch(VENUE_ID(), scanInput.trim());
      if (res.data.results?.length > 0) {
        setPendingConfirm(res.data.results[0]);
      } else { toast.error('No matching tab found'); }
    } catch { toast.error('Search failed'); }
    setScanInput('');
  };

  const handleConfirmGuest = () => { setConfirmedGuest(pendingConfirm); setPendingConfirm(null); };
  const handleCancelConfirm = () => { setPendingConfirm(null); };

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

  // Pay Here: close tab + show tip flow (Item 7 & 11)
  const handlePayHere = async () => {
    if (!confirmedGuest?.session_id) { toast.error('No active session'); return; }
    try {
      const fd = new FormData();
      fd.append('payment_method', 'card'); fd.append('payment_location', 'pay_here');
      const res = await tapAPI.closeSession(confirmedGuest.session_id, fd);
      setOrderTotal(res.data?.total || cartTotal);
      setCheckoutStep('tip');
    } catch { toast.error('Payment failed'); }
  };

  // Pay at Register: tab stays open (Item 11)
  const handlePayAtRegister = () => {
    toast.success('Sent to register — tab stays open');
    handleCleanSlate();
  };

  const handleRecordTip = async () => {
    if (!confirmedGuest?.session_id || !tipInput) return;
    try {
      const fd = new FormData();
      fd.append('session_id', confirmedGuest.session_id);
      fd.append('tip_type', tipType);
      fd.append('tip_value', tipInput);
      const res = await tapAPI.recordTip(fd);
      setTipResult(res.data);
      toast.success('Tip recorded');
    } catch { toast.error('Failed to record tip'); }
  };

  // Clean slate after order (Item 4 of previous block)
  const handleCleanSlate = () => {
    setCart([]); setConfirmedGuest(null); setSelectedBarman('');
    setCheckoutStep(null); setTipResult(null); setTipInput(''); setOrderTotal(0);
    loadSessions();
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const filteredItems = catalog.filter(i => i.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background" data-testid="bar-page">
      <PulseHeader title="BAR" activeTab="bar" />
      <BarGuestConfirmModal result={pendingConfirm} onConfirm={handleConfirmGuest} onCancel={handleCancelConfirm} />
      {showCamera && <CameraModal onCapture={file => setCustomPhoto(file)} onClose={() => setShowCamera(false)} />}

      <main className="w-full px-6 py-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scan + Bartender + Tabs */}
          <div className="col-span-2 space-y-4">
            {/* Bartender Selector (Item 6 — mandatory before serving) */}
            <div data-testid="barman-selector">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Bartender</label>
              <div className="relative">
                <select value={selectedBarman} onChange={e => setSelectedBarman(e.target.value)}
                  className={`w-full h-9 rounded-md border bg-background px-2 text-sm appearance-none ${!selectedBarman ? 'border-red-500/50 text-muted-foreground' : 'border-primary/50 text-foreground font-medium'}`}
                  data-testid="pulse-barman-select">
                  <option value="">Select...</option>
                  {barmen.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {!selectedBarman && <p className="text-[9px] text-red-500 mt-0.5">Required before serving</p>}
            </div>

            <form onSubmit={handleScan} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ScanLine className="h-3.5 w-3.5" /> Scan / Search</div>
              <Input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Tab # or name..." className="h-9 text-sm" data-testid="bar-scan-input" />
            </form>

            {confirmedGuest && (
              <div className="bg-card border-2 border-primary/30 rounded-xl p-3" data-testid="current-guest-card">
                <div className="flex items-center gap-2 mb-1">
                  {confirmedGuest.guest_photo ? (
                    <img src={confirmedGuest.guest_photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-primary/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight" data-testid="guest-name">{confirmedGuest.guest_name}</p>
                    {confirmedGuest.tab_number && <p className="text-primary font-semibold text-xs" data-testid="guest-tab-number">Tab #{confirmedGuest.tab_number}</p>}
                  </div>
                </div>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="h-3 w-3" /> Confirmed
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Inside Tabs ({activeSessions.length})</h3>
              <div className="space-y-1 max-h-[250px] overflow-y-auto">
                {activeSessions.map(s => (
                  <div key={s.id || s.session_id} className="px-2 py-1.5 bg-card border border-border rounded-lg text-sm cursor-pointer hover:border-primary/30"
                    onClick={() => setPendingConfirm(s)}
                    data-testid={`session-${s.tab_number || s.id}`}>
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

          {/* Center: Menu */}
          <div className="col-span-6">
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
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowCamera(true)} data-testid="bar-take-photo-btn">
                    <Camera className="h-3.5 w-3.5 mr-1" /> Take Photo
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="bar-upload-photo-btn">
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                  </Button>
                  {customPhoto && <span className="text-xs text-green-600 truncate max-w-[100px]">{customPhoto.name}</span>}
                </div>
                <Button size="sm" onClick={handleAddCustom} disabled={!customItem.name || !customItem.price} className="w-full" data-testid="bar-custom-submit">Add to Menu</Button>
              </div>
            )}

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

          {/* Right: Cart + Checkout */}
          <div className="col-span-4 border-l border-border pl-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Order</h2>
              {cart.length > 0 && <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">{cart.length}</span>}
            </div>

            {checkoutStep === 'tip' && !tipResult ? (
              /* Tip Recording Flow (Item 7) */
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/5" data-testid="pulse-tip-recording">
                <h4 className="font-semibold text-sm mb-1">Record Tip</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {confirmedGuest?.guest_name} — Total: ${orderTotal.toFixed(2)}
                </p>
                <div className="flex gap-2 mb-3">
                  {[18, 20, 22].map(pct => (
                    <Button key={pct} size="sm" variant={tipType === 'percent' && tipInput === pct.toString() ? 'default' : 'outline'}
                      onClick={() => { setTipType('percent'); setTipInput(pct.toString()); }}
                      data-testid={`pulse-tip-${pct}-btn`}>
                      {pct}%
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => { setTipType('amount'); setTipInput(''); }}
                    data-testid="pulse-tip-custom-btn">Custom</Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground">{tipType === 'amount' ? '$' : '%'}</span>
                    <Input value={tipInput} onChange={e => setTipInput(e.target.value)} type="number" step="0.01"
                      placeholder={tipType === 'amount' ? '0.00' : '20'} className="h-9" data-testid="pulse-tip-input" />
                  </div>
                  <Button onClick={handleRecordTip} disabled={!tipInput} data-testid="pulse-record-tip-btn">Record</Button>
                </div>
                <button onClick={handleCleanSlate} className="text-xs text-muted-foreground mt-2 hover:underline" data-testid="pulse-skip-tip-btn">Skip (no tip)</button>
              </div>
            ) : tipResult ? (
              /* Tip Result */
              <div className="border border-green-500/30 rounded-xl p-4 bg-green-500/5" data-testid="pulse-tip-result">
                <h4 className="font-semibold text-sm text-green-600 mb-2">Tip Recorded: ${tipResult.tip_amount?.toFixed(2)} ({tipResult.tip_percent}%)</h4>
                <Button size="sm" className="mt-3 w-full" onClick={handleCleanSlate} data-testid="pulse-done-tip-btn">Done</Button>
              </div>
            ) : cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No items — add from menu</p>
            ) : (
              <>
                <div className="space-y-1 mb-4 max-h-[350px] overflow-y-auto flex-1">
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
                <div className="border-t border-border pt-3 mt-auto">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-xl font-bold text-primary" data-testid="cart-total">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button className="h-11" onClick={handlePayHere} data-testid="pay-here-btn">
                      <CreditCard className="h-4 w-4 mr-1" /> Pay Here
                    </Button>
                    <Button variant="outline" className="h-11" onClick={handlePayAtRegister} data-testid="pay-register-btn">
                      <Banknote className="h-4 w-4 mr-1" /> Pay at Register
                    </Button>
                  </div>
                  {/* Cancel + Confirm (same as Tap) */}
                  <div className="grid grid-cols-2 gap-2" data-testid="pulse-order-action-buttons">
                    <Button variant="destructive" className="h-10 text-sm font-semibold" onClick={handleCleanSlate} data-testid="pulse-cancel-order-btn">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button className="h-10 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white" onClick={handleCleanSlate} data-testid="pulse-confirm-order-btn">
                      <Check className="h-4 w-4 mr-1" /> Confirm
                    </Button>
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

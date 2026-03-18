import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI, staffAPI, pulseAPI, venueAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Plus, X, CreditCard, Banknote, Beer, User, ChevronDown, ScanLine,
  Home, LogOut, LayoutGrid, Pencil, Trash2, Check, Receipt, Camera, Upload, ShieldCheck, Video, Lock,
  Wine, Coffee, Beef, Salad, UtensilsCrossed, GlassWater, Sandwich, CakeSlice
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const CATEGORIES = [
  { name: 'Beers', icon: Beer },
  { name: 'Cocktails', icon: Wine },
  { name: 'Spirits', icon: GlassWater },
  { name: 'Non-alcoholic', icon: Coffee },
  { name: 'Snacks', icon: Sandwich },
  { name: 'Starters', icon: Salad },
  { name: 'Mains', icon: Beef },
  { name: 'Plates', icon: CakeSlice },
];

const CATEGORY_NAMES = CATEGORIES.map(c => c.name);

/* Camera Capture Modal */
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  useEffect(() => {
    let ms = null;
    (async () => {
      try {
        ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(ms);
        if (videoRef.current) videoRef.current.srcObject = ms;
      } catch { toast.error('Camera unavailable'); onClose(); }
    })();
    return () => { if (ms) ms.getTracks().forEach(t => t.stop()); };
  }, [onClose]);
  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => { if (blob) onCapture(new File([blob], 'capture.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', 0.8);
    if (stream) stream.getTracks().forEach(t => t.stop());
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="camera-modal">
      <div className="bg-card rounded-2xl p-4 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Video className="h-4 w-4" /> Take Photo</h3>
          <Button variant="ghost" size="icon" onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onClose(); }}><X className="h-4 w-4" /></Button>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-black mb-3">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <Button className="w-full h-12" onClick={capture} data-testid="camera-capture-btn"><Camera className="h-5 w-5 mr-2" /> Capture</Button>
      </div>
    </div>
  );
}

/* Guest Confirmation Modal */
function GuestConfirmModal({ session, onConfirm, onCancel }) {
  if (!session) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="guest-confirm-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
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
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} data-testid="confirm-cancel-btn">Cancel</Button>
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
  const [moduleBlocked, setModuleBlocked] = useState(false);
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
  const [showCamera, setShowCamera] = useState(false);
  const [barmen, setBarmen] = useState([]);
  const [newBarmanName, setNewBarmanName] = useState('');
  const [editingBarman, setEditingBarman] = useState(null);
  const [editBarmanName, setEditBarmanName] = useState('');
  const [showAddBarman, setShowAddBarman] = useState(false);
  const [confirmedSessions, setConfirmedSessions] = useState(new Set());
  const [pendingConfirmSession, setPendingConfirmSession] = useState(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const loadBarmen = useCallback(async () => {
    try { const res = await staffAPI.getBarmen(VENUE_ID()); setBarmen(res.data.barmen || []); } catch {}
  }, []);

  useEffect(() => {
    venueAPI.checkModuleAccess('tap', VENUE_ID())
      .then(res => { if (!res.data.allowed) setModuleBlocked(true); })
      .catch(() => {});
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
      const [sessRes, catRes, stRes, insideRes] = await Promise.all([
        tapAPI.getSessions(VENUE_ID()), tapAPI.getCatalog(VENUE_ID()), tapAPI.getStats(VENUE_ID()),
        pulseAPI.getInsideGuests(VENUE_ID()),
      ]);
      const openSessions = sessRes.data.sessions || [];
      const insideGuests = insideRes.data?.guests || [];
      const sessionGuestNames = new Set(openSessions.map(s => s.guest_name?.toLowerCase()));
      const merged = [...openSessions];
      for (const g of insideGuests) {
        if (!sessionGuestNames.has(g.guest_name?.toLowerCase())) {
          merged.push({
            id: g.guest_id || g.session_id || `pulse-${g.guest_name}`,
            session_id: g.session_id || null,
            guest_name: g.guest_name,
            tab_number: g.tab_number || null,
            total: g.tab_total || 0,
            status: g.tab_number ? 'closed' : 'no_tab',
            _isPulseOnly: true,
          });
        }
      }
      setSessions(merged); setCatalog(catRes.data.items || []); setStats(stRes.data);
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
    const cleaned = raw.startsWith('#') ? raw.slice(1) : raw;
    const isNumeric = /^\d+$/.test(cleaned);
    let match;
    if (isNumeric) {
      match = sessions.find(s => s.tab_number && s.tab_number.toString() === cleaned);
    }
    if (!match) {
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
      const barmanObj = barmen.find(b => b.name === selectedBarman);
      if (barmanObj) {
        fd.append('bartender_id', barmanObj.id);
        fd.append('bartender_name', barmanObj.name);
      }
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

  const [closeStep, setCloseStep] = useState(null);
  const [closedSessionForTip, setClosedSessionForTip] = useState(null);
  const [tipInput, setTipInput] = useState('');
  const [tipType, setTipType] = useState('percent');
  const [tipResult, setTipResult] = useState(null);

  const handleCloseTab = async (method, location) => {
    if (!activeSessionId) return;
    if (location === 'pay_at_register') {
      setPaymentProcessed(true);
      toast.success('Sent to register — done.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('payment_method', method);
      fd.append('payment_location', location);
      const res = await tapAPI.closeSession(activeSessionId, fd);
      setClosedSessionForTip({ id: activeSessionId, total: res.data.total, guest_name: activeSession?.guest_name, tab_number: activeSession?.tab_number });
      setCloseStep('tip');
      setPaymentProcessed(true);
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
    setSelectedBarman(''); setConfirmedSessions(new Set());
    setPaymentProcessed(false);
  };

  const handleConfirmOrder = () => {
    if (!activeSessionId || !activeSession) return;
    if ((activeSession.items || []).length === 0) { toast.error('Add items before confirming'); return; }
    setOrderConfirmed(true);
  };

  const handleFinalDone = () => {
    if (!paymentProcessed) { toast.error('Choose payment method first'); return; }
    setActiveSessionId(null); setActiveSession(null);
    setSelectedBarman(''); setConfirmedSessions(new Set());
    setCloseStep(null); setClosedSessionForTip(null); setTipInput(''); setTipResult(null);
    setPaymentProcessed(false); setOrderConfirmed(false);
    toast.success('Order completed');
  };

  const handleCancelOrder = () => {
    setActiveSessionId(null); setActiveSession(null);
    setPaymentProcessed(false); setOrderConfirmed(false);
    setCloseStep(null); setClosedSessionForTip(null); setTipInput(''); setTipResult(null);
    toast('Order cancelled');
  };

  const filteredItems = catalog.filter(i => i.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));

  if (moduleBlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center" data-testid="module-blocked">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Module Not Available</h2>
        <p className="text-muted-foreground mb-6">You do not have access to the TAP module for this venue.</p>
        <Button onClick={() => navigate('/venue/home')} data-testid="back-to-home-btn">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="tap-page">
      {showCamera && <CameraModal onCapture={file => setCustomPhoto(file)} onClose={() => setShowCamera(false)} />}
      {pendingConfirmSession && (
        <GuestConfirmModal session={pendingConfirmSession} onConfirm={handleConfirmGuest} onCancel={handleCancelConfirm} />
      )}

      {/* ── Header ── */}
      <header className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pulse/bar')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-bold tracking-tight">TAP</span>
          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">DISCO</span>
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

      {/* ── Main POS Layout ── */}
      <main className="h-[calc(100vh-56px)] flex overflow-hidden">

        {/* LEFT: Tabs List */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-card/50 flex flex-col">
          <div className="p-3 space-y-2 border-b border-border">
            <form onSubmit={handleScan}>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 uppercase font-semibold tracking-wider">
                <ScanLine className="h-3 w-3" /> Scan / Search
              </div>
              <Input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Name or #tab..." className="h-9 text-sm" data-testid="tap-scan-input" />
            </form>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Open Tabs ({sessions.length})</span>
            <button onClick={() => setShowNewTab(true)} className="text-primary hover:text-primary/80" data-testid="new-tab-btn"><Plus className="h-4 w-4" /></button>
          </div>
          {showNewTab && (
            <div className="mx-3 mb-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2" data-testid="new-tab-form">
              <Input value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="Guest name" className="h-8 text-sm" autoFocus data-testid="new-tab-name-input" />
              <div className="flex gap-1">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleOpenTab} disabled={!newTabName.trim() || !selectedBarman || loading}>Open</Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewTab(false)}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {sessions.map(s => (
              <button key={s.session_id || s.id}
                onClick={() => !s._isPulseOnly && setActiveSessionId(s.session_id || s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                  s._isPulseOnly ? 'border-border/50 bg-muted/30 opacity-60' :
                  (s.session_id || s.id) === activeSessionId ? 'border-primary bg-primary/10 shadow-sm' : 'border-transparent hover:border-border hover:bg-card'
                }`} data-testid={`tab-${s.tab_number || s.session_id || s.id}`}>
                <div className="flex justify-between items-center">
                  <div className="truncate">
                    <span className="font-semibold">{s.guest_name}</span>
                    {s.tab_number ? (
                      <span className="text-primary font-bold ml-1.5 text-xs">#{s.tab_number}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs ml-1">(inside)</span>
                    )}
                  </div>
                  <span className={`font-bold text-xs ${s._isPulseOnly && s.status === 'closed' ? 'text-muted-foreground' : 'text-primary'}`}>
                    ${(s.total || 0).toFixed(2)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Category Sidebar + Items Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-24 flex-shrink-0 bg-secondary/30 border-r border-border flex flex-col py-2 overflow-y-auto" data-testid="category-sidebar">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setEditingItem(null); }}
                  className={`flex flex-col items-center gap-1 px-2 py-3 mx-1.5 rounded-xl transition-all text-center ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  data-testid={`cat-tab-${cat.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-semibold leading-tight">{cat.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowCustomItem(!showCustomItem)}
              className="flex flex-col items-center gap-1 px-2 py-3 mx-1.5 rounded-xl text-primary hover:bg-primary/10 transition-all mt-auto"
              data-testid="add-custom-menu-btn"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-tight">Custom</span>
            </button>
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-5 overflow-y-auto">
            {/* Custom Item Form */}
            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-5 space-y-3" data-testid="custom-item-form">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm col-span-2" data-testid="custom-item-name" />
                  <Input type="number" step="0.01" value={customItem.price} onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" data-testid="custom-item-price" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1" data-testid="custom-item-category">
                    {CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={customItem.is_alcohol} onChange={e => setCustomItem(p => ({ ...p, is_alcohol: e.target.checked }))} /> Alcohol
                  </label>
                </div>
                <div className="flex gap-2 items-center">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowCamera(true)} data-testid="take-photo-btn"><Camera className="h-3.5 w-3.5 mr-1" /> Photo</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="upload-photo-btn"><Upload className="h-3.5 w-3.5 mr-1" /> Upload</Button>
                  {customPhoto && <span className="text-xs text-green-600 truncate max-w-[100px]">{customPhoto.name}</span>}
                </div>
                <Button size="sm" onClick={handleAddCustomItem} disabled={!customItem.name.trim() || !customItem.price} className="w-full" data-testid="custom-item-submit">Add to Menu</Button>
              </div>
            )}

            {/* Category Title */}
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" data-testid="category-title">
              {(() => { const cat = CATEGORIES.find(c => c.name === selectedCategory); return cat ? <cat.icon className="h-5 w-5 text-primary" /> : null; })()}
              {selectedCategory}
              <span className="text-sm text-muted-foreground font-normal">({filteredItems.length})</span>
            </h3>

            {/* Large Touch-Friendly Grid */}
            <div className="grid grid-cols-4 gap-3" data-testid="items-list">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center col-span-4">No items in {selectedCategory}</p>
              ) : filteredItems.map(item => (
                editingItem === item.id ? (
                  <div key={item.id} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2 col-span-4">
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
                  <div
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="relative group flex flex-col rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden text-left active:scale-[0.98] cursor-pointer"
                    data-testid={`item-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem(item)}
                  >
                    {item.image_url && (
                      <img src={item.image_url} alt="" className="w-full h-20 object-cover" />
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between min-h-[80px]">
                      <span className="font-semibold text-sm leading-snug block mb-2">{item.name}</span>
                      <span className="text-primary font-bold text-base">${item.price.toFixed(2)}</span>
                    </div>
                    {/* Edit/Delete overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                        className="p-1.5 rounded-lg bg-card/90 hover:bg-muted border border-border shadow-sm" data-testid={`edit-item-${item.id}`}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="p-1.5 rounded-lg bg-card/90 hover:bg-destructive/10 border border-border shadow-sm" data-testid={`delete-item-${item.id}`}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Active Tab / Order Summary */}
        <div className="w-80 flex-shrink-0 border-l border-border bg-card/50 flex flex-col">
          {activeSession ? (
            <div data-testid="active-tab-detail" className="flex flex-col h-full">
              {/* Tab Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg" data-testid="active-tab-number">#{activeSession.tab_number || '-'}</span>
                    <h2 className="text-base font-semibold truncate">{activeSession.guest_name}</h2>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">opened {new Date(activeSession.opened_at).toLocaleTimeString()}</p>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {(activeSession.items || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No items — add from menu</p>
                ) : activeSession.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg hover:bg-muted/30 text-sm group">
                    <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{item.qty}</span>
                    <span className="font-medium flex-1 truncate">{item.name}</span>
                    <span className="font-bold text-sm">${item.line_total.toFixed(2)}</span>
                    {activeSession.status === 'open' && (
                      <button onClick={() => handleVoidItem(item.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-opacity"
                        data-testid={`void-item-${item.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="px-4 py-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary" data-testid="tab-total">${activeSession.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Area */}
              <div className="p-3 border-t border-border space-y-2">
                {/* Confirm Order */}
                {activeSession.status === 'open' && !closeStep && !orderConfirmed && (
                  <div className="grid grid-cols-2 gap-2" data-testid="order-action-buttons">
                    <Button variant="destructive" className="h-11 text-xs font-semibold" onClick={handleCancelOrder} data-testid="cancel-order-btn">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button className="h-11 text-xs font-semibold" onClick={handleConfirmOrder}
                      disabled={(activeSession.items || []).length === 0} data-testid="confirm-order-btn">
                      <Check className="h-4 w-4 mr-1" /> Confirm
                    </Button>
                  </div>
                )}

                {/* Payment */}
                {activeSession.status === 'open' && !closeStep && orderConfirmed && !paymentProcessed && (
                  <div className="space-y-2" data-testid="payment-section">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-11 text-xs" onClick={() => handleCloseTab('card', 'pay_here')} disabled={loading} data-testid="pay-here-btn">
                        <CreditCard className="h-4 w-4 mr-1" /> Pay Here
                      </Button>
                      <Button variant="outline" className="h-11 text-xs" onClick={() => handleCloseTab('card', 'pay_at_register')} disabled={loading} data-testid="pay-register-btn">
                        <Banknote className="h-4 w-4 mr-1" /> Register
                      </Button>
                    </div>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setOrderConfirmed(false)} data-testid="back-to-items-btn">
                      Back to items
                    </Button>
                  </div>
                )}

                {/* After payment */}
                {activeSession.status === 'open' && !closeStep && orderConfirmed && paymentProcessed && (
                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={handleFinalDone} data-testid="done-btn">
                    <Check className="h-4 w-4 mr-1.5" /> Done
                  </Button>
                )}

                {/* Tip Recording */}
                {closeStep === 'tip' && closedSessionForTip && !tipResult && (
                  <div className="border border-primary/30 rounded-xl p-3 bg-primary/5 space-y-2" data-testid="tip-recording">
                    <h4 className="font-semibold text-sm">Tip</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {closedSessionForTip.guest_name} — #{closedSessionForTip.tab_number} — ${closedSessionForTip.total?.toFixed(2)}
                    </p>
                    <div className="flex gap-1.5">
                      {[18, 20, 22].map(pct => (
                        <Button key={pct} size="sm" variant={tipType === 'percent' && tipInput === pct.toString() ? 'default' : 'outline'}
                          onClick={() => { setTipType('percent'); setTipInput(pct.toString()); }}
                          className="text-xs" data-testid={`tip-${pct}-btn`}>
                          {pct}%
                        </Button>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => { setTipType('amount'); setTipInput(''); }}
                        className="text-xs" data-testid="tip-custom-btn">$</Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-sm font-medium text-muted-foreground">{tipType === 'amount' ? '$' : '%'}</span>
                        <Input value={tipInput} onChange={e => setTipInput(e.target.value)} type="number" step="0.01"
                          placeholder={tipType === 'amount' ? '0.00' : '20'} className="h-9" data-testid="tip-input" />
                      </div>
                      <Button size="sm" onClick={handleRecordTip} disabled={!tipInput || loading} data-testid="record-tip-btn">Record</Button>
                    </div>
                    <button onClick={handleCloseTipFlow} className="text-[10px] text-muted-foreground hover:underline" data-testid="skip-tip-btn">Skip</button>
                  </div>
                )}

                {/* Tip Result */}
                {tipResult && (
                  <div className="border border-green-500/30 rounded-xl p-3 bg-green-500/5" data-testid="tip-result">
                    <h4 className="font-semibold text-sm text-green-600 mb-1">Tip: ${tipResult.tip_amount.toFixed(2)} ({tipResult.tip_percent}%)</h4>
                    {tipResult.distribution?.length > 0 && (
                      <div className="space-y-0.5 mt-2">
                        {tipResult.distribution.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{(d.proportion * 100).toFixed(0)}%</span>
                            <span className="font-bold text-green-600">${d.tip.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button size="sm" className="mt-2 w-full" onClick={handleCloseTipFlow} data-testid="done-tip-btn">Done</Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground px-6">
              <Receipt className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-base font-medium mb-1">Select a tab</p>
              <p className="text-sm text-center">Scan NFC or choose from the list</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

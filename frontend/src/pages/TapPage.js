import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI, staffAPI, pulseAPI, venueAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import { ItemCustomizeModal } from '../components/ItemCustomizeModal';
import {
  ArrowLeft, Plus, X, CreditCard, Banknote, Beer, User, ChevronDown, ScanLine,
  Home, LogOut, LayoutGrid, Pencil, Trash2, Check, Receipt, Camera, Upload, ShieldCheck, Video, Lock,
  Wine, Coffee, Beef, Salad, GlassWater, Sandwich, CakeSlice
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

/* Category colors — Toast-inspired vivid operational palette */
const CATEGORIES = [
  { name: 'Beers', icon: Beer, css: 'cat-beers', color: 'bg-amber-500' },
  { name: 'Cocktails', icon: Wine, css: 'cat-cocktails', color: 'bg-pink-500' },
  { name: 'Spirits', icon: GlassWater, css: 'cat-spirits', color: 'bg-orange-500' },
  { name: 'Non-alcoholic', icon: Coffee, css: 'cat-non-alcoholic', color: 'bg-emerald-500' },
  { name: 'Snacks', icon: Sandwich, css: 'cat-snacks', color: 'bg-yellow-500' },
  { name: 'Starters', icon: Salad, css: 'cat-starters', color: 'bg-lime-500' },
  { name: 'Mains', icon: Beef, css: 'cat-mains', color: 'bg-red-500' },
  { name: 'Plates', icon: CakeSlice, css: 'cat-plates', color: 'bg-violet-500' },
];

const CATEGORY_NAMES = CATEGORIES.map(c => c.name);

const getCatMeta = (name) => CATEGORIES.find(c => c.name === name) || CATEGORIES[0];

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
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80" data-testid="camera-modal">
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
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="guest-confirm-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        {session.guest_photo ? (
          <img src={session.guest_photo} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-border" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 border-4 border-border">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <h2 className="text-xl font-bold mb-1" data-testid="confirm-guest-name">{session.guest_name}</h2>
        {session.tab_number && (
          <span className="inline-block bg-muted text-foreground font-bold px-3 py-1 rounded-full text-sm mb-4" data-testid="confirm-tab-number">Tab #{session.tab_number}</span>
        )}
        <p className="text-sm text-muted-foreground mb-6">Confirm this is the correct guest before proceeding.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} data-testid="confirm-cancel-btn">Cancel</Button>
          <Button className="flex-1 h-11" onClick={onConfirm} data-testid="confirm-guest-btn">
            <ShieldCheck className="h-4 w-4 mr-2" /> Confirm
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
  const [customizingItem, setCustomizingItem] = useState(null);

  const getToken = () => localStorage.getItem('spetap_token');

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
    if (isNumeric) match = sessions.find(s => s.tab_number && s.tab_number.toString() === cleaned);
    if (!match) match = sessions.find(s => s.guest_name?.toLowerCase().includes(raw.toLowerCase()) || (s.tab_number && s.tab_number.toString() === cleaned));
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
      if (barmanObj) { fd.append('bartender_id', barmanObj.id); fd.append('bartender_name', barmanObj.name); }
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
    if (location === 'pay_at_register') { setPaymentProcessed(true); toast.success('Sent to register'); return; }
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('payment_method', method); fd.append('payment_location', location);
      const res = await tapAPI.closeSession(activeSessionId, fd);
      setClosedSessionForTip({ id: activeSessionId, total: res.data.total, guest_name: activeSession?.guest_name, tab_number: activeSession?.tab_number });
      setCloseStep('tip'); setPaymentProcessed(true); await loadData();
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
      setTipResult(res.data); toast.success(`Tip $${res.data.tip_amount.toFixed(2)} recorded`);
    } catch { toast.error('Failed'); }
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

  const reloadSession = async () => {
    if (!activeSessionId) return;
    try { const res = await tapAPI.getSession(activeSessionId); setActiveSession(res.data); } catch {}
    await loadData();
  };

  const activeCat = getCatMeta(selectedCategory);

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
      {pendingConfirmSession && <GuestConfirmModal session={pendingConfirmSession} onConfirm={handleConfirmGuest} onCancel={handleCancelConfirm} />}
      {customizingItem && activeSessionId && (
        <ItemCustomizeModal item={customizingItem} sessionId={activeSessionId} token={getToken()} onClose={() => setCustomizingItem(null)} onSaved={reloadSession} />
      )}

      {/* ── Header — clean, minimal ── */}
      <header className="h-12 border-b border-border bg-card px-5 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/pulse/bar')} data-testid="back-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold tracking-tight">TAP</span>
          <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">DISCO</span>
          <div className="h-4 w-px bg-border" />
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => navigate('/table')} data-testid="table-toggle">
            <LayoutGrid className="h-3.5 w-3.5" /> Table
          </button>
          <div className="h-4 w-px bg-border" />

          {/* Barman Selector — FIXED z-index */}
          <div className="relative">
            <button onClick={() => setShowBarmanMenu(!showBarmanMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedBarman ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500 animate-pulse'
              }`}
              data-testid="barman-selector">
              <User className="h-3 w-3" />
              <span>{selectedBarman || 'Select barman'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showBarmanMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-2xl min-w-[220px] py-1" style={{ zIndex: 9999 }} data-testid="barman-dropdown">
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tabs: <strong className="text-foreground">{stats.open_tabs || 0}</strong></span>
          <div className="h-4 w-px bg-border" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-3.5 w-3.5" /></Button>
        </div>
      </header>

      {/* ── Main POS Layout ── */}
      <main className="h-[calc(100vh-48px)] flex overflow-hidden">

        {/* LEFT: Tabs List — narrow, clean */}
        <div className="w-52 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <form onSubmit={handleScan}>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mb-1 uppercase font-semibold tracking-wider">
                <ScanLine className="h-3 w-3" /> Scan / Search
              </div>
              <Input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Name or #tab..." className="h-8 text-xs" data-testid="tap-scan-input" />
            </form>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Open Tabs ({sessions.length})</span>
            <button onClick={() => setShowNewTab(true)} className="text-primary hover:text-primary/80" data-testid="new-tab-btn"><Plus className="h-4 w-4" /></button>
          </div>
          {showNewTab && (
            <div className="mx-3 mb-2 p-2.5 rounded-lg border border-border bg-muted/30 space-y-2" data-testid="new-tab-form">
              <Input value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="Guest name" className="h-8 text-xs" autoFocus data-testid="new-tab-name-input" />
              <div className="flex gap-1">
                <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={handleOpenTab} disabled={!newTabName.trim() || !selectedBarman || loading}>Open</Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowNewTab(false)}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-0.5">
            {sessions.map(s => (
              <button key={s.session_id || s.id}
                onClick={() => !s._isPulseOnly && setActiveSessionId(s.session_id || s.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition-all text-xs ${
                  s._isPulseOnly ? 'opacity-40 cursor-default' :
                  (s.session_id || s.id) === activeSessionId ? 'bg-foreground/[0.06] ring-1 ring-foreground/10' : 'hover:bg-muted'
                }`} data-testid={`tab-${s.tab_number || s.session_id || s.id}`}>
                <div className="flex justify-between items-center">
                  <div className="truncate">
                    <span className="font-medium">{s.guest_name}</span>
                    {s.tab_number && <span className="text-muted-foreground font-bold ml-1">#{s.tab_number}</span>}
                  </div>
                  <span className="font-bold tabular-nums">${(s.total || 0).toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Category Sidebar + Items Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category Sidebar — Toast-like colored icons */}
          <div className="w-[72px] flex-shrink-0 border-r border-border bg-card flex flex-col py-2 overflow-y-auto" data-testid="category-sidebar">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setEditingItem(null); }}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2.5 mx-1 rounded-lg transition-all text-center ${
                    isActive
                      ? `${cat.css} bg-[hsl(var(--cat-bg))] text-[hsl(var(--cat-fg))] font-bold`
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  data-testid={`cat-tab-${cat.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? '' : 'bg-muted/50'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-semibold leading-tight">{cat.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowCustomItem(!showCustomItem)}
              className="flex flex-col items-center gap-0.5 px-1 py-2.5 mx-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all mt-auto"
              data-testid="add-custom-menu-btn"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/30">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-semibold leading-tight">Custom</span>
            </button>
          </div>

          {/* Items Grid — clean, spacious */}
          <div className="flex-1 p-6 overflow-y-auto bg-background">
            {/* Custom Item Form */}
            {showCustomItem && (
              <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3" data-testid="custom-item-form">
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

            {/* Category Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`${activeCat.css} w-9 h-9 rounded-lg flex items-center justify-center bg-[hsl(var(--cat-bg))]`}>
                <activeCat.icon className="h-5 w-5 text-[hsl(var(--cat-fg))]" />
              </div>
              <div>
                <h3 className="text-base font-bold" data-testid="category-title">{selectedCategory}</h3>
                <span className="text-xs text-muted-foreground">{filteredItems.length} items</span>
              </div>
            </div>

            {/* Large Touch Grid — 4 columns, clean tiles */}
            <div className="grid grid-cols-4 gap-4" data-testid="items-list">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-16 text-center col-span-4">No items in {selectedCategory}</p>
              ) : filteredItems.map(item => (
                editingItem === item.id ? (
                  <div key={item.id} className="p-4 rounded-xl border border-border bg-card space-y-2 col-span-4">
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
                    className={`${activeCat.css} relative group rounded-xl border bg-card hover:bg-[hsl(var(--cat-bg)/0.4)] hover:border-[hsl(var(--cat-border))] transition-all cursor-pointer active:scale-[0.97]`}
                    data-testid={`item-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem(item)}
                  >
                    {/* Color accent stripe */}
                    <div className={`h-1 rounded-t-xl ${activeCat.color} opacity-60`} />
                    <div className="px-4 py-4">
                      <span className="text-sm font-semibold leading-snug block mb-3">{item.name}</span>
                      <span className="text-base font-bold tabular-nums">${item.price.toFixed(2)}</span>
                    </div>
                    {/* Edit/Delete — visible on hover */}
                    <div className="absolute top-2.5 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 10 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                        className="p-1.5 rounded-lg bg-card border border-border shadow-sm hover:bg-muted" data-testid={`edit-item-${item.id}`}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="p-1.5 rounded-lg bg-card border border-border shadow-sm hover:bg-destructive/10" data-testid={`delete-item-${item.id}`}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Order Panel — STRONG, operational control */}
        <div className="w-[340px] flex-shrink-0 border-l border-border bg-card flex flex-col">
          {activeSession ? (
            <div data-testid="active-tab-detail" className="flex flex-col h-full">
              {/* Tab Header — bold, prominent */}
              <div className="px-5 py-4 border-b border-border bg-foreground/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold bg-foreground/[0.08] text-foreground px-2 py-0.5 rounded" data-testid="active-tab-number">#{activeSession.tab_number || '-'}</span>
                      <h2 className="text-base font-bold">{activeSession.guest_name}</h2>
                    </div>
                    <span className="text-[10px] text-muted-foreground">opened {new Date(activeSession.opened_at).toLocaleTimeString()}</span>
                  </div>
                  <button onClick={handleCancelOrder} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Order Items — CLEAR with visible edit action */}
              <div className="flex-1 overflow-y-auto">
                {(activeSession.items || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
                    <Receipt className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm text-center">Tap an item to add to order</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {activeSession.items.map(item => (
                      <div key={item.id} className="px-5 py-3 hover:bg-muted/20 group">
                        <div className="flex items-start gap-3">
                          {/* Quantity badge */}
                          <span className="w-7 h-7 rounded-lg bg-foreground/[0.06] text-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.qty}</span>
                          {/* Item info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{item.name}</span>
                              <span className="text-sm font-bold tabular-nums ml-2">${item.line_total.toFixed(2)}</span>
                            </div>
                            {/* Modifiers display */}
                            {(item.modifiers?.removed?.length > 0 || item.modifiers?.extras?.length > 0 || item.notes) && (
                              <div className="mt-1 space-y-0.5">
                                {item.modifiers?.removed?.map(r => (
                                  <span key={r} className="block text-[11px] text-red-500 font-medium">No {r}</span>
                                ))}
                                {item.modifiers?.extras?.map(e => (
                                  <span key={e} className="block text-[11px] text-emerald-500 font-medium">+ {e}</span>
                                ))}
                                {item.notes && (
                                  <span className="block text-[11px] text-muted-foreground italic">{item.notes}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* VISIBLE EDIT ACTIONS — not hidden */}
                        {activeSession.status === 'open' && (
                          <div className="flex items-center gap-1 mt-2 ml-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setCustomizingItem(item)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-foreground/60 hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
                              data-testid={`customize-item-${item.id}`}>
                              <Pencil className="h-3 w-3" /> Item details
                            </button>
                            <button onClick={() => handleVoidItem(item.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-foreground/60 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                              data-testid={`void-item-${item.id}`}>
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total — prominent */}
              <div className="px-5 py-4 border-t border-border bg-foreground/[0.02]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-extrabold tabular-nums" data-testid="tab-total">${activeSession.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 border-t border-border space-y-2">
                {activeSession.status === 'open' && !closeStep && !orderConfirmed && (
                  <Button className="w-full h-11 font-semibold text-sm" onClick={handleConfirmOrder}
                    disabled={(activeSession.items || []).length === 0} data-testid="confirm-order-btn">
                    <Check className="h-4 w-4 mr-1.5" /> Confirm Order
                  </Button>
                )}

                {activeSession.status === 'open' && !closeStep && orderConfirmed && !paymentProcessed && (
                  <div className="space-y-2" data-testid="payment-section">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment method</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-11 text-xs font-medium" onClick={() => handleCloseTab('card', 'pay_here')} disabled={loading} data-testid="pay-here-btn">
                        <CreditCard className="h-4 w-4 mr-1.5" /> Pay Here
                      </Button>
                      <Button variant="outline" className="h-11 text-xs font-medium" onClick={() => handleCloseTab('card', 'pay_at_register')} disabled={loading} data-testid="pay-register-btn">
                        <Banknote className="h-4 w-4 mr-1.5" /> Register
                      </Button>
                    </div>
                    <button onClick={() => setOrderConfirmed(false)} className="w-full text-[10px] text-muted-foreground hover:text-foreground py-1" data-testid="back-to-items-btn">
                      Back to items
                    </button>
                  </div>
                )}

                {activeSession.status === 'open' && !closeStep && orderConfirmed && paymentProcessed && (
                  <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={handleFinalDone} data-testid="done-btn">
                    <Check className="h-4 w-4 mr-1.5" /> Done
                  </Button>
                )}

                {closeStep === 'tip' && closedSessionForTip && !tipResult && (
                  <div className="border border-border rounded-xl p-3 space-y-2" data-testid="tip-recording">
                    <h4 className="font-semibold text-sm">Add Tip</h4>
                    <p className="text-[10px] text-muted-foreground">{closedSessionForTip.guest_name} — #{closedSessionForTip.tab_number} — ${closedSessionForTip.total?.toFixed(2)}</p>
                    <div className="flex gap-1.5">
                      {[18, 20, 22].map(pct => (
                        <Button key={pct} size="sm" variant={tipType === 'percent' && tipInput === pct.toString() ? 'default' : 'outline'}
                          onClick={() => { setTipType('percent'); setTipInput(pct.toString()); }} className="text-xs" data-testid={`tip-${pct}-btn`}>
                          {pct}%
                        </Button>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => { setTipType('amount'); setTipInput(''); }} className="text-xs" data-testid="tip-custom-btn">$</Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-sm font-medium text-muted-foreground">{tipType === 'amount' ? '$' : '%'}</span>
                        <Input value={tipInput} onChange={e => setTipInput(e.target.value)} type="number" step="0.01" placeholder={tipType === 'amount' ? '0.00' : '20'} className="h-9" data-testid="tip-input" />
                      </div>
                      <Button size="sm" onClick={handleRecordTip} disabled={!tipInput || loading} data-testid="record-tip-btn">Record</Button>
                    </div>
                    <button onClick={handleCloseTipFlow} className="text-[10px] text-muted-foreground hover:underline" data-testid="skip-tip-btn">Skip</button>
                  </div>
                )}

                {tipResult && (
                  <div className="border border-emerald-500/30 rounded-xl p-3 bg-emerald-500/5" data-testid="tip-result">
                    <h4 className="font-semibold text-sm text-emerald-600 mb-1">Tip: ${tipResult.tip_amount.toFixed(2)} ({tipResult.tip_percent}%)</h4>
                    <Button size="sm" className="mt-2 w-full" onClick={handleCloseTipFlow} data-testid="done-tip-btn">Done</Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground px-8">
              <Receipt className="h-12 w-12 mb-3 opacity-15" />
              <p className="text-sm font-medium mb-1">No active order</p>
              <p className="text-xs text-center text-muted-foreground/70">Select a tab or scan NFC to start</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

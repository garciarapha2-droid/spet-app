import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableAPI, tapAPI, staffAPI, venueAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import { ItemCustomizeModal } from '../components/ItemCustomizeModal';
import {
  ArrowLeft, LayoutGrid, Plus, Users, X, Trash2, CreditCard, Banknote,
  Home, LogOut, Pencil, Check, Camera, Upload, User, ChevronDown, Clock,
  ShieldCheck, ShieldAlert, Video, Lock, Beer, Wine, GlassWater, Coffee,
  Sandwich, Salad, Beef, CakeSlice
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const CATEGORIES = [
  { name: 'Beers', icon: Beer, css: 'cat-beers', color: 'bg-amber-500', bgFull: 'bg-amber-500/15 border-amber-500/30', tileBg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25' },
  { name: 'Cocktails', icon: Wine, css: 'cat-cocktails', color: 'bg-pink-500', bgFull: 'bg-pink-500/15 border-pink-500/30', tileBg: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/25' },
  { name: 'Spirits', icon: GlassWater, css: 'cat-spirits', color: 'bg-orange-500', bgFull: 'bg-orange-500/15 border-orange-500/30', tileBg: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/25' },
  { name: 'Non-alcoholic', icon: Coffee, css: 'cat-non-alcoholic', color: 'bg-emerald-500', bgFull: 'bg-emerald-500/15 border-emerald-500/30', tileBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25' },
  { name: 'Snacks', icon: Sandwich, css: 'cat-snacks', color: 'bg-yellow-500', bgFull: 'bg-yellow-500/15 border-yellow-500/30', tileBg: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/25' },
  { name: 'Starters', icon: Salad, css: 'cat-starters', color: 'bg-lime-500', bgFull: 'bg-lime-500/15 border-lime-500/30', tileBg: 'bg-lime-500/10 hover:bg-lime-500/20 border-lime-500/25' },
  { name: 'Mains', icon: Beef, css: 'cat-mains', color: 'bg-red-500', bgFull: 'bg-red-500/15 border-red-500/30', tileBg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/25' },
  { name: 'Plates', icon: CakeSlice, css: 'cat-plates', color: 'bg-violet-500', bgFull: 'bg-violet-500/15 border-violet-500/30', tileBg: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/25' },
];

const CATEGORY_NAMES = CATEGORIES.map(c => c.name);
const getCatMeta = (name) => CATEGORIES.find(c => c.name === name) || CATEGORIES[0];

/* Camera Capture Modal */
function CameraModal({ onCapture, onClose }) {
  const vRef = useRef(null), cRef = useRef(null);
  const [stream, setStream] = useState(null);
  useEffect(() => {
    let ms = null;
    (async () => {
      try { ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setStream(ms); if (vRef.current) vRef.current.srcObject = ms; }
      catch { toast.error('Camera unavailable'); onClose(); }
    })();
    return () => { if (ms) ms.getTracks().forEach(t => t.stop()); };
  }, [onClose]);
  const capture = () => {
    if (!vRef.current || !cRef.current) return;
    cRef.current.width = vRef.current.videoWidth; cRef.current.height = vRef.current.videoHeight;
    cRef.current.getContext('2d').drawImage(vRef.current, 0, 0);
    cRef.current.toBlob(b => { if (b) onCapture(new File([b], 'capture.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', 0.8);
    if (stream) stream.getTracks().forEach(t => t.stop()); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="camera-modal">
      <div className="bg-card rounded-2xl p-4 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Video className="h-4 w-4" /> Take Photo</h3>
          <Button variant="ghost" size="icon" onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onClose(); }}><X className="h-4 w-4" /></Button>
        </div>
        <div className="rounded-xl overflow-hidden bg-black mb-3"><video ref={vRef} autoPlay playsInline muted className="w-full h-64 object-cover" /><canvas ref={cRef} className="hidden" /></div>
        <Button className="w-full h-12" onClick={capture} data-testid="camera-capture-btn"><Camera className="h-5 w-5 mr-2" /> Capture</Button>
      </div>
    </div>
  );
}

/* ID Verification Modal */
function IDVerificationModal({ onConfirm, onCancel }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: 9999 }} data-testid="id-verification-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">ID Verification Required</h2>
            <p className="text-sm text-muted-foreground">Alcohol service compliance</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Please verify the guest is 21+ before serving alcohol.</p>
        <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 mb-5 cursor-pointer" data-testid="id-verify-checkbox-label">
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300" data-testid="id-verify-checkbox" />
          <span className="text-sm font-medium">I have verified this guest's ID (21+)</span>
        </label>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} data-testid="id-verify-cancel-btn">Cancel</Button>
          <Button className="flex-1 h-11" onClick={onConfirm} disabled={!checked} data-testid="id-verify-confirm-btn">
            <ShieldCheck className="h-4 w-4 mr-2" /> Confirm & Add Item
          </Button>
        </div>
      </div>
    </div>
  );
}

const ElapsedTime = ({ openedAt }) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!openedAt) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [openedAt]);
  return <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {elapsed || '-'}</span>;
};

export const TablePage = () => {
  const navigate = useNavigate();
  const [moduleBlocked, setModuleBlocked] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [seatCount, setSeatCount] = useState('');
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Beers');
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', category: 'Beers', is_alcohol: false });
  const [customPhoto, setCustomPhoto] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });
  const [barmen, setBarmen] = useState([]);
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingAlcoholItem, setPendingAlcoholItem] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);

  const loadBarmen = useCallback(async () => {
    try { const res = await staffAPI.getBarmen(VENUE_ID()); setBarmen(res.data.barmen || []); } catch {}
  }, []);

  const loadTables = useCallback(async () => {
    try { const res = await tableAPI.getTables(VENUE_ID()); setTables(res.data.tables || []); } catch (e) { console.error(e); }
  }, []);

  const loadCatalog = useCallback(async () => {
    try { const res = await tapAPI.getCatalog(VENUE_ID()); setCatalog(res.data.items || []); } catch {}
  }, []);

  useEffect(() => { loadTables(); loadCatalog(); loadBarmen(); }, [loadTables, loadCatalog, loadBarmen]);
  useEffect(() => { const iv = setInterval(loadTables, 15000); return () => clearInterval(iv); }, [loadTables]);

  useEffect(() => {
    venueAPI.checkModuleAccess('table', VENUE_ID())
      .then(res => { if (!res.data.allowed) setModuleBlocked(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTable) { setTableDetail(null); return; }
    (async () => {
      try { const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data); }
      catch { setTableDetail(null); }
    })();
  }, [selectedTable]);

  const handleOpenTable = async () => {
    if (!guestName.trim()) { toast.error('Enter guest name'); return; }
    if (!selectedServer) { toast.error('Select a server first'); return; }
    if (!seatCount) { toast.error('Select number of seats'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('table_id', selectedTable);
      fd.append('guest_name', guestName.trim()); fd.append('server_name', selectedServer);
      fd.append('seats', seatCount);
      const serverObj = barmen.find(b => b.name === selectedServer);
      if (serverObj) fd.append('bartender_id', serverObj.id);
      await tableAPI.openTable(fd);
      setGuestName(''); setSeatCount(''); setShowOpenForm(false); await loadTables();
      const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data);
      toast.success('Table opened');
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleAddItem = async (item) => {
    if (!tableDetail?.session) { toast.error('Open the table first'); return; }
    if (!tableDetail.session.server_name && !selectedServer) { toast.error('Select a server first'); return; }
    if (item.is_alcohol && !tableDetail.session.id_verified) {
      setPendingAlcoholItem(item);
      setShowIdModal(true);
      return;
    }
    await doAddItem(item);
  };

  const doAddItem = async (item) => {
    try {
      const fd = new FormData(); fd.append('item_id', item.id); fd.append('qty', '1');
      await tapAPI.addItem(tableDetail.session.id, fd);
      const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data);
      await loadTables();
    } catch { toast.error('Failed'); }
  };

  const handleIdVerified = async () => {
    if (!tableDetail?.session?.id) return;
    const sessionId = tableDetail.session.id;
    const itemToAdd = pendingAlcoholItem;
    setShowIdModal(false);
    setPendingAlcoholItem(null);
    try { await tapAPI.verifyId(sessionId); } catch {}
    if (itemToAdd) {
      try {
        const fd = new FormData(); fd.append('item_id', itemToAdd.id); fd.append('qty', '1');
        await tapAPI.addItem(sessionId, fd);
        toast.success(`${itemToAdd.name} added`);
        const res = await tableAPI.getTableDetail(selectedTable);
        setTableDetail(res.data);
        await loadTables();
      } catch { toast.error('Failed to add item'); }
    }
  };

  const handleIdCancel = () => { setShowIdModal(false); setPendingAlcoholItem(null); };

  const handleVoidItem = async (itemId) => {
    if (!tableDetail?.session) return;
    try {
      const fd = new FormData(); fd.append('item_id', itemId);
      await tapAPI.voidItem(tableDetail.session.id, fd);
      const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data);
      await loadTables(); toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const [tableCloseStep, setTableCloseStep] = useState(null);
  const [tableTipSession, setTableTipSession] = useState(null);
  const [tableTipInput, setTableTipInput] = useState('');
  const [tableTipType, setTableTipType] = useState('percent');
  const [tableTipResult, setTableTipResult] = useState(null);
  const [tablePaymentDone, setTablePaymentDone] = useState(false);
  const [tableOrderConfirmed, setTableOrderConfirmed] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableZone, setNewTableZone] = useState('main');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [addTableError, setAddTableError] = useState('');

  const getToken = () => localStorage.getItem('spetap_token');

  const handleCloseTable = async (method, location) => {
    if (!tableDetail?.session) return;
    if (location === 'pay_at_register') {
      setTablePaymentDone(true);
      toast.success('Sent to register');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('table_id', selectedTable);
      fd.append('payment_method', method);
      fd.append('payment_location', location);
      await tableAPI.closeTable(fd);
      setTableTipSession({ id: tableDetail.session.id, total: tableDetail.session.total, guest_name: tableDetail.session.guest_name, tab_number: tableDetail.session.tab_number });
      setTableCloseStep('tip');
      setTablePaymentDone(true);
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleTableConfirmOrder = () => {
    if (!tableDetail?.session) return;
    if ((tableDetail.items || []).length === 0) { toast.error('Add items before confirming'); return; }
    setTableOrderConfirmed(true);
  };

  const handleTableFinalDone = () => {
    if (!tablePaymentDone) { toast.error('Choose payment method first'); return; }
    setTableDetail(null); setTablePaymentDone(false); setTableOrderConfirmed(false);
    setTableCloseStep(null); setTableTipSession(null); setTableTipInput(''); setTableTipResult(null);
    loadTables(); toast.success('Order completed');
  };

  const handleTableCancelOrder = () => {
    setTableDetail(null); setTablePaymentDone(false); setTableOrderConfirmed(false);
    setTableCloseStep(null); setTableTipSession(null); setTableTipInput(''); setTableTipResult(null);
    toast('Order cancelled');
  };

  const handleTableRecordTip = async () => {
    if (!tableTipSession) return;
    setLoading(true);
    try {
      const fd = new FormData();
      if (tableTipType === 'amount') fd.append('tip_amount', parseFloat(tableTipInput).toString());
      else fd.append('tip_percent', parseFloat(tableTipInput).toString());
      const res = await tapAPI.recordTip(tableTipSession.id, fd);
      setTableTipResult(res.data);
      toast.success(`Tip $${res.data.tip_amount.toFixed(2)} recorded`);
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleTableTipDone = () => {
    setTableCloseStep(null); setTableTipSession(null); setTableTipInput(''); setTableTipResult(null);
    setTableDetail(null); loadTables();
  };

  const handleAddCustomItem = async () => {
    if (!customItem.name.trim() || !customItem.price) { toast.error('Name & price required'); return; }
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('name', customItem.name.trim());
      fd.append('category', customItem.category); fd.append('price', parseFloat(customItem.price).toString());
      fd.append('is_alcohol', customItem.is_alcohol.toString());
      const res = await tapAPI.addCatalogItem(fd);
      if (customPhoto && res.data.id) { const pFd = new FormData(); pFd.append('photo', customPhoto); await tapAPI.uploadCatalogPhoto(res.data.id, pFd); }
      setCustomItem({ name: '', price: '', category: 'Beers', is_alcohol: false }); setCustomPhoto(null); setShowCustomItem(false);
      await loadCatalog(); toast.success(`"${customItem.name}" added`);
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

  const filteredItems = catalog.filter(i => i.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));

  const handleAddTable = async () => {
    setAddTableError('');
    if (!newTableNumber.trim()) { setAddTableError('Enter table number'); return; }
    if (tables.some(t => t.table_number === newTableNumber.trim())) { setAddTableError(`Table #${newTableNumber.trim()} already exists`); return; }
    if (!/^\d+$/.test(newTableNumber.trim())) { setAddTableError('Table number must be numeric'); return; }
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('table_number', newTableNumber.trim());
      fd.append('zone', newTableZone);
      fd.append('capacity', newTableCapacity);
      await tableAPI.addTable(fd);
      setNewTableNumber(''); setNewTableZone('main'); setNewTableCapacity('4'); setShowAddTable(false);
      await loadTables(); toast.success(`Table #${newTableNumber.trim()} added`);
    } catch (e) {
      const msg = e.response?.data?.detail || 'Failed to add table';
      setAddTableError(msg); toast.error(msg);
    }
  };
  const currentTable = tables.find(t => t.id === selectedTable);
  const activeCat = getCatMeta(selectedCategory);

  const reloadTableSession = async () => {
    if (!selectedTable) return;
    try {
      const res = await tableAPI.getTableDetail(selectedTable);
      setTableDetail(res.data);
    } catch {}
    await loadTables();
  };

  if (moduleBlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center" data-testid="module-blocked">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Module Not Available</h2>
        <p className="text-muted-foreground mb-6">You do not have access to the Table module.</p>
        <Button onClick={() => navigate('/venue/home')} data-testid="back-to-home-btn">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="table-page">
      {showCamera && <CameraModal onCapture={file => setCustomPhoto(file)} onClose={() => setShowCamera(false)} />}
      {showIdModal && <IDVerificationModal onConfirm={handleIdVerified} onCancel={handleIdCancel} />}
      {customizingItem && tableDetail?.session?.id && (
        <ItemCustomizeModal
          item={customizingItem}
          sessionId={tableDetail.session.id}
          token={getToken()}
          onClose={() => setCustomizingItem(null)}
          onSaved={reloadTableSession}
        />
      )}

      {/* Header — always on top */}
      <header className="h-12 border-b border-border bg-card px-5 flex items-center justify-between" style={{ position: 'relative', zIndex: 50 }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tap')} data-testid="back-to-home-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-bold tracking-tight">TABLE</span>
          <div className="h-5 w-px bg-border" />
          <label className="flex items-center gap-2 cursor-pointer" data-testid="disco-mode-toggle">
            <LayoutGrid className="h-4 w-4 text-foreground/60" />
            <span className="text-sm text-foreground/80 font-medium" onClick={() => navigate('/tap')}>DISCO MODE</span>
          </label>
          <div className="h-5 w-px bg-border" />
          {/* Server Selector — proper layering */}
          <div className="relative" style={{ zIndex: 100 }}>
            <button onClick={() => setShowServerMenu(!showServerMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedServer ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`} data-testid="server-selector">
              <User className="h-3.5 w-3.5" />
              <span>{selectedServer || 'Select Server'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showServerMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-2xl min-w-[200px] py-1" style={{ zIndex: 9999 }} data-testid="server-dropdown">
                {barmen.map(b => (
                  <button key={b.id} onClick={() => { setSelectedServer(b.name); setShowServerMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${selectedServer === b.name ? 'text-primary font-medium' : ''}`}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); window.location.href = process.env.REACT_APP_LOVABLE_LOGIN_URL || 'https://spet.lovable.app/login'; }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Main POS Layout */}
      <main className="h-[calc(100vh-48px)] flex overflow-hidden">

        {/* LEFT: Table Map — improved spacing */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-card/50 flex flex-col">
          <div className="px-3 py-3 flex items-center justify-between border-b border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tables ({tables.length})</span>
            <button onClick={() => setShowAddTable(!showAddTable)}
              className="p-1.5 rounded-lg hover:bg-muted text-primary transition-colors" data-testid="add-table-btn">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showAddTable && (
            <div className="mx-3 mt-2 p-3 rounded-xl border border-border bg-card space-y-2.5" data-testid="add-table-form">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Add New Table</p>
              <Input
                value={newTableNumber} onChange={e => { setNewTableNumber(e.target.value); setAddTableError(''); }}
                placeholder="Table number" className="h-8 text-xs" autoFocus data-testid="new-table-number" />
              <div className="grid grid-cols-2 gap-2">
                <select value={newTableZone} onChange={e => setNewTableZone(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs" data-testid="new-table-zone">
                  <option value="main">Main</option>
                  <option value="vip">VIP</option>
                  <option value="terrace">Terrace</option>
                  <option value="bar">Bar</option>
                </select>
                <select value={newTableCapacity} onChange={e => setNewTableCapacity(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs" data-testid="new-table-capacity">
                  {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} seats</option>)}
                </select>
              </div>
              {addTableError && <p className="text-[10px] text-red-500 font-medium" data-testid="add-table-error">{addTableError}</p>}
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={handleAddTable} disabled={!newTableNumber.trim()}>Add</Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => { setShowAddTable(false); setAddTableError(''); }}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-2.5 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              {tables.map(t => (
                <div key={t.id} onClick={() => setSelectedTable(t.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    selectedTable === t.id ? 'border-foreground ring-2 ring-foreground/20' :
                    t.status === 'occupied' ? 'border-foreground/20 bg-foreground/[0.08]' :
                    'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50'
                  }`} data-testid={`table-${t.table_number}`}>
                  <span className="text-sm font-bold block">#{t.table_number}</span>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-1">
                    <Users className="h-2.5 w-2.5" /> <span>{t.capacity}</span>
                  </div>
                  <span className={`mt-1.5 inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    t.status === 'occupied' ? 'bg-foreground/10 text-foreground/70' : 'bg-emerald-500/10 text-emerald-600'
                  }`}>{t.status === 'occupied' ? 'Busy' : 'Free'}</span>
                  {t.status === 'occupied' && t.session_guest && (
                    <p className="text-[10px] text-primary mt-1 truncate font-medium">{t.session_guest}</p>
                  )}
                  {t.status === 'occupied' && (
                    <div className="mt-1.5" onClick={e => e.stopPropagation()}>
                      <ServerAssign tableId={t.id} currentServer={t.server_name} barmen={barmen} onAssigned={loadTables} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Category Sidebar + Items Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-[72px] flex-shrink-0 border-r border-border bg-card flex flex-col py-2 overflow-y-auto" data-testid="table-category-tabs">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setEditingItem(null); }}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2.5 mx-1 rounded-lg transition-all text-center ${
                    isActive ? `${cat.css} bg-[hsl(var(--cat-bg))] text-[hsl(var(--cat-fg))] font-bold` : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  data-testid={`table-cat-${cat.name.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? '' : 'bg-muted/50'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-semibold leading-tight">{cat.name}</span>
                </button>
              );
            })}
            <button onClick={() => setShowCustomItem(!showCustomItem)}
              className="flex flex-col items-center gap-0.5 px-1 py-2.5 mx-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all mt-auto"
              data-testid="table-custom-btn">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/30">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-semibold leading-tight">Custom</span>
            </button>
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-6 overflow-y-auto bg-background">
            {/* Table Context Bar */}
            {currentTable && tableDetail?.session && (
              <div className="bg-card border border-border rounded-xl p-3 mb-4" data-testid="table-context-bar">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-sm" data-testid="ctx-table-name">
                      Table #{currentTable.table_number}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground mr-1">Guest:</span>
                      <span className="font-semibold" data-testid="ctx-guest-name">{tableDetail.session.guest_name}</span>
                    </div>
                    {tableDetail.session.tab_number && (
                      <span className="text-primary font-bold text-sm" data-testid="ctx-tab-number">Tab #{tableDetail.session.tab_number}</span>
                    )}
                    <ElapsedTime openedAt={tableDetail.session.opened_at} />
                  </div>
                  <span className="text-lg font-bold text-primary">${(tableDetail.session.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600" data-testid="ctx-server-name">Server: {tableDetail.session.server_name || selectedServer || 'Not assigned'}</span>
                  {tableDetail.session.id_verified && (
                    <span className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-medium ml-2" data-testid="id-verified-badge">
                      <ShieldCheck className="h-3 w-3" /> ID verified
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Custom Item Form */}
            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-5 space-y-3" data-testid="table-custom-form">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm col-span-2" />
                  <Input type="number" step="0.01" value={customItem.price} onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1">
                    {CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowCamera(true)}><Camera className="h-3.5 w-3.5 mr-1" /> Photo</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-1" /> Upload</Button>
                </div>
                <Button size="sm" onClick={handleAddCustomItem} disabled={!customItem.name.trim() || !customItem.price} className="w-full">Add to Menu</Button>
              </div>
            )}

            {/* Category Title — full color block */}
            <div className={`flex items-center gap-3 mb-5 p-3 rounded-xl border ${activeCat.bgFull}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card/60">
                <activeCat.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold" data-testid="table-category-title">{selectedCategory}</h3>
                <span className="text-xs text-muted-foreground">{filteredItems.length} items</span>
              </div>
            </div>

            {/* Large Touch-Friendly Grid */}
            <div className="grid grid-cols-4 gap-4" data-testid="table-items-list">
              {filteredItems.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No items in {selectedCategory}</p>
                  <Button size="sm" variant="outline" onClick={() => setShowCustomItem(true)} data-testid="table-add-item-empty">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                  </Button>
                </div>
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
                  <div key={item.id}
                    onClick={() => handleAddItem(item)}
                    className={`relative group rounded-xl border transition-all cursor-pointer active:scale-[0.97] ${activeCat.tileBg}`}
                    data-testid={`table-item-${item.id}`}
                    role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleAddItem(item)}>
                    <div className="px-4 py-4">
                      <span className="text-sm font-semibold leading-snug block mb-3">{item.name}</span>
                      <span className="text-base font-bold tabular-nums">${item.price.toFixed(2)}</span>
                    </div>
                    <div className="absolute top-2.5 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 10 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item.id); setEditForm({ name: item.name, price: item.price, category: item.category }); }}
                        className="p-1.5 rounded-lg bg-card border border-border shadow-sm hover:bg-muted"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="p-1.5 rounded-lg bg-card border border-border shadow-sm hover:bg-destructive/10"><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Table Detail / Order */}
        <div className="w-[340px] flex-shrink-0 border-l border-border bg-card flex flex-col">
          {selectedTable ? (
            tableDetail ? (
              tableDetail.session ? (
                <div data-testid="table-session-detail" className="flex flex-col h-full">
                  {/* Session Header — bold, neutral */}
                  <div className="px-5 py-4 border-b border-border bg-foreground/[0.02]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold bg-foreground/[0.08] text-foreground px-2 py-0.5 rounded" data-testid="table-detail-tab-number">#{tableDetail.session.tab_number || '-'}</span>
                          <h2 className="text-base font-bold">{tableDetail.session.guest_name}</h2>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>Table #{tableDetail.table_number}</span>
                          <ElapsedTime openedAt={tableDetail.session.opened_at} />
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {tableDetail.session.server_name || 'No server'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {(tableDetail.items || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">No items — add from menu</p>
                    ) : tableDetail.items.map(item => (
                      <div key={item.id} className="px-5 py-3 hover:bg-muted/20 group">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-lg bg-foreground/[0.06] text-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.qty}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{item.name}</span>
                              <span className="text-sm font-bold tabular-nums ml-2">${item.line_total.toFixed(2)}</span>
                            </div>
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
                        {/* Always visible edit actions */}
                        <div className="flex items-center gap-1.5 mt-2 ml-10">
                          <button onClick={() => setCustomizingItem(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-muted/60 text-foreground/70 hover:bg-primary/10 hover:text-primary border border-border/40 hover:border-primary/30 transition-all"
                            data-testid={`table-customize-item-${item.id}`}>
                            <Pencil className="h-3 w-3" /> Item details
                          </button>
                          <button onClick={() => handleVoidItem(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-border/40 hover:border-red-500/20 transition-all"
                            data-testid={`table-void-item-${item.id}`}>
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="px-5 py-4 border-t border-border bg-foreground/[0.02]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-2xl font-extrabold tabular-nums" data-testid="table-total">${(tableDetail.session.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t border-border space-y-2">
                    {!tableCloseStep && !tableOrderConfirmed && (
                      <div className="grid grid-cols-2 gap-2" data-testid="table-order-action-buttons">
                        <Button variant="destructive" className="h-11 text-xs font-semibold" onClick={handleTableCancelOrder} data-testid="table-cancel-order-btn">
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button className="h-11 text-xs font-semibold" onClick={handleTableConfirmOrder}
                          disabled={(tableDetail.items || []).length === 0} data-testid="table-confirm-order-btn">
                          <Check className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                      </div>
                    )}

                    {!tableCloseStep && tableOrderConfirmed && !tablePaymentDone && (
                      <div className="space-y-2" data-testid="table-payment-section">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="h-11 text-xs" onClick={() => handleCloseTable('card', 'pay_here')} disabled={loading} data-testid="table-pay-here-btn">
                            <CreditCard className="h-4 w-4 mr-1" /> Pay Here
                          </Button>
                          <Button variant="outline" className="h-11 text-xs" onClick={() => handleCloseTable('card', 'pay_at_register')} disabled={loading} data-testid="table-pay-register-btn">
                            <Banknote className="h-4 w-4 mr-1" /> Register
                          </Button>
                        </div>
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setTableOrderConfirmed(false)} data-testid="table-back-to-items-btn">
                          Back to items
                        </Button>
                      </div>
                    )}

                    {!tableCloseStep && tableOrderConfirmed && tablePaymentDone && (
                      <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={handleTableFinalDone} data-testid="table-done-btn">
                        <Check className="h-4 w-4 mr-1.5" /> Done
                      </Button>
                    )}

                    {tableCloseStep === 'tip' && tableTipSession && !tableTipResult && (
                      <div className="border border-primary/30 rounded-xl p-3 bg-primary/5 space-y-2" data-testid="table-tip-recording">
                        <h4 className="font-semibold text-sm">Tip</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {tableTipSession.guest_name} — #{tableTipSession.tab_number} — ${tableTipSession.total?.toFixed(2)}
                        </p>
                        <div className="flex gap-1.5">
                          {[18, 20, 22].map(pct => (
                            <Button key={pct} size="sm" variant={tableTipType === 'percent' && tableTipInput === pct.toString() ? 'default' : 'outline'}
                              onClick={() => { setTableTipType('percent'); setTableTipInput(pct.toString()); }} className="text-xs">
                              {pct}%
                            </Button>
                          ))}
                          <Button size="sm" variant="outline" onClick={() => { setTableTipType('amount'); setTableTipInput(''); }} className="text-xs">$</Button>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center gap-1">
                            <span className="text-sm font-medium text-muted-foreground">{tableTipType === 'amount' ? '$' : '%'}</span>
                            <Input value={tableTipInput} onChange={e => setTableTipInput(e.target.value)} type="number" step="0.01"
                              placeholder={tableTipType === 'amount' ? '0.00' : '20'} className="h-9" data-testid="table-tip-input" />
                          </div>
                          <Button size="sm" onClick={handleTableRecordTip} disabled={!tableTipInput || loading} data-testid="table-record-tip-btn">Record</Button>
                        </div>
                        <button onClick={handleTableTipDone} className="text-[10px] text-muted-foreground hover:underline">Skip</button>
                      </div>
                    )}

                    {tableTipResult && (
                      <div className="border border-green-500/30 rounded-xl p-3 bg-green-500/5" data-testid="table-tip-result">
                        <h4 className="font-semibold text-sm text-green-600 mb-1">Tip: ${tableTipResult.tip_amount.toFixed(2)} ({tableTipResult.tip_percent}%)</h4>
                        {tableTipResult.distribution?.length > 0 && (
                          <div className="space-y-0.5 mt-2">
                            {tableTipResult.distribution.map((d, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{(d.proportion * 100).toFixed(0)}%</span>
                                <span className="font-bold text-green-600">${d.tip.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button size="sm" className="mt-2 w-full" onClick={handleTableTipDone} data-testid="table-done-tip-btn">Done</Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty Table — Open Form */
                <div className="flex flex-col items-center justify-center flex-1 px-6" data-testid="open-table-panel">
                  <p className="text-lg font-semibold mb-1">Table #{tableDetail.table_number}</p>
                  <p className="text-sm text-muted-foreground mb-4">{tableDetail.zone} — {tableDetail.capacity} seats</p>
                  {!showOpenForm ? (
                    <Button onClick={() => setShowOpenForm(true)} data-testid="open-table-btn"><Plus className="h-4 w-4 mr-1" /> Open Table</Button>
                  ) : (
                    <div className="space-y-3 w-full max-w-xs text-left" data-testid="open-table-form">
                      <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Guest name" autoFocus data-testid="open-table-guest-name" />
                      <select value={selectedServer} onChange={e => setSelectedServer(e.target.value)}
                        className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${!selectedServer ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-input'}`}
                        data-testid="open-table-server">
                        <option value="">Select server (required)...</option>
                        {barmen.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                      <select value={seatCount} onChange={e => setSeatCount(e.target.value)}
                        className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${!seatCount ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-input'}`}
                        data-testid="open-table-seats">
                        <option value="">Seats (required)...</option>
                        {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} {n === 1 ? 'seat' : 'seats'}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleOpenTable} disabled={!guestName.trim() || !selectedServer || !seatCount || loading} data-testid="open-table-submit-btn">Open</Button>
                        <Button variant="outline" onClick={() => setShowOpenForm(false)}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center flex-1">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground px-6">
              <LayoutGrid className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-base font-medium mb-1">Select a table</p>
              <p className="text-sm text-center">Choose a table from the map</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


function ServerAssign({ tableId, currentServer, barmen, onAssigned }) {
  const [open, setOpen] = useState(false);

  const assign = async (name) => {
    try {
      const fd = new FormData();
      fd.append('table_id', tableId);
      fd.append('server_name', name);
      await tableAPI.assignServer(fd);
      toast.success(`Server: ${name}`);
      setOpen(false);
      onAssigned();
    } catch { toast.error('Failed'); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className={`w-full text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
          currentServer
            ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`} data-testid={`assign-server-${tableId}`}>
        <User className="h-2.5 w-2.5 inline mr-0.5" />
        {currentServer || 'Assign'}
      </button>
    );
  }

  return (
    <div className="bg-card border border-primary/30 rounded-lg p-1 space-y-0.5">
      {barmen.map(b => (
        <button key={b.id} onClick={() => assign(b.name)}
          className={`w-full text-left text-[9px] px-1.5 py-0.5 rounded hover:bg-primary/10 ${b.name === currentServer ? 'bg-primary/10 text-primary font-bold' : ''}`}>
          {b.name}
        </button>
      ))}
      <button onClick={() => setOpen(false)} className="w-full text-[9px] text-muted-foreground hover:text-foreground">Cancel</button>
    </div>
  );
}

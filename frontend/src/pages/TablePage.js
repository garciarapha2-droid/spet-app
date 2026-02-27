import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableAPI, tapAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, LayoutGrid, Plus, Users, X, Trash2, CreditCard, Banknote, Beer,
  Home, LogOut, Pencil, Check, Camera, Upload, User, ChevronDown, Clock, ShieldCheck, ShieldAlert
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const CATEGORIES = ['Beers', 'Cocktails', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters', 'Mains', 'Plates'];

/* ─── ID Verification Modal (Table ONLY — alcohol compliance) ─────── */
function IDVerificationModal({ onConfirm, onCancel }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="id-verification-modal">
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

        <p className="text-sm text-muted-foreground mb-5">
          Please verify the guest is 21+ before serving alcohol.
        </p>

        <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 mb-5 cursor-pointer" data-testid="id-verify-checkbox-label">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
            data-testid="id-verify-checkbox"
          />
          <span className="text-sm font-medium">I have verified this guest's ID (21+)</span>
        </label>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onCancel} data-testid="id-verify-cancel-btn">
            Cancel
          </Button>
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
  return <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {elapsed || '—'}</span>;
};

export const TablePage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
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
  const cameraInputRef = useRef(null);
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
    if (!selectedTable) { setTableDetail(null); return; }
    (async () => {
      try { const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data); }
      catch { setTableDetail(null); }
    })();
  }, [selectedTable]);

  const handleOpenTable = async () => {
    if (!guestName.trim()) { toast.error('Enter guest name'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('table_id', selectedTable);
      fd.append('guest_name', guestName.trim()); fd.append('server_name', selectedServer);
      await tableAPI.openTable(fd);
      setGuestName(''); setShowOpenForm(false); await loadTables();
      const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data);
      toast.success('Table opened');
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleAddItem = async (item) => {
    if (!tableDetail?.session) { toast.error('Open the table first'); return; }
    // Check if item is alcohol and session not ID-verified
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
    if (!tableDetail?.session) return;
    try {
      await tapAPI.verifyId(tableDetail.session.id);
      const res = await tableAPI.getTableDetail(selectedTable);
      setTableDetail(res.data);
      setShowIdModal(false);
      // Now add the pending item
      if (pendingAlcoholItem) {
        await doAddItem(pendingAlcoholItem);
        setPendingAlcoholItem(null);
      }
    } catch { toast.error('ID verification failed'); }
  };

  const handleIdCancel = () => {
    setShowIdModal(false);
    setPendingAlcoholItem(null);
  };

  const handleVoidItem = async (itemId) => {
    if (!tableDetail?.session) return;
    try {
      const fd = new FormData(); fd.append('item_id', itemId);
      await tapAPI.voidItem(tableDetail.session.id, fd);
      const res = await tableAPI.getTableDetail(selectedTable); setTableDetail(res.data);
      await loadTables(); toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const handleCloseTable = async (method) => {
    if (!tableDetail?.session) return;
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('table_id', selectedTable); fd.append('payment_method', method);
      await tableAPI.closeTable(fd);
      setTableDetail(null); await loadTables(); toast.success('Table closed');
    } catch { toast.error('Failed'); }
    setLoading(false);
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

  const filteredItems = catalog.filter(i => i.category === selectedCategory);
  const currentTable = tables.find(t => t.id === selectedTable);

  return (
    <div className="min-h-screen bg-background" data-testid="table-page">
      {/* ID Verification Modal */}
      {showIdModal && (
        <IDVerificationModal onConfirm={handleIdVerified} onCancel={handleIdCancel} />
      )}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tap')} data-testid="back-to-home-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold tracking-tight">TABLE</span>
          <div className="h-5 w-px bg-border" />
          <label className="flex items-center gap-2 cursor-pointer" data-testid="disco-mode-toggle">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium" onClick={() => navigate('/tap')}>DISCO MODE</span>
          </label>
          <div className="h-5 w-px bg-border" />
          {/* Server Selector */}
          <div className="relative">
            <button onClick={() => setShowServerMenu(!showServerMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-muted" data-testid="server-selector">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{selectedServer || 'Select server'}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showServerMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[200px] py-1" data-testid="server-dropdown">
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
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="w-full px-6 py-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Table Grid */}
          <div className="col-span-2">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Tables</h3>
            <div className="grid grid-cols-2 gap-2">
              {tables.map(t => (
                <div key={t.id} onClick={() => setSelectedTable(t.id)}
                  className={`p-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    selectedTable === t.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' :
                    t.status === 'occupied' ? 'border-orange-500/30 bg-orange-500/5' :
                    'border-border hover:border-primary/30'
                  }`} data-testid={`table-${t.table_number}`}>
                  <span className="text-sm font-bold">#{t.table_number}</span>
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
                    <Users className="h-2.5 w-2.5" /> {t.capacity}
                  </div>
                  <span className={`mt-0.5 inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    t.status === 'occupied' ? 'bg-orange-500/10 text-orange-600' : 'bg-green-500/10 text-green-600'
                  }`}>{t.status === 'occupied' ? 'Occupied' : 'Available'}</span>
                  {t.status === 'occupied' && t.session_guest && (
                    <p className="text-[10px] text-primary mt-0.5 truncate font-medium">{t.session_guest}</p>
                  )}
                  {t.status === 'occupied' && t.tab_number && (
                    <p className="text-[9px] text-muted-foreground font-medium">#{t.tab_number}</p>
                  )}
                  {t.status === 'occupied' && (
                    <div className="mt-1" onClick={e => e.stopPropagation()}>
                      <ServerAssign tableId={t.id} currentServer={t.server_name} barmen={barmen} onAssigned={loadTables} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center: Kanban Menu */}
          <div className="col-span-6">
            {/* Table Context Bar */}
            {currentTable && tableDetail?.session && (
              <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center justify-between" data-testid="table-context-bar">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-bold text-sm">Table #{currentTable.table_number}</span>
                    {tableDetail.session.tab_number && <span className="text-primary font-bold text-sm ml-2">Tab #{tableDetail.session.tab_number}</span>}
                  </div>
                  <ElapsedTime openedAt={tableDetail.session.opened_at} />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{tableDetail.session.server_name || selectedServer || 'No server'}</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">${(tableDetail.session.total || 0).toFixed(2)}</span>
              </div>
            )}

            {/* Horizontal Category Tabs */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" data-testid="table-category-tabs">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setEditingItem(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  }`} data-testid={`table-cat-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {cat}
                </button>
              ))}
              <button onClick={() => setShowCustomItem(!showCustomItem)}
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-card border border-dashed border-primary/40 text-primary hover:bg-primary/5"
                data-testid="table-custom-btn">
                <Plus className="h-3.5 w-3.5 inline mr-1" /> Custom
              </button>
            </div>

            {/* Custom Item Form */}
            {showCustomItem && (
              <div className="bg-card border border-primary/20 rounded-xl p-4 mb-4 space-y-3" data-testid="table-custom-form">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={customItem.name} onChange={e => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="text-sm col-span-2" />
                  <Input type="number" step="0.01" value={customItem.price} onChange={e => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" className="text-sm" />
                </div>
                <div className="flex gap-2 items-center">
                  <select value={customItem.category} onChange={e => setCustomItem(p => ({ ...p, category: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && setCustomPhoto(e.target.files[0])} />
                  <Button type="button" size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()}><Camera className="h-3.5 w-3.5 mr-1" /> Photo</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-1" /> Upload</Button>
                </div>
                <Button size="sm" onClick={handleAddCustomItem} disabled={!customItem.name.trim() || !customItem.price} className="w-full">Add to Menu</Button>
              </div>
            )}

            {/* Category Title + Items */}
            <h3 className="text-center font-bold text-lg mb-3" data-testid="table-category-title">{selectedCategory}</h3>
            <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto" data-testid="table-items-list">
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
                    data-testid={`table-item-${item.id}`}>
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
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Right: Table Detail & Tab */}
          <div className="col-span-4 border-l border-border pl-6">
            {selectedTable ? (
              tableDetail ? (
                tableDetail.session ? (
                  <div data-testid="table-session-detail">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm bg-primary/10 text-primary px-2.5 py-1 rounded-lg" data-testid="table-detail-tab-number">#{tableDetail.session.tab_number || '—'}</span>
                          <h2 className="text-lg font-semibold">{tableDetail.session.guest_name}</h2>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Table #{tableDetail.table_number}</span>
                          <ElapsedTime openedAt={tableDetail.session.opened_at} />
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {tableDetail.session.server_name || 'No server'}</span>
                          {tableDetail.session.id_verified && (
                            <span className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium" data-testid="id-verified-badge">
                              <ShieldCheck className="h-3 w-3" /> ID verified
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-primary" data-testid="table-total">${(tableDetail.session.total || 0).toFixed(2)}</span>
                    </div>

                    <div className="space-y-1 mb-6 max-h-[300px] overflow-y-auto">
                      {(tableDetail.items || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No items — add from menu</p>
                      ) : tableDetail.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 text-sm border border-transparent hover:border-border">
                          <div className="flex-1"><span className="font-medium">{item.name}</span></div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">x{item.qty}</span>
                            <span className="font-medium w-16 text-right">${item.line_total.toFixed(2)}</span>
                            <button onClick={() => handleVoidItem(item.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              data-testid={`table-void-item-${item.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-muted-foreground">Close Table</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" className="h-11" onClick={() => handleCloseTable('card')} disabled={loading}><CreditCard className="h-4 w-4 mr-1" /> Card</Button>
                        <Button variant="outline" className="h-11" onClick={() => handleCloseTable('cash')} disabled={loading}><Banknote className="h-4 w-4 mr-1" /> Cash</Button>
                        <Button variant="outline" className="h-11" onClick={() => handleCloseTable('comp')} disabled={loading}><Beer className="h-4 w-4 mr-1" /> Comp</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10" data-testid="open-table-panel">
                    <p className="text-lg font-semibold mb-1">Table #{tableDetail.table_number}</p>
                    <p className="text-sm text-muted-foreground mb-4">{tableDetail.zone} — {tableDetail.capacity} seats</p>
                    {!showOpenForm ? (
                      <Button onClick={() => setShowOpenForm(true)} data-testid="open-table-btn"><Plus className="h-4 w-4 mr-1" /> Open Table</Button>
                    ) : (
                      <div className="space-y-3 max-w-xs mx-auto text-left" data-testid="open-table-form">
                        <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Guest name" autoFocus data-testid="open-table-guest-name" />
                        <select value={selectedServer} onChange={e => setSelectedServer(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="open-table-server">
                          <option value="">Select server...</option>
                          {barmen.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={handleOpenTable} disabled={!guestName.trim() || loading}>Open</Button>
                          <Button variant="outline" onClick={() => setShowOpenForm(false)}><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">Loading...</p>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg">Select a table</p>
              </div>
            )}
          </div>
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
            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse'
        }`} data-testid={`assign-server-${tableId}`}>
        <User className="h-2.5 w-2.5 inline mr-0.5" />
        {currentServer || 'Assign Server'}
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

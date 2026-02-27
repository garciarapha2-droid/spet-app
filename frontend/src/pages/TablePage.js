import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableAPI, tapAPI, kdsAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, LayoutGrid, Plus, Users, X, Trash2,
  Edit, Check, Home, LogOut, CreditCard, Banknote,
  Beer, UtensilsCrossed, Settings, Disc, User, ChevronDown
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const TablePage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', zone: 'main', capacity: 4 });
  const [editingTable, setEditingTable] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [openForm, setOpenForm] = useState({ guestName: '', server: '' });
  const [loading, setLoading] = useState(false);
  const [barmen, setBarmen] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [tablesRes, catRes, barmenRes] = await Promise.all([
        tableAPI.getTables(VENUE_ID()),
        tapAPI.getCatalog(VENUE_ID()),
        staffAPI.getBarmen(VENUE_ID()),
      ]);
      setTables(tablesRes.data.tables || []);
      setCatalog(catRes.data.items || []);
      setBarmen(barmenRes.data.barmen || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedTable) { setTableDetail(null); return; }
    const load = async () => {
      try {
        const res = await tableAPI.getTableDetail(selectedTable);
        setTableDetail(res.data);
      } catch { setTableDetail(null); }
    };
    load();
  }, [selectedTable]);

  const handleOpenTable = async () => {
    if (!openForm.guestName.trim() || !selectedTable) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('table_id', selectedTable);
      fd.append('guest_name', openForm.guestName.trim());
      if (openForm.server) fd.append('server_name', openForm.server);
      await tableAPI.openTable(fd);
      toast.success('Table opened');
      setOpenForm({ guestName: '', server: '' });
      await loadData();
      const res = await tableAPI.getTableDetail(selectedTable);
      setTableDetail(res.data);
    } catch (err) { toast.error('Failed to open table'); }
    setLoading(false);
  };

  const handleAddItem = async (item) => {
    if (!selectedTable || !tableDetail?.session) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('item_id', item.id);
      fd.append('qty', '1');
      await tableAPI.addTableItem(selectedTable, fd);
      const res = await tableAPI.getTableDetail(selectedTable);
      setTableDetail(res.data);
      await loadData();
    } catch (err) { toast.error('Failed to add item'); }
    setLoading(false);
  };

  const handleVoidItem = async (itemId) => {
    if (!tableDetail?.session) return;
    try {
      const fd = new FormData();
      fd.append('item_id', itemId);
      await tapAPI.voidItem(tableDetail.session.id, fd);
      const res = await tableAPI.getTableDetail(selectedTable);
      setTableDetail(res.data);
      await loadData();
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
  };

  const handleSendToKDS = async () => {
    if (!tableDetail?.session || !tableDetail.items?.length) return;
    setLoading(true);
    try {
      const itemIds = tableDetail.items.map(i => i.id).join(',');
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('session_id', tableDetail.session.id);
      fd.append('item_ids', itemIds);
      await kdsAPI.sendToKDS(fd);
      toast.success('Sent to kitchen/bar!');
      const res = await tableAPI.getTableDetail(selectedTable);
      setTableDetail(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send to KDS');
    }
    setLoading(false);
  };

  const handleCloseTable = async (method) => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('table_id', selectedTable);
      fd.append('payment_method', method);
      await tableAPI.closeTable(fd);
      toast.success('Table closed');
      setSelectedTable(null);
      setTableDetail(null);
      await loadData();
    } catch (err) { toast.error('Failed to close table'); }
    setLoading(false);
  };

  const handleAddTable = async () => {
    if (!newTable.number.trim()) return;
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('table_number', newTable.number.trim());
      fd.append('zone', newTable.zone);
      fd.append('capacity', newTable.capacity.toString());
      await tableAPI.addTable(fd);
      toast.success(`Table ${newTable.number} added`);
      setNewTable({ number: '', zone: 'main', capacity: 4 });
      setShowAddTable(false);
      await loadData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add table'); }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      await tableAPI.deleteTable(tableId);
      toast.success('Table deleted');
      if (selectedTable === tableId) {
        setSelectedTable(null);
        setTableDetail(null);
      }
      await loadData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Cannot delete occupied table'); }
  };

  const zones = [...new Set(tables.map(t => t.zone))];

  return (
    <div className="min-h-screen bg-background" data-testid="table-page">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tap')} data-testid="back-to-home-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <LayoutGrid className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Table Mode</span>
          <div className="h-5 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{tables.length} tables</span>
          <div className="h-5 w-px bg-border" />

          {/* Back to TAP / DISCO MODE toggle */}
          <label className="flex items-center gap-2 cursor-pointer" data-testid="disco-toggle">
            <Disc className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Disco</span>
            <div className="w-10 h-5 rounded-full transition-colors relative bg-muted"
              onClick={() => navigate('/tap')}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 translate-x-0.5" />
            </div>
          </label>
        </div>
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => setShowSettings(!showSettings)} data-testid="table-settings-btn">
            <Settings className="h-4 w-4 mr-1" /> Manage
          </Button>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn">
            <Home className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6" data-testid="table-settings">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Manage Tables</h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddTable(!showAddTable)} data-testid="add-table-btn">
                <Plus className="h-4 w-4 mr-1" /> Add Table
              </Button>
            </div>
            {showAddTable && (
              <div className="flex gap-3 mb-4 items-end" data-testid="add-table-form">
                <div><label className="text-xs text-muted-foreground">Number</label>
                  <Input value={newTable.number} onChange={e => setNewTable(p => ({ ...p, number: e.target.value }))}
                    placeholder="10" className="w-20" /></div>
                <div><label className="text-xs text-muted-foreground">Zone</label>
                  <select value={newTable.zone} onChange={e => setNewTable(p => ({ ...p, zone: e.target.value }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option>main</option><option>vip</option><option>patio</option><option>bar</option>
                  </select></div>
                <div><label className="text-xs text-muted-foreground">Seats</label>
                  <Input type="number" value={newTable.capacity} onChange={e => setNewTable(p => ({ ...p, capacity: parseInt(e.target.value) || 2 }))}
                    className="w-20" min={1} /></div>
                <Button size="sm" onClick={handleAddTable}>Add</Button>
              </div>
            )}
            <div className="space-y-2">
              {tables.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
                  <span className="font-medium w-16">#{t.table_number}</span>
                  <span className="text-sm text-muted-foreground w-20">{t.zone}</span>
                  <span className="text-sm text-muted-foreground"><Users className="h-3 w-3 inline" /> {t.capacity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === 'occupied' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'
                  }`}>{t.status}</span>
                  <div className="flex-1" />
                  {t.status !== 'occupied' && (
                    <button onClick={() => handleDeleteTable(t.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Table Grid */}
          <div className="col-span-4">
            {zones.map(zone => (
              <div key={zone} className="mb-6">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{zone}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {tables.filter(t => t.zone === zone).map(t => (
                    <button key={t.id} onClick={() => setSelectedTable(t.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedTable === t.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' :
                        t.status === 'occupied' ? 'border-orange-500/30 bg-orange-500/5' :
                        'border-border hover:border-primary/30'
                      }`} data-testid={`table-${t.table_number}`}>
                      <span className="text-lg font-bold">#{t.table_number}</span>
                      <p className="text-xs text-muted-foreground"><Users className="h-3 w-3 inline" /> {t.capacity}</p>
                      <span className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        t.status === 'occupied' ? 'bg-orange-500/10 text-orange-600' :
                        'bg-green-500/10 text-green-600'
                      }`}>{t.status === 'occupied' ? 'Occupied' : 'Available'}</span>
                      {t.status === 'occupied' && t.session_guest && (
                        <p className="text-xs text-primary mt-1 truncate font-medium">{t.session_guest}</p>
                      )}
                      {t.status === 'occupied' && t.tab_number && (
                        <p className="text-[10px] text-muted-foreground font-medium">Tab #{t.tab_number}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Center: Menu */}
          <div className="col-span-4">
            <h3 className="text-sm font-semibold mb-3">Menu</h3>
            <div className="grid grid-cols-2 gap-2">
              {catalog.map(item => (
                <button key={item.id} onClick={() => handleAddItem(item)}
                  disabled={!tableDetail?.session}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tableDetail?.session ? 'border-border hover:border-primary/30 hover:bg-primary/5' : 'border-border/50 opacity-50'
                  }`} data-testid={`menu-${item.id}`}>
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-primary font-bold text-sm">${item.price?.toFixed(2)}</span>
                    {item.is_alcohol ? <Beer className="h-3 w-3 text-muted-foreground" /> : <UtensilsCrossed className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Table Detail */}
          <div className="col-span-4 border-l border-border pl-6">
            {selectedTable && tableDetail ? (
              <div data-testid="table-detail">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Table #{tableDetail.table_number}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tableDetail.status === 'occupied' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'
                  }`}>{tableDetail.status}</span>
                </div>

                {tableDetail.status === 'available' ? (
                  <div className="space-y-3" data-testid="open-table-form">
                    <p className="text-muted-foreground text-sm">Open this table:</p>
                    <Input value={openForm.guestName} onChange={e => setOpenForm(p => ({ ...p, guestName: e.target.value }))}
                      placeholder="Guest / Party name" data-testid="open-table-guest" />
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Server / Waiter</label>
                      <select value={openForm.server} onChange={e => setOpenForm(p => ({ ...p, server: e.target.value }))}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        data-testid="open-table-server">
                        <option value="">Select server...</option>
                        {barmen.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <Button className="w-full" onClick={handleOpenTable} disabled={!openForm.guestName.trim() || loading}>
                      Open Table
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">{tableDetail.session?.guest_name}</p>
                    {tableDetail.session?.tab_number && (
                      <p className="text-sm text-primary font-semibold" data-testid="table-detail-tab-number">Tab #{tableDetail.session.tab_number}</p>
                    )}
                    {tableDetail.session?.server_name && (
                      <p className="text-xs text-muted-foreground mb-1">Server: {tableDetail.session.server_name}</p>
                    )}
                    <p className="text-2xl font-bold text-primary mb-4" data-testid="table-total">
                      ${(tableDetail.session?.total || 0).toFixed(2)}
                    </p>

                    {/* Items */}
                    <div className="space-y-1 mb-4 max-h-[300px] overflow-y-auto">
                      {(tableDetail.items || []).map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 text-sm group">
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-2">x{item.qty}</span>
                          </div>
                          <span className="font-medium mr-2">${item.line_total.toFixed(2)}</span>
                          <button onClick={() => handleVoidItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            data-testid={`void-table-item-${item.id}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <Button className="w-full" onClick={handleSendToKDS}
                        disabled={!tableDetail.items?.length || loading} data-testid="send-kds-btn">
                        <UtensilsCrossed className="h-4 w-4 mr-2" /> Send to Kitchen / Bar
                      </Button>
                      <p className="text-sm font-medium text-muted-foreground">Close & Pay</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={() => handleCloseTable('card')} disabled={loading} data-testid="table-pay-card">
                          <CreditCard className="h-4 w-4 mr-1" /> Card
                        </Button>
                        <Button variant="outline" onClick={() => handleCloseTable('cash')} disabled={loading} data-testid="table-pay-cash">
                          <Banknote className="h-4 w-4 mr-1" /> Cash
                        </Button>
                        <Button variant="outline" onClick={() => handleCloseTable('comp')} disabled={loading} data-testid="table-pay-comp">
                          <Beer className="h-4 w-4 mr-1" /> Comp
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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

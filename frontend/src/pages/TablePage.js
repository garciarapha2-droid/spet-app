import React, { useState, useEffect, useCallback } from 'react';
import { tableAPI, tapAPI, kdsAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  LayoutGrid, Users, X, CreditCard, Banknote, Beer,
  Plus, ArrowLeft, Send, Coffee, UtensilsCrossed, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENUE_ID = '40a24e04-75b6-435d-bfff-ab0d469ce543';

const STATUS_COLORS = {
  available: 'border-green-500/40 bg-green-500/5 hover:border-green-500',
  occupied: 'border-primary/40 bg-primary/5 hover:border-primary',
  reserved: 'border-yellow-500/40 bg-yellow-500/5',
};

const ZONE_LABELS = { main: 'Main Floor', vip: 'VIP', patio: 'Patio', bar: 'Bar Counter' };

export const TablePage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOpen, setShowOpen] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const loadTables = useCallback(async () => {
    try {
      const [tablesRes, catRes] = await Promise.all([
        tableAPI.listTables(VENUE_ID),
        tapAPI.getCatalog(VENUE_ID),
      ]);
      setTables(tablesRes.data.tables || []);
      setCatalog(catRes.data.items || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadTableDetail = useCallback(async (tableId) => {
    try {
      const res = await tableAPI.getTable(tableId);
      setActiveTable(res.data);
    } catch { setActiveTable(null); }
  }, []);

  const handleOpenTable = async (tableId) => {
    if (!guestName.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID);
      fd.append('table_id', tableId);
      fd.append('guest_name', guestName.trim());
      await tableAPI.openTable(fd);
      toast.success(`Table opened for ${guestName}`);
      setShowOpen(null);
      setGuestName('');
      await loadTables();
      await loadTableDetail(tableId);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to open table'); }
    setLoading(false);
  };

  const handleAddItem = async (catalogItem) => {
    if (!activeTable?.session) { toast.error('Open this table first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('item_id', catalogItem.id);
      fd.append('qty', '1');
      await tapAPI.addItem(activeTable.session.id, fd);
      await loadTableDetail(activeTable.id);
      await loadTables();
    } catch (err) { toast.error('Failed to add item'); }
    setLoading(false);
  };

  const handleSendToKds = async () => {
    if (!activeTable?.session || !activeTable.items?.length) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID);
      fd.append('session_id', activeTable.session.id);
      fd.append('item_ids', activeTable.items.map(i => i.id).join(','));
      const res = await kdsAPI.sendToKds(fd);
      const tickets = res.data.tickets || [];
      const dests = tickets.map(t => `${t.items_count} → ${t.destination}`).join(', ');
      toast.success(`Sent to KDS: ${dests}`);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to send to KDS'); }
    setLoading(false);
  };

  const handleCloseTable = async (method) => {
    if (!activeTable) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('table_id', activeTable.id);
      fd.append('payment_method', method);
      await tableAPI.closeTable(fd);
      toast.success('Table closed');
      setActiveTable(null);
      await loadTables();
    } catch (err) { toast.error('Failed to close table'); }
    setLoading(false);
  };

  const zones = [...new Set(tables.map(t => t.zone))];
  const categories = ['All', ...new Set(catalog.map(i => i.category))];
  const filteredCatalog = filterCategory === 'All' ? catalog : catalog.filter(i => i.category === filterCategory);

  return (
    <div className="min-h-screen bg-background" data-testid="table-page">
      <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pulse/entry')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">SPETAP</h1>
          <span className="text-sm text-muted-foreground">TABLE MODE</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/kitchen')} data-testid="go-kds-btn">
            <UtensilsCrossed className="h-4 w-4 mr-1" /> Kitchen (KDS)
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/login')} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Table Map */}
          <div className={activeTable ? 'col-span-4' : 'col-span-8'}>
            <h2 className="text-2xl font-semibold mb-6">Tables</h2>
            {zones.map(zone => (
              <div key={zone} className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {ZONE_LABELS[zone] || zone}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {tables.filter(t => t.zone === zone).map(t => (
                    <div key={t.id}
                      onClick={() => t.status === 'occupied' ? loadTableDetail(t.id) : setShowOpen(t.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${STATUS_COLORS[t.status]}`}
                      data-testid={`table-${t.table_number}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">{t.table_number}</span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">{t.capacity} seats</p>
                      {t.status === 'occupied' && (
                        <div className="mt-2">
                          <p className="text-sm font-medium truncate">{t.session_guest}</p>
                          <p className="text-sm font-bold text-primary">R${t.session_total.toFixed(2)}</p>
                        </div>
                      )}
                      {showOpen === t.id && t.status === 'available' && (
                        <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                          <Input value={guestName} onChange={e => setGuestName(e.target.value)}
                            placeholder="Guest name" autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleOpenTable(t.id)}
                            data-testid="open-table-name-input" />
                          <div className="flex gap-1">
                            <Button size="sm" className="flex-1" onClick={() => handleOpenTable(t.id)} disabled={!guestName.trim() || loading}
                              data-testid="confirm-open-table-btn">Open</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowOpen(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Center: Catalog (when table is active) */}
          {activeTable && (
            <div className="col-span-4">
              <h2 className="text-lg font-semibold mb-4">Menu</h2>
              <div className="flex gap-2 mb-3 flex-wrap">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredCatalog.map(item => (
                  <button key={item.id} onClick={() => handleAddItem(item)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 text-left w-full"
                    data-testid={`cat-item-${item.id}`}>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {item.is_alcohol ? <Beer className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
                        {item.category}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">R${item.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Right: Active Table Detail */}
          <div className={activeTable ? 'col-span-4 border-l border-border pl-8' : 'col-span-4'}>
            {activeTable ? (
              <div data-testid="table-detail">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Table {activeTable.table_number}</h2>
                    <p className="text-sm text-muted-foreground">
                      {activeTable.zone} — {activeTable.capacity} seats
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setActiveTable(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {activeTable.session ? (
                  <>
                    <div className="p-4 rounded-lg bg-muted/30 mb-4">
                      <p className="font-medium">{activeTable.session.guest_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeTable.session.covers} covers — since {new Date(activeTable.session.opened_at).toLocaleTimeString()}
                      </p>
                      <p className="text-2xl font-bold text-primary mt-2" data-testid="table-total">
                        R${activeTable.session.total.toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-1 mb-4 max-h-[250px] overflow-y-auto">
                      {(activeTable.items || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No items — add from menu</p>
                      ) : (
                        activeTable.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded text-sm hover:bg-muted/30">
                            <div className="flex items-center gap-2">
                              {item.is_alcohol ? <Beer className="h-3 w-3 text-primary" /> : <UtensilsCrossed className="h-3 w-3 text-muted-foreground" />}
                              <span className="font-medium">{item.name}</span>
                              <span className="text-muted-foreground">x{item.qty}</span>
                            </div>
                            <span className="font-medium">R${item.line_total.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {activeTable.items?.length > 0 && (
                      <Button className="w-full mb-4" variant="outline" onClick={handleSendToKds} disabled={loading}
                        data-testid="send-kds-btn">
                        <Send className="h-4 w-4 mr-2" /> Send to Kitchen / Bar
                      </Button>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-muted-foreground">Close Table</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleCloseTable('card')} disabled={loading}
                          data-testid="table-pay-card"><CreditCard className="h-4 w-4 mr-1" /> Card</Button>
                        <Button variant="outline" size="sm" onClick={() => handleCloseTable('cash')} disabled={loading}
                          data-testid="table-pay-cash"><Banknote className="h-4 w-4 mr-1" /> Cash</Button>
                        <Button variant="outline" size="sm" onClick={() => handleCloseTable('comp')} disabled={loading}
                          data-testid="table-pay-comp"><Beer className="h-4 w-4 mr-1" /> Comp</Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    <p>Table available</p>
                    <p className="text-sm">Click to seat guests</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg">Select a table</p>
                <p className="text-sm">Green = available, Purple = occupied</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

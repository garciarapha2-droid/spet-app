import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI, staffAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Home, LogOut, Users, UtensilsCrossed, Settings,
  Plus, Pencil, Trash2, Check, X, BarChart3, DollarSign,
  Search
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const VENUE_NAME = () => localStorage.getItem('active_venue_name') || 'Demo Club';

export const ManagerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu');
  const [catalog, setCatalog] = useState([]);
  const [barmen, setBarmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Snacks', is_alcohol: false });
  const [showAddBarman, setShowAddBarman] = useState(false);
  const [newBarmanName, setNewBarmanName] = useState('');
  const [editingBarman, setEditingBarman] = useState(null);
  const [editBarmanName, setEditBarmanName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [catRes, barRes] = await Promise.all([
        tapAPI.getCatalog(VENUE_ID()), staffAPI.getBarmen(VENUE_ID()),
      ]);
      setCatalog(catRes.data.items || []); setBarmen(barRes.data.barmen || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddCatalogItem = async () => {
    if (!newItem.name.trim() || !newItem.price) return;
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID()); fd.append('name', newItem.name.trim());
      fd.append('category', newItem.category); fd.append('price', parseFloat(newItem.price).toString());
      fd.append('is_alcohol', newItem.is_alcohol.toString());
      await tapAPI.addCatalogItem(fd);
      setNewItem({ name: '', price: '', category: 'Snacks', is_alcohol: false }); setShowAddItem(false);
      await loadData(); toast.success('Item added');
    } catch { toast.error('Failed'); }
  };

  const handleAddBarman = async () => {
    if (!newBarmanName.trim()) return;
    try {
      const fd = new FormData(); fd.append('venue_id', VENUE_ID()); fd.append('name', newBarmanName.trim());
      await staffAPI.addBarman(fd); setNewBarmanName(''); setShowAddBarman(false); await loadData(); toast.success('Added');
    } catch { toast.error('Failed'); }
  };

  const handleEditBarman = async (id) => {
    if (!editBarmanName.trim()) return;
    try { const fd = new FormData(); fd.append('name', editBarmanName.trim()); await staffAPI.updateBarman(id, fd); setEditingBarman(null); await loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleDeleteBarman = async (id) => {
    try { await staffAPI.deleteBarman(id); await loadData(); toast.success('Removed'); } catch { toast.error('Failed'); }
  };

  const categories = ['All', ...new Set(catalog.map(i => i.category))];
  const filteredCatalog = catalog.filter(i => {
    if (filterCategory !== 'All' && i.category !== filterCategory) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const TABS = [
    { key: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { key: 'staff', label: 'Staff', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="manager-page">
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn"><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-lg font-bold tracking-tight">Manager</h1>
          <span className="text-sm text-muted-foreground">{VENUE_NAME()}</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-56 border-r border-border bg-card min-h-[calc(100vh-56px)] p-4 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                data-testid={`manager-tab-${tab.key}`}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 p-8">
          {activeTab === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Menu Management</h2>
                  <p className="text-sm text-muted-foreground">{catalog.length} items across {categories.length - 1} categories</p>
                </div>
                <Button onClick={() => setShowAddItem(!showAddItem)} data-testid="add-menu-item-btn"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
              </div>

              {showAddItem && (
                <div className="bg-card border border-primary/20 rounded-xl p-5 mb-6 space-y-3" data-testid="add-item-form">
                  <h3 className="font-semibold text-sm">New Menu Item</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" />
                    <Input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="$ Price" />
                    <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option>Snacks</option><option>Starters</option><option>Mains</option>
                      <option>Drinks</option><option>Cocktails</option><option>Beers</option><option>No Alcohol</option><option>Other</option>
                    </select>
                    <div className="flex gap-2 items-center">
                      <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={newItem.is_alcohol} onChange={e => setNewItem(p => ({ ...p, is_alcohol: e.target.checked }))} /> Alcohol</label>
                      <Button onClick={handleAddCatalogItem} disabled={!newItem.name || !newItem.price}>Add</Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search menu..." className="pl-9" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1">
                <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase"><span>Item</span><span>Category</span><span>Price</span><span>Type</span><span></span></div>
                {filteredCatalog.map(item => (
                  <div key={item.id} className="grid grid-cols-5 gap-4 px-4 py-3 rounded-lg hover:bg-muted/30 items-center text-sm border-b border-border/50">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.category}</span>
                    <span className="font-bold text-primary">${item.price?.toFixed(2)}</span>
                    <span>{item.is_alcohol ? <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">Alcohol</span> : <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">No Alcohol</span>}</span>
                    <span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-2xl font-bold">Staff Management</h2><p className="text-sm text-muted-foreground">{barmen.length} active members</p></div>
                <Button onClick={() => setShowAddBarman(!showAddBarman)} data-testid="add-staff-btn"><Plus className="h-4 w-4 mr-2" /> Add Staff</Button>
              </div>
              {showAddBarman && (
                <div className="bg-card border border-primary/20 rounded-xl p-5 mb-6 flex gap-3 items-end">
                  <Input value={newBarmanName} onChange={e => setNewBarmanName(e.target.value)} placeholder="Staff member name" className="max-w-xs" />
                  <Button onClick={handleAddBarman} disabled={!newBarmanName.trim()}>Add</Button>
                </div>
              )}
              <div className="space-y-2">
                {barmen.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30">
                    {editingBarman === b.id ? (
                      <div className="flex items-center gap-2">
                        <Input value={editBarmanName} onChange={e => setEditBarmanName(e.target.value)} className="max-w-xs" autoFocus onKeyDown={e => e.key === 'Enter' && handleEditBarman(b.id)} />
                        <Button size="sm" onClick={() => handleEditBarman(b.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingBarman(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                        <div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">Bartender / Server</p></div>
                      </div>
                    )}
                    {editingBarman !== b.id && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingBarman(b.id); setEditBarmanName(b.name); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteBarman(b.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Venue Settings</h2>
              <div className="max-w-lg space-y-6">
                <div className="space-y-2"><label className="text-sm font-medium">Venue Name</label><Input defaultValue={VENUE_NAME()} readOnly className="bg-muted/30" /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Currency</label><Input defaultValue="USD ($)" readOnly className="bg-muted/30" /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Operating Mode</label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Club / Disco</option><option>Restaurant</option><option>Bar</option><option>Event Space</option></select>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium">KDS Enabled</label>
                  <div className="flex items-center gap-2"><input type="checkbox" defaultChecked /><span className="text-sm text-muted-foreground">Kitchen Display System active</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Operational Reports</h2>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Open Tabs</p><p className="text-3xl font-bold mt-1">7</p></div>
                <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Today's Revenue</p><p className="text-3xl font-bold mt-1 text-green-500">$1,247.00</p></div>
                <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Active Staff</p><p className="text-3xl font-bold mt-1">{barmen.length}</p></div>
              </div>
              <p className="text-muted-foreground text-sm">Detailed reports coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

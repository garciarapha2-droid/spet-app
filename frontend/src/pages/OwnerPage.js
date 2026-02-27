import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tapAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Home, LogOut, Building2, BarChart3, Users,
  DollarSign, TrendingUp, Clock, ChevronRight, Settings
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const VENUE_NAME = () => localStorage.getItem('active_venue_name') || 'Demo Club';

export const OwnerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});

  const loadData = useCallback(async () => {
    try {
      const res = await tapAPI.getStats(VENUE_ID());
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'venues', label: 'Venues', icon: Building2 },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'managers', label: 'Managers', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="owner-page">
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn"><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-lg font-bold tracking-tight">Owner Dashboard</h1>
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
                data-testid={`owner-tab-${tab.key}`}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Business Overview</h2>
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2"><DollarSign className="h-4 w-4" /><span className="text-sm">Today's Revenue</span></div>
                  <p className="text-3xl font-bold text-green-500">${(stats.revenue_today || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">+12% from yesterday</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2"><Clock className="h-4 w-4" /><span className="text-sm">Open Tabs</span></div>
                  <p className="text-3xl font-bold">{stats.open_tabs || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">${(stats.running_total || 0).toFixed(0)} running</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2"><Users className="h-4 w-4" /><span className="text-sm">Tabs Closed Today</span></div>
                  <p className="text-3xl font-bold">{stats.closed_today || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg $42 per tab</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2"><TrendingUp className="h-4 w-4" /><span className="text-sm">Month to Date</span></div>
                  <p className="text-3xl font-bold">$28,450</p>
                  <p className="text-xs text-muted-foreground mt-1">+8% from last month</p>
                </div>
              </div>

              {/* Venue card */}
              <h3 className="text-lg font-semibold mb-4">Your Venues</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 cursor-pointer hover:border-primary/60 transition-all" data-testid="venue-card-active">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>
                      <div>
                        <h4 className="font-bold">{VENUE_NAME()}</h4>
                        <p className="text-xs text-green-500 font-medium">Active Now</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div><p className="text-lg font-bold">{stats.open_tabs || 0}</p><p className="text-xs text-muted-foreground">Open Tabs</p></div>
                    <div><p className="text-lg font-bold text-green-500">${(stats.revenue_today || 0).toFixed(0)}</p><p className="text-xs text-muted-foreground">Revenue</p></div>
                    <div><p className="text-lg font-bold">3</p><p className="text-xs text-muted-foreground">Staff On</p></div>
                  </div>
                </div>

                <div className="bg-card border-2 border-dashed border-border rounded-xl p-6 flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/30 transition-all">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Add New Venue</p>
                    <p className="text-xs">Expand your operations</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Venues</h2>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>
                    <div><h4 className="font-bold">{VENUE_NAME()}</h4><p className="text-sm text-muted-foreground">Club / Disco — Active</p></div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/manager')}>Manage</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Analytics</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center"><BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" /><p>Revenue Chart</p><p className="text-xs">Coming soon</p></div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center"><TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" /><p>Guest Flow Chart</p><p className="text-xs">Coming soon</p></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'managers' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Manager Access</h2>
              <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                  <div><p className="font-medium">teste@teste.com</p><p className="text-xs text-muted-foreground">Owner — Full Access</p></div>
                </div>
                <span className="text-xs bg-green-500/10 text-green-600 px-3 py-1 rounded-full font-medium">Active</span>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Owner Settings</h2>
              <div className="max-w-lg space-y-6">
                <div className="space-y-2"><label className="text-sm font-medium">Company Name</label><input className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 text-sm" defaultValue="Demo Club Inc." readOnly /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Subscription Plan</label>
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <p className="font-bold">Professional Plan</p>
                    <p className="text-sm text-muted-foreground">All modules included — Pulse, TAP, Table, KDS</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

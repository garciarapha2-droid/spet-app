import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowLeft, Home, LogOut, Building2, BarChart3, Users,
  DollarSign, TrendingUp, TrendingDown, Clock, Settings,
  Shield, Lightbulb, ChevronRight, Heart, Activity, Server,
  AlertTriangle, X, Zap, Target, PieChart, Copy, ClipboardCheck,
  ChevronDown, UserPlus, ToggleLeft, ToggleRight
} from 'lucide-react';

const VNAME = () => localStorage.getItem('active_venue_name') || 'Demo Club';

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'venues', label: 'Performance', icon: Building2 },
  { key: 'insights', label: 'AI Insights', icon: Lightbulb },
  { key: 'finance', label: 'Finance & Risk', icon: DollarSign },
  { key: 'growth', label: 'Growth & Loyalty', icon: Heart },
  { key: 'people', label: 'People & Ops', icon: Users },
  { key: 'system', label: 'System', icon: Server },
];

export const OwnerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('all');
  const [showVenueMenu, setShowVenueMenu] = useState(false);

  useEffect(() => {
    ownerAPI.getVenues().then(r => setVenues(r.data?.venues || [])).catch(() => {});
  }, []);

  const selectedVenueName = selectedVenueId === 'all'
    ? 'All Venues'
    : venues.find(v => v.venue_id === selectedVenueId)?.name || 'All Venues';

  return (
    <div className="min-h-screen bg-background" data-testid="owner-page">
      <header className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn"><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-base font-extrabold tracking-tight">Owner Dashboard</h1>
          {/* Multi-venue Selector */}
          <div className="relative">
            <button onClick={() => setShowVenueMenu(!showVenueMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              data-testid="venue-selector-btn">
              <Building2 className="h-3.5 w-3.5" />
              <span>{selectedVenueName}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showVenueMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 min-w-[220px] py-1" data-testid="venue-selector-dropdown">
                <button onClick={() => { setSelectedVenueId('all'); setShowVenueMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${selectedVenueId === 'all' ? 'text-primary font-medium' : ''}`}>
                  All Venues
                </button>
                {venues.map(v => (
                  <button key={v.venue_id} onClick={() => { setSelectedVenueId(v.venue_id); setShowVenueMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${selectedVenueId === v.venue_id ? 'text-primary font-medium' : ''}`}>
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); window.location.href = process.env.REACT_APP_LOVABLE_LOGIN_URL || 'https://spet.lovable.app/login'; }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-52 border-r border-border/60 bg-card/50 min-h-[calc(100vh-56px)] p-3 space-y-0.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
                data-testid={`owner-tab-${tab.key}`}>
                <Icon className="h-4 w-4 shrink-0" /> {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-56px)]">
          {activeTab === 'overview' && <OverviewSection />}
          {activeTab === 'venues' && <VenuesSection />}
          {activeTab === 'insights' && <InsightsSection />}
          {activeTab === 'finance' && <FinanceSection />}
          {activeTab === 'growth' && <GrowthSection />}
          {activeTab === 'people' && <PeopleSection />}
          {activeTab === 'system' && <SystemSection />}
        </main>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   1. OVERVIEW — with Business / Venue / Events View Switcher
   ═══════════════════════════════════════════════════════════════════ */
function OverviewSection() {
  const [view, setView] = useState('business');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((v) => {
    setLoading(true);
    ownerAPI.getDashboard(v || view).then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [view]);

  useEffect(() => { load(); }, [load]);

  const switchView = (v) => { setView(v); load(v); };

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data</p>;

  const VIEWS = [
    { key: 'business', label: 'Business Overview', icon: BarChart3 },
    { key: 'venue', label: 'By Venue', icon: Building2 },
    { key: 'events', label: 'By Event', icon: Activity },
  ];

  return (
    <div data-testid="owner-overview">
      {/* View Switcher */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Overview</h2>
        <div className="flex items-center bg-muted/50 rounded-lg p-1" data-testid="view-switcher">
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button key={v.key} onClick={() => switchView(v.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  view === v.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                data-testid={`view-${v.key}`}>
                <Icon className="h-4 w-4" /> {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Business View */}
      {view === 'business' && data.kpis && <BusinessView kpis={data.kpis} venues={data.venues || []} />}

      {/* Venue View */}
      {view === 'venue' && <VenueView venues={data.venues || []} />}

      {/* Events View */}
      {view === 'events' && <EventsView events={data.events || []} />}
    </div>
  );
}

function BusinessView({ kpis, venues }) {
  return (
    <>
      {/* Row 1: Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BigKPI icon={DollarSign} label="Revenue Today" value={`$${kpis.revenue_today.toFixed(0)}`} accent="text-green-500" testid="kpi-rev-today" />
        <BigKPI icon={DollarSign} label="Month to Date" value={`$${kpis.revenue_mtd.toFixed(0)}`} accent="text-emerald-500" testid="kpi-rev-mtd" />
        <BigKPI icon={DollarSign} label="Year to Date" value={`$${kpis.revenue_ytd.toFixed(0)}`} accent="text-teal-500" testid="kpi-rev-ytd" />
        <BigKPI icon={DollarSign} label="Est. Profit (MTD)" value={`$${kpis.estimated_profit.toFixed(0)}`} accent="text-blue-500" testid="kpi-profit" />
      </div>

      {/* Row 2: Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BigKPI icon={TrendingUp} label="Growth" value={`${kpis.growth_pct > 0 ? '+' : ''}${kpis.growth_pct}%`}
          accent={kpis.growth_pct >= 0 ? 'text-green-500' : 'text-red-500'} testid="kpi-growth" />
        <BigKPI icon={Target} label="ARPU" value={`$${kpis.arpu.toFixed(2)}`} accent="text-purple-500" testid="kpi-arpu" />
        <BigKPI icon={Heart} label="Retention" value={`${kpis.retention_pct}%`} accent="text-pink-500" testid="kpi-retention" />
        <BigKPI icon={Users} label="Guests Today" value={kpis.total_guests_today} testid="kpi-guests" />
      </div>

      {/* Row 3: Operational */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4" data-testid="kpi-tabs">
          <p className="text-xs text-muted-foreground">Open Tabs</p>
          <p className="text-2xl font-bold">{kpis.open_tabs}</p>
          <p className="text-xs text-muted-foreground">${kpis.running_total.toFixed(0)} running</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Tabs Closed Today</p>
          <p className="text-2xl font-bold">{kpis.closed_today}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Avg Ticket</p>
          <p className="text-2xl font-bold text-primary">${kpis.avg_ticket.toFixed(2)}</p>
        </div>
      </div>

      {/* Venues Summary */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Venues</h3>
      <div className="grid grid-cols-2 gap-4">
        {venues.map(v => (
          <div key={v.venue_id} className="bg-card border-2 border-primary/20 rounded-xl p-5 hover:border-primary/40 transition-colors" data-testid={`venue-card-${v.venue_id}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <h4 className="font-bold text-sm">{v.name}</h4>
                  <HealthBadge health={v.health} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-lg font-bold text-green-500">${v.revenue_today.toFixed(0)}</p><p className="text-[10px] text-muted-foreground">Revenue</p></div>
              <div><p className="text-lg font-bold">{v.open_tabs}</p><p className="text-[10px] text-muted-foreground">Tabs</p></div>
              <div><p className="text-lg font-bold">{v.guests_today}</p><p className="text-[10px] text-muted-foreground">Guests</p></div>
            </div>
          </div>
        ))}
        <div className="border-2 border-dashed border-border rounded-xl p-5 flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
          <div className="text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">Add New Venue</p>
          </div>
        </div>
      </div>
    </>
  );
}

function VenueView({ venues }) {
  if (!venues.length) return <p className="text-muted-foreground p-4">No venue data available</p>;
  return (
    <div data-testid="venue-view">
      <div className="space-y-4">
        {venues.map(v => (
          <div key={v.venue_id} className="bg-card border border-border rounded-xl p-5" data-testid={`venue-financial-${v.venue_id}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <h4 className="font-bold">{v.name}</h4>
                  <HealthBadge health={v.health} />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{v.staff_count} staff</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <p className="text-xl font-bold text-green-500">${v.revenue_today.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">Today</p>
              </div>
              <div className="text-center p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                <p className="text-xl font-bold text-emerald-500">${v.revenue_mtd.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">MTD</p>
              </div>
              <div className="text-center p-3 bg-teal-500/5 rounded-lg border border-teal-500/20">
                <p className="text-xl font-bold text-teal-500">${v.revenue_ytd.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">YTD</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-primary">${v.avg_ticket.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Avg Ticket</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold">{v.open_tabs} / {v.closed_today}</p>
                <p className="text-[10px] text-muted-foreground">Open / Closed</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsView({ events }) {
  if (!events.length) return (
    <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center">
      <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
      <p className="text-sm text-muted-foreground">No events found with financial data</p>
    </div>
  );
  return (
    <div data-testid="events-view">
      <div className="space-y-3">
        {events.map(ev => (
          <div key={ev.event_id} className="bg-card border border-border rounded-xl p-5" data-testid={`event-financial-${ev.event_id}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Activity className="h-5 w-5 text-primary" /></div>
                <div>
                  <h4 className="font-bold text-sm">{ev.name}</h4>
                  <p className="text-xs text-muted-foreground">{ev.venue_name} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                ev.status === 'active' ? 'bg-green-500/10 text-green-600' :
                ev.status === 'ended' ? 'bg-muted text-muted-foreground' :
                'bg-blue-500/10 text-blue-600'}`}>{ev.status}</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <p className="text-xl font-bold text-green-500">${ev.revenue.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold">{ev.tabs_closed}</p>
                <p className="text-[10px] text-muted-foreground">Tabs Closed</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold">{ev.guests}</p>
                <p className="text-[10px] text-muted-foreground">Guests</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold">{ev.staff}</p>
                <p className="text-[10px] text-muted-foreground">Staff</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. PERFORMANCE BY VENUE
   ═══════════════════════════════════════════════════════════════════ */
function VenuesSection() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ownerAPI.getVenues(),
      ownerAPI.getDashboard('events'),
    ]).then(([vRes, eRes]) => {
      setData(vRes.data);
      setEventsData(eRes.data);
    }).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data?.venues?.length) return <p className="text-muted-foreground">No venues</p>;

  const selectedVenue = selected ? data.venues.find(v => v.venue_id === selected) : null;

  return (
    <div data-testid="venues-section">
      {/* ── Performance by Venue (ABOVE) ── */}
      <h2 className="text-xl font-bold mb-4">Performance by Venue</h2>

      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-8 gap-4 px-5 py-3 text-xs font-medium text-muted-foreground uppercase bg-muted/30">
          <span>Venue</span><span>Health</span><span>Revenue Today</span><span>Revenue MTD</span><span>Tabs</span><span>Guests</span><span>Avg Ticket</span><span>Voids</span>
        </div>
        {data.venues.map(v => (
          <div key={v.venue_id} onClick={() => setSelected(selected === v.venue_id ? null : v.venue_id)}
            className={`grid grid-cols-8 gap-4 px-5 py-3 text-sm border-t border-border/50 cursor-pointer hover:bg-muted/20 transition-colors ${selected === v.venue_id ? 'bg-primary/5' : ''}`}
            data-testid={`venue-row-${v.venue_id}`}>
            <span className="font-medium">{v.name}</span>
            <span><HealthBadge health={v.health} /></span>
            <span className="text-green-500 font-bold">${v.revenue_today.toFixed(0)}</span>
            <span className="font-medium">${v.revenue_month.toFixed(0)}</span>
            <span>{v.tabs_open} open / {v.tabs_closed_today} closed</span>
            <span>{v.guests_today}</span>
            <span className="text-primary">${v.avg_ticket.toFixed(2)}</span>
            <span className={v.voids_today > 3 ? 'text-red-500 font-bold' : ''}>{v.voids_today}</span>
          </div>
        ))}
      </div>

      {/* Venue Drill-down */}
      {selectedVenue && (
        <div className="bg-card border border-primary/20 rounded-xl p-5 mb-6" data-testid="venue-drilldown">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{selectedVenue.name} — Detail</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Stat label="Staff Active" value={selectedVenue.staff_count} />
            <Stat label="Revenue Today" value={`$${selectedVenue.revenue_today.toFixed(0)}`} accent="text-green-500" />
            <Stat label="Avg Ticket" value={`$${selectedVenue.avg_ticket.toFixed(2)}`} />
            <Stat label="Guests" value={selectedVenue.guests_today} />
          </div>
          {selectedVenue.top_items?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Top Items Today</h4>
              <div className="flex gap-3 flex-wrap">
                {selectedVenue.top_items.map((item, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-green-500 ml-2 font-bold">${item.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Performance by Event (BELOW) ── */}
      <h2 className="text-xl font-bold mb-4 mt-8">Performance by Event</h2>
      {eventsData?.events?.length > 0 ? (
        <div className="space-y-3">
          {eventsData.events.map(ev => (
            <div key={ev.event_id} className="bg-card border border-border rounded-xl p-5" data-testid={`perf-event-${ev.event_id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Activity className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h4 className="font-bold text-sm">{ev.name}</h4>
                    <p className="text-xs text-muted-foreground">{ev.venue_name} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ev.status === 'active' ? 'bg-green-500/10 text-green-600' :
                  ev.status === 'ended' ? 'bg-muted text-muted-foreground' :
                  'bg-blue-500/10 text-blue-600'}`}>{ev.status}</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="text-xl font-bold text-green-500">${ev.revenue.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xl font-bold">{ev.tabs_closed}</p>
                  <p className="text-[10px] text-muted-foreground">Tabs Closed</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xl font-bold">{ev.guests}</p>
                  <p className="text-[10px] text-muted-foreground">Guests</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xl font-bold">{ev.staff}</p>
                  <p className="text-[10px] text-muted-foreground">Staff</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center">
          <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No events with financial data</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. AI INSIGHTS — Conversational & Participatory
   ═══════════════════════════════════════════════════════════════════ */
function InsightsSection() {
  const [conversations, setConversations] = useState([]);
  const [ruleInsights, setRuleInsights] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [ruleLoading, setRuleLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    ownerAPI.getInsights().then(r => setRuleInsights(r.data.insights || [])).catch(() => {}).finally(() => setRuleLoading(false));
  }, []);

  const sendQuestion = async (questionText) => {
    const q = questionText || inputValue.trim();
    if (!q && conversations.length > 0) return;
    setLoading(true);
    setInputValue('');
    try {
      const res = await ownerAPI.generateAIInsights(q || null);
      const newInsights = res.data.insights || [];
      const entry = {
        id: Date.now(),
        question: q || null,
        insights: newInsights,
        timestamp: new Date().toISOString(),
      };
      setConversations(prev => [...prev, entry]);
    } catch { toast.error('AI analysis failed'); }
    setLoading(false);
  };

  const removeCard = (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const handleNextStep = (step) => {
    setInputValue(step);
  };

  const [copiedId, setCopiedId] = useState(null);
  const copyInsight = (convId, insight) => {
    const text = [
      `Priority: ${insight.priority?.toUpperCase()}`,
      `\nSummary:\n${insight.summary}`,
      `\nWhat We See:\n${insight.what_we_see}`,
      `\nRecommended Actions:\n${(insight.recommended_actions || []).map((a, i) => `  ${i+1}. ${a}`).join('\n')}`,
      insight.reference ? `\nReference: ${insight.reference}` : '',
      insight.next_steps?.length ? `\nNext Steps:\n${insight.next_steps.map((s, i) => `  ${i+1}. ${s}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(convId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Insight copied');
  };

  const categorizeStep = (step) => {
    const lower = step.toLowerCase();
    if (lower.includes('revenue') || lower.includes('cost') || lower.includes('price') || lower.includes('margin') || lower.includes('profit') || lower.includes('financial'))
      return { label: 'Revenue', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
    if (lower.includes('staff') || lower.includes('team') || lower.includes('hire') || lower.includes('training'))
      return { label: 'Staff', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (lower.includes('growth') || lower.includes('market') || lower.includes('expand') || lower.includes('customer'))
      return { label: 'Growth', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
    return { label: 'Strategy', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
  };

  const typeStyles = {
    critical: { border: 'border-red-500/40', bg: 'bg-red-500/5', icon: 'text-red-500', badge: 'bg-red-500/10 text-red-600' },
    warning: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', icon: 'text-yellow-500', badge: 'bg-yellow-500/10 text-yellow-600' },
    info: { border: 'border-blue-500/40', bg: 'bg-blue-500/5', icon: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-600' },
  };

  return (
    <div data-testid="insights-section" className="flex flex-col h-[calc(100vh-56px-48px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">AI Business Partner</h2>
          <p className="text-sm text-muted-foreground">Strategic analysis powered by GPT-5.2 — ask anything about your business</p>
        </div>
      </div>

      {/* Rule-based alerts (always shown) */}
      {!ruleLoading && ruleInsights.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Alerts</h3>
          <div className="space-y-2">
            {ruleInsights.filter(i => !dismissed.has(i.id)).map(insight => {
              const s = typeStyles[insight.type] || typeStyles.info;
              return (
                <div key={insight.id} className={`border rounded-lg p-3 flex items-center gap-3 ${s.border} ${s.bg}`}>
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${s.icon}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{insight.situation}</span>
                    <span className="text-xs text-muted-foreground ml-2">{insight.venue}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDismissed(prev => new Set(prev).add(insight.id))}><X className="h-3.5 w-3.5" /></Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {/* Empty State */}
        {conversations.length === 0 && !loading && (
          <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center" data-testid="ai-empty-state">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-base mb-2">Your AI Business Partner</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Ask about revenue trends, venue health, growth opportunities, or click below to get a general analysis of your business.
            </p>
            <Button onClick={() => sendQuestion(null)} className="mb-4" data-testid="initial-analysis-btn">
              <Zap className="h-4 w-4 mr-2" /> Generate Business Analysis
            </Button>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {[
                "How is my business performing this month?",
                "Which venue needs attention?",
                "What are my biggest risks right now?",
              ].map((suggestion, i) => (
                <button key={i} onClick={() => { setInputValue(suggestion); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  data-testid={`suggestion-${i}`}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Cards */}
        {conversations.map((conv) => (
          <div key={conv.id} className="space-y-3" data-testid={`ai-conv-${conv.id}`}>
            {/* User question */}
            {conv.question && (
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 max-w-lg">
                  <p className="text-sm font-medium">{conv.question}</p>
                </div>
              </div>
            )}

            {/* AI Response Cards — Redesigned */}
            {conv.insights.map((insight, idx) => {
              const s = typeStyles[insight.priority] || typeStyles.info;
              return (
                <div key={idx} className={`border rounded-xl overflow-hidden ${s.border}`} data-testid={`ai-insight-${conv.id}-${idx}`}>
                  {/* Card Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${s.bg}`}>
                    <div className="flex items-center gap-2">
                      <Lightbulb className={`h-4 w-4 ${s.icon}`} />
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${s.badge}`}>{insight.priority}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => copyInsight(`${conv.id}-${idx}`, insight)}
                        className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                        title="Copy insight"
                        data-testid={`copy-insight-${conv.id}-${idx}`}>
                        {copiedId === `${conv.id}-${idx}`
                          ? <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => removeCard(conv.id)}
                        className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                        data-testid={`delete-insight-${conv.id}`}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4 space-y-4 bg-card">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-sm font-semibold leading-relaxed">{insight.summary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">What We See</p>
                      <p className="text-sm leading-relaxed text-foreground/90">{insight.what_we_see}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Recommended Actions</p>
                      <div className="space-y-1.5">
                        {(insight.recommended_actions || []).map((action, ai) => (
                          <div key={ai} className="flex items-start gap-2.5 pl-1">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{ai+1}</span>
                            <span className="text-sm leading-relaxed">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {insight.reference && (
                      <div className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
                        {insight.reference}
                      </div>
                    )}

                    {/* Next Steps — Clean, contextual */}
                    {insight.next_steps && insight.next_steps.length > 0 && (
                      <div className="pt-3 border-t border-border/50" data-testid={`next-steps-${conv.id}-${idx}`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Next Steps</p>
                        <div className="space-y-1.5">
                          {insight.next_steps.map((step, si) => (
                            <button key={si} onClick={() => handleNextStep(step)}
                              className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                              data-testid={`next-step-${conv.id}-${idx}-${si}`}>
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{si+1}</span>
                              <p className="text-sm leading-relaxed group-hover:text-primary transition-colors flex-1">{step}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center animate-pulse" data-testid="ai-loading">
            <Zap className="h-6 w-6 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-primary font-medium">Analyzing your business data...</p>
          </div>
        )}
      </div>

      {/* Always-visible Input */}
      <div className="border-t border-border pt-3 bg-background sticky bottom-0" data-testid="ai-input-area">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { /* allow newline */ } }}
            placeholder="Ask about your business — revenue, growth, risks, staff..."
            className="flex-1 min-h-[40px] max-h-[120px] rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={loading}
            rows={1}
            data-testid="ai-input"
          />
          <Button onClick={() => sendQuestion()} disabled={loading || (!inputValue.trim() && conversations.length > 0)} data-testid="ai-send-btn">
            {loading ? <><Zap className="h-4 w-4 mr-1 animate-spin" /> Analyzing...</> : <><Zap className="h-4 w-4 mr-1" /> Ask AI</>}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">AI insights are read-only and based on your business data. They may contain inaccuracies. Always validate with your team.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   4. FINANCE & RISK
   ═══════════════════════════════════════════════════════════════════ */
function FinanceSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.getFinance().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const riskColor = data.risk_score < 20 ? 'text-green-500' : data.risk_score < 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div data-testid="finance-section">
      <h2 className="text-xl font-bold mb-4">Finance & Risk</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Revenue MTD</p>
          <p className="text-3xl font-bold text-green-500">${data.revenue_month.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Risk Score</p>
          <p className={`text-3xl font-bold ${riskColor}`}>{data.risk_score}/100</p>
          <p className="text-xs text-muted-foreground mt-1">{data.risk_score < 20 ? 'Low Risk' : data.risk_score < 50 ? 'Moderate' : 'High Risk'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Chargebacks</p>
          <p className="text-3xl font-bold">{data.chargebacks}</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">Payment Methods (MTD)</h3>
        {data.payments?.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {data.payments.map(p => (
              <div key={p.method} className="text-center p-3 bg-muted/20 rounded-lg">
                <p className="text-xl font-bold text-green-500">${p.total.toFixed(0)}</p>
                <p className="text-sm capitalize font-medium">{p.method}</p>
                <p className="text-xs text-muted-foreground">{p.count} tx</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No payments this month</p>}
      </div>

      {/* Voids Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Voids & Exceptions</h3>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total Voids" value={data.voids_summary?.count || 0} />
          <Stat label="Void Amount" value={`$${(data.voids_summary?.amount || 0).toFixed(2)}`} accent="text-red-500" />
          <Stat label="Void Rate" value={`${data.voids_summary?.rate_pct || 0}%`} accent={data.voids_summary?.rate_pct > 5 ? 'text-red-500' : ''} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. GROWTH & LOYALTY
   ═══════════════════════════════════════════════════════════════════ */
function GrowthSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.getGrowth().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  return (
    <div data-testid="growth-section">
      <h2 className="text-xl font-bold mb-4">Growth & Loyalty</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <BigKPI icon={Users} label="New Guests" value={data.new_guests} accent="text-green-500" testid="new-guests" />
        <BigKPI icon={Heart} label="Returning" value={data.returning_guests} accent="text-pink-500" testid="returning" />
        <BigKPI icon={UserPlus} label="Total Sign-ups" value={data.total_signups || 0} accent="text-blue-500" testid="total-signups" />
        <BigKPI icon={TrendingUp} label="Guest Growth" value={`${data.guest_growth_pct > 0 ? '+' : ''}${data.guest_growth_pct}%`}
          accent={data.guest_growth_pct >= 0 ? 'text-green-500' : 'text-red-500'} testid="guest-growth" />
        <BigKPI icon={Target} label="LTV" value={`$${data.ltv.toFixed(2)}`} accent="text-purple-500" testid="ltv" />
      </div>

      {/* New vs Recurring Visual */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6" data-testid="new-vs-recurring">
        <h3 className="text-sm font-semibold mb-4">New vs Recurring Guests</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-green-500">{data.new_guests}</span>
            </div>
            <p className="text-sm font-medium text-green-600">New Guests</p>
            <p className="text-xs text-muted-foreground">First visit this period</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-4 border-pink-500 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-pink-500">{data.returning_guests}</span>
            </div>
            <p className="text-sm font-medium text-pink-600">Recurring Guests</p>
            <p className="text-xs text-muted-foreground">Returned this period</p>
          </div>
        </div>
        {(data.new_guests + data.returning_guests) > 0 && (
          <div className="mt-4">
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(data.new_guests / (data.new_guests + data.returning_guests) * 100)}%` }} />
              <div className="h-full bg-pink-500 transition-all" style={{ width: `${(data.returning_guests / (data.new_guests + data.returning_guests) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>New ({Math.round(data.new_guests / (data.new_guests + data.returning_guests) * 100)}%)</span>
              <span>Recurring ({Math.round(data.returning_guests / (data.new_guests + data.returning_guests) * 100)}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Guest Comparison */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">Guest Comparison</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold">{data.unique_guests_month}</p>
            <p className="text-sm text-muted-foreground">This Month</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-muted-foreground">{data.unique_guests_prev_month}</p>
            <p className="text-sm text-muted-foreground">Last Month</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{
            width: `${Math.min(100, data.unique_guests_prev_month > 0 ? (data.unique_guests_month / data.unique_guests_prev_month * 100) : 100)}%`
          }} />
        </div>
      </div>

      {/* Loyalty */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Loyalty Program</h3>
        <div className="grid grid-cols-2 gap-6">
          <Stat label="Loyalty Members" value={data.loyalty_members} />
          <Stat label="Total Points Issued" value={data.total_points_issued} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   6. PEOPLE & OPS — Clickable cards with staff drill-down
   ═══════════════════════════════════════════════════════════════════ */
function PeopleSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState(null); // { type: 'venue'|'event', id, name }
  const [drilldownStaff, setDrilldownStaff] = useState([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    ownerAPI.getPeople().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  const openVenueDrilldown = async (venue) => {
    setDrilldown({ type: 'venue', id: venue.venue_id, name: venue.name });
    setDrilldownLoading(true);
    try {
      const r = await ownerAPI.getVenueStaff(venue.venue_id);
      setDrilldownStaff(r.data.staff || []);
    } catch { toast.error('Failed to load staff'); }
    setDrilldownLoading(false);
  };

  const openEventDrilldown = async (event) => {
    setDrilldown({ type: 'event', id: event.event_id, name: event.event_name });
    setDrilldownLoading(true);
    try {
      const r = await ownerAPI.getEventStaff(event.event_id);
      setDrilldownStaff(r.data.staff || []);
    } catch { toast.error('Failed to load staff'); }
    setDrilldownLoading(false);
  };

  const closeDrilldown = () => { setDrilldown(null); setDrilldownStaff([]); };

  if (loading) return <Skeleton />;
  if (!data) return null;

  return (
    <div data-testid="people-section">
      <h2 className="text-xl font-bold mb-4">People & Ops</h2>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold">{data.total_staff}</p>
            <p className="text-sm text-muted-foreground">Total Operational Staff</p>
          </div>
        </div>
      </div>

      {/* By Venue — Clickable */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Venue</h3>
      <div className="space-y-2 mb-6">
        {data.venues?.map(v => (
          <div key={v.venue_id} onClick={() => openVenueDrilldown(v)}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
            data-testid={`people-venue-${v.venue_id}`}>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.recent_shifts} recent shifts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold">{v.staff_count}</p>
                <p className="text-xs text-muted-foreground">staff</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* By Event — Clickable */}
      {data.events?.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Event</h3>
          <div className="space-y-2 mb-6">
            {data.events.map(ev => (
              <div key={ev.event_id} onClick={() => openEventDrilldown(ev)}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
                data-testid={`people-event-${ev.event_id}`}>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{ev.event_name}</p>
                    <p className="text-xs text-muted-foreground">{ev.venue_name} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold">{ev.staff_count}</p>
                    <p className="text-xs text-muted-foreground">staff</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ev.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>{ev.status}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drill-down Modal */}
      {drilldown && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={closeDrilldown} data-testid="people-drilldown-modal">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {drilldown.type === 'venue' ? <Building2 className="h-5 w-5 text-primary" /> : <Activity className="h-5 w-5 text-primary" />}
                <div>
                  <h3 className="font-bold">{drilldown.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{drilldown.type} Staff</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={closeDrilldown} data-testid="close-drilldown"><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-5">
              {drilldownLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse text-center py-4">Loading staff...</p>
              ) : drilldownStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No staff assigned</p>
              ) : (
                <div className="space-y-2">
                  {drilldownStaff.map((s, i) => (
                    <div key={s.id || s.staff_id || i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20" data-testid={`drilldown-staff-${i}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">{(s.name || '?')[0]}</div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{s.role || 'Server'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {s.hourly_rate !== undefined && s.hourly_rate > 0 && (
                          <p className="text-sm font-bold text-primary">${s.hourly_rate}/hr</p>
                        )}
                        {s.assigned_at && <p className="text-[10px] text-muted-foreground">Since {new Date(s.assigned_at).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   7. SYSTEM & EXPANSION
   ═══════════════════════════════════════════════════════════════════ */
function SystemSection() {
  const [data, setData] = useState(null);
  const [modulesData, setModulesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ownerAPI.getSystem(),
      ownerAPI.getModules(),
    ]).then(([sysRes, modRes]) => {
      setData(sysRes.data);
      setModulesData(modRes.data);
    }).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  return (
    <div data-testid="system-section">
      <h2 className="text-xl font-bold mb-4">System & Expansion</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">System Status</span></div>
          <p className="text-xl font-bold text-green-500 capitalize">{data.system_status}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><Server className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Uptime</span></div>
          <p className="text-xl font-bold">{data.uptime}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Active Venues</span></div>
          <p className="text-xl font-bold">{data.venues_count}</p>
        </div>
      </div>

      {/* Active Modules per Venue */}
      {modulesData?.venues_modules?.length > 0 && (
        <div className="mb-6" data-testid="modules-display">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Licensed Modules</h3>
          <div className="space-y-4">
            {modulesData.venues_modules.map(vm => (
              <div key={vm.venue_id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">{vm.venue_name}</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {vm.modules.map(mod => (
                    <div key={mod.key} className={`flex items-center gap-2 p-3 rounded-lg border ${
                      mod.active ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-muted/20 opacity-60'
                    }`} data-testid={`module-${vm.venue_id}-${mod.key}`}>
                      {mod.active ? (
                        <ToggleRight className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium">{mod.name}</p>
                        <p className={`text-[10px] font-bold ${mod.active ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {mod.active ? 'ON' : 'OFF'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Webhook Status</h3>
          <div className="flex items-center gap-2">
            {data.webhook_errors === 0 ? (
              <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm">All webhooks healthy</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-sm text-red-500">{data.webhook_errors} errors</span></>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Expansion</h3>
          <p className="text-sm text-muted-foreground">You can add new venues from the Overview tab.</p>
          <p className="text-xs text-muted-foreground mt-2">Current: {data.venues_count} venue(s)</p>
        </div>
      </div>

      {/* Subscriptions */}
      {data.subscriptions?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Subscriptions</h3>
          {data.subscriptions.map((sub, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div>
                <p className="text-sm font-medium capitalize">{sub.plan || 'Professional'} Plan</p>
                <p className="text-xs text-muted-foreground">{sub.status}</p>
              </div>
              {sub.period_end && <span className="text-xs text-muted-foreground">Until {new Date(sub.period_end).toLocaleDateString()}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function BigKPI({ icon: Icon, label, value, accent = '', sub, testid }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4" data-testid={testid}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1"><Icon className="h-3.5 w-3.5" /><span className="text-xs">{label}</span></div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Stat({ label, value, accent = '' }) {
  return (
    <div className="text-center p-3 bg-muted/20 rounded-lg">
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function HealthBadge({ health }) {
  const styles = {
    green: 'bg-green-500/10 text-green-600',
    yellow: 'bg-yellow-500/10 text-yellow-600',
    red: 'bg-red-500/10 text-red-600',
  };
  const labels = { green: 'Healthy', yellow: 'Warning', red: 'Critical' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[health] || styles.green}`}>{labels[health] || 'OK'}</span>;
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
      <div className="h-40 bg-muted rounded-xl" />
    </div>
  );
}

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
  AlertTriangle, X, Zap, Target, PieChart
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

  return (
    <div className="min-h-screen bg-background" data-testid="owner-page">
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="back-btn"><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-lg font-bold tracking-tight">Owner Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-52 border-r border-border bg-card min-h-[calc(100vh-56px)] p-3 space-y-0.5">
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
   1. OVERVIEW
   ═══════════════════════════════════════════════════════════════════ */
function OverviewSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.getDashboard().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted-foreground">No data</p>;

  const { kpis, venues } = data;

  return (
    <div data-testid="owner-overview">
      <h2 className="text-xl font-bold mb-4">Business Overview</h2>

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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. PERFORMANCE BY VENUE
   ═══════════════════════════════════════════════════════════════════ */
function VenuesSection() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.getVenues().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data?.venues?.length) return <p className="text-muted-foreground">No venues</p>;

  const selectedVenue = selected ? data.venues.find(v => v.venue_id === selected) : null;

  return (
    <div data-testid="venues-section">
      <h2 className="text-xl font-bold mb-4">Performance by Venue</h2>

      {/* Table */}
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

      {/* Drill-down */}
      {selectedVenue && (
        <div className="bg-card border border-primary/20 rounded-xl p-5" data-testid="venue-drilldown">
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

            {/* AI Response Cards */}
            {conv.insights.map((insight, idx) => {
              const s = typeStyles[insight.priority] || typeStyles.info;
              return (
                <div key={idx} className={`border rounded-xl p-5 ${s.border} ${s.bg} relative group`} data-testid={`ai-insight-${conv.id}-${idx}`}>
                  {/* Delete button */}
                  <button onClick={() => removeCard(conv.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-background/80"
                    data-testid={`delete-insight-${conv.id}`}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex items-start gap-3 mb-3">
                    <Lightbulb className={`h-5 w-5 mt-0.5 shrink-0 ${s.icon}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${s.badge}`}>{insight.priority}</span>
                      </div>
                      <h4 className="font-bold text-sm">{insight.summary}</h4>
                    </div>
                  </div>

                  <div className="space-y-3 ml-8">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">What We See</p>
                      <p className="text-sm mt-0.5">{insight.what_we_see}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Recommended Actions</p>
                      <ul className="mt-1 space-y-1">
                        {(insight.recommended_actions || []).map((action, ai) => (
                          <li key={ai} className="text-sm flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {insight.reference && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Reference</p>
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{insight.reference}</p>
                      </div>
                    )}

                    {/* Next Steps — Clickable */}
                    {insight.next_steps && insight.next_steps.length > 0 && (
                      <div data-testid={`next-steps-${conv.id}-${idx}`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Next Steps</p>
                        <div className="flex flex-wrap gap-2">
                          {insight.next_steps.map((step, si) => (
                            <button key={si} onClick={() => handleNextStep(step)}
                              className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors text-left"
                              data-testid={`next-step-${conv.id}-${idx}-${si}`}>
                              {step}
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
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && sendQuestion()}
            placeholder="Ask about your business — revenue, growth, risks, staff..."
            className="flex-1 h-10 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BigKPI icon={Users} label="New Guests" value={data.new_guests} accent="text-green-500" testid="new-guests" />
        <BigKPI icon={Heart} label="Returning" value={data.returning_guests} accent="text-pink-500" testid="returning" />
        <BigKPI icon={TrendingUp} label="Guest Growth" value={`${data.guest_growth_pct > 0 ? '+' : ''}${data.guest_growth_pct}%`}
          accent={data.guest_growth_pct >= 0 ? 'text-green-500' : 'text-red-500'} testid="guest-growth" />
        <BigKPI icon={Target} label="LTV" value={`$${data.ltv.toFixed(2)}`} accent="text-purple-500" testid="ltv" />
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
   6. PEOPLE & OPS
   ═══════════════════════════════════════════════════════════════════ */
function PeopleSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.getPeople().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

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

      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Venue</h3>
      <div className="space-y-2">
        {data.venues?.map(v => (
          <div key={v.venue_id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.recent_shifts} recent shifts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{v.staff_count}</p>
              <p className="text-xs text-muted-foreground">staff</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   7. SYSTEM & EXPANSION
   ═══════════════════════════════════════════════════════════════════ */
function SystemSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerAPI.getSystem().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
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

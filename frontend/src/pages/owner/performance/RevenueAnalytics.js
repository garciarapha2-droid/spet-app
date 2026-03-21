import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, Clock, Building2, ArrowUpRight, ArrowDownRight,
  Zap, Trophy, Calendar
} from 'lucide-react';
import {
  dailyRevenueTrend, hourlyRevenue, ownerVenues, ownerEvents, eventHourlyRevenue
} from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const fadeSub = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.2 }
};

const fadeData = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
};

const tooltipStyle = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E6E8EC', borderRadius: '8px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
};

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

const scopes = ['Company', 'Venue', 'Night / Event'];
const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom'];
const venueDots = { Downtown: 'bg-emerald-500', Midtown: 'bg-blue-500', Uptown: 'bg-purple-500' };

// Generate per-venue daily trend (multiplied from base)
const venueMultipliers = { v1: 0.42, v2: 0.34, v3: 0.24 };
const generateVenueTrend = (venueId) =>
  dailyRevenueTrend.map(d => ({
    date: d.date,
    revenue: Math.round(d.revenue * venueMultipliers[venueId] * (0.9 + Math.random() * 0.2)),
    profit: Math.round(d.profit * venueMultipliers[venueId] * (0.9 + Math.random() * 0.2)),
  }));

// Generate per-venue hourly revenue
const venueHourlyBase = { v1: 1.3, v2: 1.0, v3: 0.7 };
const generateVenueHourly = (venueId) =>
  hourlyRevenue.map(h => ({ hour: h.hour, revenue: Math.round(h.revenue * venueHourlyBase[venueId] * (0.85 + Math.random() * 0.3)) }));

// Night comparison mock data (last 4 occurrences)
const generateNightComparison = (eventName) => [
  { name: `${eventName} (4w ago)`, revenue: Math.round(3000 + Math.random() * 5000) },
  { name: `${eventName} (3w ago)`, revenue: Math.round(3500 + Math.random() * 5000) },
  { name: `${eventName} (2w ago)`, revenue: Math.round(4000 + Math.random() * 5000) },
  { name: `${eventName} (last)`, revenue: Math.round(4500 + Math.random() * 5000) },
];

export default function RevenueAnalytics() {
  const [scope, setScope] = useState('Company');
  const [period, setPeriod] = useState('Monthly');
  const [selectedVenueId, setSelectedVenueId] = useState('v1');
  const [selectedEventId, setSelectedEventId] = useState(null);

  const selectedVenue = ownerVenues.find(v => v.id === selectedVenueId);
  const venueEvents = useMemo(() => ownerEvents.filter(e => e.venueId === selectedVenueId), [selectedVenueId]);
  const selectedEvent = ownerEvents.find(e => e.id === selectedEventId);

  // Auto-select first event when venue changes
  React.useEffect(() => {
    if (scope === 'Night / Event' && venueEvents.length > 0) {
      if (!selectedEventId || !venueEvents.find(e => e.id === selectedEventId)) {
        setSelectedEventId(venueEvents[0].id);
      }
    }
  }, [scope, selectedVenueId, venueEvents, selectedEventId]);

  const periodLabel = period.toLowerCase();

  // Compute data based on scope
  const { kpis, trendData, hourlyData, bottomLeftTitle, bottomLeftSubtitle, bottomLeftData, bottomLeftLayout, bottomRightTitle, bottomRightSubtitle, bottomRightData, bottomRightLayout, contextLabel, insightText } = useMemo(() => {
    if (scope === 'Company') {
      return {
        kpis: [
          { label: 'Total (30D)', value: '$178K', delta: -4.2, icon: DollarSign },
          { label: 'Avg Daily', value: '$5.9K', delta: 2.1, icon: TrendingUp },
          { label: 'Peak Hour', value: '9PM', sub: '$6,400', icon: Zap },
          { label: 'Top Category', value: 'Cocktails', delta: 24, icon: Trophy },
        ],
        trendData: dailyRevenueTrend,
        hourlyData: hourlyRevenue,
        bottomLeftTitle: 'Revenue by Hour', bottomLeftSubtitle: "Today's distribution",
        bottomLeftData: hourlyRevenue, bottomLeftLayout: 'vertical-bar',
        bottomRightTitle: 'Revenue by Venue', bottomRightSubtitle: 'Current month',
        bottomRightData: ownerVenues.map(v => ({ name: v.name, revenue: v.revenue })),
        bottomRightLayout: 'horizontal-bar',
        contextLabel: <><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-semibold text-foreground">All Venues</span><span className="text-xs text-muted-foreground">&middot; {periodLabel}</span></>,
        insightText: 'Revenue dipped mid-month — correlates with reduced weekend event programming',
      };
    }

    if (scope === 'Venue' && selectedVenue) {
      const v = selectedVenue;
      const avgDaily = `$${(v.revenue / 30 / 1000).toFixed(1)}K`;
      const vEvents = ownerEvents.filter(e => e.venueId === v.id);
      const topEvent = [...vEvents].sort((a, b) => b.revenue - a.revenue)[0];
      return {
        kpis: [
          { label: 'Total (30D)', value: `$${(v.revenue / 1000).toFixed(0)}K`, delta: v.growth, icon: DollarSign },
          { label: 'Avg Daily', value: avgDaily, delta: v.growth > 0 ? v.growth * 0.5 : v.growth * 0.3, icon: TrendingUp },
          { label: 'Peak Hour', value: topEvent?.peakHour || '10PM', sub: topEvent ? `$${(topEvent.revenue * 0.25 / 1000).toFixed(1)}K` : '', icon: Zap },
          { label: 'Top Night', value: topEvent?.name || '-', delta: topEvent ? Math.round(topEvent.margin * 0.6) : 0, icon: Trophy },
        ],
        trendData: generateVenueTrend(v.id),
        hourlyData: generateVenueHourly(v.id),
        bottomLeftTitle: 'Revenue by Hour', bottomLeftSubtitle: `${v.name} distribution`,
        bottomLeftData: generateVenueHourly(v.id), bottomLeftLayout: 'vertical-bar',
        bottomRightTitle: 'Revenue by Night', bottomRightSubtitle: `${v.name} events`,
        bottomRightData: vEvents.map(e => ({ name: e.name, revenue: e.revenue })),
        bottomRightLayout: 'horizontal-bar',
        contextLabel: <><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-semibold text-foreground">{v.name}</span><span className="text-xs text-muted-foreground">&middot; {periodLabel}</span></>,
        insightText: v.insight,
      };
    }

    if (scope === 'Night / Event' && selectedEvent) {
      const ev = selectedEvent;
      return {
        kpis: [
          { label: 'Revenue', value: `$${(ev.revenue / 1000).toFixed(1)}K`, delta: ev.margin > 38 ? 8.5 : -2.3, icon: DollarSign },
          { label: 'Avg Ticket', value: `$${ev.avgTicket}`, delta: 3.2, icon: TrendingUp },
          { label: 'Peak Hour', value: ev.peakHour, sub: `${ev.guests} guests`, icon: Zap },
          { label: 'Margin', value: `${ev.margin}%`, delta: ev.margin > 38 ? 4.1 : -1.8, icon: Trophy },
        ],
        trendData: dailyRevenueTrend.slice(-7).map((d, i) => ({ ...d, revenue: Math.round(ev.revenue * (0.7 + i * 0.05 + Math.random() * 0.15)), profit: Math.round(ev.profit * (0.7 + i * 0.05 + Math.random() * 0.15)) })),
        hourlyData: eventHourlyRevenue,
        bottomLeftTitle: 'Revenue by Hour', bottomLeftSubtitle: `${ev.name} hours`,
        bottomLeftData: eventHourlyRevenue, bottomLeftLayout: 'vertical-bar',
        bottomRightTitle: 'Night Comparison', bottomRightSubtitle: `Last 4 ${ev.name}`,
        bottomRightData: generateNightComparison(ev.name),
        bottomRightLayout: 'horizontal-bar',
        contextLabel: <><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-semibold text-foreground">{selectedVenue?.name}</span><span className="text-xs text-muted-foreground mx-1">&#8250;</span><span className="text-sm font-semibold text-foreground">{ev.name}</span><span className="text-xs text-muted-foreground">&middot; {periodLabel}</span></>,
        insightText: `${ev.name} at ${ev.venueName} — ${ev.health} performance with ${ev.guests} guests`,
      };
    }

    // Fallback
    return {
      kpis: [], trendData: [], hourlyData: [],
      bottomLeftTitle: '', bottomLeftSubtitle: '', bottomLeftData: [], bottomLeftLayout: 'vertical-bar',
      bottomRightTitle: '', bottomRightSubtitle: '', bottomRightData: [], bottomRightLayout: 'horizontal-bar',
      contextLabel: null, insightText: '',
    };
  }, [scope, selectedVenue, selectedEvent, periodLabel, selectedVenueId]);

  const dataKey = `${scope}-${selectedVenueId}-${selectedEventId}-${period}`;

  return (
    <div className="flex flex-col gap-6" data-testid="revenue-analytics">

      {/* Controls */}
      <motion.div {...fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        {/* Scope Selector */}
        <div className="rounded-full border border-border bg-[hsl(var(--card))] inline-flex gap-0" data-testid="scope-selector">
          {scopes.map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={`px-4 py-1.5 text-xs font-medium tracking-wide rounded-full transition-colors ${scope === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid={`scope-${s.toLowerCase().replace(/[^a-z]/g, '-')}`}
            >{s}</button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="rounded-full border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] inline-flex shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]" data-testid="period-filter">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${period === p ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`}
              data-testid={`rev-period-${p.toLowerCase()}`}
            >{p}</button>
          ))}
        </div>
      </motion.div>

      {/* Sub-selectors */}
      <AnimatePresence mode="wait">
        {(scope === 'Venue' || scope === 'Night / Event') && (
          <motion.div key={scope} {...fadeSub} className="flex flex-col gap-1.5 mb-[-8px]" data-testid="sub-selector">
            {/* Venue Pills */}
            <div className="inline-flex gap-2" data-testid="venue-pills">
              {ownerVenues.map(v => (
                <button key={v.id} onClick={() => { setSelectedVenueId(v.id); setSelectedEventId(null); }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border cursor-pointer transition-colors ${selectedVenueId === v.id ? 'bg-foreground text-background border-foreground' : 'bg-[hsl(var(--card))] text-muted-foreground border-border hover:border-foreground/30'}`}
                  data-testid={`venue-pill-${v.id}`}
                >
                  <span className={`h-2 w-2 rounded-full ${venueDots[v.name]}`} />
                  {v.name}
                </button>
              ))}
            </div>

            {/* Night Pills (only in Night / Event scope) */}
            {scope === 'Night / Event' && venueEvents.length > 0 && (
              <motion.div {...fadeSub} className="inline-flex gap-2 mt-0.5" data-testid="night-pills">
                {venueEvents.map(ev => (
                  <button key={ev.id} onClick={() => setSelectedEventId(ev.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border cursor-pointer transition-colors ${selectedEventId === ev.id ? 'bg-foreground text-background border-foreground' : 'bg-[hsl(var(--card))] text-muted-foreground border-border hover:border-foreground/30'}`}
                    data-testid={`night-pill-${ev.id}`}
                  >
                    <Calendar className="h-3 w-3" />
                    {ev.name}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Label */}
      <div className="flex items-center gap-2 mb-[-8px]" data-testid="context-label">
        {contextLabel}
      </div>

      {/* Data Section — animated on scope/venue/event change */}
      <AnimatePresence mode="wait">
        <motion.div key={dataKey} {...fadeData} className="flex flex-col gap-6">

          {/* 1. KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="kpi-grid">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-[hsl(var(--card))] p-4"
                data-testid={`rev-kpi-${kpi.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
                {kpi.delta !== undefined && (
                  <div className={`flex items-center gap-0.5 mt-0.5 ${kpi.delta >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                    {kpi.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span className="text-xs font-medium">{kpi.delta > 0 ? '+' : ''}{typeof kpi.delta === 'number' ? kpi.delta.toFixed(1) : kpi.delta}%</span>
                  </div>
                )}
                {kpi.sub && <span className="text-xs text-muted-foreground">{kpi.sub}</span>}
              </motion.div>
            ))}
          </div>

          {/* 2. Revenue Trend */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-trend">
            <SectionHeader icon={TrendingUp} title="Revenue Trend" subtitle={scope === 'Night / Event' ? 'Last 7 days' : 'Last 30 days'} />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} interval={scope === 'Night / Event' ? 0 : 4} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={2} dot={false} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground italic mt-3 flex items-center gap-1.5">
              <span className="text-amber-500">&#9888;</span>
              {insightText}
            </p>
          </motion.div>

          {/* 3. Two-Column Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Chart — Revenue by Hour */}
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 }}
              className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-by-hour">
              <SectionHeader icon={Clock} title={bottomLeftTitle} subtitle={bottomLeftSubtitle} />
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottomLeftData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                    <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Right Chart — Revenue by Venue / Night / Comparison */}
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }}
              className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-by-venue">
              <SectionHeader icon={TrendingUp} title={bottomRightTitle} subtitle={bottomRightSubtitle} />
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottomRightData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}K`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={scope === 'Night / Event' ? 140 : 70} />
                    <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ArrowUpRight, ArrowDownRight, Users, Calendar, DollarSign, Percent, Clock
} from 'lucide-react';
import { ownerVenues, ownerEvents, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } };

const statusLabel = {
  top: { text: 'Top performer', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' },
  attention: { text: 'Needs attention', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  underperforming: { text: 'Underperforming', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
};

const healthLabel = {
  strong: { text: 'Strong', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' },
  stable: { text: 'Stable', cls: 'bg-blue-500/10 text-blue-500' },
  attention: { text: 'Attention', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  weak: { text: 'Weak', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
};

// Group events by venue, then sort by date within each group
const groupedEvents = ownerVenues.map(v => ({
  venue: v,
  events: ownerEvents.filter(e => e.venueId === v.id).sort((a, b) => {
    const da = new Date(a.date + ' 2025');
    const db = new Date(b.date + ' 2025');
    return db - da;
  }),
}));

export default function VenueManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState('venues');
  const [period, setPeriod] = useState('Weekly');

  return (
    <div className="space-y-5" data-testid="venue-management">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        {/* Left: View Toggle */}
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]" data-testid="venue-view-toggle">
          {[
            { key: 'venues', label: 'Venues' },
            { key: 'nights', label: 'Nights / Events' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-1.5 text-[11px] font-semibold tracking-wide rounded-full transition-colors ${
                view === v.key
                  ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
              data-testid={`venue-toggle-${v.key}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Right: Period Selector */}
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]" data-testid="venue-period-selector">
          {['Today', 'Yesterday', 'Weekly', 'Date'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[11px] font-semibold tracking-wide rounded-full transition-colors ${
                period === p
                  ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
              data-testid={`venue-period-${p.toLowerCase()}`}
            >
              {p === 'Date' ? (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</span>
              ) : p}
            </button>
          ))}
        </div>
      </div>

      {/* VENUES VIEW — Stacked List */}
      {view === 'venues' && (
        <div className="space-y-3" data-testid="venues-list-view">
          {ownerVenues.map((v, i) => {
            const vc = venueColors[v.name];
            const st = statusLabel[v.status];
            return (
              <motion.div
                key={v.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }}
                onClick={() => navigate(`/owner/system/venues/${v.id}`)}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-[0_2px_8px_0_hsl(var(--foreground)_/_0.04)] cursor-pointer transition-all group"
                data-testid={`venue-row-${v.id}`}
              >
                {/* Row 1: Name + Status + Key Metrics */}
                <div className="flex items-center gap-4">
                  {/* Color indicator */}
                  <span className={`w-3 h-3 rounded-full shrink-0 ${vc?.dot || 'bg-muted-foreground'}`} />

                  {/* Name + Address */}
                  <div className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{v.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st?.cls || ''}`}>{st?.text}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{v.address} &middot; {v.hours}</p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 ml-auto">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Revenue</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">${(v.revenue / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Profit</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">${(v.profit / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Margin</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{v.margin}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Guests</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{v.guests}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Retention</p>
                      <p className={`text-sm font-bold tabular-nums ${v.retention < 55 ? 'text-[hsl(var(--danger))]' : 'text-foreground'}`}>{v.retention}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Growth</p>
                      <p className={`text-sm font-bold tabular-nums flex items-center justify-end gap-0.5 ${v.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                        {v.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {v.growth > 0 ? '+' : ''}{v.growth}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-l border-[hsl(var(--border))] pl-4 ml-1">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{v.staffCount}</span>
                      <span>{v.tables} tbl</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.events}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </div>

                {/* Row 2: Insight */}
                <p className="text-[11px] text-muted-foreground mt-2 ml-7 italic">{v.insight}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* NIGHTS / EVENTS VIEW — Grouped by Venue */}
      {view === 'nights' && (
        <div className="space-y-6" data-testid="nights-list-view">
          {groupedEvents.map((group, gi) => {
            const vc = venueColors[group.venue.name];
            return (
              <motion.div key={group.venue.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + gi * 0.06 }}>
                {/* Venue Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.venue.name}</span>
                  <span className="text-[10px] text-muted-foreground">&middot; {group.events.length} events</span>
                </div>

                {/* Event Rows */}
                <div className="space-y-2">
                  {group.events.map((ev, ei) => {
                    const hl = healthLabel[ev.health];
                    return (
                      <motion.div
                        key={ev.id}
                        {...fadeUp}
                        transition={{ ...fadeUp.transition, delay: 0.1 + gi * 0.06 + ei * 0.03 }}
                        onClick={() => navigate(`/owner/system/venues/${ev.venueId}/events/${ev.id}`)}
                        className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3.5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-[0_2px_8px_0_hsl(var(--foreground)_/_0.04)] cursor-pointer transition-all group"
                        data-testid={`night-row-${ev.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Color indicator */}
                          <span className={`w-2 h-2 rounded-full shrink-0 ${vc?.dot || 'bg-muted-foreground'}`} />

                          {/* Name + Date */}
                          <div className="min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{ev.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${hl?.cls || ''}`}>{hl?.text}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{ev.date} &middot; Peak at {ev.peakHour}</p>
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-6 ml-auto">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Revenue</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">${(ev.revenue / 1000).toFixed(1)}K</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Profit</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">${(ev.profit / 1000).toFixed(1)}K</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Margin</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">{ev.margin}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Guests</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">{ev.guests}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Avg Ticket</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">${ev.avgTicket}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Costs</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">${(ev.totalCosts / 1000).toFixed(1)}K</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

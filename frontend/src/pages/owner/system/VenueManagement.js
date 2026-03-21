import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ArrowUpRight, ArrowDownRight, Users, Calendar, Building2, Clock
} from 'lucide-react';
import { ownerVenues, ownerEvents, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } };

const statusLabel = {
  top: { text: 'ACTIVE', cls: 'bg-[hsl(var(--success)_/_0.12)] text-[hsl(var(--success))] border border-[hsl(var(--success)_/_0.2)]' },
  attention: { text: 'ATTENTION', cls: 'bg-[hsl(var(--warning)_/_0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)_/_0.2)]' },
  underperforming: { text: 'UNDERPERFORMING', cls: 'bg-[hsl(var(--danger)_/_0.12)] text-[hsl(var(--danger))] border border-[hsl(var(--danger)_/_0.2)]' },
};

const healthLabel = {
  strong: { text: 'STRONG', cls: 'bg-[hsl(var(--success)_/_0.12)] text-[hsl(var(--success))] border border-[hsl(var(--success)_/_0.2)]' },
  stable: { text: 'STABLE', cls: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
  attention: { text: 'ATTENTION', cls: 'bg-[hsl(var(--warning)_/_0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)_/_0.2)]' },
  weak: { text: 'WEAK', cls: 'bg-[hsl(var(--danger)_/_0.12)] text-[hsl(var(--danger))] border border-[hsl(var(--danger)_/_0.2)]' },
};

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
  const [period, setPeriod] = useState('Today');

  return (
    <div className="space-y-10" data-testid="venue-management">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        {/* Left: View Toggle */}
        <div className="flex items-center gap-1.5 bg-[hsl(var(--muted)_/_0.4)] p-1.5 rounded-xl" data-testid="venue-view-toggle">
          {[
            { key: 'venues', label: 'Venues' },
            { key: 'nights', label: 'Nights / Events' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                view === v.key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`venue-toggle-${v.key}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Right: Period Selector */}
        <div className="flex items-center gap-1.5 bg-[hsl(var(--muted)_/_0.4)] p-1.5 rounded-xl" data-testid="venue-period-selector">
          {['Today', 'Yesterday', 'Weekly', 'Date'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                period === p
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`venue-period-${p.toLowerCase()}`}
            >
              {p === 'Date' ? (
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Date</span>
              ) : p}
            </button>
          ))}
        </div>
      </div>

      {/* VENUES VIEW — Stacked List */}
      {view === 'venues' && (
        <div className="space-y-10" data-testid="venues-list-view">
          {ownerVenues.map((v, i) => {
            const vc = venueColors[v.name];
            const st = statusLabel[v.status];
            return (
              <motion.div
                key={v.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.05 }}
                onClick={() => navigate(`/owner/system/venues/${v.id}`)}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 hover:border-[hsl(var(--primary)_/_0.25)] hover:shadow-[0_2px_12px_0_hsl(var(--foreground)_/_0.04)] cursor-pointer transition-all group"
                data-testid={`venue-row-${v.id}`}
              >
                {/* Header: Icon + Name/Address + Badge */}
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[hsl(var(--primary)_/_0.08)] flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[15px] font-bold text-foreground">Demo Club &mdash; {v.name}</h3>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${vc?.dot || 'bg-muted-foreground'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{v.address}, {v.name}</p>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${st?.cls || ''}`} data-testid={`venue-status-${v.id}`}>{st?.text}</span>
                </div>

                {/* Metrics: 5-column grid, full width */}
                <div className="grid grid-cols-5 gap-4 mt-7">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Revenue</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">${(v.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Staff</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{v.staffCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Tables</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{v.tables}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Hours</p>
                    <p className="text-lg font-bold text-foreground">{v.hours}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Growth</p>
                    <p className={`text-xl font-bold tabular-nums ${v.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                      {v.growth > 0 ? '+' : ''}{v.growth}%
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* NIGHTS / EVENTS VIEW — Grouped by Venue */}
      {view === 'nights' && (
        <div className="space-y-10" data-testid="nights-list-view">
          {groupedEvents.map((group, gi) => {
            const vc = venueColors[group.venue.name];
            return (
              <motion.div key={group.venue.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + gi * 0.06 }}>
                {/* Venue Group Header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className={`w-3 h-3 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.venue.name}</span>
                  <span className="text-[10px] text-muted-foreground">&middot; {group.events.length} events</span>
                </div>

                {/* Event Cards */}
                <div className="space-y-5">
                  {group.events.map((ev, ei) => {
                    const hl = healthLabel[ev.health];
                    return (
                      <motion.div
                        key={ev.id}
                        {...fadeUp}
                        transition={{ ...fadeUp.transition, delay: 0.1 + gi * 0.06 + ei * 0.03 }}
                        onClick={() => navigate(`/owner/system/venues/${ev.venueId}/events/${ev.id}`)}
                        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 hover:border-[hsl(var(--primary)_/_0.25)] hover:shadow-[0_2px_12px_0_hsl(var(--foreground)_/_0.04)] cursor-pointer transition-all group"
                        data-testid={`night-row-${ev.id}`}
                      >
                        <div className="flex items-start gap-5">
                          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-foreground">{ev.name}</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${hl?.cls || ''}`}>{hl?.text}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{ev.date} &middot; Peak at {ev.peakHour}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        </div>

                        <div className="flex items-end gap-12 mt-6 ml-[60px]">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Revenue</p>
                            <p className="text-lg font-bold text-foreground tabular-nums">${(ev.revenue / 1000).toFixed(1)}K</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Profit</p>
                            <p className="text-lg font-bold text-foreground tabular-nums">${(ev.profit / 1000).toFixed(1)}K</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Guests</p>
                            <p className="text-lg font-bold text-foreground tabular-nums">{ev.guests}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Avg Ticket</p>
                            <p className="text-lg font-bold text-foreground tabular-nums">${ev.avgTicket}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Margin</p>
                            <p className="text-lg font-bold text-foreground tabular-nums">{ev.margin}%</p>
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

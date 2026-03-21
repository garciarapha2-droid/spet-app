import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Users, Calendar, Building2, Clock
} from 'lucide-react';
import { ownerVenues, ownerEvents, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } };

// Venue-specific colors for borders, icon bg, icon color
const venueStyle = {
  Downtown: { border: 'border-[hsla(142,71%,45%,0.25)]', iconBg: 'bg-[hsl(var(--success)_/_0.08)]', iconColor: 'text-[hsl(var(--success))]', dot: 'bg-[hsl(var(--success))]' },
  Midtown:  { border: 'border-blue-500/25', iconBg: 'bg-blue-500/[0.08]', iconColor: 'text-blue-500', dot: 'bg-blue-500' },
  Uptown:   { border: 'border-purple-500/25', iconBg: 'bg-purple-500/[0.08]', iconColor: 'text-purple-500', dot: 'bg-purple-500' },
};

const statusBadge = {
  top:              { text: 'ACTIVE', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' },
  attention:        { text: 'ATTENTION', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  underperforming:  { text: 'UNDERPERFORMING', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
};

const healthBadge = {
  strong:    { text: 'STRONG', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' },
  stable:    { text: 'STABLE', cls: 'bg-blue-500/10 text-blue-500' },
  attention: { text: 'ATTENTION', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  weak:      { text: 'WEAK', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
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
    <div data-testid="venue-management">
      {/* ── Top Controls ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        {/* Left: View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(var(--muted)_/_0.5)]" data-testid="venue-view-toggle">
          {[
            { key: 'venues', label: 'Venues' },
            { key: 'nights', label: 'Nights / Events' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
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

        {/* Right: Time Filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(var(--muted)_/_0.5)]" data-testid="venue-period-selector">
          {['Today', 'Yesterday', 'Weekly', 'Date'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
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

      {/* ══════════════════════════════════════════
          VENUES VIEW
         ══════════════════════════════════════════ */}
      {view === 'venues' && (
        <div className="space-y-4" data-testid="venues-list-view">
          {ownerVenues.map((v, i) => {
            const vs = venueStyle[v.name] || venueStyle.Downtown;
            const st = statusBadge[v.status];
            return (
              <motion.div
                key={v.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.04 + i * 0.04 }}
                onClick={() => navigate(`/owner/system/venues/${v.id}`)}
                className={`rounded-xl border ${vs.border} bg-[hsl(var(--card))] p-5 hover:shadow-sm cursor-pointer transition-all group`}
                data-testid={`venue-row-${v.id}`}
              >
                {/* Header: Icon + Name/Addr + Badge */}
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${vs.iconBg} flex items-center justify-center shrink-0`}>
                    <Building2 className={`h-5 w-5 ${vs.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">Demo Club &mdash; {v.name}</span>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${vs.dot}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.address}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${st?.cls || ''}`} data-testid={`venue-status-${v.id}`}>{st?.text}</span>
                </div>

                {/* Metrics: 5-col grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">${(v.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Staff</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">{v.staffCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tables</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">{v.tables}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hours</p>
                    <p className="text-sm font-bold text-foreground">{v.hours}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Growth</p>
                    <p className={`text-sm font-bold tabular-nums ${v.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                      {v.growth > 0 ? '+' : ''}{v.growth}%
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          NIGHTS / EVENTS VIEW
         ══════════════════════════════════════════ */}
      {view === 'nights' && (
        <div className="space-y-6" data-testid="nights-list-view">
          {groupedEvents.map((group, gi) => {
            const vs = venueStyle[group.venue.name] || venueStyle.Downtown;
            return (
              <motion.div key={group.venue.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.04 + gi * 0.05 }}>
                {/* Venue Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${vs.dot}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group.venue.name}</span>
                  <span className="text-[10px] text-muted-foreground">&middot; {group.events.length} events</span>
                </div>

                {/* Event Cards */}
                <div className="space-y-3">
                  {group.events.map((ev, ei) => {
                    const hl = healthBadge[ev.health];
                    return (
                      <motion.div
                        key={ev.id}
                        {...fadeUp}
                        transition={{ ...fadeUp.transition, delay: 0.08 + gi * 0.05 + ei * 0.03 }}
                        onClick={() => navigate(`/owner/system/venues/${ev.venueId}/events/${ev.id}`)}
                        className={`rounded-xl border ${vs.border} bg-[hsl(var(--card))] p-5 hover:shadow-sm cursor-pointer transition-all group`}
                        data-testid={`night-row-${ev.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-lg bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center shrink-0`}>
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground">{ev.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${hl?.cls || ''}`}>{hl?.text}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{ev.date} &middot; Peak at {ev.peakHour}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">${(ev.revenue / 1000).toFixed(1)}K</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">${(ev.profit / 1000).toFixed(1)}K</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Guests</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">{ev.guests}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Ticket</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">${ev.avgTicket}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Margin</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">{ev.margin}%</p>
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

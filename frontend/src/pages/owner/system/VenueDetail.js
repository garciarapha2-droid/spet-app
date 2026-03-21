import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Building2, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ownerVenues, venueColors, ownerEvents } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const healthBadge = { strong: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]', stable: 'bg-blue-500/10 text-blue-500', attention: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]', weak: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' };

export default function VenueDetail() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const venue = ownerVenues.find(v => v.id === venueId);

  if (!venue) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Venue not found</p></div>;

  const vc = venueColors[venue.name];
  const venueEvents = ownerEvents.filter(e => e.venueId === venueId);

  return (
    <div className="flex flex-col gap-6" data-testid="venue-detail">
      <motion.button {...fadeUp} onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="venue-detail-back-btn">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className={`w-4 h-4 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
          <h2 className="text-lg font-bold text-foreground">{venue.name}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{venue.address} &middot; {venue.hours}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Revenue', value: `$${(venue.revenue / 1000).toFixed(0)}K` },
          { icon: DollarSign, label: 'Profit', value: `$${(venue.profit / 1000).toFixed(0)}K` },
          { icon: Users, label: 'Guests', value: venue.guests },
          { icon: Calendar, label: 'Retention', value: `${venue.retention}%`, danger: venue.retention < 55 },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`vd-kpi-${kpi.label.toLowerCase()}`}>
            <div className="flex items-center gap-1 mb-1">
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            </div>
            <p className={`text-xl font-bold tabular-nums ${kpi.danger ? 'text-[hsl(var(--danger))]' : 'text-foreground'}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Venue Details */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-4">Details</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Margin', value: `${venue.margin}%` },
            { label: 'Growth', value: `${venue.growth > 0 ? '+' : ''}${venue.growth}%`, color: venue.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]' },
            { label: 'Staff', value: venue.staffCount },
            { label: 'Tables', value: venue.tables },
            { label: 'Events', value: venue.events },
            { label: 'Hours', value: venue.hours },
          ].map((d, i) => (
            <div key={d.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{d.label}</p>
              <p className={`text-sm font-semibold ${d.color || 'text-foreground'}`}>{d.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic mt-4">{venue.insight}</p>
      </motion.div>

      {/* Events */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-4">Events / Nights</p>
        <div className="flex flex-col gap-2">
          {venueEvents.length > 0 ? venueEvents.map((ev, i) => (
            <motion.div key={ev.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 + i * 0.03 }}
              onClick={() => navigate(`/owner/system/venues/${venueId}/events/${ev.id}`)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] cursor-pointer transition-colors group"
              data-testid={`venue-event-${ev.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{ev.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${healthBadge[ev.health] || ''}`}>{ev.health}</span>
                </div>
                <p className="text-xs text-muted-foreground">{ev.date} &middot; {ev.guests} guests &middot; Peak {ev.peakHour}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground tabular-nums">${(ev.revenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground tabular-nums">Profit ${(ev.profit / 1000).toFixed(1)}K</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          )) : <p className="text-sm text-muted-foreground italic">No events for this venue</p>}
        </div>
      </motion.div>
    </div>
  );
}

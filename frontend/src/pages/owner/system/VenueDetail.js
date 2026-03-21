import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Calendar, ChevronRight, ArrowUpRight, ArrowDownRight,
  DollarSign, TrendingUp, Users
} from 'lucide-react';
import { ownerVenues, ownerEvents } from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
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

export default function VenueDetail() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const venue = ownerVenues.find(v => v.id === venueId);

  if (!venue) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Venue not found</p>
    </div>
  );

  const venueEvents = ownerEvents.filter(e => e.venueId === venueId);

  const kpis = [
    { label: 'Revenue', value: `$${(venue.revenue / 1000).toFixed(0)}K`, delta: venue.growth, icon: DollarSign },
    { label: 'Profit', value: `$${(venue.profit / 1000).toFixed(0)}K`, delta: null, icon: TrendingUp },
    { label: 'Margin', value: `${venue.margin}%`, delta: null, icon: TrendingUp },
    { label: 'Retention', value: `${venue.retention}%`, delta: null, icon: Users },
    { label: 'Guests', value: venue.guests.toLocaleString(), delta: null, icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="venue-detail">

      {/* 1. KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4"
            data-testid={`vd-kpi-${kpi.label.toLowerCase()}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
            {kpi.delta !== null && (
              <div className={`flex items-center gap-0.5 mt-0.5 ${kpi.delta >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                {kpi.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="text-xs font-medium">{kpi.delta > 0 ? '+' : ''}{kpi.delta}%</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 2. Venue Details Card */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="venue-details-card">
        <SectionHeader icon={Building2} title="Venue Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Address', value: venue.address },
            { label: 'Staff', value: `${venue.staffCount} members` },
            { label: 'Tables', value: `${venue.tables} tables` },
            { label: 'Hours', value: venue.hours },
          ].map(d => (
            <div key={d.label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{d.label}</p>
              <p className="text-sm font-medium text-foreground">{d.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">{venue.insight}</p>
      </motion.div>

      {/* 3. Recent Events / Nights */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="venue-events">
        <SectionHeader icon={Calendar} title="Recent Events / Nights" subtitle="Click to see event detail" />
        <div className="flex flex-col gap-2">
          {venueEvents.length > 0 ? venueEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/owner/system/venues/${venueId}/events/${ev.id}`)}
              className="group flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors"
              data-testid={`venue-event-${ev.id}`}
            >
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{ev.name}</span>
                  <span className="text-[10px] text-muted-foreground">{ev.date}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
                  <span>Revenue <span className="font-semibold text-foreground">${(ev.revenue / 1000).toFixed(1)}K</span></span>
                  <span>Profit <span className="font-semibold text-foreground">${(ev.profit / 1000).toFixed(1)}K</span></span>
                  <span>Guests <span className="font-semibold text-foreground">{ev.guests}</span></span>
                  <span>Margin <span className="font-semibold text-foreground">{ev.margin}%</span></span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )) : <p className="text-sm text-muted-foreground italic">No events for this venue</p>}
        </div>
      </motion.div>
    </div>
  );
}

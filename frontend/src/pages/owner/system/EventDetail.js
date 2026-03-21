import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronRight, Clock, Users, DollarSign } from 'lucide-react';
import { ownerEvents, eventHourlyRevenue, eventCostBreakdown, eventStaff, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const healthBadge = { strong: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]', stable: 'bg-blue-500/10 text-blue-500', attention: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]', weak: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' };

export default function EventDetail() {
  const { venueId, eventId } = useParams();
  const navigate = useNavigate();
  const event = ownerEvents.find(e => e.id === eventId);

  if (!event) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Event not found</p></div>;

  const vc = venueColors[event.venueName];

  return (
    <div className="space-y-6" data-testid="event-detail">
      <motion.button {...fadeUp} onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="event-back-btn">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-3 h-3 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
          <h2 className="text-lg font-bold text-foreground">{event.name}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${healthBadge[event.health] || ''}`}>{event.health}</span>
        </div>
        <p className="text-xs text-muted-foreground">{event.venueName} &middot; {event.date} &middot; Peak at {event.peakHour}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Revenue', value: `$${(event.revenue / 1000).toFixed(1)}K` },
          { icon: DollarSign, label: 'Profit', value: `$${(event.profit / 1000).toFixed(1)}K` },
          { icon: Users, label: 'Guests', value: event.guests },
          { icon: Clock, label: 'Avg Ticket', value: `$${event.avgTicket}` },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`event-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center gap-1 mb-1">
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Hourly Revenue Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Hourly Revenue</p>
        <p className="text-xs text-muted-foreground mb-4">Revenue throughout the night</p>
        <div className="h-48" data-testid="event-hourly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventHourlyRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill={vc?.hex || 'hsl(var(--primary))'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Cost Breakdown + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-4">Cost Breakdown</p>
          <div className="space-y-2">
            {eventCostBreakdown.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground flex-1">{c.name}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">${c.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-[hsl(var(--border))] pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-sm font-bold text-foreground tabular-nums">${event.totalCosts.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-4">Staff</p>
          <div className="space-y-2">
            {eventStaff.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.role} &middot; {s.hours}h</p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">${s.cost}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

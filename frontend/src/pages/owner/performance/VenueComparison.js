import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Building2, Moon, TrendingUp, Calendar } from 'lucide-react';
import { ownerVenues } from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#FFFFFF', border: '1px solid #E6E8EC', borderRadius: '8px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', color: '#111827' }
};

const statusBadge = {
  top: { text: 'Top performer', cls: 'text-[hsl(var(--success))] bg-[hsl(var(--success)_/_0.1)]' },
  attention: { text: 'Needs attention', cls: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning)_/_0.1)]' },
  underperforming: { text: 'Underperforming', cls: 'text-[hsl(var(--danger))] bg-[hsl(var(--danger)_/_0.1)]' },
};

const venueChartData = ownerVenues.map(v => ({
  name: v.name, revenue: v.revenue, profit: v.profit,
}));

const nightData = [
  { id: 'n1', name: 'Fri Mar 14', venue: 'Downtown', venueId: 'v1', eventId: 'e1', revenue: 8600, profit: 3900, guests: 112, avgTicket: 77, margin: 45 },
  { id: 'n2', name: 'Sat Mar 15', venue: 'Downtown', venueId: 'v1', eventId: 'e2', revenue: 9800, profit: 4600, guests: 128, avgTicket: 77, margin: 47 },
  { id: 'n3', name: 'Fri Mar 7', venue: 'Downtown', venueId: 'v1', eventId: 'e1', revenue: 8900, profit: 4000, guests: 108, avgTicket: 82, margin: 45 },
  { id: 'n4', name: 'Sat Mar 8', venue: 'Midtown', venueId: 'v2', eventId: 'e3', revenue: 9400, profit: 4300, guests: 120, avgTicket: 78, margin: 46 },
  { id: 'n5', name: 'Thu Mar 13', venue: 'Midtown', venueId: 'v2', eventId: 'e4', revenue: 5800, profit: 2400, guests: 74, avgTicket: 78, margin: 41 },
  { id: 'n6', name: 'Fri Mar 14', venue: 'Midtown', venueId: 'v2', eventId: 'e3', revenue: 6200, profit: 2800, guests: 82, avgTicket: 76, margin: 45 },
];

const nightChartData = nightData.map(n => ({
  name: n.name + ' ' + n.venue.charAt(0), revenue: n.revenue, profit: n.profit,
}));

const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function VenueComparison() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('venue');
  const [period, setPeriod] = useState('Weekly');

  return (
    <div className="flex flex-col gap-6" data-testid="venue-comparison">

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-[-8px]">
        {/* Mode Toggle */}
        <div className="rounded-lg border border-border bg-[hsl(var(--card))] p-0.5 flex">
          {[
            { key: 'venue', label: 'Venue', icon: Building2 },
            { key: 'night', label: 'Night', icon: Moon },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === m.key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`mode-${m.key}`}
            >
              <m.icon className="h-3 w-3" /> {m.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${
                period === p
                  ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
              data-testid={`period-${p.toLowerCase()}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── VENUE MODE ── */}
      {mode === 'venue' && (
        <>
          {/* Revenue Comparison Chart */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-comparison-chart">
            <SectionHeader icon={TrendingUp} title="Revenue Comparison" subtitle="Side-by-side venue performance" />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={venueChartData}>
                  <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip {...tooltipStyle} formatter={v => [`$${(v / 1000).toFixed(1)}K`, '']} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Venue Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {ownerVenues.map((v, i) => {
              const badge = statusBadge[v.status];
              return (
                <motion.div
                  key={v.id}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.05 }}
                  onClick={() => navigate(`/owner/system/venues/${v.id}`)}
                  className="rounded-xl border border-border bg-[hsl(var(--card))] p-5 cursor-pointer hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm transition-all"
                  data-testid={`venue-card-${v.id}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{v.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge?.cls || ''}`}>{badge?.text}</span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: 'Revenue', value: `$${(v.revenue / 1000).toFixed(0)}K` },
                      { label: 'Profit', value: `$${(v.profit / 1000).toFixed(0)}K` },
                      { label: 'Margin', value: `${v.margin}%` },
                      { label: 'Retention', value: `${v.retention}%` },
                      { label: 'Guests', value: v.guests.toLocaleString() },
                      { label: 'Growth', value: `${v.growth > 0 ? '+' : ''}${v.growth}%` },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Insight */}
                  <p className="text-xs text-muted-foreground italic">{v.insight}</p>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* ── NIGHT MODE ── */}
      {mode === 'night' && (
        <>
          {/* Night Comparison Chart */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="night-comparison-chart">
            <SectionHeader icon={Moon} title="Night Comparison" subtitle="Side-by-side night performance" />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nightChartData}>
                  <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip {...tooltipStyle} formatter={v => [`$${(v / 1000).toFixed(1)}K`, '']} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Night Cards */}
          <div className="flex flex-col gap-3">
            {nightData.map((n, i) => (
              <motion.div
                key={n.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.04 }}
                onClick={() => navigate(`/owner/system/venues/${n.venueId}/events/${n.eventId}`)}
                className="rounded-xl border border-border bg-[hsl(var(--card))] p-4 cursor-pointer hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm transition-all group"
                data-testid={`night-card-${n.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{n.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-muted-foreground font-semibold">{n.venue}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">${n.revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-5 text-xs text-muted-foreground">
                  <span>Profit <span className="font-semibold text-foreground">${n.profit.toLocaleString()}</span></span>
                  <span>Guests <span className="font-semibold text-foreground">{n.guests}</span></span>
                  <span>Avg Ticket <span className="font-semibold text-foreground">${n.avgTicket}</span></span>
                  <span>Margin <span className="font-semibold text-foreground">{n.margin}%</span></span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

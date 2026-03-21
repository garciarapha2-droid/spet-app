import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Clock, Sun, Moon, ArrowUpRight, ArrowDownRight, Zap, TrendingDown
} from 'lucide-react';
import { hourlyRevenue, dayOfWeekRevenue } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' },
};

const peakHour = [...hourlyRevenue].sort((a, b) => b.revenue - a.revenue)[0];
const deadHour = [...hourlyRevenue].sort((a, b) => a.revenue - b.revenue)[0];
const peakDay = [...dayOfWeekRevenue].sort((a, b) => b.revenue - a.revenue)[0];
const deadDay = [...dayOfWeekRevenue].sort((a, b) => a.revenue - b.revenue)[0];
const totalHourlyRev = hourlyRevenue.reduce((s, h) => s + h.revenue, 0);
const totalWeeklyRev = dayOfWeekRevenue.reduce((s, d) => s + d.revenue, 0);
const avgHourly = Math.round(totalHourlyRev / hourlyRevenue.length);
const weekdayAvg = Math.round(dayOfWeekRevenue.slice(0, 5).reduce((s, d) => s + d.revenue, 0) / 5);
const weekendAvg = Math.round(dayOfWeekRevenue.slice(5).reduce((s, d) => s + d.revenue, 0) / 2);

export default function TimeAnalysis() {
  const [view, setView] = useState('hourly');

  return (
    <div className="space-y-6" data-testid="time-analysis">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {['hourly', 'daily'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${view === v ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`time-view-${v}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Peak Hour', value: peakHour.hour, delta: `$${(peakHour.revenue / 1000).toFixed(1)}K`, up: true },
          { icon: TrendingDown, label: 'Dead Hour', value: deadHour.hour, delta: `$${deadHour.revenue}`, up: false },
          { icon: Sun, label: 'Peak Day', value: peakDay.day, delta: `$${(peakDay.revenue / 1000).toFixed(1)}K`, up: true },
          { icon: Moon, label: 'Dead Day', value: deadDay.day, delta: `$${(deadDay.revenue / 1000).toFixed(1)}K`, up: false },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`time-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
              <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {kpi.delta}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Hourly Revenue Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Hourly Revenue Distribution</p>
        <p className="text-xs text-muted-foreground mb-4">Average revenue by hour &middot; Avg ${avgHourly.toLocaleString()}/hr</p>
        <div className="h-64" data-testid="hourly-detail-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}K`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {hourlyRevenue.map((entry, i) => {
                  const isPeak = entry.revenue === peakHour.revenue;
                  const isDead = entry.revenue === deadHour.revenue;
                  return <Cell key={i} fill={isPeak ? 'hsl(var(--success))' : isDead ? 'hsl(var(--danger))' : 'hsl(var(--primary))'} opacity={isPeak || isDead ? 1 : 0.6} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Day of Week Chart + Weekday vs Weekend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Day of Week Revenue</p>
          <p className="text-xs text-muted-foreground mb-4">Revenue distribution by day</p>
          <div className="h-48" data-testid="dow-detail-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}K`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {dayOfWeekRevenue.map((entry, i) => {
                    const isPeak = entry.day === peakDay.day;
                    const isDead = entry.day === deadDay.day;
                    return <Cell key={i} fill={isPeak ? 'hsl(var(--success))' : isDead ? 'hsl(var(--danger))' : 'hsl(var(--primary))'} opacity={isPeak || isDead ? 1 : 0.5} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Weekday vs Weekend</p>
          <p className="text-xs text-muted-foreground mb-4">Performance comparison</p>
          <div className="space-y-4">
            <div className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Weekday Average</span>
                </div>
                <span className="text-lg font-bold text-foreground tabular-nums">${(weekdayAvg / 1000).toFixed(1)}K</span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <motion.div className="h-full rounded-full bg-[hsl(var(--primary))]" initial={{ width: 0 }} animate={{ width: `${(weekdayAvg / weekendAvg * 100).toFixed(0)}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <span className="text-sm font-semibold text-foreground">Weekend Average</span>
                </div>
                <span className="text-lg font-bold text-[hsl(var(--primary))] tabular-nums">${(weekendAvg / 1000).toFixed(1)}K</span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <motion.div className="h-full rounded-full bg-[hsl(var(--primary))]" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} />
              </div>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted)_/_0.3)] p-3">
              <p className="text-xs text-muted-foreground">
                Weekends generate <span className="font-semibold text-foreground">{((weekendAvg / weekdayAvg - 1) * 100).toFixed(0)}% more</span> revenue than weekdays.
                The gap is widening — consider weekday activation strategies.
              </p>
            </div>
          </div>

          {/* Time Slot Summary */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Time Slot Summary</p>
            <div className="space-y-2">
              {[
                { slot: 'Morning (11AM-2PM)', hours: hourlyRevenue.slice(0, 4), color: 'text-[hsl(var(--warning))]' },
                { slot: 'Afternoon (3PM-6PM)', hours: hourlyRevenue.slice(4, 7), color: 'text-muted-foreground' },
                { slot: 'Prime (7PM-10PM)', hours: hourlyRevenue.slice(7, 11), color: 'text-[hsl(var(--success))]' },
                { slot: 'Late (11PM-12AM)', hours: hourlyRevenue.slice(11), color: 'text-[hsl(var(--primary))]' },
              ].map(s => {
                const rev = s.hours.reduce((sum, h) => sum + h.revenue, 0);
                const pct = (rev / totalHourlyRev * 100).toFixed(0);
                return (
                  <div key={s.slot} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                    <span className="text-xs font-medium text-foreground flex-1">{s.slot}</span>
                    <span className={`text-xs font-semibold tabular-nums ${s.color}`}>${(rev / 1000).toFixed(1)}K</span>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

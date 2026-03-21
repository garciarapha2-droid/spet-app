import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Users
} from 'lucide-react';
import {
  dailyRevenueTrend, hourlyRevenue, dayOfWeekRevenue, revenueByCategory, ownerVenues, venueColors
} from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const totalRevenue = ownerVenues.reduce((s, v) => s + v.revenue, 0);
const avgDaily = Math.round(totalRevenue / 30);
const totalGuests = ownerVenues.reduce((s, v) => s + v.guests, 0);
const revPerGuest = Math.round(totalRevenue / totalGuests);
const bestDay = [...dayOfWeekRevenue].sort((a, b) => b.revenue - a.revenue)[0];
const topCategory = [...revenueByCategory].sort((a, b) => b.revenue - a.revenue)[0];

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const catColors = ['hsl(var(--primary))', 'hsl(var(--success))', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function RevenueAnalytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('Monthly');

  return (
    <div className="flex flex-col gap-6" data-testid="revenue-analytics">
      {/* Period Filter */}
      <div className="flex justify-end">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${period === p ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`rev-period-${p.toLowerCase()}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, delta: '+8.2%', up: true },
          { icon: Calendar, label: 'Avg Daily', value: `$${(avgDaily / 1000).toFixed(1)}K`, delta: '+5.7%', up: true },
          { icon: Users, label: 'Rev/Guest', value: `$${revPerGuest}`, delta: '+5.3%', up: true },
          { icon: TrendingUp, label: 'Best Day', value: bestDay.day, delta: `$${(bestDay.revenue / 1000).toFixed(1)}K`, up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`rev-kpi-${kpi.label.toLowerCase().replace(/[\s/]/g, '-')}`}>
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

      {/* 30-Day Revenue Trend */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-semibold text-foreground">Revenue Trend</p>
            <p className="text-xs text-muted-foreground">Last 30 days &middot; Revenue vs Profit</p>
          </div>
        </div>
        <div className="h-64" data-testid="revenue-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyRevenueTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#profGrad)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Revenue by Category + Venue Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Revenue by Category</p>
          <p className="text-xs text-muted-foreground mb-4">Current vs previous period</p>
          <div className="h-56" data-testid="category-revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCategory} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
                <Bar dataKey="revenue" name="Current" radius={[4, 4, 0, 0]}>
                  {revenueByCategory.map((_, i) => <Cell key={i} fill={catColors[i % catColors.length]} />)}
                </Bar>
                <Bar dataKey="prevRevenue" name="Previous" radius={[4, 4, 0, 0]} fill="hsl(var(--muted-foreground))" opacity={0.25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Category Table */}
          <div className="mt-4 flex flex-col gap-2">
            {revenueByCategory.map((c, i) => {
              const change = ((c.revenue - c.prevRevenue) / c.prevRevenue * 100).toFixed(1);
              const up = c.revenue >= c.prevRevenue;
              return (
                <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColors[i % catColors.length] }} />
                  <span className="text-sm font-medium text-foreground flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{c.margin}% margin</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">${(c.revenue / 1000).toFixed(0)}K</span>
                  <span className={`text-xs font-medium tabular-nums ${up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{up ? '+' : ''}{change}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Venue Revenue */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Revenue by Venue</p>
          <p className="text-xs text-muted-foreground mb-4">Ranked by revenue</p>
          <div className="flex flex-col gap-4">
            {ownerVenues.map((v, i) => {
              const vc = venueColors[v.name];
              const pct = (v.revenue / totalRevenue * 100).toFixed(1);
              return (
                <motion.div key={v.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 + i * 0.05 }}
                  onClick={() => navigate(`/owner/system/venues/${v.id}`)}
                  className="p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm cursor-pointer transition-all group"
                  data-testid={`rev-venue-${v.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                      <span className="text-sm font-semibold text-foreground">{v.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--muted))] text-muted-foreground">{pct}%</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">${(v.revenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: vc?.hex || '#888' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Profit ${(v.profit / 1000).toFixed(0)}K</span>
                    <span>Margin {v.margin}%</span>
                    <span>{v.guests} guests</span>
                    <span className={`font-medium ${v.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{v.growth > 0 ? '+' : ''}{v.growth}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Hourly + Day-of-Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Hourly Revenue</p>
          <p className="text-xs text-muted-foreground mb-4">Average revenue by hour</p>
          <div className="h-48" data-testid="hourly-revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}K`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Day of Week</p>
          <p className="text-xs text-muted-foreground mb-4">Revenue distribution</p>
          <div className="h-48" data-testid="day-of-week-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}K`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {dayOfWeekRevenue.map((entry, i) => (
                    <Cell key={i} fill={entry.day === 'Sat' || entry.day === 'Fri' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} opacity={entry.day === 'Sat' || entry.day === 'Fri' ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Percent
} from 'lucide-react';
import {
  monthlyFinancials, costBreakdown, ownerVenues, venueColors, staffCostByVenue
} from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const totalRevenue = ownerVenues.reduce((s, v) => s + v.revenue, 0);
const totalProfit = ownerVenues.reduce((s, v) => s + v.profit, 0);
const totalCosts = totalRevenue - totalProfit;
const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);
const bestMonth = [...monthlyFinancials].sort((a, b) => b.profit - a.profit)[0];

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const costColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#22C55E', '#94A3B8'];

export default function ProfitAnalysis() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('Monthly');

  return (
    <div className="flex flex-col gap-6" data-testid="profit-analysis">
      {/* Period Filter */}
      <div className="flex justify-end">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${period === p ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`profit-period-${p.toLowerCase()}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Profit', value: `$${(totalProfit / 1000).toFixed(0)}K`, delta: '+12.1%', up: true },
          { icon: Percent, label: 'Avg Margin', value: `${avgMargin}%`, delta: '+1.4%', up: true },
          { icon: TrendingDown, label: 'Total Costs', value: `$${(totalCosts / 1000).toFixed(0)}K`, delta: '+3.2%', up: false },
          { icon: TrendingUp, label: 'Best Month', value: bestMonth.month, delta: `$${(bestMonth.profit / 1000).toFixed(0)}K`, up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`profit-kpi-${kpi.label.toLowerCase().replace(/[\s/]/g, '-')}`}>
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

      {/* Monthly P&L Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Monthly P&L</p>
        <p className="text-xs text-muted-foreground mb-4">Revenue, costs, and profit trend</p>
        <div className="h-64" data-testid="monthly-pl-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyFinancials} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="plRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="plProfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#plRevGrad)" name="Revenue" />
              <Area type="monotone" dataKey="costs" stroke="hsl(var(--danger))" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Costs" />
              <Area type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#plProfGrad)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Cost Breakdown + Margin by Venue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Cost Breakdown</p>
          <p className="text-xs text-muted-foreground mb-4">Expense distribution</p>
          <div className="h-48" data-testid="cost-breakdown-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdown} layout="vertical" margin={{ top: 0, right: 5, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {costBreakdown.map((_, i) => <Cell key={i} fill={costColors[i % costColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Cost Table */}
          <div className="mt-4 flex flex-col gap-2">
            {costBreakdown.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: costColors[i] }} />
                <span className="text-sm font-medium text-foreground flex-1">{c.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{c.pct}%</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">${(c.amount / 1000).toFixed(0)}K</span>
                <span className={`text-xs font-medium tabular-nums ${c.trend === 'up' ? 'text-[hsl(var(--danger))]' : c.trend === 'down' ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>{c.trendValue}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Margin by Venue */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Margin by Venue</p>
          <p className="text-xs text-muted-foreground mb-4">Profitability comparison</p>
          <div className="flex flex-col gap-4">
            {ownerVenues.map((v, i) => {
              const vc = venueColors[v.name];
              return (
                <motion.div key={v.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 + i * 0.05 }}
                  onClick={() => navigate(`/owner/finance/costs/${v.name}`)}
                  className="p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.3)] cursor-pointer transition-all"
                  data-testid={`profit-venue-${v.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                      <span className="text-sm font-semibold text-foreground">{v.name}</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${v.margin >= 40 ? 'text-[hsl(var(--success))]' : v.margin >= 35 ? 'text-foreground' : 'text-[hsl(var(--danger))]'}`}>{v.margin}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: vc?.hex || '#888' }} initial={{ width: 0 }} animate={{ width: `${v.margin}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Revenue ${(v.revenue / 1000).toFixed(0)}K</span>
                    <span>Profit ${(v.profit / 1000).toFixed(0)}K</span>
                    <span>Costs ${((v.revenue - v.profit) / 1000).toFixed(0)}K</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Staff Cost Ratio */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Staff Cost Ratio</p>
            <div className="flex flex-col gap-2">
              {staffCostByVenue.map((s, i) => (
                <div key={s.venue} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground w-20">{s.venue}</span>
                  <div className="flex-1 h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div className={`h-full rounded-full ${s.ratio > 35 ? 'bg-[hsl(var(--danger))]' : 'bg-[hsl(var(--success))]'}`} style={{ width: `${s.ratio}%` }} />
                  </div>
                  <span className={`text-xs font-semibold tabular-nums ${s.ratio > 35 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]'}`}>{s.ratio}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

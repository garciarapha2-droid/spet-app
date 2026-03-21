import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { monthlyFinancials, ownerVenues } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const totalRevenue = ownerVenues.reduce((s, v) => s + v.revenue, 0);
const totalProfit = ownerVenues.reduce((s, v) => s + v.profit, 0);
const totalCosts = totalRevenue - totalProfit;
const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);
const latestMonth = monthlyFinancials[monthlyFinancials.length - 1];
const prevMonth = monthlyFinancials[monthlyFinancials.length - 2];
const revChange = ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);
const profitChange = ((latestMonth.profit - prevMonth.profit) / prevMonth.profit * 100).toFixed(1);

export default function FinancialOverview() {
  const [period, setPeriod] = useState('Monthly');

  return (
    <div className="flex flex-col gap-6" data-testid="financial-overview">
      <div className="flex justify-end">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${period === p ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`fin-period-${p.toLowerCase()}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, delta: `${revChange > 0 ? '+' : ''}${revChange}%`, up: revChange > 0 },
          { icon: TrendingUp, label: 'Profit', value: `$${(totalProfit / 1000).toFixed(0)}K`, delta: `${profitChange > 0 ? '+' : ''}${profitChange}%`, up: profitChange > 0 },
          { icon: Percent, label: 'Margin', value: `${avgMargin}%`, delta: '+1.4%', up: true },
          { icon: DollarSign, label: 'Costs', value: `$${(totalCosts / 1000).toFixed(0)}K`, delta: '+3.2%', up: false },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`fin-kpi-${kpi.label.toLowerCase()}`}>
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

      {/* Monthly P&L */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">P&L Statement</p>
        <p className="text-xs text-muted-foreground mb-4">6-month trend</p>
        <div className="h-64" data-testid="fin-pl-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFinancials} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Costs" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="profit" name="Profit" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Detail Table */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="p-5 pb-0">
          <p className="text-base font-semibold text-foreground mb-1">Monthly Breakdown</p>
          <p className="text-xs text-muted-foreground mb-4">Full detail</p>
        </div>
        <div className="overflow-x-auto" data-testid="fin-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                {['Month', 'Revenue', 'Costs', 'Profit', 'Margin'].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyFinancials.map((m, i) => {
                const margin = (m.profit / m.revenue * 100).toFixed(1);
                return (
                  <tr key={m.month} className={`border-b border-[hsl(var(--border)_/_0.5)] ${i % 2 === 0 ? 'bg-[hsl(var(--muted)_/_0.15)]' : ''}`}>
                    <td className="p-3 pl-5 font-medium text-foreground">{m.month}</td>
                    <td className="p-3 tabular-nums font-semibold">${(m.revenue / 1000).toFixed(0)}K</td>
                    <td className="p-3 tabular-nums text-[hsl(var(--danger))]">${(m.costs / 1000).toFixed(0)}K</td>
                    <td className="p-3 tabular-nums text-[hsl(var(--success))] font-semibold">${(m.profit / 1000).toFixed(0)}K</td>
                    <td className="p-3 tabular-nums">{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

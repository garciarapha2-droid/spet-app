import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import { costBreakdown, staffCostByVenue, ownerVenues, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };
const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

const totalCosts = costBreakdown.reduce((s, c) => s + c.amount, 0);
const maxCost = Math.max(...costBreakdown.map(c => c.amount));

/* Staff cost chart data — per venue */
const chartData = ownerVenues.map(v => {
  const scv = staffCostByVenue.find(s => s.venue === v.name);
  return {
    venue: v.name,
    Revenue: v.revenue / 1000,
    'Staff Cost': (scv?.staffCost || 0) / 1000,
  };
});

const tooltipStyle = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E6E8EC', borderRadius: '8px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
  labelStyle: { color: '#111827', fontWeight: 600 },
};

export default function CostAnalysis() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('Monthly');

  const staffCost = costBreakdown[0]?.amount || 62400;
  const costRevenueRatio = 62;
  const uptownRatio = 54;

  const kpis = [
    { label: 'Total Costs', value: `$${Math.round(totalCosts / 1000)}K`, icon: DollarSign },
    { label: 'Staff Cost', value: `$${Math.round(staffCost / 1000)}K`, icon: BarChart3 },
    { label: 'Cost / Revenue', value: `${costRevenueRatio}%`, icon: BarChart3 },
    { label: 'Uptown Ratio', value: `${uptownRatio}%`, icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="cost-analysis">

      {/* Period Filter — top right, mb-4 */}
      <div className="flex items-center justify-end mb-[-8px]">
        <div className="flex rounded-full bg-[hsl(var(--muted)_/_0.5)] p-1 backdrop-blur">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid={`period-${p.toLowerCase()}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs — grid-cols-2 md:grid-cols-4, gap-4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4 flex flex-col gap-1" data-testid={`cost-kpi-${i}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* 2-column grid — gap-6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT — Cost Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
              <BarChart3 className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Cost Breakdown</h3>
              <p className="text-xs text-muted-foreground">By category</p>
            </div>
          </div>

          {/* Bar list — flex flex-col gap-3 */}
          <div className="flex flex-col gap-3">
            {costBreakdown.map((c, i) => {
              const pct = Math.round((c.amount / totalCosts) * 100);
              const relPct = Math.round((c.amount / maxCost) * 100);
              const trendVal = typeof c.trendValue === 'string' ? c.trendValue : `${c.trend === 'down' ? '-' : '+'}${c.trendValue || 0}%`;
              const trendColor = (c.trend === 'up' && parseFloat(trendVal) > 5)
                ? 'text-[hsl(var(--danger))]'
                : c.trend === 'down'
                  ? 'text-[hsl(var(--success))]'
                  : 'text-muted-foreground';

              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-24 truncate">{c.name}</span>
                  <div className="flex-1 h-7 rounded-md bg-[hsl(var(--muted)_/_0.4)] overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${relPct}%` }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="h-full rounded-md bg-[hsl(var(--chart-blue,220_70%_55%)_/_0.6)]"
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-foreground">${(c.amount / 1000).toFixed(1)}K ({pct}%)</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold w-10 text-right ${trendColor}`}>{trendVal}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* RIGHT — Staff Cost by Venue */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
              <DollarSign className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Staff Cost by Venue</h3>
              <p className="text-xs text-muted-foreground">Click venue for details</p>
            </div>
          </div>

          {/* Recharts BarChart — h-[200px] */}
          <div className="h-[200px]" data-testid="staff-cost-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} cursor="pointer" onClick={(d) => { if (d?.activeLabel) navigate(`/owner/finance/costs/${d.activeLabel}`); }}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="venue" fontSize={11} fill="#6B7280" stroke="#EAECEF" />
                <YAxis fontSize={10} fill="#6B7280" stroke="#EAECEF" tickFormatter={v => `$${v}K`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`$${v}K`, '']} />
                <Bar dataKey="Revenue" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Staff Cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Venue list below chart — mt-3, flex flex-col gap-1 */}
          <div className="mt-3 flex flex-col gap-1">
            {ownerVenues.map(v => {
              const scv = staffCostByVenue.find(s => s.venue === v.name);
              const ratio = scv?.ratio || 0;
              return (
                <div key={v.id}
                  onClick={() => navigate(`/owner/finance/costs/${v.name}`)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.4)] cursor-pointer transition-colors"
                  data-testid={`cost-venue-${v.id}`}>
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">{v.name}</span>
                  <span className={`text-xs font-semibold ${ratio > 40 ? 'text-[hsl(var(--danger))]' : 'text-foreground'}`}>
                    {ratio}% of revenue &rarr;
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Cost Alert — bottom block */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--danger)_/_0.1)] flex items-center justify-center">
            <AlertTriangle className="h-[18px] w-[18px] text-[hsl(var(--danger))]" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Cost Alert</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Uptown's staff cost is 54% of revenue — well above the 35% target.
          Reducing 2 servers during low hours could save $2K/month.
        </p>
        <button
          className="mt-3 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          onClick={() => navigate('/owner/finance/costs/Uptown')}
          data-testid="cost-alert-cta"
        >
          Review Uptown Costs
        </button>
      </motion.div>
    </div>
  );
}

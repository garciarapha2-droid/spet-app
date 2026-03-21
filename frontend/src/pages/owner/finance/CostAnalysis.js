import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { BarChart3, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { costBreakdown, staffCostByVenue, ownerVenues, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const costColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#22C55E', '#94A3B8'];
const totalCosts = costBreakdown.reduce((s, c) => s + c.amount, 0);

export default function CostAnalysis() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6" data-testid="cost-analysis">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Costs', value: `$${(totalCosts / 1000).toFixed(0)}K`, delta: '+3.2%', up: false },
          { label: 'Staff Costs', value: `$${(costBreakdown[0].amount / 1000).toFixed(0)}K`, delta: costBreakdown[0].trendValue, up: false },
          { label: 'COGS', value: `$${(costBreakdown[1].amount / 1000).toFixed(0)}K`, delta: costBreakdown[1].trendValue, up: costBreakdown[1].trend === 'down' },
          { label: 'Fixed Costs', value: `$${((costBreakdown[2].amount + costBreakdown[3].amount) / 1000).toFixed(0)}K`, delta: 'stable', up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`cost-kpi-${i}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
              {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {kpi.delta}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Cost Breakdown Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Cost Breakdown</p>
        <p className="text-xs text-muted-foreground mb-4">Expense distribution</p>
        <div className="h-48" data-testid="cost-breakdown-main-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBreakdown} layout="vertical" margin={{ top: 0, right: 5, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={90} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {costBreakdown.map((_, i) => <Cell key={i} fill={costColors[i % costColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Venue Cost Drill-Down */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Cost by Venue</p>
        <p className="text-xs text-muted-foreground mb-4">Click to drill down</p>
        <div className="space-y-3">
          {ownerVenues.map((v, i) => {
            const vc = venueColors[v.name];
            const scv = staffCostByVenue.find(s => s.venue === v.name);
            return (
              <motion.div key={v.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 + i * 0.04 }}
                onClick={() => navigate(`/owner/finance/costs/${v.name}`)}
                className="p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.3)] cursor-pointer transition-all group"
                data-testid={`cost-venue-${v.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                    <span className="text-sm font-semibold text-foreground">{v.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold tabular-nums ${scv?.ratio > 35 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]'}`}>Staff {scv?.ratio}%</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Revenue ${(v.revenue / 1000).toFixed(0)}K</span>
                  <span>Costs ${((v.revenue - v.profit) / 1000).toFixed(0)}K</span>
                  <span>Margin {v.margin}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

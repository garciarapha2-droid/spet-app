import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChevronRight, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { venueCostDetails, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const costColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#22C55E'];

export default function VenueCostDetail() {
  const { venueName } = useParams();
  const navigate = useNavigate();
  const data = venueCostDetails[venueName];

  if (!data) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Venue cost data not found</p></div>;

  const vc = venueColors[venueName];

  return (
    <div className="space-y-6" data-testid="venue-cost-detail">
      <motion.button {...fadeUp} onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="cost-back-btn">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-3 h-3 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
          <h2 className="text-lg font-bold text-foreground">{venueName} — Cost Analysis</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Cost', value: `$${(data.totalCost / 1000).toFixed(0)}K` },
            { label: 'Revenue', value: `$${(data.revenue / 1000).toFixed(0)}K` },
            { label: 'Margin', value: `${data.margin}%` },
            { label: 'Labor Ratio', value: `${data.laborRatio}%`, danger: data.laborRatio > 35 },
          ].map((kpi, i) => (
            <div key={kpi.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{kpi.label}</p>
              <p className={`text-lg font-bold tabular-nums ${kpi.danger ? 'text-[hsl(var(--danger))]' : 'text-foreground'}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cost Trend */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Revenue vs Cost Trend</p>
        <p className="text-xs text-muted-foreground mb-4">6-month view</p>
        <div className="h-56" data-testid="venue-cost-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.costTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="vcRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={vc?.hex || 'hsl(var(--primary))'} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={vc?.hex || 'hsl(var(--primary))'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="revenue" stroke={vc?.hex || 'hsl(var(--primary))'} strokeWidth={2} fill="url(#vcRevGrad)" name="Revenue" />
              <Area type="monotone" dataKey="cost" stroke="hsl(var(--danger))" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Costs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Breakdown + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-4">Cost Breakdown</p>
          <div className="space-y-3">
            {data.breakdown.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: costColors[i % costColors.length] }} />
                <span className="text-sm font-medium text-foreground flex-1">{c.name}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">${(c.amount / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-4">Staff Breakdown</p>
          <div className="space-y-3">
            {data.staffBreakdown.map((s, i) => (
              <div key={s.role} className="flex items-center gap-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground flex-1">{s.role}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{s.count} staff</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">${(s.cost / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><AlertTriangle className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
            <p className="text-base font-semibold text-foreground">Recommendations</p>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
                <span className="text-xs font-semibold text-[hsl(var(--success))] mt-1 inline-block">{r.impact}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

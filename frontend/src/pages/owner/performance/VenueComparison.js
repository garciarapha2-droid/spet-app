import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  Building2, ArrowUpRight, ArrowDownRight, ChevronRight, Users, DollarSign, Percent, TrendingUp
} from 'lucide-react';
import { ownerVenues, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const statusLabel = { top: { text: 'Top performer', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' }, attention: { text: 'Needs attention', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' }, underperforming: { text: 'Underperforming', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' },
};

const venueChartData = ownerVenues.map(v => ({
  name: v.name,
  revenue: v.revenue,
  profit: v.profit,
  guests: v.guests,
  retention: v.retention,
  margin: v.margin,
  growth: v.growth,
  fill: venueColors[v.name]?.hex || '#888',
}));

const metrics = ['revenue', 'profit', 'margin', 'guests', 'retention', 'growth'];

export default function VenueComparison() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const formatVal = (val, metric) => {
    if (metric === 'revenue' || metric === 'profit') return `$${(val / 1000).toFixed(0)}K`;
    if (metric === 'margin' || metric === 'retention') return `${val}%`;
    if (metric === 'growth') return `${val > 0 ? '+' : ''}${val}%`;
    return val.toLocaleString();
  };

  return (
    <div className="flex flex-col gap-6" data-testid="venue-comparison">
      {/* Metric Selector */}
      <div className="flex justify-end">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {metrics.map(m => (
            <button key={m} onClick={() => setSelectedMetric(m)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${selectedMetric === m ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`compare-metric-${m}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Comparison Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Venue Comparison</p>
        <p className="text-xs text-muted-foreground mb-4 capitalize">Comparing {selectedMetric} across venues</p>
        <div className="h-64" data-testid="comparison-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={venueChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => selectedMetric === 'revenue' || selectedMetric === 'profit' ? `$${(v / 1000).toFixed(0)}K` : `${v}`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [formatVal(v, selectedMetric), '']} />
              <Bar dataKey={selectedMetric} radius={[6, 6, 0, 0]} barSize={60}>
                {venueChartData.map((v, i) => <Cell key={i} fill={v.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Venue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ownerVenues.map((v, i) => {
          const vc = venueColors[v.name];
          const st = statusLabel[v.status];
          return (
            <motion.div key={v.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.05 }}
              onClick={() => navigate(`/owner/system/venues/${v.id}`)}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm cursor-pointer transition-all group"
              data-testid={`compare-venue-card-${v.id}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                <span className="text-base font-semibold text-foreground">{v.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st?.cls || ''}`}>{st?.text}</span>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { icon: DollarSign, label: 'Revenue', value: `$${(v.revenue / 1000).toFixed(0)}K` },
                  { icon: TrendingUp, label: 'Profit', value: `$${(v.profit / 1000).toFixed(0)}K` },
                  { icon: Percent, label: 'Margin', value: `${v.margin}%` },
                  { icon: Users, label: 'Guests', value: v.guests.toLocaleString() },
                ].map(m => (
                  <div key={m.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2.5">
                    <div className="flex items-center gap-1 mb-1">
                      <m.icon className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{m.label}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground tabular-nums">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Growth</span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${v.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                  {v.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {v.growth > 0 ? '+' : ''}{v.growth}%
                </span>
                <span className="text-xs text-muted-foreground ml-auto">Ret {v.retention}%</span>
              </div>

              <p className="text-xs text-muted-foreground italic mt-3">{v.insight}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="p-5 pb-0">
          <p className="text-base font-semibold text-foreground mb-1">Full Comparison</p>
          <p className="text-xs text-muted-foreground mb-4">All metrics side by side</p>
        </div>
        <div className="overflow-x-auto" data-testid="comparison-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left p-3 pl-5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Metric</th>
                {ownerVenues.map(v => (
                  <th key={v.id} className="text-right p-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${venueColors[v.name]?.dot || 'bg-muted-foreground'}`} />
                      {v.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Revenue', key: 'revenue', fmt: v => `$${(v / 1000).toFixed(0)}K` },
                { label: 'Profit', key: 'profit', fmt: v => `$${(v / 1000).toFixed(0)}K` },
                { label: 'Margin', key: 'margin', fmt: v => `${v}%` },
                { label: 'Guests', key: 'guests', fmt: v => v.toLocaleString() },
                { label: 'Retention', key: 'retention', fmt: v => `${v}%` },
                { label: 'Growth', key: 'growth', fmt: v => `${v > 0 ? '+' : ''}${v}%` },
                { label: 'Staff', key: 'staffCount', fmt: v => v },
                { label: 'Tables', key: 'tables', fmt: v => v },
                { label: 'Events', key: 'events', fmt: v => v },
              ].map((row, i) => (
                <tr key={row.key} className={`border-b border-[hsl(var(--border)_/_0.5)] ${i % 2 === 0 ? 'bg-[hsl(var(--muted)_/_0.15)]' : ''}`}>
                  <td className="p-3 pl-5 font-medium text-foreground">{row.label}</td>
                  {ownerVenues.map(v => {
                    const val = v[row.key];
                    const best = row.key === 'growth' ? Math.max(...ownerVenues.map(x => x[row.key])) : Math.max(...ownerVenues.map(x => x[row.key]));
                    return (
                      <td key={v.id} className={`p-3 text-right tabular-nums font-semibold ${val === best ? 'text-[hsl(var(--primary))]' : 'text-foreground'}`}>
                        {row.fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

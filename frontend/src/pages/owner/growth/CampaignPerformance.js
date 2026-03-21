import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Target, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { ownerCampaigns } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const statusBadge = { active: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]', ended: 'bg-[hsl(var(--muted))] text-muted-foreground', draft: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' };
const typeBadge = { spend: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]', loyalty: 'bg-purple-500/10 text-purple-400', retention: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]', referral: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]', event: 'bg-blue-500/10 text-blue-500' };

const activeCampaigns = ownerCampaigns.filter(c => c.status === 'active');
const totalRevGen = ownerCampaigns.reduce((s, c) => s + c.revenueGenerated, 0);
const avgConversion = Math.round(activeCampaigns.reduce((s, c) => s + c.conversionRate, 0) / (activeCampaigns.length || 1));
const avgROI = Math.round(activeCampaigns.reduce((s, c) => s + c.roi, 0) / (activeCampaigns.length || 1));

export default function CampaignPerformance() {
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'active', 'ended', 'draft'];

  const filtered = ownerCampaigns.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="space-y-6" data-testid="campaign-performance">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: activeCampaigns.length, delta: `${ownerCampaigns.length} total`, up: true },
          { label: 'Revenue Generated', value: `$${(totalRevGen / 1000).toFixed(0)}K`, delta: '+22%', up: true },
          { label: 'Avg Conversion', value: `${avgConversion}%`, delta: '+4%', up: true },
          { label: 'Avg ROI', value: `${avgROI}%`, delta: '+18%', up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`campaign-kpi-${i}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
              <ArrowUpRight className="h-3 w-3" /> {kpi.delta}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ROI Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Campaign ROI</p>
        <p className="text-xs text-muted-foreground mb-4">Return on investment by campaign</p>
        <div className="h-48" data-testid="campaign-roi-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ownerCampaigns.filter(c => c.roi > 0)} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [`${v}%`, 'ROI']} />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                {ownerCampaigns.filter(c => c.roi > 0).map((c, i) => <Cell key={i} fill={c.roi > 300 ? 'hsl(var(--success))' : c.roi > 200 ? 'hsl(var(--primary))' : 'hsl(var(--warning))'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Filter + Campaign List */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] p-[3px] rounded-full">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`campaign-filter-${f}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((c, i) => (
          <motion.div key={c.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 + i * 0.04 }}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm transition-all"
            data-testid={`campaign-card-${c.id}`}
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{c.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusBadge[c.status] || ''}`}>{c.status}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${typeBadge[c.type] || ''}`}>{c.type}</span>
              <span className="text-xs text-muted-foreground ml-auto">{c.startDate}{c.endDate ? ` - ${c.endDate}` : ' - ongoing'}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Revenue</p><p className="text-sm font-bold text-foreground tabular-nums">${c.revenueGenerated.toLocaleString()}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Reached</p><p className="text-sm font-bold text-foreground tabular-nums">{c.guestsReached}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Conversion</p><p className="text-sm font-bold text-foreground tabular-nums">{c.conversionRate}%</p></div>
              <div><p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">ROI</p><p className={`text-sm font-bold tabular-nums ${c.roi > 200 ? 'text-[hsl(var(--success))]' : 'text-foreground'}`}>{c.roi}%</p></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

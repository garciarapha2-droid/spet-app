import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Heart, AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { retentionCurve, retentionTrend, ownerGuests, ownerVenues } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const avgRetention = Math.round(ownerVenues.reduce((s, v) => s + v.retention, 0) / ownerVenues.length);
const atRiskGuests = ownerGuests.filter(g => g.returningRisk);
const lostGuests = ownerGuests.filter(g => g.segment === 'lost');
const churnRate = Math.round((atRiskGuests.length + lostGuests.length) / ownerGuests.length * 100);

export default function ChurnRetention() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6" data-testid="churn-retention">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Retention Rate', value: `${avgRetention}%`, delta: '-3.2%', up: false },
          { label: 'Churn Rate', value: `${churnRate}%`, delta: '+18%', up: false },
          { label: 'At Risk', value: atRiskGuests.length, delta: `${atRiskGuests.length} guests`, up: false },
          { label: 'Lost', value: lostGuests.length, delta: `${lostGuests.length} guests`, up: false },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`churn-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
              {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {kpi.delta}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Retention Curve + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Retention Curve</p>
          <p className="text-xs text-muted-foreground mb-4">Guest return rate over 8 weeks</p>
          <div className="h-56" data-testid="retention-curve-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionCurve} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`${v}%`, 'Retention']} />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#retGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">Week 2 is the biggest drop-off: 28% of guests don't return after their first visit.</p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Monthly Retention Trend</p>
          <p className="text-xs text-muted-foreground mb-4">6-month view</p>
          <div className="h-56" data-testid="retention-trend-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="retTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--danger))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[40, 70]} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`${v}%`, 'Retention']} />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--danger))" strokeWidth={2} fill="url(#retTrendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">Retention has dropped steadily from 64% to 50% over 6 months.</p>
        </motion.div>
      </div>

      {/* At-Risk Guest List */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--danger)_/_0.1)] flex items-center justify-center"><AlertTriangle className="h-[18px] w-[18px] text-[hsl(var(--danger))]" /></div>
          <div><p className="text-base font-semibold text-foreground">At-Risk & Lost Guests</p><p className="text-xs text-muted-foreground">Guests needing re-engagement</p></div>
        </div>
        <div className="space-y-2">
          {[...atRiskGuests, ...lostGuests].map((g, i) => (
            <motion.div key={g.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 + i * 0.03 }}
              onClick={() => navigate(`/owner/customers/${g.id}`)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] cursor-pointer transition-colors group"
              data-testid={`churn-guest-${g.id}`}
            >
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--danger)_/_0.1)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--danger))]">
                {g.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.riskSignal} &middot; Last visit: {g.lastVisit}</p>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">${g.totalSpent.toLocaleString()}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${g.segment === 'lost' ? 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' : 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]'}`}>{g.segment === 'lost' ? 'Lost' : 'At Risk'}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

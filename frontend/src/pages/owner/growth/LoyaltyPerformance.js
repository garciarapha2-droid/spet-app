import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Sparkles, ArrowUpRight, Crown } from 'lucide-react';
import { ownerLoyaltyTiers, ownerGuests } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const totalLoyaltyMembers = ownerLoyaltyTiers.reduce((s, t) => s + t.count, 0);
const totalLoyaltyRevenue = ownerLoyaltyTiers.reduce((s, t) => s + t.revenue, 0);
const enrolledPct = Math.round(ownerGuests.filter(g => g.loyaltyEnrolled).length / ownerGuests.length * 100);
const avgMemberSpend = Math.round(totalLoyaltyRevenue / totalLoyaltyMembers);

export default function LoyaltyPerformance() {
  return (
    <div className="flex flex-col gap-6" data-testid="loyalty-performance">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: totalLoyaltyMembers, delta: '+24', up: true },
          { label: 'Enrollment', value: `${enrolledPct}%`, delta: '+4%', up: true },
          { label: 'Loyalty Revenue', value: `$${(totalLoyaltyRevenue / 1000).toFixed(0)}K`, delta: '+15%', up: true },
          { label: 'Avg Member Spend', value: `$${avgMemberSpend}`, delta: '+8%', up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`loyalty-kpi-${i}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
              <ArrowUpRight className="h-3 w-3" /> {kpi.delta}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Tier Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-1">Tier Distribution</p>
        <p className="text-xs text-muted-foreground mb-4">Members and revenue by tier</p>
        <div className="h-56" data-testid="tier-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ownerLoyaltyTiers} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                {ownerLoyaltyTiers.map((t, i) => <Cell key={i} fill={t.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ownerLoyaltyTiers.map((tier, i) => (
          <motion.div key={tier.name} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid={`tier-card-${tier.name.toLowerCase()}`}>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4" style={{ color: tier.color }} />
              <span className="text-sm font-semibold text-foreground">{tier.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-muted-foreground">Members</span><p className="font-semibold text-foreground tabular-nums">{tier.count}</p></div>
              <div><span className="text-muted-foreground">Revenue</span><p className="font-semibold text-foreground tabular-nums">${(tier.revenue / 1000).toFixed(0)}K</p></div>
              <div><span className="text-muted-foreground">Avg Spend</span><p className="font-semibold text-foreground tabular-nums">${tier.avgSpend}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insight */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Sparkles className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[hsl(var(--primary))]">Loyalty Insight</p>
        </div>
        <p className="text-sm text-muted-foreground">Loyalty members spend <span className="font-semibold text-foreground">2.4x more</span> than non-members. Increasing enrollment from {enrolledPct}% to 80% could add an estimated <span className="font-semibold text-[hsl(var(--success))]">$6,400/mo</span> in additional revenue.</p>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Crown, Sparkles, Users, ArrowUpRight, X } from 'lucide-react';
import { ownerLoyaltyTiers, ownerGuests } from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E6E8EC',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    color: '#111827'
  }
};

const chartData = ownerLoyaltyTiers.map(t => ({
  tier: t.name,
  members: t.count,
  revenue: t.revenue
}));

const maxRevenue = Math.max(...ownerLoyaltyTiers.map(t => t.revenue));

const kpis = [
  { label: 'Adoption Rate', value: '38%', sub: 'of all guests' },
  { label: 'Revenue from Loyal', value: '68%', sub: 'of total revenue' },
  { label: 'Loyal Avg Spend', value: '$185', sub: 'vs $72 non-loyal' },
  { label: 'Spend Lift', value: '+157%', sub: 'loyal vs non-loyal' },
];

export default function LoyaltyPerformance() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState(null);

  const handleTierClick = (tierName) => {
    setSelectedTier(prev => prev === tierName ? null : tierName);
  };

  const tierData = selectedTier
    ? ownerLoyaltyTiers.find(t => t.name === selectedTier)
    : null;

  const tierGuests = selectedTier
    ? ownerGuests.filter(g => g.tier === selectedTier)
    : [];

  return (
    <div className="flex flex-col gap-6" data-testid="loyalty-performance">
      {/* KPIs — grid-cols-2 md:grid-cols-4, gap-4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4 flex flex-col gap-1"
            data-testid={`loyalty-kpi-${i}`}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
            <span className="text-xs text-muted-foreground">{kpi.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Grid Central — 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Esquerdo — Tier Distribution */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
              <Crown className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Tier Distribution</h3>
              <p className="text-xs text-muted-foreground">Members by tier</p>
            </div>
          </div>
          <div className="h-[200px]" data-testid="tier-distribution-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="tier"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EAECEF' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EAECEF' }}
                />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="members"
                  name="Members"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => handleTierClick(data.tier)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">Click a bar to see tier members</p>
        </motion.div>

        {/* Direito — Revenue by Tier */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
              <Sparkles className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue by Tier</h3>
              <p className="text-xs text-muted-foreground">Click tier to explore</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {ownerLoyaltyTiers.map((tier) => {
              const pct = (tier.revenue / maxRevenue) * 100;
              return (
                <div
                  key={tier.name}
                  onClick={() => handleTierClick(tier.name)}
                  className="group flex items-center gap-3 cursor-pointer hover:bg-[hsl(var(--muted)_/_0.3)] rounded-lg p-1 -m-1 transition-colors"
                  data-testid={`revenue-tier-${tier.name.toLowerCase()}`}
                >
                  <span className="text-xs font-medium text-muted-foreground w-16 group-hover:text-foreground transition-colors">
                    {tier.name}
                  </span>
                  <div className="flex-1 h-7 rounded-md bg-[hsl(var(--muted)_/_0.4)] relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="h-full rounded-md bg-blue-500/60"
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                      ${(tier.revenue / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-20 text-right group-hover:text-foreground transition-colors">
                    {tier.count} members &rarr;
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Painel de Tier Detail (expansível) */}
      <AnimatePresence>
        {selectedTier && tierData && (
          <motion.div
            key="tier-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-[hsl(var(--primary)_/_0.2)] bg-[hsl(var(--card))] p-5 overflow-hidden"
            data-testid="tier-detail-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
                  <Users className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{selectedTier} Tier Members</h3>
                  <p className="text-xs text-muted-foreground">
                    {tierData.count} members &middot; ${(tierData.revenue / 1000).toFixed(0)}K revenue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTier(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-colors"
                data-testid="tier-detail-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* KPIs do Tier */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Total Revenue', value: `$${(tierData.revenue / 1000).toFixed(0)}K` },
                { label: 'Avg Spend', value: `$${tierData.avgSpend}` },
                { label: 'Members', value: tierData.count },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Lista de Guests */}
            <div className="flex flex-col gap-2">
              {tierGuests.length > 0 ? tierGuests.map(g => (
                <div
                  key={g.id}
                  onClick={() => navigate(`/owner/customers/${g.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors"
                  data-testid={`tier-guest-${g.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center">
                      <span className="text-xs font-bold text-[hsl(var(--primary))]">
                        {g.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.visits} visits &middot; {g.frequency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground tabular-nums">${g.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Avg ${g.avgSpend}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">No guests found in this tier</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Growth Opportunity */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.2 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
            <ArrowUpRight className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Growth Opportunity</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Loyal guests spend <span className="font-semibold text-foreground">157% more</span> than non-loyal guests.
          Currently at <span className="font-semibold text-foreground">38% adoption</span>, increasing enrollment
          to 60% could add an estimated <span className="font-semibold text-[hsl(var(--success))]">$12,400/mo</span> in
          additional revenue across all venues.
        </p>
        <button
          className="mt-3 px-3 py-1.5 rounded-lg bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] text-xs font-semibold hover:bg-[hsl(var(--primary)_/_0.2)] transition-colors"
          data-testid="boost-loyalty-cta"
        >
          Boost Loyalty Enrollment
        </button>
      </motion.div>
    </div>
  );
}

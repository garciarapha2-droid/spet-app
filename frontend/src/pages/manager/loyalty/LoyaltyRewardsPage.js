import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Percent, Gift, Sparkles, Star, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { loyaltyRewards } from '../../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const typeConfig = {
  discount: { bg: 'bg-[hsl(var(--success)_/_0.15)]', text: 'text-[hsl(var(--success))]', icon: Percent },
  free_item: { bg: 'bg-[hsl(var(--primary)_/_0.15)]', text: 'text-[hsl(var(--primary))]', icon: Gift },
  experience: { bg: 'bg-[hsl(var(--accent)_/_0.15)]', text: 'text-[hsl(var(--accent))]', icon: Sparkles },
  custom: { bg: 'bg-[hsl(var(--warning)_/_0.15)]', text: 'text-[hsl(var(--warning))]', icon: Star },
};

export default function LoyaltyRewardsPage() {
  const [filter, setFilter] = useState('all');
  const [rewards, setRewards] = useState(loyaltyRewards);

  const discountCount = rewards.filter(r => r.type === 'discount').length;
  const freeItemCount = rewards.filter(r => r.type === 'free_item').length;
  const experienceCount = rewards.filter(r => r.type === 'experience').length;

  const filtered = useMemo(() =>
    filter === 'all' ? rewards : rewards.filter(r => r.type === filter),
    [filter, rewards]
  );

  const toggleActive = (id) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className="flex flex-col gap-6" data-testid="loyalty-rewards-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rewards', value: rewards.length },
          { label: 'Discounts', value: discountCount },
          { label: 'Free Items', value: freeItemCount },
          { label: 'Experience Perks', value: experienceCount },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {['all', 'discount', 'free_item', 'experience', 'custom'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`reward-filter-${f}`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-colors" data-testid="add-reward-btn">
          <Plus className="h-4 w-4" /> Add Reward
        </button>
      </motion.div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r, i) => {
          const cfg = typeConfig[r.type] || typeConfig.custom;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={r.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.04 }}
              whileHover={{ y: -2 }}
              className={`rounded-xl border p-4 group transition-colors ${
                r.active ? 'border-[hsl(var(--border))] bg-[hsl(var(--card))]' : 'border-[hsl(var(--border)_/_0.5)] bg-[hsl(var(--muted)_/_0.3)] opacity-60'
              }`}
              data-testid={`reward-card-${r.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.text}`} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(r.id)}
                    className="p-1 transition-colors"
                    data-testid={`toggle-reward-${r.id}`}
                  >
                    {r.active ? (
                      <ToggleRight className="h-5 w-5 text-[hsl(var(--success))]" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[hsl(var(--danger))]">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{r.type.replace('_', ' ')}</span>
              <h4 className="text-sm font-semibold text-foreground mt-2">{r.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Value: {r.value}</p>
              <p className="text-xs text-muted-foreground">Tier: {r.tier}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

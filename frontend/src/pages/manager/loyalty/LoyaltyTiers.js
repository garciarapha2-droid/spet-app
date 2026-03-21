import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Plus, Edit2, Zap, CheckCircle, XCircle } from 'lucide-react';
import { loyaltyTiers } from '../../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const tierColors = {
  Bronze: 'hsl(30, 60%, 50%)',
  Silver: 'hsl(220, 10%, 60%)',
  Gold: 'hsl(45, 90%, 50%)',
  Platinum: 'hsl(260, 20%, 70%)',
  VIP: 'hsl(258, 75%, 58%)',
};

const tierIcons = {
  Bronze: Shield,
  Silver: Shield,
  Gold: Star,
  Platinum: Star,
  VIP: Zap,
};

const automationRules = [
  { label: 'Auto-upgrade tier when points threshold is reached', status: 'active' },
  { label: 'Instant reward unlock on tier change', status: 'active' },
  { label: 'Notify guest via Pulse on tier change', status: 'active' },
  { label: 'Auto-downgrade after 90 days of inactivity', status: 'disabled' },
];

export default function LoyaltyTiers() {
  return (
    <div className="flex flex-col gap-6" data-testid="loyalty-tiers-page">
      {/* Point Rules Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Points/Dollar', value: '2x' },
          { label: 'Daily Limit', value: '500' },
          { label: 'Max/Visit', value: '200' },
          { label: 'Status', value: 'Active' },
        ].map((r, i) => (
          <motion.div key={r.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{r.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{r.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loyaltyTiers.map((tier, i) => {
          const color = tierColors[tier.name];
          const Icon = tierIcons[tier.name] || Shield;
          return (
            <motion.div
              key={tier.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-xl border-2 p-4 relative overflow-hidden group"
              style={{ borderColor: `${color}66`, background: `${color}14` }}
              data-testid={`tier-card-${tier.name.toLowerCase()}`}
            >
              {/* Decorative gradient corner */}
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20" style={{ background: `linear-gradient(to bottom-left, ${color}, transparent)` }} />

              {/* Edit button (hover) */}
              <button className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[hsl(var(--muted)_/_0.5)]">
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <Icon className="h-6 w-6 mb-2" style={{ color }} />
              <h3 className="text-base font-bold mb-1" style={{ color }}>{tier.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">{tier.pointsRequired.toLocaleString()} points required</p>
              {tier.discount > 0 && <p className="text-sm font-semibold text-foreground mb-3">{tier.discount}% discount</p>}

              <div className="flex flex-col gap-1.5 mt-3">
                {tier.benefits.map((b, bi) => (
                  <div key={bi} className="flex items-start gap-1.5">
                    <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" style={{ color }} />
                    <span className="text-xs text-foreground">{b}</span>
                  </div>
                ))}
              </div>

              <button className="flex items-center gap-1 mt-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Add Benefit
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Automation Rules */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">Automation Rules</p>
        <div className="flex flex-col gap-2">
          {automationRules.map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
              <span className="text-sm text-foreground">{rule.label}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                rule.status === 'active' ? 'bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'
              }`}>
                {rule.status === 'active' ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

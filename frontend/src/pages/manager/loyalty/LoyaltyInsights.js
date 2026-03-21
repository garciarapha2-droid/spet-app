import React from 'react';
import { motion } from 'framer-motion';
import { Flame, AlertTriangle, TrendingUp, Sparkles, Target, Send, Zap } from 'lucide-react';
import { loyaltyInsightsData, guestProfiles } from '../../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const typeConfig = {
  critical: { bg: 'bg-[hsl(var(--danger)_/_0.08)]', border: 'border-[hsl(var(--danger)_/_0.2)]', text: 'text-[hsl(var(--danger))]', icon: AlertTriangle },
  opportunity: { bg: 'bg-[hsl(var(--success)_/_0.08)]', border: 'border-[hsl(var(--success)_/_0.2)]', text: 'text-[hsl(var(--success))]', icon: TrendingUp },
  performance: { bg: 'bg-[hsl(var(--primary)_/_0.08)]', border: 'border-[hsl(var(--primary)_/_0.2)]', text: 'text-[hsl(var(--primary))]', icon: Sparkles },
  action: { bg: 'bg-[hsl(var(--warning)_/_0.08)]', border: 'border-[hsl(var(--warning)_/_0.2)]', text: 'text-[hsl(var(--warning))]', icon: Target },
};

export default function LoyaltyInsights() {
  const churnRiskGuests = guestProfiles.filter(g => g.status === 'churn_risk' || g.status === 'lost');
  const nearUpgradeGuests = guestProfiles.filter(g => g.tierProgress >= 60 && g.pointsToNextTier > 0);
  const activeInsights = loyaltyInsightsData.filter(i => i.type === 'critical' || i.type === 'action').length;
  const churnCount = churnRiskGuests.length;
  const nearUpgradeCount = nearUpgradeGuests.length;
  const vipCount = guestProfiles.filter(g => g.status === 'vip').length;

  return (
    <div className="flex flex-col gap-6" data-testid="loyalty-insights-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Insights', value: activeInsights, color: 'text-[hsl(var(--primary))]' },
          { label: 'Churn Risks', value: churnCount, color: 'text-[hsl(var(--danger))]' },
          { label: 'Near Upgrade', value: nearUpgradeCount, color: 'text-[hsl(var(--warning))]' },
          { label: 'VIP Guests', value: vipCount, color: 'text-[hsl(var(--success))]' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold tabular-nums ${kpi.color || 'text-foreground'}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* All Insights */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-[hsl(var(--primary))]" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">All Insights</p>
        </div>
        <div className="flex flex-col gap-2">
          {loyaltyInsightsData.map((ins, i) => {
            const cfg = typeConfig[ins.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={ins.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.04 }}
                className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border} hover:scale-[1.005] transition-transform`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.text}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{ins.message}</p>
                    <p className="text-xs text-muted-foreground">{ins.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums text-foreground">{ins.metric}</span>
                    {ins.trendValue && (
                      <p className={`text-[10px] font-semibold ${ins.trend === 'up' ? cfg.text : ins.trend === 'down' ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground'}`}>
                        {ins.trendValue}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Actionable Guests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Churn Risk */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--danger)_/_0.2)] bg-[hsl(var(--danger)_/_0.05)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--danger))]" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[hsl(var(--danger))]">Churn Risk</p>
          </div>
          <div className="flex flex-col gap-2">
            {churnRiskGuests.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--card)_/_0.6)]">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {g.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">Last: {g.lastVisit} &middot; Score: {g.guestScore}</p>
                </div>
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[hsl(var(--danger)_/_0.15)] text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)_/_0.25)] transition-colors" data-testid={`send-reward-${g.id}`}>
                  <Send className="h-3 w-3" /> Send reward
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Near Upgrade */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} className="rounded-xl border border-[hsl(var(--warning)_/_0.2)] bg-[hsl(var(--warning)_/_0.05)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--warning))]" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[hsl(var(--warning))]">Near Upgrade</p>
          </div>
          <div className="flex flex-col gap-2">
            {nearUpgradeGuests.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--card)_/_0.6)]">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {g.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.pointsToNextTier} pts to {g.nextTier} &middot; {g.tierProgress}%</p>
                </div>
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)_/_0.25)] transition-colors" data-testid={`boost-${g.id}`}>
                  <Zap className="h-3 w-3" /> Boost
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

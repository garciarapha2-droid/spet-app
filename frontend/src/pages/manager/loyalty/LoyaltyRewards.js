import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Rocket, ChevronRight, UserCheck, Crown, Target, Sparkles, Heart, AlertTriangle, TrendingUp } from 'lucide-react';
import { guestProfiles, loyaltyTiers, loyaltyInsightsData } from '../../../data/managerModuleData';

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
  VIP: '#8B5CF6',
};

const insightTypeConfig = {
  critical: { bg: 'bg-[hsl(var(--danger)_/_0.08)]', border: 'border-[hsl(var(--danger)_/_0.2)]', text: 'text-[hsl(var(--danger))]', icon: AlertTriangle },
  opportunity: { bg: 'bg-[hsl(var(--success)_/_0.08)]', border: 'border-[hsl(var(--success)_/_0.2)]', text: 'text-[hsl(var(--success))]', icon: TrendingUp },
  performance: { bg: 'bg-[hsl(var(--primary)_/_0.08)]', border: 'border-[hsl(var(--primary)_/_0.2)]', text: 'text-[hsl(var(--primary))]', icon: Sparkles },
  action: { bg: 'bg-[hsl(var(--warning)_/_0.08)]', border: 'border-[hsl(var(--warning)_/_0.2)]', text: 'text-[hsl(var(--warning))]', icon: Target },
};

export default function LoyaltyRewards() {
  const navigate = useNavigate();

  const vipCount = guestProfiles.filter(g => g.status === 'vip').length;
  const churnCount = guestProfiles.filter(g => g.status === 'churn_risk' || g.status === 'lost').length;
  const returningPct = Math.round((guestProfiles.filter(g => g.visits > 5).length / guestProfiles.length) * 100);
  const avgSpend = Math.round(guestProfiles.reduce((s, g) => s + g.avgSpendPerVisit, 0) / guestProfiles.length);

  const tierDistribution = loyaltyTiers.map(t => ({
    name: t.name,
    value: guestProfiles.filter(g => g.tier === t.name).length,
    color: tierColors[t.name],
  })).filter(t => t.value > 0);

  const quickNav = [
    { label: 'Guests', icon: UserCheck, path: '/manager/loyalty/guests', count: guestProfiles.length },
    { label: 'Tiers', icon: Crown, path: '/manager/loyalty/tiers', count: loyaltyTiers.length },
    { label: 'Campaigns', icon: Target, path: '/manager/loyalty/campaigns', count: 5 },
    { label: 'Rewards', icon: Sparkles, path: '/manager/loyalty/rewards', count: 8 },
    { label: 'Insights', icon: Heart, path: '/manager/loyalty/insights', count: loyaltyInsightsData.length },
  ];

  const topInsights = loyaltyInsightsData.slice(0, 4);

  return (
    <div className="flex flex-col gap-6" data-testid="loyalty-overview-page">
      {/* Hero */}
      <motion.div {...fadeUp} className="rounded-2xl border border-[hsl(var(--primary)_/_0.2)] bg-[hsl(var(--primary)_/_0.05)] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[hsl(var(--primary)_/_0.1)] rounded-bl-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5 text-[hsl(var(--primary))]" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Growth Engine</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Loyalty & Membership</h2>
          <p className="text-sm text-muted-foreground mb-4">Drive retention, increase spend, and build lasting relationships.</p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.8)] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity" data-testid="boost-revenue-btn">
            Boost Revenue Today
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Returning Guests', value: `${returningPct}%` },
          { label: 'Avg Spend/Member', value: `$${avgSpend}` },
          { label: 'VIP Guests', value: vipCount },
          { label: 'Churn Risk', value: churnCount },
          { label: 'Points/Dollar', value: '2x' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.05 }}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            data-testid={`loyalty-kpi-${i}`}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {quickNav.map((item, i) => (
          <motion.div
            key={item.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.04 }}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 cursor-pointer hover:border-[hsl(var(--primary)_/_0.3)] transition-colors"
            onClick={() => navigate(item.path)}
            data-testid={`loyalty-nav-${item.label.toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <item.icon className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span className="text-[10px] font-bold text-muted-foreground">{item.count}</span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-2">{item.label}</p>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-1" />
          </motion.div>
        ))}
      </div>

      {/* Insights + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Insights */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Top Insights</p>
          <div className="flex flex-col gap-2">
            {topInsights.map((ins, i) => {
              const cfg = insightTypeConfig[ins.type];
              const Icon = cfg.icon;
              return (
                <div key={ins.id} className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.text}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{ins.message}</p>
                      <p className="text-xs text-muted-foreground">{ins.detail}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">{ins.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Member Distribution */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Member Distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={tierDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {tierDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col gap-2">
              {loyaltyTiers.map(t => {
                const count = guestProfiles.filter(g => g.tier === t.name).length;
                const pct = Math.round((count / guestProfiles.length) * 100);
                return (
                  <div key={t.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tierColors[t.name] }} />
                    <span className="text-xs font-medium text-foreground flex-1">{t.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                    <div className="w-16 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tierColors[t.name] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

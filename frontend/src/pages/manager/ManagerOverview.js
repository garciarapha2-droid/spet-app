import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Flame, ArrowUpRight, ArrowDownRight, TrendingUp, ChevronRight,
  AlertTriangle, Lightbulb, Star, Users as UsersIcon
} from 'lucide-react';
import {
  quickStats, topSellingItems, hourlyRevenueData,
  staffPerformance, tableInsights, riskAlerts, suggestions
} from '../../data/managerData';
import { smartInsights } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const typeConfig = {
  critical: { bg: 'bg-[hsl(var(--danger)_/_0.08)]', border: 'border-[hsl(var(--danger)_/_0.2)]', text: 'text-[hsl(var(--danger))]', icon: AlertTriangle },
  opportunity: { bg: 'bg-[hsl(var(--success)_/_0.08)]', border: 'border-[hsl(var(--success)_/_0.2)]', text: 'text-[hsl(var(--success))]', icon: TrendingUp },
  performance: { bg: 'bg-[hsl(var(--primary)_/_0.08)]', border: 'border-[hsl(var(--primary)_/_0.2)]', text: 'text-[hsl(var(--primary))]', icon: Star },
  action: { bg: 'bg-[hsl(var(--warning)_/_0.08)]', border: 'border-[hsl(var(--warning)_/_0.2)]', text: 'text-[hsl(var(--warning))]', icon: Lightbulb },
};

function SmartInsightsHero() {
  const heroInsight = smartInsights[0];
  const secondaryInsights = smartInsights.slice(1);
  const [expandedId, setExpandedId] = useState(null);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const heroType = typeConfig[heroInsight.type];
  const HeroIcon = heroType.icon;

  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
      {/* Hero Card */}
      <div className={`rounded-xl border p-5 mb-4 ${heroType.bg} ${heroType.border}`} data-testid="smart-insights-hero">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`h-4 w-4 ${heroType.text}`} />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Smart Insights</span>
            </div>
            <p className="text-xl font-bold text-foreground mb-1">{heroInsight.message}</p>
            <button onClick={() => setHeroExpanded(!heroExpanded)} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Why?
            </button>
            <AnimatePresence>
              {heroExpanded && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-sm text-muted-foreground mt-1">
                  {heroInsight.detail}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="text-right ml-4">
            <p className="text-3xl font-black tabular-nums text-foreground">{heroInsight.metric}</p>
            {heroInsight.trend === 'up' && (
              <span className="flex items-center justify-end gap-0.5 text-xs font-medium text-[hsl(var(--danger))]">
                <ArrowUpRight className="h-3 w-3" /> {heroInsight.trendValue}
              </span>
            )}
            {heroInsight.trend === 'down' && (
              <span className="flex items-center justify-end gap-0.5 text-xs font-medium text-[hsl(var(--success))]">
                <ArrowDownRight className="h-3 w-3" /> {heroInsight.trendValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {secondaryInsights.map((insight, i) => {
          const cfg = typeConfig[insight.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={insight.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.04 }}
              className={`rounded-xl border p-4 cursor-pointer transition-transform hover:scale-[1.01] ${cfg.bg} ${cfg.border}`}
              onClick={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
              data-testid={`insight-card-${insight.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Icon className={`h-4 w-4 mb-1.5 ${cfg.text}`} />
                  <p className="text-sm font-semibold text-foreground">{insight.message}</p>
                  <AnimatePresence>
                    {expandedId === insight.id && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-xs text-muted-foreground mt-1">
                        {insight.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="text-right ml-3">
                  <p className="text-lg font-bold tabular-nums text-foreground">{insight.metric}</p>
                  {insight.trendValue && (
                    <span className={`text-[10px] font-semibold ${insight.trend === 'up' ? cfg.text : 'text-muted-foreground'}`}>
                      {insight.trendValue}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ManagerOverview() {
  return (
    <div className="space-y-6" data-testid="manager-overview">
      <SmartInsightsHero />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            data-testid={`quick-stat-${i}`}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
            {stat.delta && <p className="text-xs font-medium text-[hsl(var(--success))]">{stat.delta}</p>}
            {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Top Performance + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Selling */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Top Performance</p>
          <div className="space-y-2">
            {topSellingItems.map((item, i) => (
              <div key={item.rank} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  item.rank === 1 ? 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'
                }`}>
                  {item.rank}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">{item.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{item.orders} sold</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">${item.revenue}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Revenue by Hour Chart */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="lg:col-span-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid="revenue-chart">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Revenue by Hour</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAECEF" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Staff + Table Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff Insights */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Staff Insights</p>
          <div className="space-y-2.5">
            {staffPerformance.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  s.isTopPerformer ? 'ring-2 ring-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'
                }`}>
                  {s.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    {s.isTopPerformer && <Star className="h-3 w-3 text-[hsl(var(--warning))]" fill="hsl(var(--warning))" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{s.tablesHandled} tables</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">${s.revenue}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Table Insights */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Table Insights</p>
          <div className="space-y-2">
            {tableInsights.map((t, i) => (
              <div key={t.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  <span className="text-xs text-muted-foreground">Avg {t.avg}</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[hsl(var(--primary))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.value / 70) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.value} tables</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk Alerts + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Alerts */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Risk Alerts</p>
          <div className="space-y-2">
            {riskAlerts.map((a, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.04 }}
                className={`rounded-lg border p-3 ${
                  a.type === 'danger'
                    ? 'border-[hsl(var(--danger)_/_0.2)] bg-[hsl(var(--danger)_/_0.05)]'
                    : 'border-[hsl(var(--warning)_/_0.2)] bg-[hsl(var(--warning)_/_0.05)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                    a.type === 'danger' ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--warning))]'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.message}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Suggestions</p>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.03 }}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors group cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  s.impact === 'high' ? 'bg-[hsl(var(--success))]' : s.impact === 'medium' ? 'bg-[hsl(var(--warning))]' : 'bg-muted-foreground'
                }`} />
                <p className="text-sm text-foreground flex-1">{s.message}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

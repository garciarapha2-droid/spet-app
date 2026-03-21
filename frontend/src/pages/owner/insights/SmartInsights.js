import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, AlertTriangle, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { ownerInsights } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const catConfig = {
  critical: { icon: AlertTriangle, color: 'text-[hsl(var(--danger))]', bg: 'bg-[hsl(var(--danger)_/_0.1)]', border: 'border-[hsl(var(--danger)_/_0.3)]', badge: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
  attention: { icon: Target, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning)_/_0.1)]', border: 'border-[hsl(var(--warning)_/_0.3)]', badge: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  opportunity: { icon: Lightbulb, color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success)_/_0.1)]', border: 'border-[hsl(var(--success)_/_0.3)]', badge: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' },
  growth: { icon: TrendingUp, color: 'text-[hsl(var(--primary))]', bg: 'bg-[hsl(var(--primary)_/_0.1)]', border: 'border-[hsl(var(--primary)_/_0.3)]', badge: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]' },
};

export default function SmartInsights() {
  const [filter, setFilter] = useState('all');
  const categories = ['all', 'critical', 'attention', 'opportunity', 'growth'];
  const filtered = ownerInsights.filter(i => filter === 'all' || i.category === filter);

  return (
    <div className="flex flex-col gap-6" data-testid="smart-insights">
      {/* Category KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical', count: ownerInsights.filter(i => i.category === 'critical').length, color: 'text-[hsl(var(--danger))]' },
          { label: 'Attention', count: ownerInsights.filter(i => i.category === 'attention').length, color: 'text-[hsl(var(--warning))]' },
          { label: 'Opportunity', count: ownerInsights.filter(i => i.category === 'opportunity').length, color: 'text-[hsl(var(--success))]' },
          { label: 'Growth', count: ownerInsights.filter(i => i.category === 'growth').length, color: 'text-[hsl(var(--primary))]' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center" data-testid={`insight-kpi-${kpi.label.toLowerCase()}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${kpi.color}`}>{kpi.count}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] p-[3px] rounded-full w-fit">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${filter === c ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`insight-filter-${c}`}>{c}</button>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="flex flex-col gap-4">
        {filtered.map((ins, i) => {
          const cfg = catConfig[ins.category];
          const Icon = cfg.icon;
          return (
            <motion.div key={ins.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.04 }}
              className={`rounded-xl border-2 p-5 ${cfg.border} bg-[hsl(var(--card))] transition-all hover:shadow-sm`}
              data-testid={`insight-card-${ins.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-[18px] w-[18px] ${cfg.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{ins.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${cfg.badge}`}>{ins.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ins.detail}</p>
                </div>
                <span className="text-lg font-bold text-foreground tabular-nums shrink-0">{ins.metric}</span>
              </div>
              {ins.cta && (
                <div className="mt-3 flex justify-end">
                  <button className="flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-opacity" data-testid={`insight-cta-${ins.id}`}>
                    {ins.cta} <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

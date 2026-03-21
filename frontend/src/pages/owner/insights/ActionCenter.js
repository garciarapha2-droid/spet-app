import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, ChevronRight, CheckCircle2, Clock, Circle } from 'lucide-react';
import { ownerActions } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const impactBadge = { high: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]', medium: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]', low: 'bg-[hsl(var(--muted))] text-muted-foreground' };
const statusIcon = { todo: Circle, in_progress: Clock, done: CheckCircle2 };
const statusColor = { todo: 'text-muted-foreground', in_progress: 'text-[hsl(var(--warning))]', done: 'text-[hsl(var(--success))]' };

const todoCount = ownerActions.filter(a => a.status === 'todo').length;
const inProgressCount = ownerActions.filter(a => a.status === 'in_progress').length;
const doneCount = ownerActions.filter(a => a.status === 'done').length;

export default function ActionCenter() {
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'todo', 'in_progress', 'done'];
  const filtered = ownerActions.filter(a => filter === 'all' || a.status === filter).sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 };
    return o[a.impact] - o[b.impact];
  });

  return (
    <div className="space-y-6" data-testid="action-center">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'To Do', value: todoCount, color: 'text-muted-foreground' },
          { label: 'In Progress', value: inProgressCount, color: 'text-[hsl(var(--warning))]' },
          { label: 'Done', value: doneCount, color: 'text-[hsl(var(--success))]' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center" data-testid={`action-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] p-[3px] rounded-full w-fit">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`action-filter-${f}`}>{f.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        {filtered.map((a, i) => {
          const StatusIcon = statusIcon[a.status];
          return (
            <motion.div key={a.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.04 }}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm transition-all"
              data-testid={`action-card-${a.id}`}
            >
              <div className="flex items-start gap-3">
                <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${statusColor[a.status]}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{a.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${impactBadge[a.impact]}`}>{a.impact}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.explanation}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Est. Revenue: <span className="font-semibold text-[hsl(var(--success))]">{a.estimatedRevenue}</span></span>
                    <span>Time: {a.timeToExecute}</span>
                  </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity shrink-0" data-testid={`action-cta-${a.id}`}>
                  {a.cta} <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

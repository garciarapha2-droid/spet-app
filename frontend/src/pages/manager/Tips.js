import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { tipRecords, operationalStaff } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

export default function Tips() {
  const staffTips = operationalStaff
    .map(s => ({ ...s, totalTips: tipRecords.filter(t => t.server === s.name).reduce((sum, t) => sum + t.tipAmount, 0) }))
    .sort((a, b) => b.totalTips - a.totalTips);

  return (
    <div className="flex flex-col gap-6" data-testid="tips-page">
      {/* Staff Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {staffTips.map((s, i) => (
          <motion.div
            key={s.id}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            className={`rounded-xl border p-4 text-center ${
              i === 0
                ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary)_/_0.3)] border-[hsl(var(--primary)_/_0.3)]'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
            }`}
            data-testid={`staff-tip-card-${s.id}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2 ${
              i === 0 ? 'bg-[hsl(var(--primary)_/_0.2)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'
            }`}>
              {s.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm font-medium text-foreground">{s.name.split(' ')[0]}</span>
              {i === 0 && <Star className="h-3 w-3 text-[hsl(var(--warning))]" fill="hsl(var(--warning))" />}
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">${s.totalTips}</p>
            <p className="text-xs text-muted-foreground">{s.tablesHandled} tables</p>
          </motion.div>
        ))}
      </div>

      {/* Tip Details Table */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Tip Details</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              {['Server', 'Guest', 'Tab #', 'Total Spent', 'Tip', '%', 'Time', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tipRecords.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.03 }}
                className="border-b border-[hsl(var(--border)_/_0.5)] hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors"
              >
                <td className="px-4 py-2.5 text-sm font-medium text-foreground">{t.server}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{t.guestName}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{t.tabNumber}</td>
                <td className="px-4 py-2.5 text-sm text-foreground tabular-nums">${t.totalSpent}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-[hsl(var(--success))] tabular-nums">${t.tipAmount}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">{t.tipPercent}%</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{t.time}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{t.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

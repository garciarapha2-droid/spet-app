import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain } from 'lucide-react';
import { shiftKpis, dayPerformance, revenueCostChart, operationalStaff } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

export default function ShiftOperations() {
  return (
    <div className="flex flex-col gap-6" data-testid="shift-operations-page">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {shiftKpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            data-testid={`shift-kpi-${i}`}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
            {kpi.delta && <p className="text-xs font-medium text-[hsl(var(--success))]">{kpi.delta}</p>}
          </motion.div>
        ))}
      </div>

      {/* Staff Earnings */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Staff Earnings</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              {['Name', 'Role', '$/hr', 'Hours', 'Wages', 'Tips', 'Total'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operationalStaff.map((s, i) => {
              const wages = s.hourlyRate * s.hoursWorked;
              const total = wages + s.tips;
              return (
                <tr key={s.id} className="border-b border-[hsl(var(--border)_/_0.5)] hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                  <td className="px-4 py-2.5 text-sm font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground capitalize">{s.role}</td>
                  <td className="px-4 py-2.5 text-sm text-foreground tabular-nums">${s.hourlyRate}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">{s.hoursWorked}h</td>
                  <td className="px-4 py-2.5 text-sm text-foreground tabular-nums">${wages}</td>
                  <td className="px-4 py-2.5 text-sm text-[hsl(var(--success))] tabular-nums">${s.tips}</td>
                  <td className="px-4 py-2.5 text-sm font-bold text-foreground tabular-nums">${total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Day Performance History */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Day Performance (7-day)</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              {['Date', 'Day', 'Revenue', 'Staff Cost', 'Tables', 'Tabs', 'Result', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dayPerformance.map((d, i) => (
              <tr key={d.date} className="border-b border-[hsl(var(--border)_/_0.5)] hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                <td className="px-4 py-2.5 text-sm text-muted-foreground">{d.date}</td>
                <td className="px-4 py-2.5 text-sm font-medium text-foreground">{d.day}</td>
                <td className="px-4 py-2.5 text-sm text-foreground tabular-nums">${d.revenue.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">${d.staffCost.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">{d.tables}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">{d.tabs}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-foreground tabular-nums">${d.result.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    d.status === 'positive' ? 'bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--danger)_/_0.15)] text-[hsl(var(--danger))]'
                  }`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Revenue vs Cost Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid="revenue-cost-chart">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Revenue vs Staff Cost</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenueCostChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAECEF" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="staffCost" fill="#EF4444" radius={[4, 4, 0, 0]} name="Staff Cost" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* AI Operations Partner */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--primary)_/_0.2)] bg-[hsl(var(--primary)_/_0.05)] p-5" data-testid="ai-partner">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5 text-[hsl(var(--primary))]" />
          <p className="text-base font-semibold text-foreground">AI Operations Partner</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Am I overstaffed?', 'Cost per table?', 'How to improve margins?', 'Analyze this shift'].map(q => (
            <button
              key={q}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)_/_0.2)] transition-colors"
              data-testid={`ai-question-${q.toLowerCase().replace(/[^a-z]/g, '-')}`}
            >
              {q}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

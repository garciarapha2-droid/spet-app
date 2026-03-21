import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { hourlyRevenueData } from '../../data/managerData';
import { menuItems } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

export default function ReportsFinance() {
  const [period, setPeriod] = useState('Today');

  const sortedItems = useMemo(() =>
    [...menuItems].sort((a, b) => b.revenue - a.revenue),
    []
  );

  return (
    <div className="flex flex-col gap-6" data-testid="reports-finance-page">
      {/* Period Filters */}
      <motion.div {...fadeUp} className="flex items-center gap-1.5">
        {['Today', 'Week', 'Month'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === p
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`period-filter-${p.toLowerCase()}`}
          >
            {p}
          </button>
        ))}
      </motion.div>

      {/* Sales by Hour Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid="sales-hour-chart">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Sales by Hour</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={hourlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAECEF" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Sales by Item Table */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Sales by Item</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              {['#', 'Item', 'Category', 'Qty Sold', 'Revenue', 'Cost', 'Margin'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((m, i) => {
              const margin = ((m.price - m.cost) / m.price * 100).toFixed(0);
              const marginColor = margin > 70 ? 'text-[hsl(var(--success))]' : margin > 50 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--danger))]';
              return (
                <tr key={m.id} className="border-b border-[hsl(var(--border)_/_0.5)] hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-foreground">{m.name}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{m.category}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">{m.quantitySold}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-foreground tabular-nums">${m.revenue}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">${m.cost}</td>
                  <td className={`px-4 py-2.5 text-sm font-semibold tabular-nums ${marginColor}`}>{margin}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

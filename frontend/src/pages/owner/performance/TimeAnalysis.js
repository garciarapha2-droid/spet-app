import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Flame, TrendingDown, Clock } from 'lucide-react';
import { hourlyRevenue, dayOfWeekRevenue } from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E6E8EC',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    color: '#111827'
  }
};

/* ── Derived data ── */
const sortedHours = [...hourlyRevenue].sort((a, b) => b.revenue - a.revenue);
const peakHours = sortedHours.slice(0, 4);
const deadHours = [...hourlyRevenue].sort((a, b) => a.revenue - b.revenue).slice(0, 4);

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

export default function TimeAnalysis() {
  const [period, setPeriod] = useState('Weekly');

  const kpis = [
    { label: 'Peak Hour', value: '9 PM', sub: '$6,400 revenue', icon: Flame },
    { label: 'Peak Day', value: 'Saturday', sub: '$9,800 revenue', icon: Flame },
    { label: 'Dead Hours', value: '4', sub: 'Under $1K each', icon: TrendingDown },
    { label: 'Avg / Hour', value: '$2,697', sub: 'across all hours', icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="time-analysis">

      {/* 2. Period Filter */}
      <div className="flex justify-end mb-[-8px]">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${
                period === p
                  ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
              data-testid={`period-${p.toLowerCase()}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4 flex flex-col gap-1"
            data-testid={`time-kpi-${i}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
            <span className="text-xs font-medium text-[hsl(var(--primary))]">{kpi.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* 4. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4a. Revenue by Hour */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-by-hour">
          <SectionHeader icon={Clock} title="Revenue by Hour" subtitle="Peak vs dead hours" />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyRevenue}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                  tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground italic mt-2">2-5 PM is underperforming — consider happy hour pricing to boost afternoon traffic</p>
        </motion.div>

        {/* 4b. Revenue by Day */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-by-day">
          <SectionHeader icon={Flame} title="Revenue by Day" subtitle="Weekly performance pattern" />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekRevenue}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground italic mt-2">Sat generates 2.4x more than Mon — weekend programming is working</p>
        </motion.div>
      </div>

      {/* 5. Peak vs Dead Hours */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="peak-dead-hours">
        <SectionHeader icon={Flame} title="Peak vs Dead Hours" subtitle="Opportunity map" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Peak */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--success))] font-semibold mb-2">PEAK HOURS</p>
            <div className="flex flex-col gap-1.5">
              {peakHours.map(h => (
                <div key={h.hour} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--success)_/_0.05)] border border-[hsl(var(--success)_/_0.1)]">
                  <span className="text-sm font-medium text-foreground">{h.hour}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground tabular-nums">${h.revenue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(h.revenue / 40)} guests</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Dead */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--danger))] font-semibold mb-2">DEAD HOURS</p>
            <div className="flex flex-col gap-1.5">
              {deadHours.map(h => (
                <div key={h.hour} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--danger)_/_0.05)] border border-[hsl(var(--danger)_/_0.1)]">
                  <span className="text-sm font-medium text-foreground">{h.hour}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground tabular-nums">${h.revenue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(h.revenue / 40)} guests</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

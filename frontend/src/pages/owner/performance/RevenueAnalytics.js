import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, Clock, Building2, ArrowUpRight, ArrowDownRight,
  Zap, Trophy
} from 'lucide-react';
import { dailyRevenueTrend, hourlyRevenue, ownerVenues } from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E6E8EC',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
  }
};

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

const scopes = ['Company', 'Venue', 'Night / Event'];
const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

const venueRevenueData = ownerVenues.map(v => ({
  name: v.name,
  revenue: v.revenue
}));

export default function RevenueAnalytics() {
  const [scope, setScope] = useState('Company');
  const [period, setPeriod] = useState('Monthly');

  const kpis = [
    { label: 'Total (30D)', value: '$178K', delta: -4.2, icon: DollarSign },
    { label: 'Avg Daily', value: '$5.9K', delta: 2.1, icon: TrendingUp },
    { label: 'Peak Hour', value: '9PM', sub: '$6,400', icon: Zap },
    { label: 'Top Category', value: 'Cocktails', delta: 24, icon: Trophy },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="revenue-analytics">

      {/* Controls */}
      <motion.div {...fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        {/* Scope Selector */}
        <div className="rounded-full border border-border bg-[hsl(var(--card))] inline-flex gap-0" data-testid="scope-selector">
          {scopes.map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-4 py-1.5 text-xs font-medium tracking-wide rounded-full transition-colors ${
                scope === s
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`scope-${s.toLowerCase().replace(/[^a-z]/g, '-')}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="rounded-full border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] inline-flex shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]" data-testid="period-filter">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${
                period === p
                  ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
              data-testid={`rev-period-${p.toLowerCase()}`}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Context Label */}
      <div className="flex items-center gap-2 mb-[-8px]" data-testid="context-label">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">All Venues</span>
        <span className="text-xs text-muted-foreground">&middot; today</span>
      </div>

      {/* 1. KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="kpi-grid">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4"
            data-testid={`rev-kpi-${kpi.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
            {kpi.delta !== undefined && (
              <div className={`flex items-center gap-0.5 mt-0.5 ${kpi.delta >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                {kpi.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="text-xs font-medium">{kpi.delta > 0 ? '+' : ''}{kpi.delta}%</span>
              </div>
            )}
            {kpi.sub && (
              <span className="text-xs text-muted-foreground">{kpi.sub}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* 2. Revenue Trend (LineChart) */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-trend">
        <SectionHeader icon={TrendingUp} title="Revenue Trend" subtitle="Last 30 days" />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenueTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, '']} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground italic mt-3 flex items-center gap-1.5">
          <span className="text-amber-500">&#9888;</span>
          Revenue dipped mid-month — correlates with reduced weekend event programming
        </p>
      </motion.div>

      {/* 3. Revenue by Hour + Revenue by Venue (2-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3a. Revenue by Hour */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-by-hour">
          <SectionHeader icon={Clock} title="Revenue by Hour" subtitle="Today's distribution" />
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
                />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 3b. Revenue by Venue (Horizontal) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="revenue-by-venue">
          <SectionHeader icon={TrendingUp} title="Revenue by Venue" subtitle="Current month" />
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueRevenueData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

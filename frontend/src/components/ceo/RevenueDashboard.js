import React, { useState, useEffect } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, BarChart3 } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, ChartTooltip, MiniStat, EmptyChart } from './shared';

export default function RevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getRevenueDetailed()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load revenue'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const m = data?.metrics || {};
  const charts = data?.charts || {};

  return (
    <div data-testid="ceo-revenue">
      <PageHeader title="Revenue" subtitle="MRR breakdown, trends, and cash flow analysis" />

      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="MRR" value={`$${(m.mrr || 0).toLocaleString()}`} icon={DollarSign} color="#059669" trend={m.mrr_growth_pct} size="lg" />
        <MetricCard label="ARR" value={`$${(m.arr || 0).toLocaleString()}`} icon={TrendingUp} color="#3b82f6" subtitle="Annual Run Rate" />
        <MetricCard label="Net New MRR" value={`$${(m.net_new_mrr || 0).toLocaleString()}`} icon={ArrowUpRight} color={m.net_new_mrr >= 0 ? '#10b981' : '#ef4444'} />
        <MetricCard label="Net Cash Flow" value={`$${(m.net_cash_flow || 0).toLocaleString()}`} icon={BarChart3} color="#8b5cf6" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Expansion MRR" value={`$${(m.expansion_mrr || 0).toLocaleString()}`} icon={TrendingUp} color="#10b981" />
        <MetricCard label="Contraction MRR" value={`$${(m.contraction_mrr || 0).toLocaleString()}`} icon={TrendingDown} color="#f59e0b" />
        <MetricCard label="Churned MRR" value={`$${(m.churned_mrr || 0).toLocaleString()}`} icon={TrendingDown} color="#ef4444" />
        <MetricCard label="Previous MRR" value={`$${(m.prev_mrr || 0).toLocaleString()}`} icon={DollarSign} color="#94a3b8" subtitle="Last month" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Daily Revenue (30 days) */}
        <ChartCard title="Revenue — Last 30 Days" subtitle="Daily revenue and profit trend">
          {charts.daily_revenue?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.daily_revenue}>
                <defs>
                  <linearGradient id="dailyRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#dailyRevGrad)" dot={false} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={BarChart3} />}
        </ChartCard>

        {/* MRR Breakdown (12 months) */}
        <ChartCard title="MRR Breakdown — 12 Months" subtitle="New, expansion, and churned MRR">
          {charts.monthly_mrr?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.monthly_mrr} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="new_mrr" name="New MRR" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="expansion_mrr" name="Expansion" fill="#10b981" stackId="a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="churned_mrr" name="Churned" fill="#ef4444" radius={[0, 0, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={BarChart3} />}
          <div className="flex items-center justify-center gap-5 mt-2 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />New</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Expansion</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Churned</span>
          </div>
        </ChartCard>
      </div>

      {/* Cash Flow */}
      <ChartCard title="Cash Flow Trend" subtitle="Net cash flow over time">
        {charts.cash_flow?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.cash_flow}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cash_flow" name="Cash Flow" stroke="#8b5cf6" strokeWidth={2} fill="url(#cashGrad)" dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart icon={DollarSign} />}
      </ChartCard>
    </div>
  );
}

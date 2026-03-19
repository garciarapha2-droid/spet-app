import React, { useState, useEffect } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { TrendingUp, Target, Zap, Users, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, ChartTooltip, EmptyChart } from './shared';

export default function GrowthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getGrowthMetrics()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load growth metrics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const m = data?.metrics || {};
  const charts = data?.charts || {};

  return (
    <div data-testid="ceo-growth">
      <PageHeader title="Growth" subtitle="Unit economics, lifetime value, and customer acquisition metrics" />

      {/* Hero Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Customer LTV" value={`$${(m.ltv || 0).toLocaleString()}`} icon={DollarSign} color="#8b5cf6" size="lg" subtitle="Avg. customer lifetime value" />
        <MetricCard label="CAC" value={`$${(m.cac || 0).toLocaleString()}`} icon={Target} color="#f59e0b" subtitle="Customer acquisition cost" />
        <MetricCard label="LTV / CAC" value={`${m.ltv_cac_ratio || 0}x`} icon={Zap} color={m.ltv_cac_ratio >= 3 ? '#16a34a' : '#ef4444'} subtitle={m.ltv_cac_ratio >= 3 ? 'Strong ratio (>3x)' : 'Needs improvement (<3x)'} />
        <MetricCard label="Payback Period" value={`${m.payback_months || 0} mo`} icon={Clock} color="#06b6d4" subtitle="Time to recover CAC" />
      </div>

      {/* Secondary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="ARPU" value={`$${(m.arpu || 0).toLocaleString()}`} icon={DollarSign} color="#3b82f6" />
        <MetricCard label="New Customers This Month" value={m.new_customers_this_month || 0} icon={Users} color="#10b981" />
        <MetricCard label="Avg. Lifetime" value={`${m.avg_lifetime_months || 0} months`} icon={TrendingUp} color="#8b5cf6" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* LTV vs CAC */}
        <ChartCard title="LTV vs CAC" subtitle="Unit economics over time">
          {charts.ltv_vs_cac?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={charts.ltv_vs_cac}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="ltv" name="LTV" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="cac" name="CAC" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} strokeDasharray="6 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={BarChart3} />}
          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-1 rounded-full bg-purple-500" />LTV</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-1 rounded-full bg-amber-500 border border-dashed border-amber-300" />CAC</span>
          </div>
        </ChartCard>

        {/* Customer Growth */}
        <ChartCard title="New Customers" subtitle="Monthly customer acquisition">
          {charts.new_customers?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.new_customers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatValue={v => v} />} />
                <Bar dataKey="new_customers" name="New Customers" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {(charts.new_customers || []).map((e, i) => (
                    <Cell key={i} fill={i === charts.new_customers.length - 1 ? '#3b82f6' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={Users} />}
        </ChartCard>
      </div>

      {/* Churn Trend */}
      <ChartCard title="Churn Rate Trend" subtitle="Monthly churn rate percentage">
        {charts.churn_trend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.churn_trend}>
              <defs>
                <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip formatValue={v => `${v}%`} />} />
              <Area type="monotone" dataKey="churn_rate" name="Churn Rate" stroke="#ef4444" strokeWidth={2} fill="url(#churnGrad)" dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart icon={TrendingUp} />}
      </ChartCard>
    </div>
  );
}

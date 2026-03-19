import React, { useState, useEffect } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { Users, UserPlus, UserMinus, TrendingUp, DollarSign, BarChart3, Shield } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, ChartTooltip, EmptyChart } from './shared';

export default function CustomersDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getCustomerLifecycle()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load customer data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const m = data?.metrics || {};
  const charts = data?.charts || {};

  return (
    <div data-testid="ceo-customers">
      <PageHeader title="Customers" subtitle="Lifecycle analysis, retention, and revenue per customer" />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Paying Customers" value={m.total_customers || 0} icon={Users} color="#3b82f6" size="lg" />
        <MetricCard label="New This Month" value={m.new_this_month || 0} icon={UserPlus} color="#10b981" />
        <MetricCard label="Lost This Month" value={m.lost_this_month || 0} icon={UserMinus} color="#ef4444" />
        <MetricCard label="Net Gained" value={m.net_gained || 0} icon={TrendingUp} color={m.net_gained >= 0 ? '#16a34a' : '#ef4444'} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="Retention Rate" value={`${m.retention_rate || 0}%`} icon={Shield} color="#10b981" subtitle={m.retention_rate >= 90 ? 'Excellent' : 'Needs attention'} />
        <MetricCard label="Churn Rate" value={`${m.churn_rate || 0}%`} icon={TrendingUp} color={m.churn_rate > 5 ? '#ef4444' : '#10b981'} />
        <MetricCard label="Revenue / Customer" value={`$${(m.rev_per_customer || 0).toLocaleString()}`} icon={DollarSign} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Customer Growth */}
        <ChartCard title="Customer Growth" subtitle="Cumulative customer base over 12 months">
          {charts.customer_growth?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={charts.customer_growth}>
                <defs>
                  <linearGradient id="custGrowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatValue={v => v} />} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#custGrowGrad)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={Users} />}
        </ChartCard>

        {/* New vs Lost */}
        <ChartCard title="New vs Lost Customers" subtitle="Monthly acquisition vs churn">
          {charts.customer_growth?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.customer_growth} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatValue={v => v} />} />
                <Bar dataKey="new" name="New" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={Users} />}
          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />New</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Lost</span>
          </div>
        </ChartCard>
      </div>

      {/* Revenue Per Customer */}
      <ChartCard title="Revenue Per Customer" subtitle="Monthly ARPU trend">
        {charts.rev_per_customer?.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts.rev_per_customer}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="rev_per_customer" name="ARPU" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyChart icon={DollarSign} />}
      </ChartCard>
    </div>
  );
}

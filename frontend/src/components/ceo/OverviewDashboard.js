import React, { useState, useEffect } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, Users, Activity, Target, Zap,
  ArrowUpRight, ArrowDownRight, BarChart3, Percent
} from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, ChartTooltip, MiniStat, EmptyChart } from './shared';

export default function OverviewDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getOverviewMetrics()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const m = data?.metrics || {};
  const charts = data?.charts || {};

  return (
    <div data-testid="ceo-overview">
      <PageHeader title="Executive Overview" subtitle="Real-time snapshot of your SaaS business" />

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <MetricCard label="MRR" value={`$${(m.mrr || 0).toLocaleString()}`} icon={DollarSign} color="#059669" trend={m.growth_pct} subtitle="Monthly Recurring Revenue" />
        <MetricCard label="Net New MRR" value={`$${(m.net_new_mrr || 0).toLocaleString()}`} icon={TrendingUp} color={m.net_new_mrr >= 0 ? '#10b981' : '#ef4444'} />
        <MetricCard label="Active Customers" value={m.active_customers || 0} icon={Users} color="#3b82f6" />
        <MetricCard label="Churn Rate" value={`${m.churn_rate || 0}%`} icon={Activity} color={m.churn_rate > 5 ? '#ef4444' : '#10b981'} subtitle={m.churn_rate > 5 ? 'Above target' : 'Healthy'} />
        <MetricCard label="ARPU" value={`$${(m.arpu || 0).toLocaleString()}`} icon={Target} color="#8b5cf6" />
        <MetricCard label="LTV / CAC" value={`${m.ltv_cac_ratio || 0}x`} icon={Zap} color={m.ltv_cac_ratio >= 3 ? '#16a34a' : '#f59e0b'} subtitle={m.ltv_cac_ratio >= 3 ? 'Strong unit economics' : 'Needs improvement'} />
      </div>

      {/* Growth Banner */}
      <div className="bg-white border border-slate-200/70 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${m.growth_pct >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {m.growth_pct >= 0 ? <ArrowUpRight className="h-8 w-8 text-emerald-600" /> : <ArrowDownRight className="h-8 w-8 text-red-500" />}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Month-over-Month Growth</p>
              <p className={`text-4xl font-black tracking-tight ${m.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {m.growth_pct > 0 ? '+' : ''}{m.growth_pct || 0}%
              </p>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">ARR</p>
              <p className="text-xl font-bold text-slate-800">${(m.arr || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Revenue YTD</p>
              <p className="text-xl font-bold text-slate-800">${(m.revenue_ytd || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Today</p>
              <p className="text-xl font-bold text-emerald-600">${(m.revenue_today || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* MRR Growth Line */}
        <ChartCard title="MRR Growth" subtitle="Monthly recurring revenue trend">
          {charts.mrr_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={charts.mrr_trend}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" name="MRR" stroke="#10b981" strokeWidth={2.5} fill="url(#mrrGrad)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={BarChart3} message="MRR data will appear as revenue flows in" />}
        </ChartCard>

        {/* Customers Growth */}
        <ChartCard title="Customer Growth" subtitle="New signups over time">
          {charts.customer_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={charts.customer_trend}>
                <defs>
                  <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatValue={v => v} />} />
                <Area type="monotone" dataKey="value" name="Customers" stroke="#3b82f6" strokeWidth={2.5} fill="url(#custGrad)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={Users} message="Customer data will appear here" />}
        </ChartCard>
      </div>

      {/* Revenue Breakdown + Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Revenue Breakdown" subtitle="New MRR vs Expansion vs Churn" className="col-span-2">
          {charts.revenue_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.revenue_breakdown} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="new_mrr" name="New MRR" fill="#3b82f6" radius={[3, 3, 0, 0]} stackId="stack" />
                <Bar dataKey="expansion" name="Expansion" fill="#10b981" radius={[3, 3, 0, 0]} stackId="stack" />
                <Bar dataKey="churn" name="Churn" fill="#ef4444" radius={[0, 0, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={BarChart3} />}
          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />New</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Expansion</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Churn</span>
          </div>
        </ChartCard>

        {/* Quick Stats */}
        <ChartCard title="Quick Stats" subtitle="Key indicators">
          <div className="space-y-0">
            <MiniStat label="Total Leads" value={m.total_leads || 0} />
            <MiniStat label="Paid Leads" value={m.paid_leads || 0} color="#059669" />
            <MiniStat label="Total Users" value={m.total_users || 0} color="#3b82f6" />
            <MiniStat label="LTV" value={`$${(m.ltv || 0).toLocaleString()}`} color="#8b5cf6" />
            <MiniStat label="CAC" value={`$${(m.cac || 0).toLocaleString()}`} color="#f59e0b" />
            <MiniStat label="Revenue Today" value={`$${(m.revenue_today || 0).toLocaleString()}`} color="#059669" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { Users, UserPlus, Zap, Target, TrendingUp, BarChart3, Globe, Percent } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, ChartTooltip, EmptyChart, MiniStat } from './shared';

const FUNNEL_COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#22c55e'];
const SOURCE_COLORS = { signup: '#4f46e5', contact: '#0284c7', support: '#ea580c', direct: '#16a34a', referral: '#8b5cf6', organic: '#06b6d4' };

export default function MarketingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getMarketingFunnel()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load marketing'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const m = data?.metrics || {};
  const charts = data?.charts || {};
  const funnel = charts.funnel || [];
  const maxFunnel = Math.max(...funnel.map(f => f.value), 1);

  return (
    <div data-testid="ceo-marketing">
      <PageHeader title="Marketing" subtitle="Funnel analysis, conversion rates, and acquisition channels" />

      {/* Metrics */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <MetricCard label="Total Leads" value={m.total_leads || 0} icon={Users} color="#3b82f6" />
        <MetricCard label="Leads Today" value={m.leads_today || 0} icon={UserPlus} color="#10b981" />
        <MetricCard label="This Month" value={m.leads_this_month || 0} icon={Target} color="#8b5cf6" />
        <MetricCard label="Lead → Trial" value={`${m.lead_to_trial || 0}%`} icon={TrendingUp} color="#06b6d4" />
        <MetricCard label="Trial → Paid" value={`${m.trial_to_paid || 0}%`} icon={Zap} color="#f59e0b" />
        <MetricCard label="Qualified → Win" value={`${m.qualified_to_win || 0}%`} icon={Percent} color="#16a34a" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Sales Funnel */}
        <ChartCard title="Acquisition Funnel" subtitle="Lead progression through stages">
          <div className="space-y-1.5 mt-3">
            {funnel.map((f, i) => {
              const widthPct = Math.max((f.value / maxFunnel) * 100, 12);
              const prevVal = i > 0 ? funnel[i - 1].value : f.value;
              const dropOff = prevVal > 0 ? Math.round(((prevVal - f.value) / prevVal) * 100) : 0;
              return (
                <div key={f.stage} className="flex items-center gap-3" data-testid={`funnel-${f.stage.toLowerCase()}`}>
                  <span className="text-[10px] font-medium w-20 text-right text-slate-500">{f.stage}</span>
                  <div className="flex-1 relative">
                    <div
                      className="h-10 rounded-md flex items-center transition-all duration-700 mx-auto"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                        clipPath: i < funnel.length - 1 ? 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)' : undefined,
                      }}
                    >
                      <span className="text-white text-[12px] font-bold w-full text-center">{f.value}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 w-12">
                    {i > 0 && dropOff > 0 ? <span className="text-red-400">-{dropOff}%</span> : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Source Breakdown */}
        <ChartCard title="Traffic Sources" subtitle="Leads by acquisition channel">
          {charts.sources?.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={charts.sources} dataKey="count" nameKey="source" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {charts.sources.map((s, i) => (
                        <Cell key={i} fill={SOURCE_COLORS[s.source] || FUNNEL_COLORS[i % FUNNEL_COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2.5">
                {charts.sources.map((s, i) => {
                  const pct = m.total_leads > 0 ? Math.round((s.count / m.total_leads) * 100) : 0;
                  const c = SOURCE_COLORS[s.source] || FUNNEL_COLORS[i];
                  return (
                    <div key={s.source}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                          <span className="text-[11px] font-semibold text-slate-700 capitalize">{s.source}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">{s.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: c }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <EmptyChart icon={Globe} />}
        </ChartCard>
      </div>

      {/* Monthly Conversion */}
      <ChartCard title="Monthly Lead Capture & Conversion" subtitle="Leads captured vs converted over time">
        {charts.monthly_leads?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.monthly_leads} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatValue={v => v} />} />
              <Bar dataKey="leads" name="Captured" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart icon={BarChart3} />}
        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />Captured</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Converted</span>
        </div>
      </ChartCard>
    </div>
  );
}

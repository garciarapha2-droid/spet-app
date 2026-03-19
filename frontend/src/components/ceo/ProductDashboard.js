import React, { useState, useEffect } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { Layers, Zap, DollarSign, BarChart3, TrendingUp } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, EmptyChart, ChartTooltip } from './shared';

const MOD_COLORS = { pulse: '#ec4899', tap: '#3b82f6', table: '#10b981', kds: '#f97316' };

export default function ProductDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getModules()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load module data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const modules = data?.modules || [];
  const totalVenues = data?.total_venues || 0;

  const barData = modules.map(m => ({
    name: m.name, active: m.active, color: MOD_COLORS[m.key] || '#6366f1',
  }));

  const pieData = modules.map(m => ({
    name: m.name, value: m.active, color: MOD_COLORS[m.key] || '#6366f1',
  })).filter(m => m.value > 0);

  return (
    <div data-testid="ceo-product">
      <PageHeader title="Product / Module Adoption" subtitle={`${modules.length} modules across ${totalVenues} venues`} />

      {/* Module Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {modules.map(m => {
          const c = MOD_COLORS[m.key] || '#6366f1';
          return (
            <div key={m.key} className="bg-white border border-slate-200/70 rounded-xl p-5 hover:shadow-sm transition-all" data-testid={`module-${m.key}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: c + '12' }}>
                    <Layers className="h-5 w-5" style={{ color: c }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-slate-800">{m.name}</h3>
                    <p className="text-[10px] text-slate-400">{m.active} of {totalVenues} venues</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: c }}>{m.adoption_pct}%</p>
                  <p className="text-[9px] text-slate-400">Adoption</p>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.adoption_pct}%`, backgroundColor: c }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Bar Chart */}
        <ChartCard title="Venues per Module" subtitle="Active venue count by feature">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<ChartTooltip formatValue={v => `${v} venues`} />} />
                <Bar dataKey="active" name="Venues" radius={[0, 6, 6, 0]}>
                  {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart icon={BarChart3} />}
        </ChartCard>

        {/* Donut */}
        <ChartCard title="Module Distribution" subtitle="Share of venue usage">
          {pieData.length > 0 ? (
            <div className="flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3 pl-4">
                {pieData.map(m => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-[11px] font-semibold text-slate-600">{m.name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-slate-800">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart icon={Layers} />}
        </ChartCard>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ceoAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { AlertTriangle, Shield, ShieldAlert, AlertCircle, Activity, CheckCircle } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, DashboardSkeleton, EmptyChart, ChartTooltip } from './shared';

const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };

export default function RiskDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoAPI.getRiskDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load risk data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const m = data?.metrics || {};
  const alerts = data?.alerts || [];
  const sevBreakdown = data?.severity_breakdown || {};

  const sevData = Object.entries(sevBreakdown).filter(([, v]) => v > 0).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: SEVERITY_COLORS[k] || '#94a3b8',
  }));

  // Risk score gauge
  const score = m.risk_score || 0;
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 80 ? 'Low Risk' : score >= 50 ? 'Medium Risk' : 'High Risk';

  return (
    <div data-testid="ceo-risk">
      <PageHeader title="Risk & Security" subtitle="Incident tracking, risk assessment, and system health" />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Risk Score" value={`${score}/100`} icon={Shield} color={scoreColor} size="lg" subtitle={scoreLabel} />
        <MetricCard label="Total Incidents" value={m.total_incidents || 0} icon={AlertTriangle} color="#f59e0b" />
        <MetricCard label="Critical" value={m.critical_incidents || 0} icon={ShieldAlert} color="#ef4444" />
        <MetricCard label="Open Tasks" value={m.open_tasks || 0} icon={Activity} color="#3b82f6" subtitle={`${m.nodes || 0} nodes monitored`} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Risk Score Gauge */}
        <ChartCard title="Risk Assessment">
          <div className="flex flex-col items-center py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeDasharray={`${score * 3.14} ${314 - score * 3.14}`}
                  strokeDashoffset="78.5" strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color: scoreColor }}>{score}</span>
                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Score</span>
              </div>
            </div>
            <p className="text-[12px] font-semibold mt-3" style={{ color: scoreColor }}>{scoreLabel}</p>
          </div>
        </ChartCard>

        {/* Severity Breakdown Donut */}
        <ChartCard title="Severity Breakdown" subtitle="Incidents by severity level">
          {sevData.length > 0 ? (
            <div className="flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sevData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {sevData.map((e, i) => <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3 pl-2">
                {sevData.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] font-semibold text-slate-600">{s.name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
              <p className="text-[12px] text-emerald-600 font-semibold">No incidents</p>
            </div>
          )}
        </ChartCard>

        {/* Incident Types */}
        <ChartCard title="Incident Types" subtitle="Breakdown by category">
          {alerts.length > 0 ? (
            <div className="space-y-0 mt-1">
              {(() => {
                const types = {};
                alerts.forEach(a => { types[a.type] = (types[a.type] || 0) + 1; });
                return Object.entries(types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-[11px] text-slate-600 capitalize">{type.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(count / alerts.length) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
              <p className="text-[12px] text-emerald-600 font-semibold">All clear</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Alert List */}
      <ChartCard title="Active Alerts" subtitle={`${alerts.length} alerts detected`}>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const isCritical = a.severity === 'critical';
              return (
                <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all hover:shadow-sm ${isCritical ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/20'}`}
                  data-testid={`alert-${i}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">{a.message}</p>
                    <p className="text-[10px] text-slate-400">{a.type?.replace(/_/g, ' ')} &middot; {a.venue_name}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{a.severity}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-[14px] font-semibold text-emerald-700">All systems healthy</p>
            <p className="text-[11px] text-slate-400 mt-1">No risk alerts at this time</p>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

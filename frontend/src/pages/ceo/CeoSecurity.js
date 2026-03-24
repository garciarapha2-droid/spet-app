import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from 'recharts';
import { KpiCard } from '../../components/ceo/KpiCard';
import { ChartCard } from '../../components/ceo/ChartCard';
import { PeriodFilter } from '../../components/ceo/PeriodFilter';
import { DrillDownSheet } from '../../components/ceo/DrillDownSheet';
import { CustomerDetailDialog } from '../../components/ceo/CustomerDetailDialog';
import { getCustomers, computeSecurityAlerts, computeRiskScore, computeModuleUsage } from '../../services/ceoService';

const severityConfig = {
  critical: { border: 'border-l-4 border-l-red-400 bg-red-400/5', badge: 'bg-red-400/10 text-red-400', icon: AlertCircle, iconColor: 'text-red-400' },
  warning: { border: 'border-l-4 border-l-amber-400 bg-amber-400/5', badge: 'bg-amber-400/10 text-amber-400', icon: AlertTriangle, iconColor: 'text-amber-400' },
  info: { border: 'border-l-4 border-l-blue-400 bg-blue-400/5', badge: 'bg-blue-400/10 text-blue-400', icon: Info, iconColor: 'text-blue-400' },
};

export default function CeoSecurity() {
  const [period, setPeriod] = useState('month');
  const [customers, setCustomers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [drill, setDrill] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadData = useCallback(async () => {
    const custs = await getCustomers();
    setCustomers(custs);
    const computed = await computeSecurityAlerts(custs);
    setAlerts(computed);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const riskScore = useMemo(() => computeRiskScore(alerts), [alerts]);
  const moduleUsage = useMemo(() => computeModuleUsage(customers), [customers]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;
  const venuesAtRisk = new Set(alerts.map(a => a.customer.id)).size;

  const riskLabel = riskScore <= 30 ? 'Low Risk' : riskScore <= 60 ? 'Moderate Risk' : 'High Risk';
  const riskColor = riskScore <= 30 ? '#1FAA6B' : riskScore <= 60 ? '#F59F00' : '#E03131';

  // Chart data
  const gaugeData = [{ value: riskScore, fill: riskColor }];
  const alertBreakdown = [
    { name: 'Critical', value: criticalCount, color: '#E03131' },
    { name: 'Warning', value: warningCount, color: '#F59F00' },
    { name: 'Info', value: infoCount, color: '#3B82F6' },
  ].filter(d => d.value > 0);

  const kpis = [
    { key: 'risk', icon: 'Shield', color: riskColor, value: `${riskScore}/100`, label: 'Risk Score', description: riskLabel },
    { key: 'totalAlerts', icon: 'AlertTriangle', color: '#F59F00', value: String(alerts.length), label: 'Total Alerts' },
    { key: 'critical', icon: 'AlertCircle', color: '#E03131', value: String(criticalCount), label: 'Critical' },
    { key: 'venues', icon: 'Users', color: '#3B82F6', value: String(venuesAtRisk), label: 'Venues At Risk' },
  ];

  const drillContent = () => {
    switch (drill) {
      case 'risk':
        return (
          <DrillDownSheet open title="Risk Breakdown" subtitle="Score composition by category" onClose={() => setDrill(null)}>
            <div className="space-y-3">
              {[{ label: 'Critical alerts', count: criticalCount, weight: 10 },
                { label: 'Warning alerts', count: warningCount, weight: 3 },
                { label: 'Info alerts', count: infoCount, weight: 1 }].map(r => (
                <div key={r.label} className="flex justify-between text-[13px] py-1.5">
                  <span className="text-foreground">{r.label} ({r.count}x weight {r.weight})</span>
                  <span className="font-medium tabular-nums">{r.count * r.weight} pts</span>
                </div>
              ))}
              <div className="border-t-2 border-border pt-3 flex justify-between">
                <span className="text-[14px] font-bold">Risk Score</span>
                <span className="text-[14px] font-bold tabular-nums">{riskScore}/100</span>
              </div>
            </div>
          </DrillDownSheet>
        );
      case 'totalAlerts':
        return (
          <DrillDownSheet open title="All Alerts" subtitle={`${alerts.length} alerts detected`} onClose={() => setDrill(null)} count={alerts.length}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alerts.map(a => (
                <div key={a.id} className="text-[13px] py-2 border-b border-border/50 last:border-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mr-2 ${severityConfig[a.severity].badge}`}>{a.severity}</span>
                  {a.title} — {a.customer.company}
                </div>
              ))}
            </div>
          </DrillDownSheet>
        );
      case 'critical':
        return (
          <DrillDownSheet open title="Critical Alerts" subtitle={`${criticalCount} critical issues`} onClose={() => setDrill(null)} count={criticalCount}>
            <div className="space-y-2">
              {alerts.filter(a => a.severity === 'critical').map(a => (
                <div key={a.id} className="text-[13px] py-2 border-b border-border/50 last:border-0">
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-muted-foreground">{a.description}</p>
                </div>
              ))}
            </div>
          </DrillDownSheet>
        );
      case 'venues':
        return (
          <DrillDownSheet open title="Venues At Risk" subtitle={`${venuesAtRisk} venues with active alerts`} onClose={() => setDrill(null)} count={venuesAtRisk}>
            <div className="space-y-2">
              {[...new Map(alerts.map(a => [a.customer.id, a.customer])).values()].map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{c.company}</p>
                    <p className="text-[12px] text-muted-foreground">{alerts.filter(a => a.customer.id === c.id).length} alerts</p>
                  </div>
                  <button onClick={() => { setDrill(null); setSelectedCustomer(c); }} className="text-[12px] text-primary hover:underline">View</button>
                </div>
              ))}
            </div>
          </DrillDownSheet>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="ceo-security">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-foreground">Security & Monitoring</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Platform health, usage alerts, and risk assessment</p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="security-kpis">
        {kpis.map(kpi => (
          <KpiCard key={kpi.key} icon={kpi.icon} color={kpi.color} value={kpi.value} label={kpi.label} description={kpi.description} onClick={() => setDrill(kpi.key)} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Assessment Gauge */}
        <ChartCard title="Risk Assessment" subtitle="Overall platform risk score">
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={gaugeData} barSize={12}>
                <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-20 text-center">
              <p className="text-[32px] font-bold text-foreground tabular-nums">{riskScore}</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: riskColor }}>Score</p>
            </div>
            <p className="text-[14px] font-medium mt-4" style={{ color: riskColor }}>{riskLabel}</p>
          </div>
        </ChartCard>

        {/* Alert Breakdown Donut */}
        <ChartCard title="Alert Breakdown" subtitle="By severity level">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={alertBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {alertBreakdown.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 -mt-2">
            {alertBreakdown.map(r => (
              <div key={r.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-[12px] text-muted-foreground">{r.name}: {r.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Module Usage Bar */}
        <ChartCard title="Module Usage" subtitle="Adoption % across customers">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moduleUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="module" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={70} />
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} formatter={v => [`${v}%`, 'Adoption']} />
              <Bar dataKey="percentage" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Active Alerts */}
      <div className="bg-card border border-border rounded-xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} data-testid="active-alerts">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Active Alerts</h3>
            <p className="text-[13px] text-muted-foreground">{alerts.length} alerts detected</p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`rounded-lg p-4 ${config.border} transition-all`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-medium text-foreground">{alert.title}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0 ${config.badge}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-[13px] text-foreground mt-0.5">{alert.description}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{alert.context}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(alert.customer)}
                    className="text-[12px] text-primary hover:underline flex items-center gap-1 flex-shrink-0 mt-1"
                    data-testid={`alert-view-${alert.id}`}
                  >
                    View Venue <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-downs */}
      {drillContent()}

      {/* Customer Detail */}
      <CustomerDetailDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdate={(updated) => {
          setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
          setSelectedCustomer(updated);
        }}
      />
    </div>
  );
}

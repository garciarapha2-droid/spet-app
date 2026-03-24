import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, PieChart, Pie, Cell } from 'recharts';
import { KpiCard } from '../../components/ceo/KpiCard';
import { PeriodFilter } from '../../components/ceo/PeriodFilter';
import { ChartCard, ListCard } from '../../components/ceo/ChartCard';
import { DrillDownSheet, CompanyListDrillDown, BreakdownDrillDown } from '../../components/ceo/DrillDownSheet';
import { overviewKpis, growthBanner, mrrGrowthData, customerGrowthData, revenueBreakdown, quickStats, mrrDrillDown, netNewMrrBreakdown, customers } from '../../data/ceoData';

export default function CeoOverview() {
  const [period, setPeriod] = useState('month');
  const [drill, setDrill] = useState(null);

  const handlePeriodChange = (p) => setPeriod(p);

  const drillDownContent = () => {
    switch (drill) {
      case 'mrr':
        return (
          <DrillDownSheet open title="MRR Breakdown — This Month" subtitle="All paying companies with their MRR contribution" onClose={() => setDrill(null)} count={mrrDrillDown.length}>
            <CompanyListDrillDown data={mrrDrillDown} />
          </DrillDownSheet>
        );
      case 'netNewMrr':
        return (
          <DrillDownSheet open title="Net New MRR — This Month" subtitle="Breakdown: new vs expansion vs contraction vs churned" onClose={() => setDrill(null)}>
            <BreakdownDrillDown
              items={[
                { label: 'New MRR', value: `$${netNewMrrBreakdown.newMrr.toLocaleString()}` },
                { label: '+ Expansion MRR', value: `$${netNewMrrBreakdown.expansion.toLocaleString()}` },
                { label: '- Contraction MRR', value: `$${netNewMrrBreakdown.contraction.toLocaleString()}`, negative: true },
                { label: '- Churned MRR', value: `$${netNewMrrBreakdown.churned}`, negative: true },
              ]}
              total={`$${netNewMrrBreakdown.net.toLocaleString()}`}
              totalLabel="Net New MRR"
            />
          </DrillDownSheet>
        );
      case 'activeCustomers':
        return (
          <DrillDownSheet open title="Active Customers — This Month" subtitle="Full list of active companies with plan, status, signup date" onClose={() => setDrill(null)} count={customers.filter(c => c.status === 'active').length}>
            <CompanyListDrillDown data={customers.filter(c => c.status === 'active').map(c => ({ company: c.company, plan: c.plan, mrr: c.mrr, status: c.status, since: c.signup }))} />
          </DrillDownSheet>
        );
      case 'churnRate':
        return (
          <DrillDownSheet open title="Churned Customers — This Month" subtitle="Customers who churned in this period" onClose={() => setDrill(null)} count={0}>
            <p className="text-[13px] text-muted-foreground text-center py-8">No data for this period</p>
          </DrillDownSheet>
        );
      case 'arpu':
        return (
          <DrillDownSheet open title="ARPU Distribution — This Month" subtitle="Revenue per user distribution" onClose={() => setDrill(null)}>
            <BreakdownDrillDown
              items={[
                { label: 'Enterprise avg.', value: '$517.43' },
                { label: 'Pro avg.', value: '$199.00' },
                { label: 'Starter avg.', value: '$49.00' },
              ]}
              total="$198.49"
              totalLabel="Overall ARPU"
            />
          </DrillDownSheet>
        );
      case 'ltvCac':
        return (
          <DrillDownSheet open title="LTV / CAC — This Month" subtitle="LTV breakdown by cohort, CAC breakdown by channel" onClose={() => setDrill(null)}>
            <BreakdownDrillDown
              items={[
                { label: 'Avg. Customer Lifetime', value: '14.2 mo' },
                { label: 'Avg. LTV', value: '$2,818' },
                { label: 'Avg. CAC', value: '$687' },
                { label: 'LTV / CAC Ratio', value: '4.1x' },
              ]}
            />
          </DrillDownSheet>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="ceo-overview">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] leading-[1.08] text-foreground">Executive Overview</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Real-time snapshot of your SaaS business</p>
        </div>
        <PeriodFilter period={period} onChange={handlePeriodChange} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" data-testid="overview-kpis">
        {overviewKpis.map(kpi => (
          <KpiCard key={kpi.key} icon={kpi.icon} color={kpi.color} value={kpi.value} label={kpi.label} description={kpi.description} trend={kpi.trend === 'up' ? 'up' : kpi.trend === 'down' ? 'down' : undefined} trendValue={kpi.trendValue} onClick={() => setDrill(kpi.key)} />
        ))}
      </div>

      {/* Growth Banner */}
      <div className="bg-card border border-border rounded-[12px] p-6 flex items-center justify-between" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} data-testid="growth-banner">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1FAA6B]/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#1FAA6B]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Month-over-month Growth</p>
            <p className="text-[36px] font-extrabold text-primary leading-none mt-1">{growthBanner.momGrowth}</p>
          </div>
        </div>
        <div className="flex gap-10">
          {[
            { label: 'ARR', value: growthBanner.arr },
            { label: 'Rev YTD', value: growthBanner.revenueYtd },
            { label: 'Today', value: growthBanner.today },
          ].map(m => (
            <div key={m.label} className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{m.label}</p>
              <p className="text-[20px] font-bold text-foreground mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="MRR Growth" subtitle="Monthly recurring revenue trend">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrGrowthData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} formatter={v => [`$${v.toLocaleString()}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#7C3AED" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Growth" subtitle="New signups over time">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={customerGrowthData}>
              <defs>
                <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
              <Area type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} fill="url(#custGrad)" dot={{ r: 3, fill: '#3B82F6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Breakdown" subtitle="By plan tier">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                {revenueBreakdown.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} formatter={v => [`$${v.toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 -mt-2">
            {revenueBreakdown.map(r => (
              <div key={r.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-[12px] text-muted-foreground">{r.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ListCard
          title="Quick Stats"
          subtitle="Key business metrics"
          items={quickStats.map(s => ({ label: s.label, value: s.value }))}
        />
      </div>

      {/* Drill-Down Modals */}
      {drillDownContent()}
    </div>
  );
}

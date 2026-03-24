import { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend } from 'recharts';
import { KpiCard } from '../../components/ceo/KpiCard';
import { PeriodFilter } from '../../components/ceo/PeriodFilter';
import { ChartCard } from '../../components/ceo/ChartCard';
import { DrillDownSheet, CompanyListDrillDown, BreakdownDrillDown } from '../../components/ceo/DrillDownSheet';
import { revenueKpisRow1, revenueKpisRow2, revenueLast30Days, mrrBreakdownMonthly, mrrDrillDown, netNewMrrBreakdown, customers } from '../../data/ceoData';

export default function CeoRevenue() {
  const [period, setPeriod] = useState('month');
  const [drill, setDrill] = useState(null);

  const drillContent = () => {
    switch (drill) {
      case 'mrr':
        return (
          <DrillDownSheet open title="MRR — Company Breakdown" subtitle="Company-by-company MRR contribution" onClose={() => setDrill(null)} count={mrrDrillDown.length}>
            <CompanyListDrillDown data={mrrDrillDown} />
          </DrillDownSheet>
        );
      case 'arr':
        return (
          <DrillDownSheet open title="ARR — Monthly Evolution" subtitle="Annual Run Rate evolution over time" onClose={() => setDrill(null)}>
            <BreakdownDrillDown items={[
              { label: 'Current MRR', value: '$7,741' },
              { label: 'MRR x 12', value: '$92,892' },
            ]} total="$92,892" totalLabel="Annual Run Rate" />
          </DrillDownSheet>
        );
      case 'netNewMrr':
        return (
          <DrillDownSheet open title="Net New MRR — Breakdown" subtitle="New + Expansion - Contraction - Churned" onClose={() => setDrill(null)}>
            <BreakdownDrillDown items={[
              { label: 'New MRR', value: `$${netNewMrrBreakdown.newMrr.toLocaleString()}` },
              { label: '+ Expansion', value: `$${netNewMrrBreakdown.expansion.toLocaleString()}` },
              { label: '- Contraction', value: `$${netNewMrrBreakdown.contraction.toLocaleString()}`, negative: true },
              { label: '- Churned', value: `$${netNewMrrBreakdown.churned}`, negative: true },
            ]} total={`$${netNewMrrBreakdown.net.toLocaleString()}`} totalLabel="Net New MRR" />
          </DrillDownSheet>
        );
      case 'netCashFlow':
        return (
          <DrillDownSheet open title="Net Cash Flow — Breakdown" subtitle="Cash in vs cash out by category" onClose={() => setDrill(null)}>
            <BreakdownDrillDown items={[
              { label: 'Revenue Received', value: '$7,741.00' },
              { label: '- Hosting & Infra', value: '$1,240.00', negative: true },
              { label: '- Payroll', value: '$980.00', negative: true },
              { label: '- Marketing', value: '$320.00', negative: true },
              { label: '- Other', value: '$169.35', negative: true },
            ]} total="$5,031.65" totalLabel="Net Cash Flow" />
          </DrillDownSheet>
        );
      case 'expansionMrr':
        return (
          <DrillDownSheet open title="Expansion MRR — Detail" subtitle="Which customers expanded, by how much" onClose={() => setDrill(null)}>
            <BreakdownDrillDown items={[
              { label: 'Nexus Global (addon)', value: '$225.00' },
              { label: 'Blue Wave Bar (Pro upgrade)', value: '$150.00' },
              { label: 'Sunset Terrace (seats)', value: '$120.00' },
              { label: 'Other expansions (11)', value: '$1,440.25' },
            ]} total="$1,935.25" totalLabel="Total Expansion" />
          </DrillDownSheet>
        );
      case 'contractionMrr':
        return (
          <DrillDownSheet open title="Contraction MRR — Detail" subtitle="Which customers contracted" onClose={() => setDrill(null)}>
            <BreakdownDrillDown items={[
              { label: 'Corner Pub (downgrade seats)', value: '$87.05', negative: true },
              { label: 'Jazz Corner (module removed)', value: '$150.00', negative: true },
              { label: 'Craft House (plan downgrade)', value: '$150.00', negative: true },
            ]} total="$387.05" totalLabel="Total Contraction" />
          </DrillDownSheet>
        );
      case 'churnedMrr':
        return (
          <DrillDownSheet open title="Churned MRR" subtitle="Churned customers list" onClose={() => setDrill(null)} count={0}>
            <p className="text-[13px] text-muted-foreground text-center py-8">No data for this period</p>
          </DrillDownSheet>
        );
      case 'previousMrr':
        return (
          <DrillDownSheet open title="Previous MRR — Last Month" subtitle="Full breakdown of previous month" onClose={() => setDrill(null)}>
            <p className="text-[13px] text-muted-foreground text-center py-8">No data for this period</p>
          </DrillDownSheet>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="ceo-revenue">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] leading-[1.08] text-foreground">Revenue</h1>
          <p className="text-[15px] text-muted-foreground mt-1">MRR breakdown, trends, and cash flow analysis</p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="revenue-kpis-1">
        {revenueKpisRow1.map(kpi => (
          <KpiCard key={kpi.key} icon={kpi.icon} color={kpi.color} value={kpi.value} label={kpi.label} description={kpi.description} onClick={() => setDrill(kpi.key)} />
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="revenue-kpis-2">
        {revenueKpisRow2.map(kpi => (
          <KpiCard key={kpi.key} icon={kpi.icon} color={kpi.color} value={kpi.value} label={kpi.label} description={kpi.description} onClick={() => setDrill(kpi.key)} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue — Last 30 Days" subtitle="Daily revenue and profit trend">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueLast30Days}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="#1FAA6B" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="MRR Breakdown — 12 Months" subtitle="New, expansion, and churned MRR">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mrrBreakdownMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="newMrr" stackId="a" fill="#1FAA6B" name="New" radius={[0, 0, 0, 0]} />
              <Bar dataKey="expansion" stackId="a" fill="#3B82F6" name="Expansion" radius={[0, 0, 0, 0]} />
              <Bar dataKey="churned" stackId="b" fill="#E03131" name="Churned" radius={[0, 0, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Drill-Downs */}
      {drillContent()}
    </div>
  );
}

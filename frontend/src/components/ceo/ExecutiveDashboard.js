import React from 'react';
import { BarChart3, Users, DollarSign, TrendingUp, Activity, ArrowDownRight } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat, StatRow } from './shared';

export default function ExecutiveDashboard() {
  return (
    <div data-testid="ceo-executive">
      <PageHeader title="Executive" subtitle="High-level business health, customer metrics, and growth trends" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Paying Customers" value="153" icon={Users} color="#3b82f6" trend={8} subtitle="Net gained: +12" />
        <MetricCard label="Churn Rate" value="3.2%" icon={Activity} color="#10b981" trend={-0.5} subtitle="Improving" />
        <MetricCard label="Avg Contract" value="$3,620" icon={DollarSign} color="#8b5cf6" trend={6} />
        <MetricCard label="MRR" value="$46,200" icon={TrendingUp} color="#059669" trend={9.8} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="New vs Lost Customers" subtitle="Monthly customer movement with churn overlay">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="ARPU Trend" subtitle="All customers vs new customers ARPU + CAC + CLTV">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <ChartCard title="MRR Metrics">
          <div className="space-y-0">
            <MiniStat label="Total MRR" value="$46,200" color="#059669" />
            <MiniStat label="Net New MRR" value="$6,200" color="#10b981" />
            <MiniStat label="Expansion MRR" value="$3,800" color="#3b82f6" />
            <MiniStat label="Churned MRR" value="-$1,200" color="#ef4444" />
          </div>
        </ChartCard>
        <ChartCard title="CAC / ARPU / CLTV">
          <div className="space-y-0">
            <MiniStat label="CAC" value="$1,040" />
            <MiniStat label="CLTV" value="$4,280" color="#8b5cf6" />
            <MiniStat label="CLTV/CAC Ratio" value="4.11x" color="#10b981" />
            <MiniStat label="ARPU (All)" value="$302" />
            <MiniStat label="ARPU (New)" value="$285" />
          </div>
        </ChartCard>
        <ChartCard title="MRR Net Growth" subtitle="Year-over-year">
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-4xl font-bold text-foreground">+42%</p>
            <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--text-tertiary))' }}>YoY MRR Growth</p>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="MRR Net Growth — Monthly" subtitle="Monthly net growth rate trend">
        <div className="h-52 flex items-center justify-center">
          <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
        </div>
      </ChartCard>
    </div>
  );
}

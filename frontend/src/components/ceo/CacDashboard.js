import React from 'react';
import { Target, DollarSign, Users, TrendingUp, Activity, ArrowDownRight } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat } from './shared';

export default function CacDashboard() {
  return (
    <div data-testid="ceo-cac">
      <PageHeader title="CAC & Metrics" subtitle="Customer acquisition cost and unit economics" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="CAC" value="$1,040" icon={Target} color="#ef4444" trend={-8} subtitle="vs $1,130 last month" />
        <MetricCard label="LTV / CAC" value="4.11x" icon={TrendingUp} color="#10b981" trend={5} subtitle="Healthy ratio" />
        <MetricCard label="New Customers" value="52" icon={Users} color="#3b82f6" trend={12} subtitle="This month" />
        <MetricCard label="Payback Period" value="8.2 mo" icon={DollarSign} color="#f59e0b" trend={-3} subtitle="Improving" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="New Customers Trend" subtitle="Monthly new customer acquisitions">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="CAC Trend" subtitle="Monthly customer acquisition cost">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Churn Trend" subtitle="Monthly churn rate">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="CMRR Waterfall" subtitle="Contracted MRR breakdown">
          <div className="space-y-0">
            <MiniStat label="Beginning MRR" value="$42,000" />
            <MiniStat label="New Business" value="+$4,200" color="#10b981" />
            <MiniStat label="Expansion" value="+$1,800" color="#10b981" />
            <MiniStat label="Contraction" value="-$600" color="#ef4444" />
            <MiniStat label="Churn" value="-$1,200" color="#ef4444" />
            <MiniStat label="Ending MRR" value="$46,200" color="#3b82f6" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

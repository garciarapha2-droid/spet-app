import React from 'react';
import { FileBarChart, Users, DollarSign, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat } from './shared';

export default function StartupKpisDashboard() {
  return (
    <div data-testid="ceo-startup-kpis">
      <PageHeader title="Startup KPIs" subtitle="Visitors, signups, ARPA, and MRR stack analysis" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Monthly Visitors" value="24.8K" icon={Users} color="#3b82f6" trend={18} subtitle="Unique visitors" />
        <MetricCard label="Signups" value="620" icon={ArrowUpRight} color="#10b981" trend={12} subtitle="This month" />
        <MetricCard label="Signup → Paying" value="8.4%" icon={TrendingUp} color="#8b5cf6" trend={2} subtitle="Conversion rate" />
        <MetricCard label="ARPA (All)" value="$302" icon={DollarSign} color="#059669" trend={4} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Visitors vs Signups" subtitle="Monthly traffic and conversion">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="ARPA Trend" subtitle="All customers vs new customers">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Signups → Paying Customers" subtitle="Monthly conversion and churn rate">
          <div className="space-y-0">
            <MiniStat label="New Signups" value="620" />
            <MiniStat label="New Paying Customers" value="52" color="#10b981" />
            <MiniStat label="Signup → Paying Rate" value="8.4%" color="#3b82f6" />
            <MiniStat label="Churn Rate" value="3.2%" color="#ef4444" />
          </div>
        </ChartCard>
        <ChartCard title="New vs Lost MRR" subtitle="Monthly MRR changes">
          <div className="space-y-0">
            <MiniStat label="New MRR" value="$4,200" color="#10b981" />
            <MiniStat label="Lost MRR" value="-$1,200" color="#ef4444" />
            <MiniStat label="Net New MRR" value="$3,000" color="#3b82f6" />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="MRR Stack" subtitle="Beginning + New + Expansion - Lost">
        <div className="h-52 flex items-center justify-center">
          <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
        </div>
      </ChartCard>
    </div>
  );
}

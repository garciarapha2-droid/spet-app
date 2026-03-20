import React from 'react';
import { Users, Clock, ArrowUpRight, TrendingUp, RefreshCw, Target, Zap } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, StatRow, MiniStat } from './shared';

export default function CustomerLifecycleDashboard() {
  return (
    <div data-testid="ceo-customer-lifecycle">
      <PageHeader title="Customer Lifecycle" subtitle="Retention, LTV, and conversion funnel metrics" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Avg. Customer Lifetime" value="14.2 mo" icon={Clock} color="#3b82f6" trend={8} subtitle="vs 12.1 last quarter" />
        <MetricCard label="Avg. LTV" value="$4,280" icon={Users} color="#059669" trend={12} subtitle="Per customer" />
        <MetricCard label="MRR Retention" value="96.4%" icon={RefreshCw} color="#10b981" trend={1.2} subtitle="Target: 95%" />
        <MetricCard label="LTV / CAC Ratio" value="4.11x" icon={Zap} color="#8b5cf6" trend={5} subtitle="Target: 3.0x" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Customer Lifetime Value Trend" subtitle="LTV evolution over time">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="Retention & Expansion" subtitle="Monthly retention and expansion rates">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Lead Conversion Funnel" subtitle="Captured → Qualified → Accepted → Won">
          <div className="space-y-0">
            <MiniStat label="Captured" value="1,240" />
            <MiniStat label="Qualified" value="680" />
            <MiniStat label="Accepted" value="320" />
            <MiniStat label="Opportunities" value="145" />
            <MiniStat label="Wins" value="52" color="#10b981" />
          </div>
        </ChartCard>
        <ChartCard title="Account Retention Trend" subtitle="Monthly account retention rate">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

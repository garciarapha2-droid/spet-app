import React from 'react';
import { TrendingUp, DollarSign, Users, Target, BarChart3, PieChart } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat } from './shared';

export default function CrmReportsDashboard() {
  return (
    <div data-testid="ceo-crm-reports">
      <PageHeader title="CRM Reports" subtitle="Pipeline funnel, win/loss analysis, and opportunity metrics" />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="Active Opportunities" value="38" icon={Target} color="#3b82f6" trend={12} subtitle="In pipeline" />
        <MetricCard label="Won Opportunities" value="12" icon={TrendingUp} color="#10b981" trend={20} subtitle="This month" />
        <MetricCard label="Conversion Rate" value="31.6%" icon={PieChart} color="#8b5cf6" trend={4} subtitle="Won / Total" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Pipeline Funnel" subtitle="Deals and value by stage">
          <div className="space-y-0">
            <MiniStat label="New — 8 deals" value="$72,000" />
            <MiniStat label="Qualification — 10 deals" value="$84,200" color="#f59e0b" />
            <MiniStat label="Presentation — 6 deals" value="$42,000" color="#8b5cf6" />
            <MiniStat label="Negotiation — 8 deals" value="$96,400" color="#ef4444" />
            <MiniStat label="Evaluation — 4 deals" value="$28,800" color="#06b6d4" />
            <MiniStat label="Won — 12 deals" value="$128,400" color="#10b981" />
          </div>
        </ChartCard>
        <ChartCard title="Loss Reasons" subtitle="Why deals were lost">
          <div className="space-y-0">
            <MiniStat label="Price too high" value="34%" color="#ef4444" />
            <MiniStat label="Chose competitor" value="22%" color="#f59e0b" />
            <MiniStat label="No budget" value="18%" color="#3b82f6" />
            <MiniStat label="Timing" value="14%" color="#8b5cf6" />
            <MiniStat label="Other" value="12%" />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Pipeline Value Over Time" subtitle="Total pipeline value trend">
        <div className="h-52 flex items-center justify-center">
          <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
        </div>
      </ChartCard>
    </div>
  );
}

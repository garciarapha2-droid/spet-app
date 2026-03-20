import React from 'react';
import { Megaphone, Users, Globe, UserCheck, Target, BarChart3 } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat, StatRow } from './shared';

export default function LeadBreakdownDashboard() {
  return (
    <div data-testid="ceo-lead-breakdown">
      <PageHeader title="Lead Breakdown" subtitle="Trial activity, conversion, and lead quality metrics" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Trials Today" value="18" icon={Users} color="#3b82f6" trend={15} subtitle="of 42 total" />
        <MetricCard label="Trials This Month" value="284" icon={UserCheck} color="#059669" trend={8} subtitle="of 620 total" />
        <MetricCard label="Web → Lead" value="12.4%" icon={Globe} color="#8b5cf6" trend={2} subtitle="Conversion rate" />
        <MetricCard label="Lead → Trial" value="34.2%" icon={Target} color="#f59e0b" trend={-1} subtitle="Conversion rate" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <ChartCard title="Lead Quality — Today" subtitle="Active trial metrics">
          <div className="space-y-0">
            <MiniStat label="Active Trials" value="18" />
            <MiniStat label="High Demographic" value="12" color="#10b981" />
            <MiniStat label="Voting Sales" value="8" color="#8b5cf6" />
          </div>
        </ChartCard>
        <ChartCard title="Lead Quality — Month" subtitle="Monthly trial metrics">
          <div className="space-y-0">
            <MiniStat label="Active Trials" value="284" />
            <MiniStat label="High Demographic" value="196" color="#10b981" />
            <MiniStat label="Voting Sales" value="142" color="#8b5cf6" />
          </div>
        </ChartCard>
        <ChartCard title="Trial Breakdown by Role" subtitle="Distribution">
          <div className="space-y-0">
            <MiniStat label="Marketing Manager" value="84" />
            <MiniStat label="VP Sales" value="62" />
            <MiniStat label="CEO / Founder" value="48" />
            <MiniStat label="Other" value="90" />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Lead Source by Region" subtitle="Geographic distribution of leads">
        <div className="h-52 flex items-center justify-center">
          <p className="text-[12px] text-muted-foreground">Map will render with real data</p>
        </div>
      </ChartCard>
    </div>
  );
}

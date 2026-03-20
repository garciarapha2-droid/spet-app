import React from 'react';
import { Activity, RefreshCw, Users, TrendingUp, ArrowUpRight, DollarSign } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, StatRow, MiniStat } from './shared';

export default function MrrRetentionDashboard() {
  return (
    <div data-testid="ceo-mrr-retention">
      <PageHeader title="MRR Retention" subtitle="Monthly recurring revenue retention and churn analysis" />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="MRR Retention Rate" value="97.2%" icon={RefreshCw} color="#10b981" trend={0.8} subtitle="Target: 95%" />
        <MetricCard label="Net Dollar Retention" value="112%" icon={DollarSign} color="#059669" trend={3.2} subtitle="Expansion offsets churn" />
        <MetricCard label="Viral Coefficient" value="0.85" icon={Users} color="#8b5cf6" trend={5} subtitle="Approaching 1.0" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Retention vs Plan" subtitle="Monthly retention rate vs target">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="Cancellation Trend" subtitle="Daily MRR lost and accounts cancelled">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="MRR Split: Direct vs Partner" subtitle="Revenue source breakdown">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>Direct</p>
            <MiniStat label="New MRR" value="$4,200" color="#3b82f6" />
            <MiniStat label="Expansion MRR" value="$1,800" color="#10b981" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>Partner</p>
            <MiniStat label="New MRR" value="$2,100" color="#3b82f6" />
            <MiniStat label="Expansion MRR" value="$900" color="#10b981" />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

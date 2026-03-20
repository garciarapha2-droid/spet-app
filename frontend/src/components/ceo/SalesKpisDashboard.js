import React from 'react';
import { ShoppingCart, DollarSign, TrendingUp, Target, BarChart3, Globe } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat } from './shared';

export default function SalesKpisDashboard() {
  return (
    <div data-testid="ceo-sales-kpis">
      <PageHeader title="Sales KPIs" subtitle="Sales performance, pipeline velocity, and regional breakdown" />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="Total Sales" value="$128,400" icon={DollarSign} color="#059669" trend={14} subtitle="This month" />
        <MetricCard label="Average Sale" value="$2,470" icon={ShoppingCart} color="#3b82f6" trend={6} subtitle="Per deal" />
        <MetricCard label="Count of Sales" value="52" icon={Target} color="#8b5cf6" trend={8} subtitle="Closed won" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="Avg. Impressions" value="14.2K" icon={BarChart3} color="#f59e0b" trend={12} />
        <MetricCard label="Avg. CTR" value="3.8%" icon={TrendingUp} color="#10b981" trend={4} />
        <MetricCard label="Avg. ACOS" value="22%" icon={DollarSign} color="#ef4444" trend={-3} subtitle="Improving" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Impressions Breakdown" subtitle="Organic vs Referral vs Direct">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="Sales vs Target" subtitle="Monthly dollar sales vs target">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Sales by Product" subtitle="Revenue distribution by product">
          <div className="space-y-0">
            <MiniStat label="Spet Core" value="$32,100" />
            <MiniStat label="Spet Flow" value="$42,800" color="#3b82f6" />
            <MiniStat label="Spet Sync" value="$34,200" color="#10b981" />
            <MiniStat label="Spet OS" value="$19,300" color="#8b5cf6" />
          </div>
        </ChartCard>
        <ChartCard title="Sales by Region" subtitle="Top performing regions">
          <div className="space-y-0">
            <MiniStat label="California" value="$28,400" />
            <MiniStat label="New York" value="$22,100" />
            <MiniStat label="Texas" value="$18,600" />
            <MiniStat label="Florida" value="$14,200" />
            <MiniStat label="Other" value="$45,100" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

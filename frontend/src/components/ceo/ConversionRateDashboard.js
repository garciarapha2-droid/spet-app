import React from 'react';
import { Target, DollarSign, Users, TrendingUp, Activity, PieChart } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat } from './shared';

export default function ConversionRateDashboard() {
  return (
    <div data-testid="ceo-conversion-rate">
      <PageHeader title="Conversion Rate" subtitle="Trial conversion, revenue targets, and account growth" />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="Net New Revenue" value="$8,400" icon={DollarSign} color="#059669" trend={11} subtitle="Target: $10,000" />
        <MetricCard label="Monthly Revenue" value="$46,200" icon={TrendingUp} color="#3b82f6" trend={9.8} subtitle="Target: $50,000" />
        <MetricCard label="Avg Revenue / Account" value="$302" icon={Users} color="#8b5cf6" trend={4.2} subtitle="Target: $320" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="New Accounts by Month" subtitle="Monthly new account growth">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="Lifetime Value vs Target" subtitle="Monthly LTV trend vs benchmark">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="Churn Rate by Month" subtitle="Monthly churn percentage">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="Trial Conversion" subtitle="Trial to paying conversion rate">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="CAC Trend" subtitle="Customer acquisition cost over time">
        <div className="h-52 flex items-center justify-center">
          <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
        </div>
      </ChartCard>
    </div>
  );
}

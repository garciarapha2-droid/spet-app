import React from 'react';
import { DollarSign, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { MetricCard, ChartCard, PageHeader, MiniStat } from './shared';

export default function CashFlowMrrDashboard() {
  return (
    <div data-testid="ceo-cashflow-mrr">
      <PageHeader title="Cash Flow & MRR" subtitle="Revenue streams, cash flow, and MRR breakdown" />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="MRR This Month" value="$46,200" icon={DollarSign} color="#059669" trend={9.8} subtitle="Monthly Recurring Revenue" />
        <MetricCard label="Expansion MRR" value="$3,800" icon={TrendingUp} color="#10b981" trend={14} subtitle="Upsells & cross-sells" />
        <MetricCard label="Churned MRR" value="$1,200" icon={Activity} color="#ef4444" trend={-5} subtitle="Lost revenue" />
        <MetricCard label="Net Cash Flow" value="$28,600" icon={DollarSign} color="#3b82f6" trend={7} subtitle="After expenses" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="ARR" value="$554,400" icon={DollarSign} color="#8b5cf6" trend={12} />
        <MetricCard label="Contraction MRR" value="$600" icon={ArrowDownRight} color="#f59e0b" trend={-2} />
        <MetricCard label="Net MRR Churn Rate" value="1.8%" icon={RefreshCw} color="#10b981" trend={-0.3} subtitle="Improving" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartCard title="MRR Growth Trend" subtitle="12-month MRR evolution">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
        <ChartCard title="Cash Flow Trend" subtitle="Monthly net cash flow">
          <div className="h-52 flex items-center justify-center">
            <p className="text-[12px] text-muted-foreground">Chart will render with real data</p>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="MRR Breakdown" subtitle="Revenue by category">
        <div className="space-y-0">
          <MiniStat label="New Business" value="$4,200 (42 accounts)" color="#3b82f6" />
          <MiniStat label="Expansion" value="$3,800 (28 accounts)" color="#10b981" />
          <MiniStat label="Reactivation" value="$400 (4 accounts)" color="#8b5cf6" />
          <MiniStat label="Contraction" value="-$600 (6 accounts)" color="#f59e0b" />
          <MiniStat label="Churn" value="-$1,200 (8 accounts)" color="#ef4444" />
        </div>
      </ChartCard>
    </div>
  );
}

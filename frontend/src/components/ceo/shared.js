import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/* ─── Custom Chart Tooltip ─── */
export function ChartTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null;
  const fmt = formatValue || ((v) => typeof v === 'number' ? `$${v.toLocaleString()}` : v);
  return (
    <div className="bg-foreground text-background text-[11px] rounded-lg px-3 py-2 shadow-xl">
      <p className="font-medium opacity-60 mb-1 text-[10px]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="opacity-60">{p.name}:</span>
          <span className="font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── KPI Metric Card ─── */
export function MetricCard({ label, value, icon: Icon, color = '#3b82f6', trend, trendLabel, subtitle, onClick, size = 'default' }) {
  const isUp = trend > 0;
  const hasTrend = trend !== undefined && trend !== null;
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-xl transition-all duration-200 hover:border-border/50 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'hover:shadow-sm'} ${size === 'lg' ? 'p-5' : 'p-4'}`}
      data-testid={`metric-${label?.toLowerCase().replace(/[\s\/]+/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '10' }}>
          <Icon className="h-[18px] w-[18px]" style={{ color }} />
        </div>
        {hasTrend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-600' : trend < 0 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
            {isUp ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={`font-bold tracking-tight text-foreground ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>{value}</p>
      <p className="text-[11px] font-medium mt-1" style={{ color: 'hsl(var(--text-secondary))' }}>{label}</p>
      {subtitle && <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>{subtitle}</p>}
      {trendLabel && <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>{trendLabel}</p>}
    </div>
  );
}

/* ─── Chart Container Card ─── */
export function ChartCard({ title, subtitle, action, children, className = '', noPad }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div>
            <h3 className="text-[13px] font-bold text-foreground tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

/* ─── Section Page Header ─── */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] mt-1" style={{ color: 'hsl(var(--text-tertiary))' }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/* ─── Mini Stat (inline) ─── */
export function MiniStat({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-[11px]" style={{ color: 'hsl(var(--text-secondary))' }}>{label}</span>
      <span className="text-[12px] font-bold" style={{ color: color || 'hsl(var(--foreground))' }}>{value}</span>
    </div>
  );
}

/* ─── Loading Skeleton ─── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyChart({ icon: Icon, message }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30 mb-3" />
      <p className="text-[12px] text-muted-foreground font-medium">{message || 'No data available yet'}</p>
    </div>
  );
}

/* ─── Stat Row for Side Panels ─── */
export function StatRow({ items }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-muted rounded-xl p-3.5">
          <p className="text-[9px] uppercase tracking-[0.1em] font-bold mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>{label}</p>
          <p className="text-[14px] font-bold" style={{ color: color || 'hsl(var(--foreground))' }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

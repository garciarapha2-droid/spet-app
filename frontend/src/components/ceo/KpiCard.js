import { DollarSign, TrendingUp, TrendingDown, Users, Globe, Target, BarChart3, RefreshCw, Zap, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';

const iconMap = {
  DollarSign, TrendingUp, TrendingDown, Users, Globe, Target, BarChart3, RefreshCw, Zap, ShoppingCart, Clock, AlertTriangle,
};

export function KpiCard({ icon, color, value, label, description, trend, trendValue, onClick, className = '' }) {
  const Icon = typeof icon === 'string' ? iconMap[icon] || DollarSign : icon;

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-[12px] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 ${className}`}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      data-testid={`kpi-${label?.toLowerCase().replace(/[\s\/]/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
        </div>
        {trendValue && (
          <span className={`text-[12px] font-semibold rounded-[6px] px-2 py-0.5 ${
            trend === 'up' ? 'text-[#1FAA6B] bg-[#1FAA6B]/10' : 'text-[#E03131] bg-[#E03131]/10'
          }`}>
            {trend === 'up' ? '\u2197' : '\u2198'} {trendValue}
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold tracking-[-0.02em] leading-none mt-4 text-foreground">{value}</p>
      <p className="text-[14px] font-medium text-foreground mt-1">{label}</p>
      {description && <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

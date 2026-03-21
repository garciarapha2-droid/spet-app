import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, ChevronRight, Shield, Info } from 'lucide-react';
import { riskAlerts } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const severityConfig = {
  critical: { icon: AlertTriangle, cls: 'border-[hsl(var(--danger)_/_0.3)] bg-[hsl(var(--danger)_/_0.03)]', iconCls: 'text-[hsl(var(--danger))]', badge: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
  warning: { icon: Shield, cls: 'border-[hsl(var(--warning)_/_0.3)] bg-[hsl(var(--warning)_/_0.03)]', iconCls: 'text-[hsl(var(--warning))]', badge: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  info: { icon: Info, cls: 'border-[hsl(var(--primary)_/_0.3)] bg-[hsl(var(--primary)_/_0.03)]', iconCls: 'text-[hsl(var(--primary))]', badge: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]' },
};

const criticalCount = riskAlerts.filter(a => a.severity === 'critical').length;
const warningCount = riskAlerts.filter(a => a.severity === 'warning').length;
const infoCount = riskAlerts.filter(a => a.severity === 'info').length;

export default function RiskAlerts() {
  return (
    <div className="space-y-6" data-testid="risk-alerts">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical', value: criticalCount, color: 'text-[hsl(var(--danger))]' },
          { label: 'Warnings', value: warningCount, color: 'text-[hsl(var(--warning))]' },
          { label: 'Info', value: infoCount, color: 'text-[hsl(var(--primary))]' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center" data-testid={`risk-kpi-${kpi.label.toLowerCase()}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {riskAlerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const Icon = cfg.icon;
          return (
            <motion.div key={alert.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.04 }}
              className={`rounded-xl border-2 p-5 ${cfg.cls} transition-all hover:shadow-sm`}
              data-testid={`risk-alert-${alert.id}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.iconCls}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${cfg.badge}`}>{alert.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-foreground tabular-nums">{alert.metric}</span>
                  <p className={`text-xs font-medium ${alert.trend === 'up' ? 'text-[hsl(var(--danger))]' : alert.trend === 'down' ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>{alert.trend}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-opacity" data-testid={`risk-cta-${alert.id}`}>
                  {alert.cta} <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

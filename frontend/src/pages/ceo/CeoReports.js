import { useState, useEffect, useCallback, useMemo } from 'react';
import { Target, Trophy, Percent, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '../../components/ceo/KpiCard';
import { ChartCard } from '../../components/ceo/ChartCard';
import { DrillDownSheet } from '../../components/ceo/DrillDownSheet';
import { getDeals, getPipelineHistory, getLossReasons, PIPELINE_STAGES } from '../../services/ceoService';

export default function CeoReports() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [pipelineHistory, setPipelineHistory] = useState([]);
  const [lossReasons, setLossReasons] = useState([]);
  const [drill, setDrill] = useState(null);

  const loadData = useCallback(async () => {
    const [d, ph, lr] = await Promise.all([getDeals(), getPipelineHistory(), getLossReasons()]);
    setDeals(d);
    setPipelineHistory(ph);
    setLossReasons(lr);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
  const wonDeals = deals.filter(d => d.stage === 'won');
  const totalForConversion = deals.filter(d => d.stage !== 'lost').length;
  const convRate = totalForConversion > 0 ? ((wonDeals.length / totalForConversion) * 100).toFixed(1) : '0';

  // Funnel data
  const funnelStages = PIPELINE_STAGES.filter(s => s.key !== 'lost');
  const funnel = useMemo(() =>
    funnelStages.map(stage => {
      const stDeals = deals.filter(d => d.stage === stage.key);
      return {
        stage: stage.label,
        key: stage.key,
        color: stage.color,
        count: stDeals.length,
        value: stDeals.reduce((sum, d) => sum + d.value, 0),
      };
    }),
    [deals, funnelStages]
  );

  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  const kpis = [
    { key: 'active', icon: 'Target', color: '#7C3AED', value: String(activeDeals.length), label: 'Active Opportunities', description: 'In pipeline' },
    { key: 'won', icon: 'Trophy', color: '#1FAA6B', value: String(wonDeals.length), label: 'Won Opportunities', description: 'This month' },
    { key: 'convRate', icon: 'Percent', color: '#3B82F6', value: `${convRate}%`, label: 'Conversion Rate', description: 'Won / Total' },
  ];

  const handleKpiClick = (key) => {
    switch (key) {
      case 'active': navigate('/ceo/pipeline'); break;
      case 'won': navigate('/ceo/pipeline'); break;
      case 'convRate': setDrill('convRate'); break;
      default: break;
    }
  };

  const handleFunnelClick = (stageKey) => {
    navigate('/ceo/pipeline');
  };

  const drillContent = () => {
    if (drill === 'convRate') {
      return (
        <DrillDownSheet open title="Conversion Rate Breakdown" subtitle="Stage-to-stage conversion" onClose={() => setDrill(null)}>
          <div className="space-y-3">
            {funnelStages.slice(0, -1).map((stage, i) => {
              const nextStage = funnelStages[i + 1];
              const currentCount = deals.filter(d => d.stage === stage.key).length || 1;
              const nextCount = deals.filter(d => d.stage === nextStage.key).length;
              const pct = Math.round((nextCount / currentCount) * 100);
              return (
                <div key={stage.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-[13px] text-foreground">{stage.label} → {nextStage.label}</span>
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: stage.color }}>{pct}%</span>
                </div>
              );
            })}
            <div className="border-t-2 border-border pt-3 flex justify-between">
              <span className="text-[14px] font-bold">Overall Win Rate</span>
              <span className="text-[14px] font-bold text-primary tabular-nums">{convRate}%</span>
            </div>
          </div>
        </DrillDownSheet>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" data-testid="ceo-reports">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-foreground">CRM Reports</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Pipeline funnel, win/loss analysis, and opportunity metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="reports-kpis">
        {kpis.map(kpi => (
          <KpiCard key={kpi.key} icon={kpi.icon} color={kpi.color} value={kpi.value} label={kpi.label} description={kpi.description} onClick={() => handleKpiClick(kpi.key)} />
        ))}
      </div>

      {/* Funnel + Loss Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Funnel */}
        <ChartCard title="Pipeline Funnel" subtitle="Deals and value by stage">
          <div className="space-y-0" data-testid="pipeline-funnel">
            {funnel.map((row) => (
              <div
                key={row.key}
                onClick={() => handleFunnelClick(row.key)}
                className="flex items-center justify-between py-3 px-3 hover:bg-muted/30 rounded-lg cursor-pointer transition-colors"
                data-testid={`funnel-row-${row.key}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                  <span className="text-[13px] font-medium text-foreground">{row.stage}</span>
                  <span className="text-[12px] text-muted-foreground">— {row.count} deals</span>
                </div>
                <span className="text-[13px] font-medium text-primary tabular-nums">${row.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-border mt-2 pt-3 px-3 flex justify-between">
              <span className="text-[13px] font-bold text-foreground">Total Pipeline</span>
              <span className="text-[14px] font-bold text-primary tabular-nums">${totalPipelineValue.toLocaleString()}</span>
            </div>
          </div>
        </ChartCard>

        {/* Loss Reasons */}
        <ChartCard title="Loss Reasons" subtitle="Why deals were lost">
          <div className="space-y-3 px-1" data-testid="loss-reasons">
            {lossReasons.map((lr) => (
              <div key={lr.reason} className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground">{lr.reason}</span>
                  <span className="text-primary font-medium tabular-nums">{lr.percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${lr.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Pipeline Value Over Time */}
      <ChartCard title="Pipeline Value Over Time" subtitle="Total pipeline value trend">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={pipelineHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <ReTooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
              formatter={v => [`$${v.toLocaleString()}`, 'Pipeline Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7C3AED"
              strokeWidth={2}
              fill="#7C3AED"
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Drill-downs */}
      {drillContent()}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Search, Building2 } from 'lucide-react';
import { useDeals, useDeal } from '../../hooks/useCrmData';
import { CrmDetailDialog } from '../../components/ceo/CrmDetailDialog';
import { DEAL_STAGES, getPlanName } from '../../services/crmService';

const stageColors = Object.fromEntries(DEAL_STAGES.map(s => [s.key, s.color]));
const visibleStages = DEAL_STAGES.filter(s => s.key !== 'closed_lost');

export default function CeoPipeline() {
  const { deals, loading, refetch } = useDeals();
  const [search, setSearch] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const { deal: selectedDeal, refetch: refetchDeal } = useDeal(selectedDealId);

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(d =>
      (d.company_name || '').toLowerCase().includes(q) ||
      (d.contact_name || '').toLowerCase().includes(q) ||
      (d.title || d.company_name || '').toLowerCase().includes(q)
    );
  }, [deals, search]);

  const stageDeals = useMemo(() => {
    const map = {};
    visibleStages.forEach(s => { map[s.key] = []; });
    filtered.forEach(d => {
      if (map[d.stage]) map[d.stage].push(d);
    });
    return map;
  }, [filtered]);

  const handleRefresh = () => {
    refetch();
    if (selectedDealId) refetchDeal();
  };

  return (
    <div className="space-y-6" data-testid="ceo-pipeline">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-foreground">Sales Pipeline</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Deal stages, pipeline value, and opportunity tracking</p>
        </div>
        <div className="relative w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="pipeline-search"
          />
        </div>
      </div>

      {/* Stage Header Bar */}
      <div className="flex gap-0 bg-card border border-border rounded-xl overflow-hidden" data-testid="stage-headers">
        {visibleStages.map((stage, i) => {
          const stDeals = stageDeals[stage.key] || [];
          const totalValue = stDeals.reduce((sum, d) => sum + Number(d.deal_value || 0), 0);
          return (
            <div key={stage.key} className={`flex-1 min-w-[140px] py-3 px-4 ${i < visibleStages.length - 1 ? 'border-r border-border' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="text-[13px] font-medium text-foreground">{stage.label}</span>
                <span className="text-[12px] text-muted-foreground">({stDeals.length})</span>
              </div>
              <p className="text-[13px] font-medium text-foreground mt-0.5 tabular-nums">${totalValue.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Kanban Board */}
      {!loading && (
        <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
          {visibleStages.map(stage => {
            const stDeals = stageDeals[stage.key] || [];
            return (
              <div key={stage.key} className="flex-1 min-w-[200px] space-y-3">
                {stDeals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className="p-3 rounded-lg border border-border/30 bg-card hover:border-primary/30 cursor-pointer transition-all"
                    data-testid={`deal-card-${deal.id}`}
                  >
                    <p className="text-[13px] font-semibold text-foreground leading-tight">{deal.company_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{deal.contact_name}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[13px] font-mono font-semibold tabular-nums" style={{ color: stageColors[deal.stage] }}>
                        ${Number(deal.deal_value || 0).toLocaleString()}/mo
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {getPlanName(deal.plan_id)}
                      </span>
                    </div>
                  </div>
                ))}
                {stDeals.length === 0 && (
                  <div className="border border-dashed border-border/30 rounded-lg py-8 text-center">
                    <p className="text-[12px] text-muted-foreground">No deals</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deal Detail Dialog */}
      <CrmDetailDialog
        item={selectedDeal}
        mode="deal"
        open={!!selectedDeal}
        onClose={() => setSelectedDealId(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

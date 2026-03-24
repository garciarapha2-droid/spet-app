import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Building2, ExternalLink, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getDeals, moveDealToStage, markDealAsLost, PIPELINE_STAGES } from '../../services/ceoService';

const stageColors = Object.fromEntries(PIPELINE_STAGES.map(s => [s.key, s.color]));

export default function CeoPipeline() {
  const [deals, setDeals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const loadDeals = useCallback(async () => {
    const data = await getDeals();
    setDeals(data);
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.company.toLowerCase().includes(q) ||
      d.contact.toLowerCase().includes(q)
    );
  }, [deals, search]);

  const visibleStages = PIPELINE_STAGES.filter(s => s.key !== 'lost');

  const stageDeals = useMemo(() => {
    const map = {};
    visibleStages.forEach(s => { map[s.key] = []; });
    filtered.forEach(d => {
      if (map[d.stage]) map[d.stage].push(d);
    });
    return map;
  }, [filtered, visibleStages]);

  const handleMoveNext = async (deal) => {
    const stage = PIPELINE_STAGES.find(s => s.key === deal.stage);
    if (!stage?.next) return;
    try {
      await moveDealToStage(deal.id, stage.next);
      await loadDeals();
      const nextStage = PIPELINE_STAGES.find(s => s.key === stage.next);
      toast.success(`Deal moved to ${nextStage?.label}`);
      setSelectedDeal(null);
    } catch {
      toast.error('Failed to move deal');
    }
  };

  const handleMarkLost = async () => {
    if (!selectedDeal || !lostReason.trim()) return;
    try {
      await markDealAsLost(selectedDeal.id, lostReason);
      await loadDeals();
      toast.success('Deal marked as lost');
      setSelectedDeal(null);
      setShowLostConfirm(false);
      setLostReason('');
    } catch {
      toast.error('Failed to mark as lost');
    }
  };

  const currentStage = selectedDeal ? PIPELINE_STAGES.find(s => s.key === selectedDeal.stage) : null;
  const canMoveNext = currentStage?.next && currentStage.key !== 'won' && currentStage.key !== 'lost';

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
      <div className="flex gap-0 overflow-x-auto" data-testid="stage-headers">
        {visibleStages.map((stage, i) => {
          const stDeals = stageDeals[stage.key] || [];
          const totalValue = stDeals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div key={stage.key} className={`flex-1 min-w-[160px] py-3 px-4 ${i < visibleStages.length - 1 ? 'border-r border-border' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="text-[13px] font-medium text-foreground">{stage.label}</span>
                <span className="text-[12px] text-muted-foreground">{stDeals.length}</span>
              </div>
              <p className="text-[13px] font-medium text-foreground mt-0.5 tabular-nums">${totalValue.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {visibleStages.map(stage => {
          const stDeals = stageDeals[stage.key] || [];
          return (
            <div key={stage.key} className="flex-1 min-w-[220px] space-y-3">
              {stDeals.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
                  data-testid={`deal-card-${deal.id}`}
                >
                  <p className="text-[14px] font-medium text-foreground leading-tight">{deal.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">{deal.company}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[14px] font-semibold tabular-nums" style={{ color: stageColors[deal.stage] }}>
                      ${deal.value.toLocaleString()}
                    </span>
                    <div className="flex gap-1">
                      {deal.tags.map(tag => (
                        <span key={tag} className="text-[11px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {stDeals.length === 0 && (
                <div className="border border-dashed border-border rounded-lg py-8 text-center">
                  <p className="text-[12px] text-muted-foreground">No deals</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Deal Detail Dialog */}
      {selectedDeal && !showLostConfirm && (
        <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
          <DialogContent className="max-w-[520px] max-h-[85vh] overflow-y-auto rounded-[16px] p-0" data-testid="deal-detail-dialog">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <DialogTitle className="text-[18px] font-bold text-foreground">{selectedDeal.title}</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground">{selectedDeal.company}</DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5 space-y-6">
              {/* Contact Information */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">Contact Information</p>
                <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
                  {[
                    { icon: '👤', label: 'Contact', value: selectedDeal.contact },
                    { icon: '✉', label: 'Email', value: selectedDeal.email, href: `mailto:${selectedDeal.email}` },
                    { icon: '📞', label: 'Phone', value: selectedDeal.phone, href: `tel:${selectedDeal.phone}` },
                    { icon: '🏢', label: 'Company', value: selectedDeal.company },
                    { icon: '📍', label: 'Location', value: selectedDeal.location },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 text-[13px]">
                      <span className="w-5 text-center">{item.icon}</span>
                      <span className="text-muted-foreground w-16">{item.label}</span>
                      {item.href ? (
                        <a href={item.href} className="text-primary hover:underline">{item.value}</a>
                      ) : (
                        <span className="text-foreground">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Deal Details */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">Deal Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Stage', value: currentStage?.label, color: currentStage?.color },
                    { label: 'Value', value: `$${selectedDeal.value.toLocaleString()}` },
                    { label: 'Type', value: selectedDeal.type },
                    { label: 'Expected', value: selectedDeal.expectedClose },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                      <p className="text-[14px] font-medium text-foreground mt-1" style={item.color ? { color: item.color } : {}}>
                        {item.color && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />}
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedDeal.notes && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">Notes</p>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-[13px] text-foreground leading-relaxed">{selectedDeal.notes}</p>
                  </div>
                </div>
              )}

              {/* Activity Log */}
              {selectedDeal.activity?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">Activity Log</p>
                  <div className="space-y-2">
                    {selectedDeal.activity.map((a, i) => (
                      <div key={i} className="flex gap-3 text-[13px]">
                        <span className="text-muted-foreground whitespace-nowrap tabular-nums">{a.date}</span>
                        <span className="text-foreground">{a.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {canMoveNext && (
                  <Button onClick={() => handleMoveNext(selectedDeal)} className="flex-1 text-[13px]" data-testid="move-next-stage">
                    Move to Next Stage <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
                {selectedDeal.stage !== 'won' && selectedDeal.stage !== 'lost' && (
                  <Button variant="ghost" onClick={() => setShowLostConfirm(true)} className="text-destructive hover:bg-destructive/10 text-[13px]" data-testid="mark-lost">
                    Mark as Lost
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lost Confirmation Dialog */}
      {showLostConfirm && (
        <Dialog open={showLostConfirm} onOpenChange={() => { setShowLostConfirm(false); setLostReason(''); }}>
          <DialogContent className="max-w-[400px] rounded-[16px]" data-testid="lost-confirm-dialog">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-bold">Mark as Lost</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground">Why was this deal lost?</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {['Price too high', 'Chose competitor', 'No budget', 'Timing', 'Other'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setLostReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-[13px] transition-colors ${
                    lostReason === reason ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {reason}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleMarkLost} disabled={!lostReason} className="flex-1 text-[13px]" variant="destructive">
                  Confirm Lost
                </Button>
                <Button variant="outline" onClick={() => { setShowLostConfirm(false); setLostReason(''); }} className="text-[13px]">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

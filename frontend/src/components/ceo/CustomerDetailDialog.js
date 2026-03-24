import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { PLANS, ALL_MODULES, STATUSES, updateCustomerPlan, updateCustomerStatus, toggleCustomerModule, getPlanName } from '../../services/ceoService';

const statusColors = {
  active: 'text-[#1FAA6B]',
  trial: 'text-[#F59F00]',
  past_due: 'text-[#E03131]',
  churned: 'text-muted-foreground',
};

const statusLabels = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past Due',
  churned: 'Churned',
};

export function CustomerDetailDialog({ customer, open, onClose, onUpdate }) {
  const [localCustomer, setLocalCustomer] = useState(customer);
  const [loading, setLoading] = useState(null); // tracks which field is loading

  // Sync localCustomer when customer prop changes
  useEffect(() => {
    if (customer) {
      setLocalCustomer(customer);
    }
  }, [customer]);

  if (!customer || !localCustomer) return null;

  const handlePlanChange = async (planId) => {
    setLoading('plan');
    try {
      const result = await updateCustomerPlan(localCustomer.id, planId);
      const updated = { ...localCustomer, plan: planId, mrr: result.mrr };
      setLocalCustomer(updated);
      onUpdate?.(updated);
      toast.success(`Plan changed to ${getPlanName(planId)}`);
    } catch {
      toast.error('Failed to update plan');
    }
    setLoading(null);
  };

  const handleStatusChange = async (status) => {
    setLoading('status');
    try {
      await updateCustomerStatus(localCustomer.id, status);
      const updated = { ...localCustomer, status };
      setLocalCustomer(updated);
      onUpdate?.(updated);
      toast.success(`Status changed to ${statusLabels[status]}`);
    } catch {
      toast.error('Failed to update status');
    }
    setLoading(null);
  };

  const handleModuleToggle = async (moduleKey, enabled) => {
    const prevModules = [...localCustomer.modules];
    // Optimistic update
    const newModules = enabled
      ? [...localCustomer.modules, moduleKey]
      : localCustomer.modules.filter(m => m !== moduleKey);
    const updated = { ...localCustomer, modules: newModules };
    setLocalCustomer(updated);

    try {
      await toggleCustomerModule(localCustomer.id, moduleKey, enabled);
      onUpdate?.(updated);
      const moduleName = ALL_MODULES.find(m => m.key === moduleKey)?.name || moduleKey;
      toast.success(`Module "${moduleName}" ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      // Revert
      setLocalCustomer({ ...localCustomer, modules: prevModules });
      toast.error('Failed to update module');
    }
  };

  const enabledCount = localCustomer.modules.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[540px] max-h-[85vh] overflow-y-auto rounded-[16px] p-0" data-testid="customer-detail-dialog">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-[18px] font-bold text-foreground">{localCustomer.company}</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {localCustomer.name} — {localCustomer.email}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Plan + MRR */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Plan</p>
              <Select value={localCustomer.plan} onValueChange={handlePlanChange} disabled={loading === 'plan'}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="plan-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-[13px]">
                      {p.name} — ${p.price}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">MRR</p>
              <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/30">
                <span className="text-[14px] font-semibold text-foreground tabular-nums">${localCustomer.mrr}</span>
              </div>
            </div>
          </div>

          {/* Status + Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Status</p>
              <Select value={localCustomer.status} onValueChange={handleStatusChange} disabled={loading === 'status'}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-[13px]">
                      <span className={statusColors[s]}>{statusLabels[s]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Payment</p>
              <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/30">
                <span className="text-[13px] text-muted-foreground">{localCustomer.payment || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Signup */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Signup</p>
            <span className="text-[13px] text-foreground">{localCustomer.signup}</span>
          </div>

          {/* Modules */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Modules ({enabledCount} / {ALL_MODULES.length})
            </p>
            <div className="space-y-0 rounded-xl border border-border overflow-hidden" data-testid="module-toggles">
              {ALL_MODULES.map((mod) => {
                const isEnabled = localCustomer.modules.includes(mod.key);
                return (
                  <div
                    key={mod.key}
                    className={`flex items-center justify-between px-4 py-3 border-b border-border last:border-0 transition-colors ${
                      isEnabled ? 'bg-primary/5 border-l-2 border-l-primary/20' : 'bg-background'
                    }`}
                    data-testid={`module-${mod.key}`}
                  >
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{mod.name}</p>
                      <p className="text-[11px] text-muted-foreground">{mod.description}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleModuleToggle(mod.key, checked)}
                      data-testid={`module-switch-${mod.key}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

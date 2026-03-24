import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Phone, Users, Mail, ArrowRight, FileText, Pencil, Trash2, Plus, Save, MapPin, Building2, User, DollarSign } from 'lucide-react';
import {
  PLANS, ALL_MODULES, DEAL_STAGES, ACTIVITY_TYPES,
  getPlanName, updateDeal, updateCustomer, closeDealAsWon, closeDealAsLost,
  addActivity, updateActivity, deleteActivity
} from '../../services/crmService';

const activityIcons = { call: Phone, meeting: Users, email: Mail, follow_up: ArrowRight, note: FileText };

export function CrmDetailDialog({ item, mode, open, onClose, onRefresh }) {
  // mode: 'deal' or 'customer'
  const isDeal = mode === 'deal';

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editText, setEditText] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'call', description: '' });

  useEffect(() => {
    if (item) {
      setForm({
        contact_name: item.contact_name || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        company_name: item.company_name || '',
        address: item.address || '',
        plan_id: item.plan_id || 'core',
        notes: item.notes || '',
        ...(isDeal ? {
          stage: item.stage || 'lead',
          deal_value: item.deal_value ?? 0,
        } : {
          status: item.status || 'active',
          mrr: item.mrr ?? 0,
          modules_enabled: item.modules_enabled || ['pulse'],
        }),
      });
      setActivities(item.activities || []);
      setEditingActivity(null);
      setShowAddActivity(false);
    }
  }, [item, isDeal]);

  if (!item) return null;

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isDeal) {
        await updateDeal(item.id, {
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          company_name: form.company_name,
          address: form.address,
          plan_id: form.plan_id,
          stage: form.stage,
          deal_value: Number(form.deal_value),
          notes: form.notes,
        });
      } else {
        await updateCustomer(item.id, {
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          company_name: form.company_name,
          address: form.address,
          plan_id: form.plan_id,
          status: form.status,
          mrr: Number(form.mrr),
          modules_enabled: form.modules_enabled,
          notes: form.notes,
        });
      }
      toast.success('Saved', { description: 'Changes saved successfully.' });
      onRefresh?.();
      onClose();
    } catch (e) {
      toast.error('Error', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkWon = async () => {
    setSaving(true);
    try {
      await closeDealAsWon(item.id);
      toast.success('Deal closed!', { description: 'Customer created in base.' });
      onRefresh?.();
      onClose();
    } catch (e) {
      toast.error('Error', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkLost = async () => {
    setSaving(true);
    try {
      await closeDealAsLost(item.id);
      toast.success('Deal marked as lost');
      onRefresh?.();
      onClose();
    } catch (e) {
      toast.error('Error', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.description.trim()) return;
    try {
      await addActivity(item.id, newActivity.type, newActivity.description);
      toast.success('Activity added');
      setNewActivity({ type: 'call', description: '' });
      setShowAddActivity(false);
      onRefresh?.();
      // Refetch deal to get updated activities
      const crm = await import('../../services/crmService');
      const updated = await crm.getDealById(item.id);
      setActivities(updated.activities || []);
    } catch (e) {
      toast.error('Error', { description: e.message });
    }
  };

  const handleUpdateActivity = async (actId) => {
    if (!editText.trim()) return;
    try {
      await updateActivity(actId, editText);
      toast.success('Activity updated');
      setEditingActivity(null);
      const crm = await import('../../services/crmService');
      const updated = await crm.getDealById(item.id);
      setActivities(updated.activities || []);
    } catch (e) {
      toast.error('Error', { description: e.message });
    }
  };

  const handleDeleteActivity = async (actId) => {
    try {
      await deleteActivity(actId);
      toast.success('Activity deleted');
      setActivities(prev => prev.filter(a => a.id !== actId));
    } catch (e) {
      toast.error('Error', { description: e.message });
    }
  };

  const handleModuleToggle = (moduleKey, enabled) => {
    const current = form.modules_enabled || [];
    const updated = enabled
      ? [...current, moduleKey]
      : current.filter(m => m !== moduleKey);
    update('modules_enabled', updated);
  };

  const isClosed = isDeal && (form.stage === 'closed_won' || form.stage === 'closed_lost');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[560px] p-0 max-h-[90vh] flex flex-col" data-testid="crm-detail-dialog">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/30 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-foreground">{form.company_name || 'Detail'}</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">{form.contact_name}</DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Contact fields */}
          <div className="space-y-3">
            <FieldRow icon={<User className="w-4 h-4" />} label="Name">
              <input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} className="field-input" data-testid="field-name" />
            </FieldRow>
            <FieldRow icon={<Mail className="w-4 h-4" />} label="Email">
              <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} className="field-input" data-testid="field-email" />
            </FieldRow>
            <FieldRow icon={<Phone className="w-4 h-4" />} label="Phone">
              <input type="tel" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} className="field-input" data-testid="field-phone" />
            </FieldRow>
            <FieldRow icon={<Building2 className="w-4 h-4" />} label="Company">
              <input value={form.company_name} onChange={e => update('company_name', e.target.value)} className="field-input" data-testid="field-company" />
            </FieldRow>
            <FieldRow icon={<MapPin className="w-4 h-4" />} label="Address">
              <input value={form.address} onChange={e => update('address', e.target.value)} className="field-input" data-testid="field-address" />
            </FieldRow>
            <FieldRow icon={<DollarSign className="w-4 h-4" />} label="Plan">
              <Select value={form.plan_id} onValueChange={v => {
                update('plan_id', v);
                if (isDeal) {
                  const price = PLANS.find(p => p.id === v)?.price || 0;
                  update('deal_value', price);
                }
              }}>
                <SelectTrigger className="h-9 text-[13px] flex-1" data-testid="field-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-[13px]">{p.name} — ${p.price}/mo</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          {/* Deal-specific fields */}
          {isDeal && (
            <div className="space-y-3 border-t border-border/30 pt-4">
              <FieldRow icon={null} label="Stage">
                <Select value={form.stage} onValueChange={v => update('stage', v)}>
                  <SelectTrigger className="h-9 text-[13px] flex-1" data-testid="field-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map(s => (
                      <SelectItem key={s.key} value={s.key} className="text-[13px]">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow icon={null} label="Deal Value">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[13px] text-muted-foreground">$</span>
                  <input type="number" value={form.deal_value} onChange={e => update('deal_value', e.target.value)} className="field-input" data-testid="field-deal-value" />
                  <span className="text-[11px] text-muted-foreground">/mo</span>
                </div>
              </FieldRow>
              {!isClosed && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleMarkWon} disabled={saving} className="text-[13px]" size="sm" data-testid="btn-mark-won">
                    Mark as Won
                  </Button>
                  <Button onClick={handleMarkLost} disabled={saving} variant="ghost" className="text-destructive hover:bg-destructive/10 text-[13px]" size="sm" data-testid="btn-mark-lost">
                    Mark as Lost
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Customer-specific fields */}
          {!isDeal && (
            <div className="space-y-3 border-t border-border/30 pt-4">
              <FieldRow icon={null} label="Status">
                <Select value={form.status} onValueChange={v => update('status', v)}>
                  <SelectTrigger className="h-9 text-[13px] flex-1" data-testid="field-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['active', 'paused', 'churned'].map(s => (
                      <SelectItem key={s} value={s} className="text-[13px] capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <div className="flex items-center gap-3 text-[13px]">
                <span className="text-muted-foreground w-16">MRR</span>
                <span className="font-semibold text-foreground">${form.mrr}</span>
              </div>
              {item.signup_date && (
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="text-muted-foreground w-16">Since</span>
                  <span className="text-foreground">{item.signup_date}</span>
                </div>
              )}
              {/* Module toggles */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Modules ({(form.modules_enabled || []).length} / {ALL_MODULES.length})
                </p>
                <div className="space-y-0 rounded-lg border border-border/30 overflow-hidden" data-testid="module-toggles">
                  {ALL_MODULES.map(mod => {
                    const enabled = (form.modules_enabled || []).includes(mod.key);
                    return (
                      <div key={mod.key} className={`flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-0 ${enabled ? 'bg-primary/5' : ''}`}>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{mod.name}</p>
                          <p className="text-[11px] text-muted-foreground">{mod.description}</p>
                        </div>
                        <Switch checked={enabled} onCheckedChange={checked => handleModuleToggle(mod.key, checked)} data-testid={`module-${mod.key}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="border-t border-border/30 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Notes</p>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              className="w-full min-h-[80px] text-[13px] border border-border/40 rounded-lg p-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              placeholder="Add notes..."
              data-testid="field-notes"
            />
          </div>

          {/* Activity Log (deals only) */}
          {isDeal && (
            <div className="border-t border-border/30 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Activity Log</p>
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setShowAddActivity(true)} data-testid="btn-add-activity">
                  <Plus className="w-3 h-3 mr-1" /> Add Activity
                </Button>
              </div>

              {showAddActivity && (
                <div className="flex gap-2 mb-3 p-3 bg-muted/30 rounded-lg" data-testid="add-activity-form">
                  <select
                    value={newActivity.type}
                    onChange={e => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                    className="h-9 px-2 rounded-lg border border-border/40 bg-background text-[13px] text-foreground"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    value={newActivity.description}
                    onChange={e => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description..."
                    className="flex-1 h-9 px-3 rounded-lg border border-border/40 bg-background text-[13px] text-foreground"
                    data-testid="new-activity-description"
                  />
                  <Button size="sm" className="h-9 text-[12px]" onClick={handleAddActivity}>Save</Button>
                </div>
              )}

              <div className="space-y-0">
                {activities.map(act => {
                  const Icon = activityIcons[act.type] || FileText;
                  const isEditing = editingActivity === act.id;
                  return (
                    <div key={act.id} className="group flex items-start gap-3 py-2 border-b border-border/20 last:border-0" data-testid={`activity-${act.id}`}>
                      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 h-8 px-2 rounded border border-border/40 bg-background text-[13px]" />
                            <Button size="sm" className="h-8 text-[11px]" onClick={() => handleUpdateActivity(act.id)}>Save</Button>
                          </div>
                        ) : (
                          <p className="text-[13px] text-foreground">{act.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { setEditingActivity(act.id); setEditText(act.description); }} className="p-1 hover:bg-muted rounded" data-testid={`edit-activity-${act.id}`}>
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDeleteActivity(act.id)} className="p-1 hover:bg-destructive/10 rounded" data-testid={`delete-activity-${act.id}`}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <p className="text-[12px] text-muted-foreground py-3 text-center">No activities yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-[13px]" data-testid="btn-save">
            <Save className="w-4 h-4 mr-1.5" /> Save
          </Button>
        </div>
      </DialogContent>

      <style>{`
        .field-input {
          height: 36px;
          padding: 0 12px;
          font-size: 13px;
          border: 1px solid hsl(var(--border) / 0.4);
          border-radius: 8px;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          flex: 1;
          outline: none;
        }
        .field-input:focus {
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
          border-color: hsl(var(--primary));
        }
      `}</style>
    </Dialog>
  );
}

function FieldRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
      {!icon && <span className="w-4" />}
      <span className="text-[13px] text-muted-foreground w-16 flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}

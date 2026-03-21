import React, { useState } from 'react';
import { ArrowLeft, Wine, ConciergeBell, CreditCard, Trash2, Plus, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const TABS = ['payments', 'team', 'modules'];
const TAB_LABELS = { payments: 'Payments', team: 'Team', modules: 'Modules' };

const ROLES = ['Manager', 'Host', 'Server', 'Bartender', 'Kitchen', 'Cashier'];

const MODULE_DEFS = [
  { id: 'pulse', label: 'Pulse', desc: 'Membership & identity' },
  { id: 'tap', label: 'Tap', desc: 'Individual orders' },
  { id: 'table', label: 'Table', desc: 'Table management' },
  { id: 'kds', label: 'KDS', desc: 'Kitchen display' },
  { id: 'reservations', label: 'Reservations', desc: 'Booking system' },
  { id: 'events', label: 'Events', desc: 'Event management' },
];

const PAYMENT_OPTIONS = [
  {
    key: 'bartendersCanCloseChecks',
    label: 'Bartenders',
    desc: 'Allow bartenders to close checks and receive payments',
    icon: Wine,
    group: 'staff',
  },
  {
    key: 'serversCanCloseChecks',
    label: 'Servers',
    desc: 'Allow servers to close checks directly at the table',
    icon: ConciergeBell,
    group: 'staff',
  },
  {
    key: 'cashierOnly',
    label: 'Cashier only',
    desc: 'Payments are handled only by a dedicated cashier',
    icon: CreditCard,
    group: 'cashier',
  },
];

export default function InitialSetupStep({ data, updateData, onNext, onBack }) {
  const [activeTab, setActiveTab] = useState('payments');

  const handlePaymentToggle = (key, group) => {
    const pf = { ...data.paymentFlow };
    if (group === 'cashier') {
      pf.cashierOnly = !pf.cashierOnly;
      if (pf.cashierOnly) {
        pf.bartendersCanCloseChecks = false;
        pf.serversCanCloseChecks = false;
      }
    } else {
      pf[key] = !pf[key];
      if (pf[key]) {
        pf.cashierOnly = false;
      }
    }
    updateData({ paymentFlow: pf });
  };

  const resetPayments = () => {
    updateData({
      paymentFlow: {
        bartendersCanCloseChecks: false,
        serversCanCloseChecks: false,
        cashierOnly: false,
      },
    });
  };

  const hasPaymentSelection =
    data.paymentFlow.bartendersCanCloseChecks ||
    data.paymentFlow.serversCanCloseChecks ||
    data.paymentFlow.cashierOnly;

  // Team members
  const addTeamMember = () => {
    updateData({
      teamMembers: [...data.teamMembers, { name: '', email: '', role: 'Server' }],
    });
  };

  const updateMember = (idx, field, value) => {
    const members = [...data.teamMembers];
    members[idx] = { ...members[idx], [field]: value };
    updateData({ teamMembers: members });
  };

  const removeMember = (idx) => {
    updateData({ teamMembers: data.teamMembers.filter((_, i) => i !== idx) });
  };

  // Modules
  const toggleModule = (id) => {
    const mods = data.enabledModules.includes(id)
      ? data.enabledModules.filter(m => m !== id)
      : [...data.enabledModules, id];
    updateData({ enabledModules: mods });
  };

  // Tab navigation
  const tabIdx = TABS.indexOf(activeTab);

  const handleBack = () => {
    if (tabIdx === 0) {
      onBack();
    } else {
      setActiveTab(TABS[tabIdx - 1]);
    }
  };

  const handleNext = () => {
    if (tabIdx < TABS.length - 1) {
      setActiveTab(TABS[tabIdx + 1]);
    } else {
      onNext();
    }
  };

  const nextLabel = activeTab === 'modules' ? 'Continue' : 'Next';

  return (
    <div data-testid="onboarding-initial-setup" className="w-full space-y-5">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Initial setup
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enable modules, configure payments, and add your team.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
        {TABS.map((tab) => (
          <button
            key={tab}
            data-testid={`setup-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'payments' && (
        <div className="space-y-3" data-testid="setup-payments-content">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Payment Flow</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Define who is responsible for handling payments in your operation.
              </div>
            </div>
            {hasPaymentSelection && (
              <button
                data-testid="reset-payments"
                onClick={resetPayments}
                className="text-primary text-sm font-medium hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          {PAYMENT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = data.paymentFlow[opt.key];
            const disabled =
              (opt.group === 'cashier' && (data.paymentFlow.bartendersCanCloseChecks || data.paymentFlow.serversCanCloseChecks)) ||
              (opt.group === 'staff' && data.paymentFlow.cashierOnly);
            return (
              <button
                key={opt.key}
                data-testid={`payment-${opt.key}`}
                onClick={() => !disabled && handlePaymentToggle(opt.key, opt.group)}
                disabled={disabled}
                className={`w-full p-4 rounded-xl border flex items-start gap-3.5 transition-all text-left ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed border-border bg-card/40'
                    : active
                      ? 'border-primary bg-primary/[0.08]'
                      : 'border-border bg-card/40 hover:border-primary/30'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </div>
                {active && <Check size={16} className="text-primary mt-1 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-3" data-testid="setup-team-content">
          {data.teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No team members added yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can add them now or later from settings.
              </p>
            </div>
          ) : (
            data.teamMembers.map((member, idx) => (
              <div
                key={idx}
                data-testid={`team-member-${idx}`}
                className="p-3 rounded-xl border border-border bg-card/40 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(idx, 'name', e.target.value)}
                    placeholder="Name"
                    className="flex-1 h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={() => removeMember(idx)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => updateMember(idx, 'email', e.target.value)}
                  placeholder="email@venue.com"
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                <select
                  value={member.role}
                  onChange={(e) => updateMember(idx, 'role', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))
          )}

          <Button
            data-testid="add-team-member"
            variant="outline"
            size="sm"
            onClick={addTeamMember}
            className="w-full"
          >
            <Plus size={14} className="mr-1" />
            Add team member
          </Button>

          <button
            data-testid="skip-team"
            onClick={() => setActiveTab('modules')}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="grid grid-cols-2 gap-2.5" data-testid="setup-modules-content">
          {MODULE_DEFS.map((mod) => {
            const active = data.enabledModules.includes(mod.id);
            return (
              <button
                key={mod.id}
                data-testid={`module-${mod.id}`}
                onClick={() => toggleModule(mod.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-primary bg-primary/[0.08] text-foreground'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-primary/30'
                }`}
              >
                <div className="text-sm font-semibold">{mod.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{mod.desc}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          data-testid="setup-back"
          variant="ghost"
          onClick={handleBack}
          className="text-muted-foreground"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <Button
          data-testid="setup-next"
          onClick={handleNext}
          className="flex-1"
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

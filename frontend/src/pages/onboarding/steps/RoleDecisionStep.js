import React from 'react';
import { ArrowLeft, UserCog, Users, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function RoleDecisionStep({ data, updateData, onNext, onBack }) {
  const { isAlsoManager, createManagerNow, managerName, managerEmail } = data;

  const canContinue =
    isAlsoManager === true ||
    (isAlsoManager === false && createManagerNow === false) ||
    (isAlsoManager === false && createManagerNow === true && managerName.trim() && managerEmail.trim());

  return (
    <div data-testid="onboarding-role-decision" className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Your role
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Will you also manage day-to-day operations?
        </p>
      </div>

      {/* Question */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Will you also act as the Manager?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Yes */}
          <button
            data-testid="role-yes"
            onClick={() => updateData({ isAlsoManager: true, createManagerNow: null, managerName: '', managerEmail: '' })}
            className={`p-5 rounded-xl border transition-all text-left ${
              isAlsoManager === true
                ? 'border-primary bg-primary/[0.08] text-foreground'
                : 'border-border bg-card/50 text-foreground/60 hover:border-primary/30'
            }`}
          >
            <UserCog size={24} className={isAlsoManager === true ? 'text-primary mb-2' : 'mb-2'} />
            <div className="text-sm font-semibold">Yes</div>
            <div className="text-xs text-muted-foreground mt-0.5">Owner + Manager</div>
          </button>

          {/* No */}
          <button
            data-testid="role-no"
            onClick={() => updateData({ isAlsoManager: false })}
            className={`p-5 rounded-xl border transition-all text-left ${
              isAlsoManager === false
                ? 'border-primary bg-primary/[0.08] text-foreground'
                : 'border-border bg-card/50 text-foreground/60 hover:border-primary/30'
            }`}
          >
            <Users size={24} className={isAlsoManager === false ? 'text-primary mb-2' : 'mb-2'} />
            <div className="text-sm font-semibold">No</div>
            <div className="text-xs text-muted-foreground mt-0.5">Someone else manages</div>
          </button>
        </div>
      </div>

      {/* Sub-question if No */}
      {isAlsoManager === false && (
        <div className="p-4 rounded-xl bg-card/60 border border-border/50 space-y-3">
          <label className="text-sm font-medium text-foreground">Create your Manager now?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="create-manager-yes"
              onClick={() => updateData({ createManagerNow: true })}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                createManagerNow === true
                  ? 'border-primary bg-primary/[0.08] text-foreground'
                  : 'border-border bg-card/40 text-foreground/60 hover:border-primary/30'
              }`}
            >
              Yes, now
            </button>
            <button
              data-testid="create-manager-later"
              onClick={() => updateData({ createManagerNow: false, managerName: '', managerEmail: '' })}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                createManagerNow === false
                  ? 'border-primary bg-primary/[0.08] text-foreground'
                  : 'border-border bg-card/40 text-foreground/60 hover:border-primary/30'
              }`}
            >
              Later
            </button>
          </div>

          {/* Manager Form */}
          {createManagerNow === true && (
            <div className="space-y-3 mt-3">
              <input
                data-testid="manager-name-input"
                type="text"
                value={managerName}
                onChange={(e) => updateData({ managerName: e.target.value })}
                placeholder="Jane Smith"
                className="w-full h-11 px-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <input
                data-testid="manager-email-input"
                type="email"
                value={managerEmail}
                onChange={(e) => updateData({ managerEmail: e.target.value })}
                placeholder="jane@venue.com"
                className="w-full h-11 px-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          data-testid="onboarding-role-back"
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <Button
          data-testid="onboarding-role-continue"
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

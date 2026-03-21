import React from 'react';
import { ArrowLeft, Building2, Utensils, Music, Wine, Beer, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const VENUE_TYPES = [
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'club', label: 'Club', icon: Music },
  { id: 'lounge', label: 'Lounge', icon: Wine },
  { id: 'bar', label: 'Bar', icon: Beer },
];

export default function ConfirmAccountStep({ data, updateData, onNext, onBack }) {
  const toggleType = (id) => {
    const types = data.venueType.includes(id)
      ? data.venueType.filter(t => t !== id)
      : [...data.venueType, id];
    updateData({ venueType: types });
  };

  const canContinue = data.venueName.trim().length > 0 && data.venueType.length > 0;

  return (
    <div data-testid="onboarding-confirm-account" className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Your venue starts here
        </h1>
        <p className="text-foreground/60 text-sm mt-1">
          Set up your operation and go live in minutes.
        </p>
      </div>

      {/* Venue Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Venue name</label>
        <div className="relative">
          <Building2
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
          />
          <input
            data-testid="onboarding-venue-name"
            type="text"
            value={data.venueName}
            onChange={(e) => updateData({ venueName: e.target.value })}
            placeholder="Demo Club"
            className="w-full h-11 pl-10 pr-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Venue Type */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <label className="text-sm font-medium text-foreground">Type of operation</label>
          <span className="text-foreground/50 text-sm">(select all that apply)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {VENUE_TYPES.map((vt) => {
            const selected = data.venueType.includes(vt.id);
            const Icon = vt.icon;
            return (
              <button
                key={vt.id}
                data-testid={`venue-type-${vt.id}`}
                onClick={() => toggleType(vt.id)}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  selected
                    ? 'border-primary bg-primary/[0.08] text-foreground'
                    : 'border-border bg-card/50 text-foreground/60 hover:border-primary/30 hover:bg-card'
                }`}
              >
                <Icon size={20} className={selected ? 'text-primary' : ''} />
                <span className="text-sm font-medium">{vt.label}</span>
                {selected && <Check size={16} className="text-primary ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          data-testid="onboarding-confirm-back"
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <Button
          data-testid="onboarding-confirm-continue"
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

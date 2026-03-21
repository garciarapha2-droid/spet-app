import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, DoorOpen, Clock, Armchair, Crown, Users, Bell, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const FLOW_STEPS = [
  { label: 'Guest arrives', icon: DoorOpen },
  { label: 'Added to waitlist', icon: Clock },
  { label: 'VIP detected', icon: Crown },
  { label: 'Table available', icon: Armchair },
  { label: 'Seated instantly', icon: Check },
];

const PREVIEW_STEPS = [
  { name: 'Anna', badge: 'VIP', color: 'text-amber-400', label: 'Arrives at door', icon: DoorOpen },
  { name: 'Marcus', badge: null, color: '', label: 'Added to waitlist', icon: Clock },
  { name: 'Table 7', badge: null, color: 'text-emerald-400', label: 'Becomes available', icon: Armchair },
  { name: 'Anna', badge: 'VIP', color: 'text-amber-400', label: 'Seated instantly (priority)', icon: Crown },
];

export default function ReservationSetup({ data, updateData, onNext, onBack }) {
  const rs = data.reservationSettings;
  const [quickApplied, setQuickApplied] = useState(rs.useQuickSetup);
  const [activePreview, setActivePreview] = useState(0);

  const update = (partial) => {
    updateData({ reservationSettings: { ...rs, ...partial } });
  };

  // Animate preview
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePreview(p => (p + 1) % PREVIEW_STEPS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const applyQuickSetup = () => {
    update({
      useQuickSetup: true,
      waitlistEnabled: true,
      avgWaitTime: '15',
      vipPriority: true,
      guestNotifications: true,
      smartFlow: true,
    });
    setQuickApplied(true);
  };

  return (
    <div data-testid="onboarding-reservation-setup" className="w-full max-w-4xl mx-auto pb-28 space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <DoorOpen size={24} className="text-primary" />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Control Your Door Like a Pro
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Manage reservations, waitlists, and VIP guests in real time &mdash; without chaos.
        </p>
      </div>

      {/* Live Preview */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">Live Preview</span>
        </div>
        <div className="space-y-2">
          {PREVIEW_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activePreview;
            const isPast = i < activePreview;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                  isActive ? 'opacity-100 scale-100 bg-muted/60 border border-border/60' : isPast ? 'opacity-50' : 'opacity-30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/10' : 'bg-muted/30'}`}>
                  <Icon size={14} className={step.color || 'text-muted-foreground'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{step.name}</span>
                    {step.badge && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{step.label}</span>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <ChevronRight size={12} className="text-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Setup */}
      <div className={`rounded-2xl border p-5 transition-all ${
        quickApplied ? 'border-primary/30 bg-primary/[0.03]' : 'border-border/60 bg-card/50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Recommended Setup</span>
              <span className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">Most venues</span>
            </div>
          </div>
          {quickApplied && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Check size={12} /> Applied
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {['Waitlist ON', 'Walk-ins ON', 'VIP Priority', 'Smart Estimation'].map(tag => (
            <span key={tag} className="text-xs bg-muted/40 px-2 py-1 rounded-full text-muted-foreground">{tag}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={applyQuickSetup}>{quickApplied ? 'Applied' : 'Use this setup'}</Button>
          <button onClick={() => setQuickApplied(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Customize manually
          </button>
        </div>
      </div>

      {/* Impact Panel */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['~40%', 'Faster seating', 'quicker decisions'],
          ['-60%', 'Wait time', 'reduced confusion'],
          ['+25%', 'Table turnover', 'increased efficiency'],
        ].map(([num, l1, l2]) => (
          <div key={l1} className="p-3 rounded-xl bg-muted/20 text-center">
            <div className="text-lg font-bold text-foreground">{num}</div>
            <div className="text-xs text-muted-foreground">{l1}</div>
            <div className="text-[10px] text-muted-foreground">{l2}</div>
          </div>
        ))}
      </div>

      {/* Table Capacity */}
      <div className="space-y-3">
        <span className="text-sm font-bold text-foreground">Table Capacity</span>
        <div className="grid grid-cols-4 gap-3">
          {[
            ['Total tables', 'totalTables'],
            ['Small 2\u20134', 'smallTables'],
            ['Medium 4\u20136', 'mediumTables'],
            ['Large 6+', 'largeTables'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
              <input
                type="number"
                value={rs[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-full h-9 px-3 bg-muted/30 border border-border/40 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">You can customize the full layout later</p>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        {[
          { key: 'waitlistEnabled', label: 'Waitlist behavior', icon: Users, badge: null, extra: true },
          { key: 'vipPriority', label: 'VIP Priority', icon: Crown, badge: 'Recommended', extra: false },
          { key: 'guestNotifications', label: 'Guest notifications', icon: Bell, badge: null, extra: false },
          { key: 'smartFlow', label: 'Smart Flow', icon: Sparkles, badge: 'AI-powered', extra: false },
        ].map((setting) => {
          const Icon = setting.icon;
          return (
            <div key={setting.key} className="flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card/50">
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{setting.label}</span>
                  {setting.badge && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{setting.badge}</span>
                  )}
                </div>
                {setting.extra && rs.waitlistEnabled && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Avg wait time:</span>
                    <input
                      type="number"
                      value={rs.avgWaitTime}
                      onChange={(e) => update({ avgWaitTime: e.target.value })}
                      className="w-16 h-7 px-2 bg-background border border-border rounded-md text-xs text-foreground outline-none"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => update({ [setting.key]: !rs[setting.key] })}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-1 ${rs[setting.key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ left: rs[setting.key] ? '22px' : '2px' }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Mini Flow Preview */}
      <div className="space-y-3">
        <span className="text-sm font-bold text-foreground">How it works</span>
        <div className="flex items-center gap-1 flex-wrap">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.label}>
                <div
                  className="flex flex-col items-center gap-1 p-2"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-center">
                    <Icon size={16} className="text-muted-foreground" />
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center">{step.label}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight size={12} className="text-muted-foreground/40 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onNext} className="text-muted-foreground text-sm">
              Skip for now
            </Button>
            <Button data-testid="reservation-activate" onClick={onNext}>
              Activate Reservation System
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

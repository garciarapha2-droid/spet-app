import React, { useState } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { Gift, Star, Trophy, Lock } from 'lucide-react';

export const PulseRewardsPage = () => {
  const [venue, setVenue] = useState('demo-club');

  return (
    <div className="min-h-screen bg-background" data-testid="rewards-page">
      <PulseHeader venue={venue} onVenueChange={setVenue} />
      <main className="w-full px-16 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold mb-3">Loyalty & Rewards</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            Points, tiers, and rewards for your guests. This module is a paid add-on.
          </p>

          <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="p-6 rounded-xl border border-border text-center space-y-3 opacity-60">
              <Star className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Points</h3>
              <p className="text-sm text-muted-foreground">Earn points per visit and spend</p>
            </div>
            <div className="p-6 rounded-xl border border-border text-center space-y-3 opacity-60">
              <Trophy className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Tiers</h3>
              <p className="text-sm text-muted-foreground">Bronze, Silver, Gold, Platinum</p>
            </div>
            <div className="p-6 rounded-xl border border-border text-center space-y-3 opacity-60">
              <Gift className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Rewards</h3>
              <p className="text-sm text-muted-foreground">Free drinks, VIP access, merch</p>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Contact sales to enable this add-on</span>
          </div>
        </div>
      </main>
    </div>
  );
};

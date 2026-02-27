import React, { useState } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { Input } from '../../components/ui/input';
import { Users, Activity, Zap, UserPlus } from 'lucide-react';

export const PulseEntryPage = () => {
  const [venue, setVenue] = useState('demo-club');
  const [scanInput, setScanInput] = useState('');
  const [guestsInside, setGuestsInside] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [pointsIssued, setPointsIssued] = useState(0);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (scanInput.trim()) {
      console.log('Scanning:', scanInput);
      setScanInput('');
    }
  };

  const handleManualEntry = () => {
    console.log('Manual entry clicked');
  };

  return (
    <div className="min-h-screen bg-background">
      <PulseHeader venue={venue} onVenueChange={setVenue} />

      {/* Full-width main content - Desktop-first, expansive */}
      <main className="px-12 py-12">
        {/* Page Title - Full width */}
        <div className="mb-16">
          <h2 className="text-4xl font-semibold mb-3 tracking-tight">Loyalty & Presence</h2>
          <p className="text-lg text-muted-foreground">
            Manage guest entries, track presence, and award loyalty points
          </p>
        </div>

        {/* KPI Cards - Full width grid, expansive */}
        <div className="grid grid-cols-3 gap-12 mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="h-5 w-5 text-primary" />
              <span>Guests Inside</span>
            </div>
            <div className="text-7xl font-semibold tracking-tight">{guestsInside}</div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Activity className="h-5 w-5 text-primary" />
              <span>Total Visits</span>
            </div>
            <div className="text-7xl font-semibold tracking-tight">{totalVisits}</div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Zap className="h-5 w-5 text-primary" />
              <span>Points Issued</span>
            </div>
            <div className="text-7xl font-semibold tracking-tight">{pointsIssued}</div>
          </div>
        </div>

        {/* Scan & Manual Entry - Horizontal distribution across full width */}
        <div className="grid grid-cols-12 gap-8 mb-20">
          {/* Scan NFC Tag - Takes 8 columns, dominant presence */}
          <div className="col-span-8">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Scan NFC Tag
              </h3>
            </div>
            <form onSubmit={handleScanSubmit}>
              <Input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Waiting for scan..."
                className="h-28 text-3xl border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                autoFocus
                data-testid="nfc-scan-input"
              />
              <p className="text-base text-muted-foreground mt-5">
                Place tag on reader or type UID manually and press Enter
              </p>
            </form>
          </div>

          {/* Manual Entry - Takes 4 columns, balanced */}
          <div 
            className="col-span-4 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-colors group"
            onClick={handleManualEntry}
          >
            <div className="flex flex-col items-center justify-center h-full py-16 px-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manual Entry</h3>
              <p className="text-base text-muted-foreground text-center">Without NFC tag</p>
            </div>
          </div>
        </div>

        {/* Guests List - Full width, expansive table area */}
        <div className="border-t border-border pt-16">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-3xl font-semibold">Guests Hoje</h3>
            <p className="text-muted-foreground">0 guests</p>
          </div>
          
          {/* Empty state - centered but within full-width context */}
          <div className="flex items-center justify-center py-32 text-muted-foreground text-lg">
            No guests registered yet
          </div>
        </div>
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { Input } from '../../components/ui/input';
import { Users, Activity, Zap, UserPlus } from 'lucide-react';

export const PulseEntryPage = () => {
  const [venue, setVenue] = useState('demo-club');
  const [scanInput, setScanInput] = useState('');
  const [guestsInside] = useState(0);
  const [totalVisits] = useState(0);
  const [pointsIssued] = useState(0);

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

      {/* FULL WIDTH - No max-width constraints */}
      <main className="w-full px-16 py-16">
        {/* Page Title */}
        <div className="mb-20">
          <h2 className="text-5xl font-semibold mb-4 tracking-tight">Loyalty & Presence</h2>
          <p className="text-xl text-muted-foreground">
            Manage guest entries, track presence, and award loyalty points
          </p>
        </div>

        {/* KPI Cards - Full width, 3 columns */}
        <div className="grid grid-cols-3 gap-16 mb-24">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="h-6 w-6 text-primary" />
              <span>Guests Inside</span>
            </div>
            <div className="text-8xl font-semibold tracking-tight">{guestsInside}</div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Activity className="h-6 w-6 text-primary" />
              <span>Total Visits</span>
            </div>
            <div className="text-8xl font-semibold tracking-tight">{totalVisits}</div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Zap className="h-6 w-6 text-primary" />
              <span>Points Issued</span>
            </div>
            <div className="text-8xl font-semibold tracking-tight">{pointsIssued}</div>
          </div>
        </div>

        {/* Scan & Manual Entry - 12 column grid, 8/4 split */}
        <div className="grid grid-cols-12 gap-10 mb-24">
          {/* Scan NFC - 8 columns */}
          <div className="col-span-8">
            <div className="mb-6">
              <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wider">
                Scan NFC Tag
              </h3>
            </div>
            <form onSubmit={handleScanSubmit}>
              <Input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Waiting for scan..."
                className="h-32 text-4xl border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 rounded-xl transition-all"
                autoFocus
                data-testid="nfc-scan-input"
              />
              <p className="text-base text-muted-foreground mt-6">
                Place tag on reader or type UID manually and press Enter
              </p>
            </form>
          </div>

          {/* Manual Entry - 4 columns */}
          <div 
            className="col-span-4 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all group"
            onClick={handleManualEntry}
          >
            <div className="flex flex-col items-center justify-center h-full py-20 px-10">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Manual Entry</h3>
              <p className="text-base text-muted-foreground text-center">Without NFC tag</p>
            </div>
          </div>
        </div>

        {/* Guests List - Full width */}
        <div className="border-t border-border pt-20">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-4xl font-semibold">Guests Hoje</h3>
            <p className="text-xl text-muted-foreground">0 guests</p>
          </div>
          
          <div className="flex items-center justify-center py-40 text-muted-foreground text-xl">
            No guests registered yet
          </div>
        </div>
      </main>
    </div>
  );
};

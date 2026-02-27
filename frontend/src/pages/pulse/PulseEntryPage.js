import React, { useState } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
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

      <main className="container mx-auto px-8 py-12 max-w-7xl">
        {/* Page Title - More editorial, generous spacing */}
        <div className="mb-16">
          <h2 className="text-4xl font-semibold mb-3 tracking-tight">Loyalty & Presence</h2>
          <p className="text-lg text-muted-foreground">
            Manage guest entries, track presence, and award loyalty points
          </p>
        </div>

        {/* KPI Cards - Bigger, more prominent, less bordered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="h-5 w-5 text-primary" />
              <span>Guests Inside</span>
            </div>
            <div className="text-6xl font-semibold tracking-tight">{guestsInside}</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Activity className="h-5 w-5 text-primary" />
              <span>Total Visits</span>
            </div>
            <div className="text-6xl font-semibold tracking-tight">{totalVisits}</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Zap className="h-5 w-5 text-primary" />
              <span>Points Issued</span>
            </div>
            <div className="text-6xl font-semibold tracking-tight">{pointsIssued}</div>
          </div>
        </div>

        {/* Scan & Manual Entry - Much bigger, more prominent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Scan NFC Tag - Dominant, large input */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Scan NFC Tag
              </h3>
            </div>
            <form onSubmit={handleScanSubmit}>
              <Input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Waiting for scan..."
                className="h-24 text-2xl border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                autoFocus
                data-testid="nfc-scan-input"
              />
              <p className="text-sm text-muted-foreground mt-4">
                Place tag on reader or type UID manually and press Enter
              </p>
            </form>
          </div>

          {/* Manual Entry - Bigger, cleaner */}
          <div 
            className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg cursor-pointer transition-colors group"
            onClick={handleManualEntry}
          >
            <div className="flex flex-col items-center justify-center h-full py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manual Entry</h3>
              <p className="text-sm text-muted-foreground text-center">Without NFC tag</p>
            </div>
          </div>
        </div>

        {/* Guests List - More editorial, less card-like */}
        <div className="border-t border-border pt-12">
          <h3 className="text-2xl font-semibold mb-8">Guests Hoje</h3>
          <div className="flex items-center justify-center py-20 text-muted-foreground text-lg">
            No guests registered yet
          </div>
        </div>
      </main>
    </div>
  );
};

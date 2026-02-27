import React, { useState } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
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
      // TODO: Handle NFC scan
      console.log('Scanning:', scanInput);
      setScanInput('');
    }
  };

  const handleManualEntry = () => {
    // TODO: Navigate to manual guest entry
    console.log('Manual entry clicked');
  };

  return (
    <div className="min-h-screen bg-background">
      <PulseHeader venue={venue} onVenueChange={setVenue} />

      <main className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Loyalty & Presence</h2>
          <p className="text-muted-foreground">
            Manage guest entries, track presence, and award loyalty points
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Users className="h-4 w-4 inline mr-2 text-primary" />
                GUESTS INSIDE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{guestsInside}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Activity className="h-4 w-4 inline mr-2 text-primary" />
                TOTAL VISITS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalVisits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Zap className="h-4 w-4 inline mr-2 text-primary" />
                POINTS ISSUED
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pointsIssued}</div>
            </CardContent>
          </Card>
        </div>

        {/* Scan & Manual Entry Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Scan NFC Tag */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                SCAN NFC TAG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScanSubmit}>
                <Input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Waiting for scan..."
                  className="h-16 text-lg border-2 border-primary focus:border-primary focus:ring-primary"
                  autoFocus
                  data-testid="nfc-scan-input"
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Place tag on reader or type UID manually and press Enter
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleManualEntry}>
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <UserPlus className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Manual Entry</h3>
              <p className="text-sm text-muted-foreground text-center">Without NFC tag</p>
            </CardContent>
          </Card>
        </div>

        {/* Guests List */}
        <Card>
          <CardHeader>
            <CardTitle>Guests Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No guests registered yet
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

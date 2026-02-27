import React, { useState, useEffect } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { useNavigate } from 'react-router-dom';
import { Beer } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const PulseBarPage = () => {
  const [venue, setVenue] = useState('demo-club');
  const navigate = useNavigate();

  // Auto-redirect to TAP after a brief moment
  useEffect(() => {
    const t = setTimeout(() => navigate('/tap'), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background" data-testid="bar-page">
      <PulseHeader venue={venue} onVenueChange={setVenue} />
      <main className="w-full px-16 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Beer className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold mb-3">Redirecting to TAP...</h2>
          <p className="text-muted-foreground mb-8">Opening bar mode</p>
          <Button onClick={() => navigate('/tap')} data-testid="go-to-tap-btn">
            Open TAP Now
          </Button>
        </div>
      </main>
    </div>
  );
};

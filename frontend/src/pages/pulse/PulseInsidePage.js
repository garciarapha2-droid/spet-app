import React, { useState, useEffect, useCallback } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI } from '../../services/api';
import { toast } from 'sonner';
import { Users, Crown, LogIn, Clock, User } from 'lucide-react';
import { Button } from '../../components/ui/button';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseInsidePage = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInside = useCallback(async () => {
    try {
      const res = await pulseAPI.getInsideGuests(VENUE_ID());
      setGuests(res.data.guests || []);
    } catch (err) {
      console.error('Failed to load inside guests:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadInside(); }, [loadInside]);

  const handleExit = async (guestId, guestName) => {
    try {
      const fd = new FormData();
      fd.append('guest_id', guestId);
      fd.append('venue_id', VENUE_ID());
      await pulseAPI.registerExit(fd);
      toast.success(`${guestName} exited`);
      await loadInside();
    } catch (err) {
      toast.error('Failed to register exit');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="inside-page">
      <PulseHeader />
      <main className="w-full px-16 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">Inside Now</h2>
            <p className="text-lg text-muted-foreground mt-2">{guests.length} guest{guests.length !== 1 ? 's' : ''} currently inside</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <span className="text-6xl font-bold" data-testid="inside-count">{guests.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : guests.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-xl">No guests inside right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {guests.map((g) => (
              <div key={g.guest_id}
                className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-primary/30 transition-all"
                data-testid={`inside-guest-${g.guest_id}`}>
                {g.guest_photo ? (
                  <img src={g.guest_photo} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{g.guest_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <LogIn className="h-3 w-3" />
                    <span>{new Date(g.entered_at).toLocaleTimeString()}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{g.entry_type?.replace(/_/g, ' ')}</span>
                  </div>
                  {g.tags?.includes('vip') && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Crown className="h-3 w-3" /> VIP
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExit(g.guest_id, g.guest_name)}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  data-testid={`exit-btn-${g.guest_id}`}>
                  Exit
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

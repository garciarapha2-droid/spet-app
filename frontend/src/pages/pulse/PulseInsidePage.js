import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI } from '../../services/api';
import { toast } from 'sonner';
import { Users, Crown, LogIn, User, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseInsidePage = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleExit = async (e, guestId, guestName) => {
    e.stopPropagation();
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

  const filtered = search
    ? guests.filter(g => g.guest_name.toLowerCase().includes(search.toLowerCase()))
    : guests;

  return (
    <div className="min-h-screen bg-background" data-testid="inside-page">
      <PulseHeader />
      <main className="w-full px-16 py-10 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inside Now</h2>
            <p className="text-lg text-muted-foreground mt-1">{guests.length} guest{guests.length !== 1 ? 's' : ''} currently inside</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <span className="text-5xl font-bold" data-testid="inside-count">{guests.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guest..." className="pl-10" data-testid="inside-search" />
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-xl">{search ? 'No matches' : 'No guests inside right now'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((g) => (
              <div key={g.guest_id}
                onClick={() => navigate(`/pulse/guest/${g.guest_id}`)}
                className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
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
                <Button variant="outline" size="sm"
                  onClick={(e) => handleExit(e, g.guest_id, g.guest_name)}
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

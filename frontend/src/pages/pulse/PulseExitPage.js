import React, { useState, useEffect, useCallback } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI } from '../../services/api';
import { toast } from 'sonner';
import { LogOut, User, Search, Clock } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const VENUE_ID = '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseExitPage = () => {
  const [venue, setVenue] = useState('demo-club');
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentExits, setRecentExits] = useState([]);

  const loadInside = useCallback(async () => {
    try {
      const res = await pulseAPI.getInsideGuests(VENUE_ID);
      setGuests(res.data.guests || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadInside(); }, [loadInside]);

  const handleExit = async (guestId, guestName) => {
    try {
      const fd = new FormData();
      fd.append('guest_id', guestId);
      fd.append('venue_id', VENUE_ID);
      await pulseAPI.registerExit(fd);
      toast.success(`${guestName} checked out`);
      setRecentExits(prev => [{ guest_id: guestId, guest_name: guestName, exited_at: new Date().toISOString() }, ...prev]);
      await loadInside();
    } catch (err) {
      toast.error('Failed to register exit');
    }
  };

  const filtered = search
    ? guests.filter(g => g.guest_name.toLowerCase().includes(search.toLowerCase()))
    : guests;

  return (
    <div className="min-h-screen bg-background" data-testid="exit-page">
      <PulseHeader venue={venue} onVenueChange={setVenue} />
      <main className="w-full px-16 py-12">
        <div className="grid grid-cols-12 gap-10">
          {/* Left: Inside guests for exit */}
          <div className="col-span-8">
            <h2 className="text-4xl font-semibold tracking-tight mb-2">Register Exit</h2>
            <p className="text-lg text-muted-foreground mb-8">{guests.length} guest{guests.length !== 1 ? 's' : ''} inside — tap to check out</p>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search guest..." className="pl-10"
                data-testid="exit-search-input" />
            </div>

            {loading ? (
              <div className="py-20 text-center text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <LogOut className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-xl">{search ? 'No matches' : 'No guests inside'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((g) => (
                  <div key={g.guest_id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all cursor-pointer"
                    onClick={() => handleExit(g.guest_id, g.guest_name)}
                    data-testid={`exit-guest-${g.guest_id}`}>
                    {g.guest_photo ? (
                      <img src={g.guest_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{g.guest_name}</p>
                      <p className="text-xs text-muted-foreground">
                        In since {new Date(g.entered_at).toLocaleTimeString()} — {g.entry_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-destructive">
                      <LogOut className="h-5 w-5" />
                      <span className="text-sm font-medium">Exit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Recent exits */}
          <div className="col-span-4 border-l border-border pl-10">
            <h3 className="text-xl font-semibold mb-6">Recent Exits</h3>
            {recentExits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No exits this session</p>
            ) : (
              <div className="space-y-3">
                {recentExits.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.guest_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(e.exited_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

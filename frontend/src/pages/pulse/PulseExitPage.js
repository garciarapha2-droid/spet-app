import React, { useState, useEffect, useCallback } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI } from '../../services/api';
import { toast } from 'sonner';
import { LogOut, User, Search, Clock, ArrowDownRight, ArrowUpRight, AlertTriangle, Ban, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseExitPage = () => {
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayExits, setTodayExits] = useState([]);
  const [exitModal, setExitModal] = useState(null); // { type: 'open_tab'|'blocked', guest, data }

  const loadData = useCallback(async () => {
    try {
      const [insideRes, exitsRes] = await Promise.all([
        pulseAPI.getInsideGuests(VENUE_ID()),
        pulseAPI.getTodayExits(VENUE_ID()),
      ]);
      setGuests(insideRes.data.guests || []);
      setTodayExits(exitsRes.data.exits || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExit = async (guestId, guestName) => {
    // Check for blocked wristband
    try {
      const guestRes = await pulseAPI.getGuest(guestId, VENUE_ID());
      if (guestRes.data.wristband_blocked) {
        setExitModal({ type: 'blocked', guest: { guestId, guestName } });
        return;
      }
    } catch {}
    // Check for open tabs
    try {
      const tabRes = await pulseAPI.getTabStatus(guestId, VENUE_ID());
      if (tabRes.data.has_open_tabs) {
        setExitModal({ type: 'open_tab', guest: { guestId, guestName }, data: tabRes.data });
        return;
      }
    } catch {}
    // All clear — register exit
    try {
      const fd = new FormData();
      fd.append('guest_id', guestId);
      fd.append('venue_id', VENUE_ID());
      await pulseAPI.registerExit(fd);
      toast.success(`${guestName} checked out`);
      await loadData();
    } catch (err) {
      toast.error('Failed to register exit');
    }
  };

  const filtered = search
    ? guests.filter(g => g.guest_name.toLowerCase().includes(search.toLowerCase()))
    : guests;

  return (
    <div className="min-h-screen bg-background" data-testid="exit-page">
      <PulseHeader />
      <main className="w-full px-8 py-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-12 gap-10">
          {/* Left: Inside guests for exit */}
          <div className="col-span-7">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Register Exit</h2>
            <p className="text-lg text-muted-foreground mb-6">{guests.length} guest{guests.length !== 1 ? 's' : ''} inside — tap to check out</p>

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
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all cursor-pointer"
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
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                        In since {new Date(g.entered_at).toLocaleTimeString()} — {g.entry_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <LogOut className="h-4 w-4 mr-1" /> Exit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: All exits today with times */}
          <div className="col-span-5 border-l border-border pl-10">
            <h3 className="text-xl font-semibold mb-6">
              Exits Today <span className="text-muted-foreground font-normal text-base ml-2">({todayExits.length})</span>
            </h3>
            {todayExits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No exits today</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {todayExits.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                    {e.guest_photo ? (
                      <img src={e.guest_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.guest_name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
                        {e.entered_at && (
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                            In: {new Date(e.entered_at).toLocaleTimeString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-destructive" />
                          Out: {new Date(e.exited_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {e.entered_at && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(() => {
                            const ms = new Date(e.exited_at) - new Date(e.entered_at);
                            const h = Math.floor(ms / 3600000);
                            const m = Math.floor((ms % 3600000) / 60000);
                            return `${h}h ${m}m`;
                          })()}
                        </p>
                      </div>
                    )}
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

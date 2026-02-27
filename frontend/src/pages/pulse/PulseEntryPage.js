import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PulseHeader } from '../../components/PulseHeader';
import { GuestIntakeForm } from '../../components/pulse/GuestIntakeForm';
import { DedupeMatches } from '../../components/pulse/DedupeMatches';
import { DecisionCard } from '../../components/pulse/DecisionCard';
import { EntrySuccess } from '../../components/pulse/EntrySuccess';
import { Input } from '../../components/ui/input';
import { pulseAPI } from '../../services/api';
import { toast } from 'sonner';
import { Users, Activity, Zap, UserPlus, ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseEntryPage = () => {
  const navigate = useNavigate();
  const [venue, setVenue] = useState('demo-club');
  // Flow states: idle | intake | dedupe | decision | success
  const [flowState, setFlowState] = useState('idle');
  const [loading, setLoading] = useState(false);

  // Data
  const [venueConfig, setVenueConfig] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [intakeData, setIntakeData] = useState(null);
  const [dedupeMatches, setDedupeMatches] = useState([]);
  const [currentGuest, setCurrentGuest] = useState(null);
  const [entryResult, setEntryResult] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [guestHistory, setGuestHistory] = useState(null);
  const [stats, setStats] = useState({ inside: 0, visits: 0, points: 0 });

  // Load venue config + today's entries on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [cfgRes, entriesRes] = await Promise.all([
          pulseAPI.getVenueConfig(VENUE_ID()),
          pulseAPI.getTodayEntries(VENUE_ID()),
        ]);
        setVenueConfig(cfgRes.data);
        setTodayEntries(entriesRes.data.entries || []);
        setStats({
          inside: entriesRes.data.allowed || 0,
          visits: entriesRes.data.total || 0,
          points: 0,
        });
      } catch (err) {
        console.error('Failed to load venue data:', err);
      }
    };
    load();
  }, []);

  const refreshEntries = useCallback(async () => {
    try {
      const res = await pulseAPI.getTodayEntries(VENUE_ID());
      setTodayEntries(res.data.entries || []);
      setStats({
        inside: res.data.allowed || 0,
        visits: res.data.total || 0,
        points: 0,
      });
    } catch {}
  }, []);

  // ── C0: NFC scan submit ──
  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (scanInput.trim()) {
      toast.info(`NFC scan: ${scanInput} — guest lookup not yet wired`);
      setScanInput('');
    }
  };

  // ── C1: Open intake form ──
  const handleManualEntry = () => setFlowState('intake');

  // ── C1: Submit intake → dedupe check ──
  const handleIntakeSubmit = async (data) => {
    setLoading(true);
    setIntakeData(data);
    try {
      // First check for duplicates
      if (data.email || data.phone) {
        const fd = new FormData();
        fd.append('venue_id', VENUE_ID());
        if (data.email) fd.append('email', data.email);
        if (data.phone) fd.append('phone', data.phone);
        const dedupeRes = await pulseAPI.dedupeSearch(fd);
        if (dedupeRes.data.matches?.length > 0) {
          setDedupeMatches(dedupeRes.data.matches);
          setFlowState('dedupe');
          setLoading(false);
          return;
        }
      }
      // No matches — create guest directly
      await createGuestAndDecide(data);
    } catch (err) {
      toast.error('Failed to check for duplicates');
      console.error(err);
    }
    setLoading(false);
  };

  // ── C1.1: Select existing match ──
  const handleSelectExisting = async (guestId) => {
    setLoading(true);
    try {
      const res = await pulseAPI.getGuest(guestId, VENUE_ID());
      setCurrentGuest(res.data);
      setFlowState('decision');
    } catch (err) {
      toast.error('Failed to load guest');
    }
    setLoading(false);
  };

  // ── C1.1: Create new despite matches ──
  const handleCreateNew = async () => {
    if (intakeData) {
      setLoading(true);
      await createGuestAndDecide(intakeData);
      setLoading(false);
    }
  };

  // ── Helper: create guest in backend, then go to decision ──
  const createGuestAndDecide = async (data) => {
    try {
      const fd = new FormData();
      fd.append('name', data.name);
      fd.append('venue_id', VENUE_ID());
      if (data.email) fd.append('email', data.email);
      if (data.phone) fd.append('phone', data.phone);
      if (data.dob) fd.append('dob', data.dob);
      if (data.photo) fd.append('photo', data.photo);

      const intakeRes = await pulseAPI.guestIntake(fd);
      const guestId = intakeRes.data.guest_id;

      // Load full guest with chips
      const guestRes = await pulseAPI.getGuest(guestId, VENUE_ID());
      setCurrentGuest(guestRes.data);
      setFlowState('decision');
    } catch (err) {
      toast.error('Failed to register guest');
      console.error(err);
    }
  };

  // ── C2: Record decision ──
  const handleDecision = async (decision, entryType, coverAmount, coverPaid) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('guest_id', currentGuest.guest_id);
      fd.append('venue_id', VENUE_ID());      fd.append('decision', decision);
      fd.append('entry_type', entryType);
      fd.append('cover_amount', coverAmount.toString());
      fd.append('cover_paid', coverPaid.toString());

      const res = await pulseAPI.recordDecision(fd);
      setEntryResult({ ...res.data, entry_type: entryType });
      setFlowState('success');
      await refreshEntries();
    } catch (err) {
      toast.error('Failed to record decision');
      console.error(err);
    }
    setLoading(false);
  };

  // ── C3: Done — reset to idle ──
  const handleDone = () => {
    setFlowState('idle');
    setIntakeData(null);
    setDedupeMatches([]);
    setCurrentGuest(null);
    setEntryResult(null);
    setGuestHistory(null);
  };

  // ── View guest history ──
  const handleViewHistory = async (guestId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await pulseAPI.getGuestHistory(guestId, VENUE_ID());
      setGuestHistory(res.data);
      setFlowState('history');
    } catch (err) {
      toast.error('Failed to load history');
    }
  };

  const handleBack = () => {
    if (flowState === 'dedupe') setFlowState('intake');
    else if (flowState === 'decision' && dedupeMatches.length > 0) setFlowState('dedupe');
    else setFlowState('idle');
  };

  // ── Right Panel Content ──
  const renderRightPanel = () => {
    switch (flowState) {
      case 'intake':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBack} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">Guest Registration</h3>
            </div>
            <GuestIntakeForm
              venueConfig={venueConfig}
              onSubmit={handleIntakeSubmit}
              onCancel={() => setFlowState('idle')}
              loading={loading}
            />
          </div>
        );
      case 'dedupe':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBack} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">Duplicate Check</h3>
            </div>
            <DedupeMatches
              matches={dedupeMatches}
              onSelectExisting={handleSelectExisting}
              onCreateNew={handleCreateNew}
              loading={loading}
            />
          </div>
        );
      case 'decision':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBack} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">Entry Decision</h3>
            </div>
            <DecisionCard guest={currentGuest} onDecision={handleDecision} loading={loading} />
          </div>
        );
      case 'success':
        return <EntrySuccess result={entryResult} guest={currentGuest} onDone={handleDone} />;
      case 'history':
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => { setFlowState('idle'); setGuestHistory(null); }} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">Guest History</h3>
            </div>
            {guestHistory && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {guestHistory.guest_photo ? (
                    <img src={guestHistory.guest_photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-semibold" data-testid="history-guest-name">{guestHistory.guest_name}</h4>
                    {guestHistory.guest_email && <p className="text-sm text-muted-foreground">{guestHistory.guest_email}</p>}
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>{guestHistory.visits} visits</span>
                      <span>R${(guestHistory.spend_total || 0).toFixed(0)} spent</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{guestHistory.total} event{guestHistory.total !== 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {guestHistory.history.map((evt, i) => (
                      <div key={evt.entry_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          evt.decision === 'allowed' ? 'bg-green-500/10' :
                          evt.decision === 'exit' ? 'bg-blue-500/10' :
                          'bg-destructive/10'
                        }`}>
                          <Clock className={`h-4 w-4 ${
                            evt.decision === 'allowed' ? 'text-green-500' :
                            evt.decision === 'exit' ? 'text-blue-500' :
                            'text-destructive'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{evt.decision === 'exit' ? 'Exit' : evt.decision}</p>
                          <p className="text-xs text-muted-foreground">{evt.entry_type?.replace(/_/g, ' ')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(evt.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const showRightPanel = flowState !== 'idle';

  return (
    <div className="min-h-screen bg-background">
      <PulseHeader venue={venue} onVenueChange={setVenue} />

      <main className="w-full px-16 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-16 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="h-5 w-5 text-primary" />
              <span>Guests Inside</span>
            </div>
            <div className="text-7xl font-semibold tracking-tight" data-testid="kpi-inside">{stats.inside}</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Activity className="h-5 w-5 text-primary" />
              <span>Total Entries</span>
            </div>
            <div className="text-7xl font-semibold tracking-tight" data-testid="kpi-visits">{stats.visits}</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Zap className="h-5 w-5 text-primary" />
              <span>Denied</span>
            </div>
            <div className="text-7xl font-semibold tracking-tight" data-testid="kpi-denied">
              {todayEntries.filter(e => e.decision === 'denied').length}
            </div>
          </div>
        </div>

        {/* Main area: 12 col grid */}
        <div className={`grid ${showRightPanel ? 'grid-cols-12 gap-10' : 'grid-cols-12 gap-10'}`}>
          {/* Left: Scan + Manual + Guest list */}
          <div className={showRightPanel ? 'col-span-7' : 'col-span-12'}>
            {/* Scan + Manual Entry */}
            <div className="grid grid-cols-12 gap-8 mb-16">
              <div className="col-span-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Scan NFC Tag
                </h3>
                <form onSubmit={handleScanSubmit}>
                  <Input value={scanInput} onChange={e => setScanInput(e.target.value)}
                    placeholder="Waiting for scan..."
                    className="h-24 text-3xl border-2 border-input focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 rounded-xl transition-all"
                    autoFocus={flowState === 'idle'}
                    data-testid="nfc-scan-input" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Place tag on reader or type UID and press Enter
                  </p>
                </form>
              </div>
              <div className="col-span-4 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all group"
                onClick={handleManualEntry} data-testid="manual-entry-btn">
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Manual Entry</h3>
                  <p className="text-sm text-muted-foreground">Without NFC tag</p>
                </div>
              </div>
            </div>

            {/* Today's guest list */}
            <div className="border-t border-border pt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold">Guests Today</h3>
                <p className="text-base text-muted-foreground">{(() => {
                  const unique = {};
                  todayEntries.forEach(e => {
                    if (!unique[e.guest_id] || new Date(e.created_at) > new Date(unique[e.guest_id].created_at)) {
                      unique[e.guest_id] = e;
                    }
                  });
                  return Object.keys(unique).length;
                })()} guests</p>
              </div>
              {todayEntries.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  No guests registered yet
                </div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    // Dedupe: one row per guest, latest action only
                    const unique = {};
                    todayEntries.forEach(e => {
                      if (!unique[e.guest_id] || new Date(e.created_at) > new Date(unique[e.guest_id].created_at)) {
                        unique[e.guest_id] = e;
                      }
                    });
                    return Object.values(unique);
                  })().map((entry) => {
                    const statusLabel = entry.decision === 'allowed' ? 'Inside'
                      : entry.decision === 'exit' ? 'Exited'
                      : entry.decision === 'denied' ? 'Denied' : entry.decision;
                    const statusClass = entry.decision === 'allowed' ? 'bg-green-500/10 text-green-600'
                      : entry.decision === 'exit' ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-destructive/10 text-destructive';

                    return (
                    <div key={entry.guest_id}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectExisting(entry.guest_id)}
                      data-testid={`entry-row-${entry.guest_id}`}>
                      {entry.guest_photo ? (
                        <img src={entry.guest_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{entry.guest_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass}`}>
                        {statusLabel}
                      </span>
                      <button
                        onClick={(e) => handleViewHistory(entry.guest_id, e)}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`history-btn-${entry.guest_id}`}
                        title="View history"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: C1→C3 flow */}
          {showRightPanel && (
            <div className="col-span-5 border-l border-border pl-10" data-testid="flow-panel">
              {renderRightPanel()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

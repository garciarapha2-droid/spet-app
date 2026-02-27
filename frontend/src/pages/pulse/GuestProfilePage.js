import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PulseHeader } from '../../components/PulseHeader';
import { pulseAPI, rewardsAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft, Users, Clock, DollarSign, Calendar, Star,
  LogIn, LogOut as LogOutIcon, ShieldAlert, Award, Ban, ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const GuestProfilePage = () => {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [tabStatus, setTabStatus] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

  const loadData = async () => {
    try {
      const [profileRes, pointsRes, tabRes] = await Promise.all([
        pulseAPI.getGuestProfile(guestId, VENUE_ID()),
        rewardsAPI.getGuestPoints(guestId, VENUE_ID()).catch(() => ({ data: { points: 0, tier: 'None' } })),
        pulseAPI.getTabStatus(guestId, VENUE_ID()).catch(() => ({ data: { has_open_tabs: false, open_tabs: [], total_owed: 0 } })),
      ]);
      setProfile(profileRes.data);
      setPoints(pointsRes.data);
      setTabStatus(tabRes.data);
    } catch (err) {
      toast.error('Failed to load guest profile');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [guestId]);

  const handleBlock = async () => {
    setBlockLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('reason', 'lost');
      await pulseAPI.blockWristband(guestId, fd);
      toast.success('Wristband blocked');
      await loadData();
    } catch { toast.error('Failed to block'); }
    setBlockLoading(false);
  };

  const handleUnblock = async () => {
    setBlockLoading(true);
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      await pulseAPI.unblockWristband(guestId, fd);
      toast.success('Wristband unblocked');
      await loadData();
    } catch { toast.error('Failed to unblock'); }
    setBlockLoading(false);
  };
    load();
  }, [guestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PulseHeader />
        <div className="flex items-center justify-center py-32 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <PulseHeader />
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <p>Guest not found</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Go back</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'history', label: 'History' },
    { key: 'consumptions', label: 'Consumptions' },
    { key: 'events', label: 'Events' },
    { key: 'rewards', label: 'Rewards' },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="guest-profile-page">
      <PulseHeader />
      <main className="w-full max-w-[1200px] mx-auto px-8 py-8">
        {/* Back */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6" data-testid="back-btn">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Wristband Blocked Alert */}
        {profile.wristband_blocked && (
          <div className="mb-6 p-5 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex items-center gap-4" data-testid="blocked-alert">
            <Ban className="h-8 w-8 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-destructive text-lg">WRISTBAND BLOCKED</p>
              <p className="text-sm text-destructive/80">Reason: {profile.wristband_block_reason || 'Lost wristband'}. Cannot make purchases.</p>
            </div>
            <Button variant="outline" onClick={handleUnblock} disabled={blockLoading}
              className="border-destructive/30 text-destructive hover:bg-destructive/10" data-testid="unblock-btn">
              <ShieldCheck className="h-4 w-4 mr-2" /> Unblock
            </Button>
          </div>
        )}

        {/* Open Tab Warning */}
        {tabStatus?.has_open_tabs && (
          <div className="mb-6 p-5 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center gap-4" data-testid="open-tab-alert">
            <AlertTriangle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-yellow-700">Open Tab — R${tabStatus.total_owed.toFixed(2)}</p>
              <p className="text-sm text-yellow-600/80">Guest has {tabStatus.open_tabs.length} open tab{tabStatus.open_tabs.length > 1 ? 's' : ''}. Must pay before exit.</p>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="grid grid-cols-12 gap-8 mb-10">
          {/* Photo + Info */}
          <div className="col-span-8 flex gap-6">
            {profile.photo ? (
              <img src={profile.photo} alt="" className="w-28 h-28 rounded-2xl object-cover border-2 border-border" data-testid="guest-photo" />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight mb-1" data-testid="guest-name">{profile.name}</h2>
              {profile.email && <p className="text-muted-foreground">{profile.email}</p>}
              {profile.phone && <p className="text-muted-foreground">{profile.phone}</p>}
              {profile.dob && <p className="text-sm text-muted-foreground mt-1">DOB: {profile.dob}</p>}

              {/* Tags & Flags */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {profile.flags.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">{f}</span>
                ))}
                {profile.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="col-span-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <LogIn className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold" data-testid="stat-entries">{profile.entries_count}</p>
                <p className="text-xs text-muted-foreground">Entries</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <LogOutIcon className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold" data-testid="stat-exits">{profile.exits_count}</p>
                <p className="text-xs text-muted-foreground">Exits</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold" data-testid="stat-spent">R${(profile.total_spent || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold" data-testid="stat-points">{points?.points || 0}</p>
                <p className="text-xs text-muted-foreground">{points?.tier || 'No tier'}</p>
              </div>
            </div>
            {/* Block Wristband Button */}
            {!profile.wristband_blocked ? (
              <Button variant="outline" onClick={handleBlock} disabled={blockLoading}
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                data-testid="block-wristband-btn">
                <Ban className="h-4 w-4 mr-2" /> Block Wristband
              </Button>
            ) : (
              <Button variant="outline" onClick={handleUnblock} disabled={blockLoading}
                className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10"
                data-testid="unblock-wristband-btn">
                <ShieldCheck className="h-4 w-4 mr-2" /> Unblock Wristband
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tab.key}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'history' && (
          <div className="space-y-2" data-testid="history-tab">
            {profile.history.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No history yet</p>
            ) : profile.history.map((evt, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  evt.decision === 'allowed' ? 'bg-green-500/10' :
                  evt.decision === 'exit' ? 'bg-blue-500/10' :
                  evt.decision === 'denied' ? 'bg-destructive/10' : 'bg-muted'
                }`}>
                  {evt.type === 'exit' ? <LogOutIcon className="h-5 w-5 text-blue-500" /> :
                   evt.decision === 'allowed' ? <LogIn className="h-5 w-5 text-green-500" /> :
                   <ShieldAlert className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">{evt.decision === 'exit' ? 'Exit' : evt.decision}</p>
                  <p className="text-xs text-muted-foreground">{evt.entry_type?.replace(/_/g, ' ')}</p>
                </div>
                {evt.cover_amount > 0 && (
                  <span className="text-sm text-muted-foreground">R${evt.cover_amount}</span>
                )}
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(evt.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'consumptions' && (
          <div data-testid="consumptions-tab">
            {profile.consumptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No purchases yet</p>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Item</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Qty</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Price</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.consumptions.map((c, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3 font-medium">{c.name}</td>
                        <td className="px-5 py-3 text-muted-foreground text-sm">{c.category}</td>
                        <td className="px-5 py-3 text-right">{c.qty}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">R${c.unit_price?.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-medium">R${c.total?.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                          {c.date ? new Date(c.date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td colSpan="4" className="px-5 py-3 font-semibold text-right">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-lg">
                        R${profile.consumptions.reduce((sum, c) => sum + (c.total || 0), 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3" data-testid="events-tab">
            {profile.events_attended.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No events attended yet</p>
            ) : profile.events_attended.map((evt, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{evt.name}</p>
                  <p className="text-sm text-muted-foreground">{evt.date ? new Date(evt.date).toLocaleDateString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rewards' && (
          <div data-testid="rewards-tab">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">{points?.points || 0}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold">{points?.tier || 'None'}</p>
                <p className="text-sm text-muted-foreground">Current Tier</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-xl font-bold">R${(profile.total_spent || 0).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Lifetime Spend</p>
              </div>
            </div>
            {points?.transactions?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recent Transactions</h4>
                <div className="space-y-2">
                  {points.transactions.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                      <span className={`text-sm font-bold ${t.points > 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {t.points > 0 ? '+' : ''}{t.points}
                      </span>
                      <span className="text-sm text-muted-foreground flex-1">{t.reason}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

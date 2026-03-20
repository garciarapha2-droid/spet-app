import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { venueAPI, pulseAPI, staffAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  MapPin, LogOut, Sparkles, Users, CreditCard, LayoutGrid,
  UtensilsCrossed, BarChart3, Building2, Crown, ChevronDown,
  X, Search, Trash2, UserPlus, Briefcase, DollarSign, Clock, Power,
  Activity, Fingerprint, UserCog, Sun, Moon, Loader2, RefreshCw
} from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '';

/* ─── Event Detail Panel ────────────────────────────────────────── */
function EventDetailPanel({ event, venueId, onClose, onEventEnded }) {
  const [tab, setTab] = useState('guests');
  const [guests, setGuests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [barmen, setBarmen] = useState([]);
  const [showStaffAdd, setShowStaffAdd] = useState(false);
  const [newStaff, setNewStaff] = useState({ staff_id: '', role: 'server', hourly_rate: '' });
  const [ending, setEnding] = useState(false);

  const loadGuests = useCallback(async () => {
    try {
      const res = await venueAPI.getEventGuests(venueId, event.id);
      setGuests(res.data.guests || []);
    } catch {}
  }, [venueId, event.id]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await venueAPI.getEventStaff(venueId, event.id);
      setStaff(res.data.staff || []);
    } catch {}
  }, [venueId, event.id]);

  const loadBarmen = useCallback(async () => {
    try {
      const res = await staffAPI.getBarmen(venueId);
      setBarmen(res.data.barmen || []);
    } catch {}
  }, [venueId]);

  useEffect(() => { loadGuests(); loadStaff(); loadBarmen(); }, [loadGuests, loadStaff, loadBarmen]);

  // Debounced guest search
  useEffect(() => {
    if (!guestSearch.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await pulseAPI.searchGuests(venueId, guestSearch.trim());
        // Filter out guests already in event
        const existingIds = new Set(guests.map(g => g.guest_id));
        setSearchResults((res.data.guests || []).filter(g => !existingIds.has(g.id)));
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [guestSearch, venueId, guests]);

  const addGuest = async (guestId) => {
    try {
      const fd = new FormData();
      fd.append('guest_id', guestId);
      await venueAPI.addGuestToEvent(venueId, event.id, fd);
      await loadGuests();
      setGuestSearch('');
      setSearchResults([]);
      toast.success('Guest added');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  const removeGuest = async (guestId) => {
    try {
      await venueAPI.removeGuestFromEvent(venueId, event.id, guestId);
      await loadGuests();
      toast.success('Guest removed');
    } catch { toast.error('Failed'); }
  };

  const assignStaff = async () => {
    if (!newStaff.staff_id || !newStaff.hourly_rate) { toast.error('Select staff and set rate'); return; }
    try {
      const fd = new FormData();
      fd.append('staff_id', newStaff.staff_id);
      fd.append('role', newStaff.role);
      fd.append('hourly_rate', parseFloat(newStaff.hourly_rate).toString());
      await venueAPI.assignStaffToEvent(venueId, event.id, fd);
      await loadStaff();
      setNewStaff({ staff_id: '', role: 'server', hourly_rate: '' });
      setShowStaffAdd(false);
      toast.success('Staff assigned');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  const removeStaffMember = async (staffId) => {
    try {
      await venueAPI.removeStaffFromEvent(venueId, event.id, staffId);
      await loadStaff();
      toast.success('Staff removed');
    } catch { toast.error('Failed'); }
  };

  const endEvent = async () => {
    if (!window.confirm('End this event? Guest presence will be cleared (guest data is preserved in Pulse).')) return;
    setEnding(true);
    try {
      const res = await venueAPI.endEvent(venueId, event.id);
      toast.success(`Event ended. ${res.data.guests_cleared} guests cleared.`);
      onEventEnded?.();
    } catch { toast.error('Failed'); }
    setEnding(false);
  };

  const isEnded = event.is_active === false;
  const availableBarmen = barmen.filter(b => !staff.some(s => s.staff_id === b.id));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="event-detail-panel">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h3 className="font-bold text-base" data-testid="event-detail-name">{event.name}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {event.cover_price > 0 && <span>Cover: ${event.cover_price}</span>}
            <span className={`px-2 py-0.5 rounded-full font-medium ${isEnded ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              {isEnded ? 'Ended' : 'Active'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEnded && (
            <Button size="sm" variant="outline" onClick={endEvent} disabled={ending} className="text-red-500 border-red-500/30 hover:bg-red-500/5" data-testid="end-event-btn">
              <Power className="h-3.5 w-3.5 mr-1" /> End Event
            </Button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'guests', label: 'Guests', icon: Users, count: guests.length },
          { key: 'staff', label: 'Staff', icon: Briefcase, count: staff.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`event-tab-${t.key}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* === GUESTS TAB === */}
        {tab === 'guests' && (
          <div>
            {!isEnded && (
              <div className="mb-3 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={guestSearch}
                  onChange={e => setGuestSearch(e.target.value)}
                  placeholder="Search Pulse guests by name..."
                  className="pl-9 h-9"
                  data-testid="event-guest-search"
                />
                {/* Search Dropdown */}
                {(searchResults.length > 0 || searching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ zIndex: 200 }}>
                    {searching && <p className="p-3 text-xs text-muted-foreground text-center">Searching...</p>}
                    {searchResults.map(g => (
                      <button key={g.id} onClick={() => addGuest(g.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                        data-testid={`add-guest-${g.id}`}>
                        {g.photo ? (
                          <img src={g.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground">{g.visits || 0} visits | ${g.spend_total || 0} spent</p>
                        </div>
                        <UserPlus className="h-4 w-4 text-primary shrink-0" />
                      </button>
                    ))}
                    {!searching && searchResults.length === 0 && guestSearch.trim() && (
                      <p className="p-3 text-xs text-muted-foreground text-center">No guests found</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {guests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isEnded ? 'Event ended — guest presence cleared' : 'No guests yet'}</p>
                {!isEnded && <p className="text-xs text-muted-foreground/60 mt-1">Search and add guests from Pulse above</p>}
              </div>
            ) : (
              <div className="space-y-1">
                {guests.map(g => (
                  <div key={g.guest_id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 group" data-testid={`event-guest-${g.guest_id}`}>
                    {g.photo ? (
                      <img src={g.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground">{g.visits || 0} visits | ${g.spend_total || 0} total spend</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {g.tags?.length > 0 && g.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
                      ))}
                      {!isEnded && (
                        <button onClick={() => removeGuest(g.guest_id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                          data-testid={`remove-guest-${g.guest_id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === STAFF TAB === */}
        {tab === 'staff' && (
          <div>
            {!isEnded && (
              <>
                {!showStaffAdd ? (
                  <Button size="sm" variant="outline" className="w-full mb-3" onClick={() => setShowStaffAdd(true)} data-testid="add-staff-btn">
                    <Plus className="h-4 w-4 mr-1" /> Assign Staff
                  </Button>
                ) : (
                  <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3 space-y-2" data-testid="staff-assign-form">
                    <select
                      value={newStaff.staff_id}
                      onChange={e => {
                        const selected = barmen.find(b => b.id === e.target.value);
                        setNewStaff(prev => ({
                          ...prev,
                          staff_id: e.target.value,
                          hourly_rate: selected?.hourly_rate?.toString() || prev.hourly_rate,
                          role: selected?.role || prev.role,
                        }));
                      }}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      data-testid="staff-select">
                      <option value="">Select staff member...</option>
                      {availableBarmen.map(b => (
                        <option key={b.id} value={b.id}>{b.name} — {b.role || 'server'} (${b.hourly_rate || 0}/hr)</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase">Role</label>
                        <Input value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))}
                          placeholder="server" className="h-8 text-sm" data-testid="staff-role-input" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase">$/Hour</label>
                        <Input type="number" step="0.5" value={newStaff.hourly_rate}
                          onChange={e => setNewStaff(p => ({ ...p, hourly_rate: e.target.value }))}
                          placeholder="15" className="h-8 text-sm" data-testid="staff-rate-input" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={assignStaff} data-testid="confirm-staff-btn">Assign</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowStaffAdd(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {staff.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No staff assigned</p>
                {!isEnded && <p className="text-xs text-muted-foreground/60 mt-1">Assign team members above</p>}
              </div>
            ) : (
              <div className="space-y-1">
                {staff.map(s => (
                  <div key={s.staff_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 group" data-testid={`event-staff-${s.staff_id}`}>
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{s.role}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium text-orange-500">${s.hourly_rate}/hr</span>
                      {!isEnded && (
                        <button onClick={() => removeStaffMember(s.staff_id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                          data-testid={`remove-staff-${s.staff_id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-xs">
                  <span className="text-muted-foreground">Total hourly cost:</span>
                  <span className="font-bold text-orange-500">${staff.reduce((sum, s) => sum + (s.hourly_rate || 0), 0).toFixed(2)}/hr</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Event Preview Panel (1-click: quick view) ─────────────────── */
function EventPreviewPanel({ event, venueId, onClose, onEventEnded }) {
  const [guests, setGuests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          venueAPI.getEventGuests(venueId, event.id),
          venueAPI.getEventStaff(venueId, event.id),
        ]);
        setGuests(gRes.data.guests || []);
        setStaff(sRes.data.staff || []);
      } catch {}
    };
    load();
  }, [venueId, event.id]);

  if (!showFull) {
    return (
      <div className="mt-2 bg-card border border-primary/30 rounded-xl p-4" data-testid="event-preview">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Event Preview</h4>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFull(true)} data-testid="manage-event-btn">
              Manage
            </Button>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Guest count */}
          <div className="bg-muted/30 rounded-lg p-3" data-testid="preview-guest-count">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Guests</span>
            </div>
            <p className="text-2xl font-bold">{guests.length}</p>
            <p className="text-[10px] text-muted-foreground">{guests.length > 0 ? 'inside now' : 'no guests yet'}</p>
          </div>

          {/* Staff count */}
          <div className="bg-muted/30 rounded-lg p-3" data-testid="preview-staff-count">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Staff</span>
            </div>
            <p className="text-2xl font-bold">{staff.length}</p>
            <p className="text-[10px] text-muted-foreground">{staff.length > 0 ? 'assigned' : 'no staff yet'}</p>
          </div>
        </div>

        {/* Staff list with names + roles */}
        {staff.length > 0 && (
          <div className="mt-3 space-y-1" data-testid="preview-staff-list">
            {staff.map(s => (
              <div key={s.staff_id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Briefcase className="h-3 w-3 text-orange-500" />
                  </div>
                  <span className="font-medium">{s.name}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">{s.role}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground mt-3">Double-click the event card to enter operations</p>
      </div>
    );
  }

  // Full management view
  return (
    <div className="mt-2">
      <EventDetailPanel event={event} venueId={venueId} onClose={() => { setShowFull(false); onClose(); }} onEventEnded={onEventEnded} />
    </div>
  );
}

/* ─── Create Event Wizard ───────────────────────────────────────── */
function CreateEventWizard({ venueId, date, barmen, onCreated, onCancel }) {
  const [step, setStep] = useState(1);
  const [eventInfo, setEventInfo] = useState({ name: '', cover_price: 0, cover_consumption_price: 0 });
  const [staffList, setStaffList] = useState([]);
  const [newStaff, setNewStaff] = useState({ staff_id: '', role: 'server', hourly_rate: '' });
  const [creating, setCreating] = useState(false);

  const availableBarmen = barmen.filter(b => !staffList.some(s => s.staff_id === b.id));

  const addStaffToList = () => {
    if (!newStaff.staff_id || !newStaff.hourly_rate) return;
    const barman = barmen.find(b => b.id === newStaff.staff_id);
    setStaffList(prev => [...prev, { ...newStaff, name: barman?.name || 'Unknown' }]);
    setNewStaff({ staff_id: '', role: 'server', hourly_rate: '' });
  };

  const handleCreate = async () => {
    if (!eventInfo.name.trim()) { toast.error('Event name required'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', eventInfo.name);
      fd.append('date', date);
      fd.append('cover_price', eventInfo.cover_price.toString());
      fd.append('cover_consumption_price', eventInfo.cover_consumption_price.toString());
      const res = await venueAPI.createEvent(venueId, fd);
      const eventId = res.data.id;

      // Assign staff
      for (const s of staffList) {
        const sfd = new FormData();
        sfd.append('staff_id', s.staff_id);
        sfd.append('role', s.role);
        sfd.append('hourly_rate', parseFloat(s.hourly_rate).toString());
        await venueAPI.assignStaffToEvent(venueId, eventId, sfd);
      }

      toast.success('Event created!');
      onCreated?.();
    } catch { toast.error('Failed'); }
    setCreating(false);
  };

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-5 mb-4" data-testid="create-event-wizard">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
        <div className="flex-1 h-0.5 bg-border"><div className={`h-full transition-all ${step >= 2 ? 'bg-primary w-full' : 'w-0'}`} /></div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
      </div>

      {step === 1 && (
        <div className="space-y-3" data-testid="wizard-step-1">
          <h4 className="font-semibold text-sm">Event Info</h4>
          <Input
            value={eventInfo.name}
            onChange={e => setEventInfo(p => ({ ...p, name: e.target.value }))}
            placeholder="Event name (e.g. Friday Night)"
            data-testid="event-name-input"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Cover ($)</label>
              <Input type="number" value={eventInfo.cover_price}
                onChange={e => setEventInfo(p => ({ ...p, cover_price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cover + Consum. ($)</label>
              <Input type="number" value={eventInfo.cover_consumption_price}
                onChange={e => setEventInfo(p => ({ ...p, cover_consumption_price: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => { if (!eventInfo.name.trim()) { toast.error('Event name required'); return; } setStep(2); }} data-testid="wizard-next-btn">
              Next: Assign Staff
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3" data-testid="wizard-step-2">
          <h4 className="font-semibold text-sm">Assign Staff <span className="text-xs font-normal text-muted-foreground">(optional)</span></h4>

          {/* Add staff form */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <select
                value={newStaff.staff_id}
                onChange={e => {
                  const b = barmen.find(x => x.id === e.target.value);
                  setNewStaff(prev => ({
                    ...prev,
                    staff_id: e.target.value,
                    hourly_rate: b?.hourly_rate?.toString() || prev.hourly_rate,
                    role: b?.role || prev.role,
                  }));
                }}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                data-testid="wizard-staff-select">
                <option value="">Select staff...</option>
                {availableBarmen.map(b => (
                  <option key={b.id} value={b.id}>{b.name} (${b.hourly_rate || 0}/hr)</option>
                ))}
              </select>
            </div>
            <Input value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))}
              placeholder="role" className="w-24 h-9" />
            <Input type="number" step="0.5" value={newStaff.hourly_rate}
              onChange={e => setNewStaff(p => ({ ...p, hourly_rate: e.target.value }))}
              placeholder="$/hr" className="w-20 h-9" />
            <Button size="sm" variant="outline" onClick={addStaffToList} disabled={!newStaff.staff_id || !newStaff.hourly_rate}
              data-testid="wizard-add-staff-btn">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Staff list */}
          {staffList.length > 0 && (
            <div className="space-y-1 bg-muted/20 rounded-lg p-2">
              {staffList.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted/50">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground capitalize">{s.role}</span>
                    <span className="text-orange-500 font-medium">${s.hourly_rate}/hr</span>
                    <button onClick={() => setStaffList(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating} data-testid="wizard-create-btn">
              {creating ? 'Creating...' : `Create Event${staffList.length > 0 ? ` (${staffList.length} staff)` : ''}`}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inside Now Panel ──────────────────────────────────────────── */
function InsideNowPanel({ venueId }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInsideGuests = useCallback(async () => {
    if (!venueId) return;
    try {
      const res = await pulseAPI.getInsideGuests(venueId);
      setGuests(res.data.guests || []);
    } catch {}
    setLoading(false);
  }, [venueId]);

  useEffect(() => { loadInsideGuests(); }, [loadInsideGuests]);
  useEffect(() => { const iv = setInterval(loadInsideGuests, 15000); return () => clearInterval(iv); }, [loadInsideGuests]);

  return (
    <div className="border border-border rounded-2xl p-5 bg-background" data-testid="inside-now-panel">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
          <span className="text-[15px] font-semibold text-foreground">Inside Now</span>
          <span
            className="min-w-[22px] h-[22px] rounded-full bg-green-500 text-white text-[12px] font-semibold inline-flex items-center justify-center px-1"
            data-testid="inside-now-count"
          >
            {guests.length}
          </span>
        </div>
        <button
          onClick={loadInsideGuests}
          className="text-[14px] font-medium cursor-pointer transition-colors duration-150 hover:text-primary"
          style={{ color: 'hsl(var(--text-tertiary, var(--muted-foreground)))' }}
        >
          Refresh
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-border mt-3 pt-3">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
        ) : guests.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <Users className="h-8 w-8 opacity-30" style={{ color: 'hsl(var(--muted-foreground))' }} strokeWidth={1.5} />
            <p className="text-[14px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>No guests inside</p>
          </div>
        ) : (
          <div className="max-h-[280px] overflow-y-auto">
            {guests.map(g => (
              <div
                key={g.guest_id}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                data-testid={`inside-guest-${g.guest_id}`}
              >
                <div className="flex items-center gap-3">
                  {g.guest_photo ? (
                    <img src={g.guest_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[12px] font-bold text-primary">
                        {(g.guest_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-[14px] font-medium text-foreground" data-testid={`inside-guest-name-${g.guest_id}`}>{g.guest_name}</p>
                    <p className="text-[13px]" style={{ color: 'hsl(var(--text-tertiary, var(--muted-foreground)))' }}>
                      {g.entered_at ? new Date(g.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    g.guest_status === 'Blocked' ? 'bg-red-500/10 text-red-500' :
                    g.tab_total > 0 ? 'bg-blue-500/10 text-blue-500' :
                    'bg-green-500/10 text-green-500'
                  }`} data-testid={`inside-guest-status-${g.guest_id}`}>
                    {g.guest_status === 'Blocked' ? 'Blocked' : g.tab_total > 0 ? `$${g.tab_total.toFixed(2)}` : 'No tab'}
                  </span>
                  {g.tab_number && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full" data-testid={`inside-guest-tab-${g.guest_id}`}>
                      #{g.tab_number}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export const VenueSelectPage = () => {
  const navigate = useNavigate();
  const { logout, user, isCEO } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    const { handleFullLogout } = await import('../../utils/logout');
    await handleFullLogout(logout);
  };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [eventDates, setEventDates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [barmen, setBarmen] = useState([]);

  useEffect(() => {
    // Wait until user data is fully loaded from /auth/me (has modules_enabled)
    if (!user?.modules_enabled) return;
    const load = async () => {
      try {
        const res = await venueAPI.getHome();
        const raw = res.data;
        const homeData = raw?.data || raw;
        // Filter modules by user's modules_enabled
        if (homeData.modules) {
          const allowed = new Set(user.modules_enabled);
          homeData.modules = homeData.modules.map(m => ({
            ...m,
            enabled: allowed.has(m.key) ? m.enabled : false,
          }));
        }
        setData(homeData);
        if (homeData.venues?.length > 0) setSelectedVenue(homeData.venues[0]);
      } catch { toast.error('Failed to load venues'); }
      setLoading(false);
    };
    load();
  }, [user?.modules_enabled]);

  const loadEvents = useCallback(async () => {
    if (!selectedVenue) return;
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await venueAPI.getEvents(selectedVenue.id, dateStr);
      const raw = res.data;
      const evtData = raw?.data || raw;
      setEvents(evtData.events || []);
    } catch {}
  }, [selectedVenue, selectedDate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (!selectedVenue) return;
    const loadDates = async () => {
      try {
        const month = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const res = await venueAPI.getEventDates(selectedVenue.id, month);
        const raw = res.data;
        const datesData = raw?.data || raw;
        setEventDates(datesData.dates || []);
      } catch {}
    };
    loadDates();
  }, [selectedVenue, selectedDate]);

  useEffect(() => {
    if (!selectedVenue) return;
    const loadBarmenData = async () => {
      try { const res = await staffAPI.getBarmen(selectedVenue.id); const raw = res.data; const d = raw?.data || raw; setBarmen(d.barmen || []); } catch {}
    };
    loadBarmenData();
  }, [selectedVenue]);

  const handleEnter = () => {
    if (selectedVenue) {
      localStorage.setItem('active_venue_id', selectedVenue.id);
      localStorage.setItem('active_venue_name', selectedVenue.name);
    }
    navigate('/pulse/entry');
  };

  const MODULE_ICONS = {
    pulse: Activity, tap: Fingerprint, table: LayoutGrid, kds: UtensilsCrossed,
    manager: UserCog, owner: Crown, ceo: Crown,
  };
  const MODULE_ROUTES = {
    pulse: '/pulse/entry', tap: '/tap', table: '/table', kds: '/kitchen',
    manager: '/manager', owner: '/owner', ceo: '/ceo',
  };

  const handleModuleClick = (mod) => {
    if (!mod.enabled) return;
    if (selectedVenue) {
      localStorage.setItem('active_venue_id', selectedVenue.id);
      localStorage.setItem('active_venue_name', selectedVenue.name);
    }
    navigate(MODULE_ROUTES[mod.key] || '/venue/home');
  };

  const calendarMonth = selectedDate.getMonth();
  const calendarYear = selectedDate.getFullYear();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const prevMonth = () => setSelectedDate(new Date(calendarYear, calendarMonth - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(calendarYear, calendarMonth + 1, 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const venues = data?.venues || [];
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background" data-testid="venue-select-page">
      {/* ─── NAVBAR ─── */}
      <header className="h-16 border-b border-border bg-background px-6 lg:px-10 flex items-center justify-between relative z-50" data-testid="dashboard-navbar">
        {/* Left group */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-[22px] font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              spet<span className="gradient-text">.</span>
            </span>
          </Link>
          {selectedVenue && (
            <>
              <div className="h-5 w-px bg-border mx-2" />
              <span className="text-[14px] font-medium truncate max-w-[140px] sm:max-w-none" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedVenue.name}</span>
            </>
          )}
        </div>

        {/* Right group */}
        <div className="flex items-center gap-3">
          {/* Modules dropdown */}
          {data?.modules && (
            <div className="relative">
              <button
                onClick={() => setShowModulesMenu(!showModulesMenu)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[14px] font-medium transition-colors duration-150 ${
                  showModulesMenu ? 'border-primary/20 bg-muted' : 'border-border hover:bg-muted'
                }`}
                data-testid="modules-dropdown"
              >
                <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Modules</span>
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>

              {showModulesMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowModulesMenu(false)} />
                  <div
                    className="absolute top-full right-0 mt-2 bg-background border border-border rounded-xl p-4 z-50"
                    style={{ boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)' }}
                    data-testid="modules-menu"
                  >
                    <div className="flex gap-2">
                      {data.modules
                        .filter(m => m.enabled)
                        .filter(m => m.key !== 'ceo' || isCEO)
                        .map(mod => {
                          const Icon = MODULE_ICONS[mod.key] || Sparkles;
                          return (
                            <button
                              key={mod.key}
                              onClick={() => { handleModuleClick(mod); setShowModulesMenu(false); }}
                              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors duration-150 min-w-[56px]"
                              data-testid={`module-item-${mod.key}`}
                            >
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
                                <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
                              </div>
                              <span className="text-[12px] font-medium text-foreground">{mod.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="h-5 w-px bg-border mx-1" />
          <span className="text-[14px] hidden md:inline" style={{ color: 'hsl(var(--muted-foreground))' }}>{data?.user_email}</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors duration-150 hover:bg-muted"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full transition-colors duration-150 hover:bg-muted"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            data-testid="logout-btn"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto px-6 lg:px-10 pt-8 md:pt-10 pb-16">
        {/* Venue Selector (multi-venue only) */}
        {venues.length > 1 && (
          <div className="mb-10">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Select Venue</p>
            <div className="flex gap-3">
              {venues.map((v) => (
                <button key={v.id}
                  onClick={() => setSelectedVenue(v)}
                  className={`px-5 py-3 rounded-xl border-2 transition-all font-medium ${
                    selectedVenue?.id === v.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                  data-testid={`venue-btn-${v.id}`}>
                  <MapPin className="h-4 w-4 inline mr-2" />
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedVenue && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[32px] font-extrabold tracking-[-0.03em] leading-[1.1] text-foreground" data-testid="venue-title">
                {selectedVenue.name}
              </h1>
              <p className="text-[16px] mt-1 leading-[1.5]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Select a date and event to start operations
              </p>
            </div>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
              {/* ─── LEFT: CALENDAR ─── */}
              <div className="bg-background border border-border rounded-2xl p-6" data-testid="dashboard-calendar">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-muted"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    data-testid="calendar-prev"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <h3 className="text-[16px] font-semibold text-foreground leading-[1.4]">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-muted"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    data-testid="calendar-next"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="h-9 flex items-center justify-center text-[14px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={idx} className="h-10" />;
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDateStr;
                    const isToday = dateStr === todayStr;
                    const hasEvent = eventDates.includes(dateStr);
                    return (
                      <div key={idx} className="flex items-center justify-center py-0.5">
                        <button
                          onClick={() => { setSelectedDate(new Date(calendarYear, calendarMonth, day)); setSelectedEvent(null); }}
                          onDoubleClick={() => {
                            setSelectedDate(new Date(calendarYear, calendarMonth, day));
                            if (hasEvent) handleEnter();
                          }}
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center text-[14px] transition-colors duration-150 cursor-pointer ${
                            isToday ? 'bg-primary text-primary-foreground font-semibold' :
                            isSelected ? 'bg-primary/10 text-primary font-medium' :
                            'text-foreground hover:bg-muted'
                          }`}
                          data-testid={`cal-day-${day}`}
                        >
                          {day}
                          {hasEvent && !isToday && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── RIGHT: EVENT PANEL ─── */}
              <div className="flex flex-col gap-4">
                {/* Date Header + New Event */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-[18px] w-[18px] text-foreground" strokeWidth={1.5} />
                    <span className="text-[16px] font-semibold text-foreground leading-[1.4]" data-testid="selected-date-label">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowCreate(!showCreate); setSelectedEvent(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[14px] font-medium text-foreground bg-transparent transition-colors duration-150 hover:bg-muted hover:border-primary/20 active:scale-[0.98]"
                    data-testid="create-event-btn"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    New Event
                  </button>
                </div>

                {/* Create Event Wizard */}
                {showCreate && (
                  <CreateEventWizard
                    venueId={selectedVenue.id}
                    date={selectedDateStr}
                    barmen={barmen}
                    onCreated={() => { setShowCreate(false); loadEvents(); }}
                    onCancel={() => setShowCreate(false)}
                  />
                )}

                {/* Event list or empty state */}
                {events.filter(e => e.is_active !== false).length === 0 && !showCreate ? (
                  <div className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center text-center" data-testid="empty-events">
                    <Sparkles className="h-8 w-8 opacity-40" style={{ color: 'hsl(var(--muted-foreground))' }} strokeWidth={1.5} />
                    <p className="text-[15px] font-medium mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      No active events for this date
                    </p>
                    <p className="text-[14px] mt-1" style={{ color: 'hsl(var(--text-tertiary, var(--muted-foreground)))' }}>
                      Create one or select a different date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.filter(e => e.is_active !== false).map((evt) => (
                      <div key={evt.id}>
                        <div
                          onClick={() => setSelectedEvent(selectedEvent?.id === evt.id ? null : evt)}
                          onDoubleClick={() => handleEnter()}
                          className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                            selectedEvent?.id === evt.id ? 'border-primary/40 bg-primary/[0.02]' : 'border-border hover:border-primary/20'
                          }`}
                          data-testid={`event-card-${evt.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-semibold text-foreground">{evt.name}</h4>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                              Active
                            </span>
                          </div>
                          <div className="flex gap-4 text-[13px] mt-1" style={{ color: 'hsl(var(--text-secondary, var(--muted-foreground)))' }}>
                            {evt.cover_price > 0 && <span>Cover: ${evt.cover_price}</span>}
                            {evt.cover_consumption_price > 0 && <span>Cover+Cons: ${evt.cover_consumption_price}</span>}
                          </div>
                        </div>

                        {/* Event Preview (1 click) */}
                        {selectedEvent?.id === evt.id && (
                          <EventPreviewPanel event={evt} venueId={selectedVenue.id} onClose={() => setSelectedEvent(null)} onEventEnded={() => { setSelectedEvent(null); loadEvents(); }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Enter Venue Button — premium gradient */}
                <button
                  onClick={handleEnter}
                  className="btn-premium w-full h-[52px] rounded-xl text-[16px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-px hover:scale-[1.01] active:translate-y-0 active:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258 75% 58%), hsl(263 80% 66%))',
                    boxShadow: '0 4px 20px hsl(258 75% 58% / 0.25)',
                  }}
                  data-testid="enter-venue-btn"
                >
                  Enter {selectedVenue.name}
                </button>

                {/* Inside Now Panel */}
                <InsideNowPanel venueId={selectedVenue.id} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

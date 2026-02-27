import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { venueAPI } from '../../services/api';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  MapPin, LogOut, Sparkles, Users, CreditCard, LayoutGrid,
  UtensilsCrossed, BarChart3, Building2, Crown, ChevronDown, Menu
} from 'lucide-react';

export const VenueSelectPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [eventDates, setEventDates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', cover_price: 0, cover_consumption_price: 0 });
  const [showModulesMenu, setShowModulesMenu] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await venueAPI.getHome();
        setData(res.data);
        if (res.data.venues?.length > 0) {
          setSelectedVenue(res.data.venues[0]);
        }
      } catch (err) {
        toast.error('Failed to load venues');
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load events for selected date
  useEffect(() => {
    if (!selectedVenue) return;
    const loadEvents = async () => {
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await venueAPI.getEvents(selectedVenue.id, dateStr);
        setEvents(res.data.events || []);
      } catch {}
    };
    loadEvents();
  }, [selectedVenue, selectedDate]);

  // Load event dates for calendar highlights
  useEffect(() => {
    if (!selectedVenue) return;
    const loadDates = async () => {
      try {
        const month = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const res = await venueAPI.getEventDates(selectedVenue.id, month);
        setEventDates(res.data.dates || []);
      } catch {}
    };
    loadDates();
  }, [selectedVenue, selectedDate]);

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim()) { toast.error('Event name required'); return; }
    try {
      const fd = new FormData();
      fd.append('name', newEvent.name);
      fd.append('date', selectedDate.toISOString().split('T')[0]);
      fd.append('cover_price', newEvent.cover_price.toString());
      fd.append('cover_consumption_price', newEvent.cover_consumption_price.toString());
      await venueAPI.createEvent(selectedVenue.id, fd);
      toast.success('Event created!');
      setShowCreate(false);
      setNewEvent({ name: '', cover_price: 0, cover_consumption_price: 0 });
      // Reload events
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await venueAPI.getEvents(selectedVenue.id, dateStr);
      setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to create event');
    }
  };

  const handleEnter = () => {
    // Store active venue in localStorage for other pages to use
    if (selectedVenue) {
      localStorage.setItem('active_venue_id', selectedVenue.id);
      localStorage.setItem('active_venue_name', selectedVenue.name);
    }
    navigate('/pulse/entry');
  };

  const MODULE_ICONS = {
    pulse: Users, tap: CreditCard, table: LayoutGrid, kds: UtensilsCrossed,
    manager: BarChart3, owner: Building2, ceo: Crown,
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

  // Calendar logic
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
      {/* Header */}
      <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">SPETAP</h1>
          {selectedVenue && (
            <>
              <div className="h-5 w-px bg-border" />
              <span className="text-sm text-muted-foreground">{selectedVenue.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Modules Dropdown */}
          {data?.modules && (
            <div className="relative">
              <button onClick={() => setShowModulesMenu(!showModulesMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors border border-border"
                data-testid="modules-dropdown">
                <Menu className="h-4 w-4" />
                <span>Modules</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showModulesMenu && (
                <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[200px] py-1" data-testid="modules-menu">
                  {data.modules
                    .filter(m => m.enabled && m.key !== 'ceo')
                    .map(mod => {
                      const Icon = MODULE_ICONS[mod.key] || Sparkles;
                      return (
                        <button key={mod.key}
                          onClick={() => { handleModuleClick(mod); setShowModulesMenu(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-3 transition-colors"
                          data-testid={`module-item-${mod.key}`}>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{mod.name}</p>
                            <p className="text-xs text-muted-foreground">{mod.description}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
          <div className="h-5 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{data?.user_email}</span>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto px-8 py-12">
        {/* Venue Selector */}
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
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight mb-1" data-testid="venue-title">{selectedVenue.name}</h2>
              <p className="text-lg text-muted-foreground">Select a date and event to start operations</p>
            </div>

            <div className="grid grid-cols-12 gap-10">
              {/* Calendar */}
              <div className="col-span-7">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-lg font-semibold">
                      {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      if (!day) return <div key={idx} />;
                      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = dateStr === selectedDateStr;
                      const isToday = dateStr === todayStr;
                      const hasEvent = eventDates.includes(dateStr);
                      return (
                        <button key={idx}
                          onClick={() => setSelectedDate(new Date(calendarYear, calendarMonth, day))}
                          onDoubleClick={() => {
                            setSelectedDate(new Date(calendarYear, calendarMonth, day));
                            if (hasEvent) handleEnter();
                          }}
                          className={`relative h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                            isSelected ? 'bg-primary text-primary-foreground' :
                            isToday ? 'bg-primary/10 text-primary font-bold' :
                            'hover:bg-muted'
                          }`}
                          data-testid={`cal-day-${day}`}>
                          {day}
                          {hasEvent && !isSelected && (
                            <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Events for selected date */}
              <div className="col-span-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)} data-testid="create-event-btn">
                    <Plus className="h-4 w-4 mr-1" /> New Event
                  </Button>
                </div>

                {/* Create event form */}
                {showCreate && (
                  <div className="bg-card border border-primary/20 rounded-xl p-5 mb-4 space-y-3" data-testid="create-event-form">
                    <input type="text" value={newEvent.name}
                      onChange={(e) => setNewEvent(p => ({ ...p, name: e.target.value }))}
                      placeholder="Event name (e.g. Friday Night)"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm"
                      data-testid="event-name-input" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Cover ($)</label>
                        <input type="number" value={newEvent.cover_price}
                          onChange={(e) => setNewEvent(p => ({ ...p, cover_price: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Cover + Consum. ($)</label>
                        <input type="number" value={newEvent.cover_consumption_price}
                          onChange={(e) => setNewEvent(p => ({ ...p, cover_consumption_price: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateEvent} data-testid="save-event-btn">Create</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Event list */}
                {events.length === 0 ? (
                  <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1">No events for this date</p>
                    <p className="text-sm text-muted-foreground/60">Create one or select a different date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((evt) => (
                      <div key={evt.id}
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer"
                        onDoubleClick={handleEnter}
                        data-testid={`event-card-${evt.id}`}>
                        <h4 className="font-semibold mb-1">{evt.name}</h4>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {evt.cover_price > 0 && <span>Cover: ${evt.cover_price}</span>}
                          {evt.cover_consumption_price > 0 && <span>Cover+Cons: ${evt.cover_consumption_price}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground/60 mt-2">Double-click to enter</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enter button */}
                <Button className="w-full mt-6 h-14 text-lg font-semibold rounded-xl" onClick={handleEnter} data-testid="enter-venue-btn">
                  Enter {selectedVenue.name}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

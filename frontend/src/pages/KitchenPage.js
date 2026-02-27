import React, { useState, useEffect, useCallback } from 'react';
import { kdsAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  UtensilsCrossed, Beer, Clock, ChefHat, CheckCircle,
  ArrowLeft, Timer, LogOut, Home, AlertTriangle, X, PackageCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const STATUS_COLORS = {
  pending: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-600', dot: 'bg-yellow-500' },
  preparing: { border: 'border-primary/50', bg: 'bg-primary/5', badge: 'bg-primary/20 text-primary', dot: 'bg-primary' },
  ready: { border: 'border-green-500/50', bg: 'bg-green-500/5', badge: 'bg-green-500/20 text-green-600', dot: 'bg-green-500' },
  delivered: { border: 'border-blue-500/50', bg: 'bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-600', dot: 'bg-blue-500' },
  delayed: { border: 'border-red-500/50', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-600', dot: 'bg-red-500' },
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered' };
const ACTION_LABELS = { pending: 'Start Preparing', preparing: 'Mark Ready', ready: 'Delivered' };
const STATUS_LABELS = { pending: 'Pending', preparing: 'Preparing', ready: 'Ready', delivered: 'Delivered', delayed: 'Delayed' };

// Timer hook for live countdown/countup
const useElapsed = (startTime) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!startTime) return { minutes: 0, seconds: 0 };
  const diff = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
  return { minutes: Math.floor(diff / 60), seconds: diff % 60 };
};

const TimerDisplay = ({ startTime, estimatedMinutes, isDelayed }) => {
  const { minutes, seconds } = useElapsed(startTime);
  const remaining = estimatedMinutes ? (estimatedMinutes * 60) - (minutes * 60 + seconds) : null;
  const isOvertime = remaining !== null && remaining < 0;
  const overtime = isOvertime ? Math.abs(remaining) : 0;

  return (
    <div className={`flex items-center gap-2 font-mono text-base ${isOvertime || isDelayed ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
      <Timer className={`h-5 w-5 ${isOvertime || isDelayed ? 'text-red-500 animate-pulse' : ''}`} />
      {estimatedMinutes && !isOvertime ? (
        <span>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} left</span>
      ) : isOvertime ? (
        <span>+{Math.floor(overtime / 60)}:{String(overtime % 60).padStart(2, '0')} over!</span>
      ) : (
        <span>{minutes}:{String(seconds).padStart(2, '0')}</span>
      )}
    </div>
  );
};

const TicketCard = ({ ticket, onStatusChange, onSetTime, isDelayed }) => {
  const colors = isDelayed ? STATUS_COLORS.delayed : (STATUS_COLORS[ticket.status] || STATUS_COLORS.pending);
  const [estimateInput, setEstimateInput] = useState('');
  const [showEstimate, setShowEstimate] = useState(false);
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('ticket_id', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; };

  return (
    <div className={`rounded-xl border-2 p-5 transition-all cursor-grab active:cursor-grabbing ${colors.border} ${colors.bg} ${isDelayed ? 'ring-2 ring-red-500/30' : ''}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`ticket-${ticket.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {ticket.table_number && <span className="text-lg font-bold">T{ticket.table_number}</span>}
          {ticket.guest_name && <span className="text-sm text-muted-foreground truncate">{ticket.guest_name}</span>}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
          {isDelayed ? 'Delayed' : STATUS_LABELS[ticket.status]}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {ticket.items.map((item, i) => (
          <div key={item.id || i} className="flex items-center gap-2 text-sm">
            <span className="font-bold text-primary">{item.qty}x</span>
            <span className="font-medium">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Timer */}
      {ticket.status === 'preparing' ? (
        <div className="mb-3">
          <TimerDisplay startTime={ticket.started_at} estimatedMinutes={ticket.estimated_minutes} isDelayed={isDelayed} />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3" /> {elapsed}m ago
          {ticket.estimated_minutes && <span className="ml-1">| ~{ticket.estimated_minutes}m est.</span>}
        </div>
      )}

      {showEstimate && (
        <div className="flex gap-2 mb-3">
          <input type="number" min="1" max="120" value={estimateInput}
            onChange={e => setEstimateInput(e.target.value)}
            placeholder="Min"
            className="w-20 px-2 py-1.5 text-sm rounded border border-border bg-background"
            data-testid="estimate-input" />
          <Button size="sm" variant="outline"
            onClick={() => { onSetTime(ticket.id, parseInt(estimateInput)); setShowEstimate(false); setEstimateInput(''); }}
            disabled={!estimateInput}>Set</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowEstimate(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        {NEXT_STATUS[ticket.status] && (
          <Button size="sm" className={`flex-1 ${isDelayed ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={() => onStatusChange(ticket.id, NEXT_STATUS[ticket.status])}
            data-testid={`ticket-action-${ticket.id}`}>
            {ticket.status === 'pending' && <ChefHat className="h-4 w-4 mr-1" />}
            {ticket.status === 'preparing' && <CheckCircle className="h-4 w-4 mr-1" />}
            {ticket.status === 'ready' && <CheckCircle className="h-4 w-4 mr-1" />}
            {ACTION_LABELS[ticket.status]}
          </Button>
        )}
        {ticket.status === 'pending' && (
          <Button size="sm" variant="outline" onClick={() => setShowEstimate(!showEstimate)}
            data-testid={`set-time-${ticket.id}`}>
            <Timer className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const COLUMN_STATUS = { 'Pending': 'pending', 'Preparing': 'preparing', 'Ready': 'ready', 'Delivered': 'delivered', 'Delayed': 'delayed' };

const KanbanColumn = ({ title, tickets, dotColor, onStatusChange, onSetTime, isDelayed, onDrop }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true); };
  const handleDragLeave = () => { setDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const ticketId = e.dataTransfer.getData('ticket_id');
    if (ticketId && onDrop) onDrop(ticketId, COLUMN_STATUS[title]);
  };

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={`transition-all rounded-xl p-2 ${dragOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${dotColor}`} />
        {title} <span className="text-muted-foreground font-normal">({tickets.length})</span>
      </h2>
      <div className="space-y-4 min-h-[200px]">
        {tickets.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground/40 text-sm">
            Drop here
          </div>
        ) : tickets.map(t => (
          <TicketCard key={t.id} ticket={t} onStatusChange={onStatusChange} onSetTime={onSetTime} isDelayed={isDelayed} />
        ))}
      </div>
    </div>
  );
};

export const KitchenPage = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('kitchen');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayedPopup, setDelayedPopup] = useState(null);

  const loadTickets = useCallback(async () => {
    try {
      const res = await kdsAPI.getTickets(VENUE_ID(), destination);
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [destination]);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => {
    const interval = setInterval(loadTickets, 10000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  // Check for delayed orders every 5 seconds
  useEffect(() => {
    const checkDelayed = () => {
      const now = Date.now();
      const delayed = tickets.filter(t => {
        if (t.status !== 'preparing' || !t.estimated_minutes || !t.started_at) return false;
        const started = new Date(t.started_at).getTime();
        const deadline = started + t.estimated_minutes * 60000;
        return now > deadline;
      });
      if (delayed.length > 0 && !delayedPopup) {
        setDelayedPopup(delayed[0]);
      }
    };
    const iv = setInterval(checkDelayed, 5000);
    checkDelayed();
    return () => clearInterval(iv);
  }, [tickets, delayedPopup]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      await kdsAPI.updateStatus(ticketId, fd);
      if (delayedPopup?.id === ticketId) setDelayedPopup(null);
      await loadTickets();
    } catch { toast.error('Failed to update'); }
  };

  const handleSetTime = async (ticketId, minutes) => {
    try {
      const fd = new FormData();
      fd.append('status', 'preparing');
      fd.append('estimated_minutes', minutes.toString());
      await kdsAPI.updateStatus(ticketId, fd);
      toast.success(`Estimated ${minutes}m`);
      await loadTickets();
    } catch { toast.error('Failed to set time'); }
  };

  const handleDrop = async (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;
    await handleStatusChange(ticketId, newStatus);
  };

  // Categorize tickets
  const now = Date.now();
  const isTimeDelayed = (t) => {
    if (t.status !== 'preparing' || !t.estimated_minutes || !t.started_at) return false;
    return now > new Date(t.started_at).getTime() + t.estimated_minutes * 60000;
  };

  const pending = tickets.filter(t => t.status === 'pending');
  const preparing = tickets.filter(t => t.status === 'preparing' && !isTimeDelayed(t));
  const delayed = tickets.filter(t => t.status === 'delayed' || isTimeDelayed(t));
  const ready = tickets.filter(t => t.status === 'ready');
  const delivered = tickets.filter(t => t.status === 'delivered');

  return (
    <div className="min-h-screen bg-background" data-testid="kds-page">
      {/* Delayed Order Popup */}
      {delayedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="delayed-popup">
          <div className="bg-card border-4 border-red-500 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />
              <div>
                <h2 className="text-2xl font-bold text-red-500">ORDER DELAYED</h2>
                <p className="text-muted-foreground text-sm">This order exceeded the estimated time</p>
              </div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                {delayedPopup.table_number && <span className="text-xl font-bold">T{delayedPopup.table_number}</span>}
                <span className="text-muted-foreground">{delayedPopup.guest_name}</span>
              </div>
              {delayedPopup.items.map((item, i) => (
                <div key={i} className="text-sm font-medium">{item.qty}x {item.name}</div>
              ))}
              <div className="mt-3">
                <TimerDisplay startTime={delayedPopup.started_at} estimatedMinutes={delayedPopup.estimated_minutes} isDelayed />
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => { handleStatusChange(delayedPopup.id, 'ready'); setDelayedPopup(null); }}>
                <CheckCircle className="h-4 w-4 mr-1" /> Mark Ready
              </Button>
              <Button variant="outline" onClick={() => setDelayedPopup(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">SPETAP</h1>
          <span className="text-sm text-muted-foreground">KDS — {destination === 'kitchen' ? 'Kitchen' : 'Bar'} Display</span>
          {delayed.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
              {delayed.length} delayed
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setDestination('kitchen')}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${destination === 'kitchen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="filter-kitchen">
              <UtensilsCrossed className="h-4 w-4 inline mr-1" /> Kitchen
            </button>
            <button onClick={() => setDestination('bar')}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${destination === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="filter-bar">
              <Beer className="h-4 w-4 inline mr-1" /> Bar
            </button>
          </div>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')} data-testid="home-btn">
            <Home className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('spetap_token'); navigate('/login'); }} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <div className="grid grid-cols-5 gap-5">
          <KanbanColumn title="Pending" tickets={pending} dotColor="bg-yellow-500"
            onStatusChange={handleStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Preparing" tickets={preparing} dotColor="bg-primary"
            onStatusChange={handleStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Ready" tickets={ready} dotColor="bg-green-500"
            onStatusChange={handleStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Delivered" tickets={delivered} dotColor="bg-blue-500"
            onStatusChange={handleStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Delayed" tickets={delayed} dotColor="bg-red-500"
            onStatusChange={handleStatusChange} onSetTime={handleSetTime} isDelayed onDrop={handleDrop} />
        </div>
      </main>
    </div>
  );
};

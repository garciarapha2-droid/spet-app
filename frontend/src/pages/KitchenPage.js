import React, { useState, useEffect, useCallback } from 'react';
import { kdsAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import SpetLogo from '../components/SpetLogo';
import {
  UtensilsCrossed, Beer, Clock, ChefHat, CheckCircle,
  ArrowLeft, Timer, LogOut, Home, AlertTriangle, X, PackageCheck,
  Printer, Zap, WifiOff, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

/* Color-coded header bands by status — Toast style adapted to SPET dark mode */
const HEADER_COLORS = {
  pending:   { band: 'bg-amber-500/20 border-b border-amber-500/30', text: 'text-amber-400' },
  preparing: { band: 'bg-primary/15 border-b border-primary/30', text: 'text-primary' },
  ready:     { band: 'bg-emerald-500/15 border-b border-emerald-500/30', text: 'text-emerald-400' },
  delivered: { band: 'bg-muted border-b border-border', text: 'text-muted-foreground' },
  delayed:   { band: 'bg-red-500/15 border-b border-red-500/30', text: 'text-red-400' },
};

const COLUMN_COLORS = {
  pending:   { dot: 'bg-amber-500', border: 'border-amber-500/30' },
  preparing: { dot: 'bg-primary', border: 'border-primary/30' },
  ready:     { dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
  delivered: { dot: 'bg-blue-500', border: 'border-blue-500/30' },
  delayed:   { dot: 'bg-red-500', border: 'border-red-500/30' },
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered', delayed: 'ready' };
const ACTION_LABELS = { pending: 'Start', preparing: 'Ready', ready: 'Deliver', delayed: 'Ready' };
const STATUS_LABELS = { pending: 'NEW', preparing: 'PREPARING', ready: 'READY', delivered: 'DONE', delayed: 'DELAYED' };

/* Generate short order number from ID */
const shortOrderNum = (id) => {
  if (!id) return '#000';
  const num = parseInt(id.replace(/[^0-9a-f]/gi, '').slice(-4), 16) % 1000;
  return `#${String(num).padStart(3, '0')}`;
};

/* Timer hook */
const useElapsed = (startTime) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!startTime) return { minutes: 0, seconds: 0, total: 0 };
  const diff = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
  return { minutes: Math.floor(diff / 60), seconds: diff % 60, total: diff };
};

const LiveTimer = ({ startTime, estimatedMinutes, isDelayed }) => {
  const { minutes, seconds, total } = useElapsed(startTime);
  const remaining = estimatedMinutes ? (estimatedMinutes * 60) - total : null;
  const isOvertime = remaining !== null && remaining < 0;
  const overtime = isOvertime ? Math.abs(remaining) : 0;

  const display = isOvertime
    ? `+${Math.floor(overtime / 60)}:${String(overtime % 60).padStart(2, '0')}`
    : estimatedMinutes && !isOvertime
      ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <span className={`font-mono font-bold text-sm ${isOvertime || isDelayed ? 'text-red-400' : 'text-muted-foreground'}`}>
      {display}
    </span>
  );
};

/* ═══════ TICKET CARD — Toast Kanban Style ═══════ */
const TicketCard = ({ ticket, onStatusChange, onSetTime, isDelayed }) => {
  const status = isDelayed ? 'delayed' : ticket.status;
  const hdr = HEADER_COLORS[status] || HEADER_COLORS.pending;
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimateInput, setEstimateInput] = useState('');
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;
  const orderType = ticket.table_number ? 'DINE IN' : 'TAB';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('ticket_id', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; };

  return (
    <div
      className={`rounded-xl border border-border bg-card overflow-hidden transition-all cursor-grab active:cursor-grabbing ${isDelayed ? 'ring-2 ring-red-500/40' : 'hover:border-border/80'}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`ticket-${ticket.id}`}
    >
      {/* ── Header Band (color-coded) ── */}
      <div className={`px-4 py-3 ${hdr.band}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-extrabold tracking-tight ${hdr.text}`}>{shortOrderNum(ticket.id)}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm font-medium truncate max-w-[120px]">
              {ticket.guest_name || (ticket.table_number ? `Table ${ticket.table_number}` : 'Guest')}
            </span>
          </div>
          {/* Timer */}
          {ticket.status === 'preparing' || isDelayed ? (
            <LiveTimer startTime={ticket.started_at || ticket.created_at} estimatedMinutes={ticket.estimated_minutes} isDelayed={isDelayed} />
          ) : (
            <span className="text-xs text-muted-foreground font-mono">{elapsed}m</span>
          )}
        </div>
        {/* Type + Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{orderType}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
            status === 'delayed' ? 'bg-red-500/20 text-red-400' :
            status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
            status === 'preparing' ? 'bg-primary/20 text-primary' :
            status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="px-4 py-3">
        <div className="space-y-2.5 mb-4">
          {ticket.items.map((item, i) => (
            <div key={item.id || i} className="flex items-start gap-3">
              <span className="text-base font-bold text-muted-foreground w-5 text-right flex-shrink-0 mt-px">{item.qty}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold leading-snug block">{item.name}</span>
                {item.notes && <span className="text-xs text-muted-foreground/70 italic block mt-0.5">{item.notes}</span>}
                {item.modifiers && item.modifiers.length > 0 && item.modifiers.map((mod, mi) => (
                  <span key={mi} className="text-xs text-muted-foreground/70 italic block mt-0.5">
                    {mod.type === 'remove' ? `No ${mod.name}` : mod.type === 'add' ? `Extra ${mod.name}` : mod.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ETA Input */}
        {showEstimate && (
          <div className="flex gap-2 mb-3">
            <input type="number" min="1" max="120" value={estimateInput}
              onChange={e => setEstimateInput(e.target.value)}
              placeholder="Min"
              className="w-20 px-2 py-1.5 text-sm rounded-lg border border-border bg-background"
              data-testid="estimate-input" />
            <Button size="sm" variant="outline"
              onClick={() => { onSetTime(ticket.id, parseInt(estimateInput)); setShowEstimate(false); setEstimateInput(''); }}
              disabled={!estimateInput}>Set</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowEstimate(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-2 pt-2 border-t border-border/40">
          {NEXT_STATUS[status] && (
            <Button size="sm" className={`flex-1 h-9 text-xs font-bold uppercase tracking-wide ${isDelayed ? 'bg-red-500 hover:bg-red-600' : ''}`}
              onClick={() => onStatusChange(ticket.id, NEXT_STATUS[status])}
              data-testid={`ticket-action-${ticket.id}`}>
              {status === 'pending' && <ChefHat className="h-3.5 w-3.5 mr-1.5" />}
              {status === 'preparing' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
              {(status === 'ready' || status === 'delayed') && <PackageCheck className="h-3.5 w-3.5 mr-1.5" />}
              {ACTION_LABELS[status]}
            </Button>
          )}
          {status === 'pending' && (
            <Button size="sm" variant="outline" className="h-9 px-2.5" onClick={() => setShowEstimate(!showEstimate)}
              data-testid={`set-time-${ticket.id}`} title="Set timer">
              <Timer className="h-3.5 w-3.5" />
            </Button>
          )}
          {(status === 'preparing' || status === 'pending') && (
            <Button size="sm" variant="outline" className="h-9 px-2.5" title="Rush order"
              onClick={() => toast.info('Rush sent to team')}>
              <Zap className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
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
  const [dismissedIds, setDismissedIds] = useState(new Set());

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
      const delayedTickets = tickets.filter(t => {
        // Explicitly delayed status
        if (t.status === 'delayed') return true;
        // Preparing but over time
        if (t.status !== 'preparing' || !t.estimated_minutes || !t.started_at) return false;
        const started = new Date(t.started_at).getTime();
        const deadline = started + t.estimated_minutes * 60000;
        return now > deadline;
      });
      const unDismissed = delayedTickets.filter(t => !dismissedIds.has(t.id));
      // If current popup was dismissed, clear it
      if (delayedPopup && dismissedIds.has(delayedPopup.id)) {
        setDelayedPopup(null);
        return;
      }
      // Show next undismissed delayed order
      if (unDismissed.length > 0 && !delayedPopup) {
        setDelayedPopup(unDismissed[0]);
      }
      // Clear popup if no more delayed orders
      if (unDismissed.length === 0 && delayedPopup) {
        setDelayedPopup(null);
      }
    };
    const iv = setInterval(checkDelayed, 5000);
    checkDelayed();
    return () => clearInterval(iv);
  }, [tickets, delayedPopup, dismissedIds]);

  const [etaModal, setEtaModal] = useState(null); // { ticketId, etaValue }

  const handleStatusChange = async (ticketId, newStatus, etaMinutes) => {
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      if (etaMinutes) fd.append('estimated_minutes', etaMinutes.toString());
      await kdsAPI.updateStatus(ticketId, fd);
      if (delayedPopup?.id === ticketId) setDelayedPopup(null);
      setDismissedIds(prev => { const next = new Set(prev); next.delete(ticketId); return next; });
      await loadTickets();
    } catch { toast.error('Failed to update'); }
  };

  // Intercept: when moving from pending→preparing, show ETA modal first
  const handleRequestStatusChange = (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && ticket.status === 'pending' && newStatus === 'preparing') {
      setEtaModal({ ticketId, etaValue: '' });
      return;
    }
    handleStatusChange(ticketId, newStatus);
  };

  const handleConfirmEta = () => {
    if (!etaModal || !etaModal.etaValue) return;
    handleStatusChange(etaModal.ticketId, 'preparing', parseInt(etaModal.etaValue));
    setEtaModal(null);
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
    handleRequestStatusChange(ticketId, newStatus);
  };

  // Categorize tickets
  const now = Date.now();
  const isTimeDelayed = (t) => {
    if (t.status === 'delayed') return true;
    if (t.status !== 'preparing' || !t.estimated_minutes || !t.started_at) return false;
    return now > new Date(t.started_at).getTime() + t.estimated_minutes * 60000;
  };

  const pending = tickets.filter(t => t.status === 'pending');
  const preparing = tickets.filter(t => t.status === 'preparing' && !isTimeDelayed(t));
  const delayed = tickets.filter(t => isTimeDelayed(t));
  const ready = tickets.filter(t => t.status === 'ready');
  const delivered = tickets.filter(t => t.status === 'delivered');

  return (
    <div className="min-h-screen bg-background" data-testid="kds-page">
      {/* Delayed Order Popup */}
      {delayedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) { setDismissedIds(prev => new Set(prev).add(delayedPopup.id)); setDelayedPopup(null); } }}
          data-testid="delayed-popup">
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
              <Button variant="outline" onClick={() => { setDismissedIds(prev => new Set(prev).add(delayedPopup.id)); setDelayedPopup(null); }}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ETA Modal — appears when moving Pending → Preparing */}
      {etaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="eta-modal">
          <div className="bg-card border-2 border-primary rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-2">Estimated Time</h2>
            <p className="text-sm text-muted-foreground mb-5">Set preparation time before starting</p>
            <div className="flex items-center gap-3 mb-5">
              <input
                type="number" min="1" max="120" autoFocus
                value={etaModal.etaValue}
                onChange={e => setEtaModal(prev => ({ ...prev, etaValue: e.target.value }))}
                placeholder="Minutes"
                className="flex-1 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none"
                data-testid="eta-minutes-input"
              />
              <span className="text-lg text-muted-foreground font-medium">min</span>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-lg font-bold"
                disabled={!etaModal.etaValue || parseInt(etaModal.etaValue) < 1}
                onClick={handleConfirmEta}
                data-testid="eta-confirm-btn">
                <CheckCircle className="h-5 w-5 mr-2" /> Confirm
              </Button>
              <Button variant="outline" className="h-12" onClick={() => setEtaModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="h-14 border-b border-border/60 px-6 flex items-center justify-between bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <SpetLogo size="default" />
          </div>
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
            onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Preparing" tickets={preparing} dotColor="bg-primary"
            onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Ready" tickets={ready} dotColor="bg-green-500"
            onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Delivered" tickets={delivered} dotColor="bg-blue-500"
            onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Delayed" tickets={delayed} dotColor="bg-red-500"
            onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} isDelayed onDrop={handleDrop} />
        </div>
      </main>
    </div>
  );
};

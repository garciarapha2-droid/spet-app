import React, { useState, useEffect, useCallback } from 'react';
import { kdsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import SpetLogo from '../components/SpetLogo';
import {
  UtensilsCrossed, Beer, Clock, ChefHat, CheckCircle,
  ArrowLeft, Timer, LogOut, Home, AlertTriangle, X, PackageCheck, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

/* Status config — Toast-like clean operational colors */
const STATUS_CONFIG = {
  pending:   { dot: 'bg-amber-500',   headerBg: 'bg-amber-500/8 border-b border-amber-500/15', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  preparing: { dot: 'bg-blue-500',    headerBg: 'bg-blue-500/8 border-b border-blue-500/15',   text: 'text-blue-600 dark:text-blue-400',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  ready:     { dot: 'bg-emerald-500', headerBg: 'bg-emerald-500/8 border-b border-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  delivered: { dot: 'bg-gray-400',    headerBg: 'bg-gray-500/5 border-b border-gray-500/10', text: 'text-gray-500', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400' },
  delayed:   { dot: 'bg-red-500',     headerBg: 'bg-red-500/8 border-b border-red-500/20',   text: 'text-red-600 dark:text-red-400',   badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered', delayed: 'ready' };
const ACTION_LABELS = { pending: 'Start', preparing: 'Ready', ready: 'Deliver', delayed: 'Ready' };
const STATUS_LABELS = { pending: 'NEW', preparing: 'PREP', ready: 'READY', delivered: 'DONE', delayed: 'LATE' };

const shortOrderNum = (id) => {
  if (!id) return '#000';
  const num = parseInt(id.replace(/[^0-9a-f]/gi, '').slice(-4), 16) % 1000;
  return `#${String(num).padStart(3, '0')}`;
};

/* Timer hook */
const useElapsed = (startTime) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
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
    <span className={`font-mono font-bold text-xs tabular-nums ${isOvertime || isDelayed ? 'text-red-500' : 'text-muted-foreground'}`}>
      {display}
    </span>
  );
};

/* ═══ TICKET CARD — Clean, scannable ═══ */
const TicketCard = ({ ticket, onStatusChange, onSetTime, isDelayed }) => {
  const status = isDelayed ? 'delayed' : ticket.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimateInput, setEstimateInput] = useState('');
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;
  const orderType = ticket.table_number ? 'DINE IN' : 'TAB';

  const handleDragStart = (e) => { e.dataTransfer.setData('ticket_id', ticket.id); e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.4'; };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; };

  return (
    <div
      className={`rounded-xl border border-border bg-card overflow-hidden transition-all cursor-grab active:cursor-grabbing ${isDelayed ? 'ring-2 ring-red-500/30' : 'hover:shadow-md'}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`ticket-${ticket.id}`}
    >
      {/* Header band — subtle color */}
      <div className={`px-4 py-3 ${cfg.headerBg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-extrabold tracking-tight ${cfg.text}`} data-testid={`ticket-num-${ticket.id}`}>
              {shortOrderNum(ticket.id)}
            </span>
            <span className="text-xs font-semibold truncate max-w-[110px]">
              {ticket.guest_name || (ticket.table_number ? `Table ${ticket.table_number}` : 'Guest')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {ticket.status === 'preparing' || isDelayed ? (
              <LiveTimer startTime={ticket.started_at || ticket.created_at} estimatedMinutes={ticket.estimated_minutes} isDelayed={isDelayed} />
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{elapsed}m</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{orderType}</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* Items — clean hierarchy */}
      <div className="px-4 py-3">
        <div className="space-y-2 mb-3">
          {ticket.items.map((item, i) => (
            <div key={item.id || i}>
              <div className="flex items-start gap-2.5">
                <span className="text-sm font-bold text-foreground/60 w-5 text-right flex-shrink-0">{item.qty}</span>
                <span className="text-sm font-semibold">{item.name}</span>
              </div>
              {/* Modifiers */}
              {item.modifiers?.removed?.map((r, ri) => (
                <div key={`r-${ri}`} className="ml-[30px] text-[11px] text-red-500 font-medium">No {r}</div>
              ))}
              {item.modifiers?.extras?.map((e, ei) => {
                const name = typeof e === 'string' ? e : e.name;
                const price = typeof e === 'object' ? e.price : 0;
                return (
                  <div key={`e-${ei}`} className="ml-[30px] text-[11px] text-emerald-500 font-medium">+ {name}{price > 0 && ` (+$${price.toFixed(2)})`}</div>
                );
              })}
              {item.notes && <div className="ml-[30px] text-[11px] text-muted-foreground italic">{item.notes}</div>}
            </div>
          ))}
        </div>

        {/* ETA Input */}
        {showEstimate && (
          <div className="flex gap-2 mb-3">
            <input type="number" min="1" max="120" value={estimateInput}
              onChange={e => setEstimateInput(e.target.value)} placeholder="Min"
              className="w-20 px-2 py-1.5 text-sm rounded-lg border border-border bg-background" data-testid="estimate-input" />
            <Button size="sm" variant="outline" onClick={() => { onSetTime(ticket.id, parseInt(estimateInput)); setShowEstimate(false); setEstimateInput(''); }} disabled={!estimateInput}>Set</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowEstimate(false)}><X className="h-3 w-3" /></Button>
          </div>
        )}

        {/* Action buttons — clean */}
        <div className="flex gap-2 pt-2 border-t border-border/40">
          {NEXT_STATUS[status] && (
            <Button size="sm" className={`flex-1 h-9 text-xs font-bold uppercase tracking-wide ${
              isDelayed ? 'bg-red-500 hover:bg-red-600 text-white' :
              status === 'preparing' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
            }`}
              onClick={() => onStatusChange(ticket.id, NEXT_STATUS[status])}
              data-testid={`ticket-action-${ticket.id}`}>
              {status === 'pending' && <ChefHat className="h-3.5 w-3.5 mr-1" />}
              {status === 'preparing' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {(status === 'ready' || status === 'delayed') && <PackageCheck className="h-3.5 w-3.5 mr-1" />}
              {ACTION_LABELS[status]}
            </Button>
          )}
          {status === 'pending' && (
            <Button size="sm" variant="outline" className="h-9 px-2.5" onClick={() => setShowEstimate(!showEstimate)} data-testid={`set-time-${ticket.id}`} title="Set timer">
              <Timer className="h-3.5 w-3.5" />
            </Button>
          )}
          {(status === 'preparing' || status === 'pending') && (
            <Button size="sm" variant="outline" className="h-9 px-2.5" title="Rush" onClick={() => toast.info('Rush sent')}>
              <Zap className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const COLUMN_STATUS = { 'Pending': 'pending', 'Preparing': 'preparing', 'Ready': 'ready', 'Delivered': 'delivered', 'Delayed': 'delayed' };

const KanbanColumn = ({ title, tickets, status, onStatusChange, onSetTime, isDelayed, onDrop }) => {
  const [dragOver, setDragOver] = useState(false);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true); };
  const handleDragLeave = () => { setDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const ticketId = e.dataTransfer.getData('ticket_id');
    if (ticketId && onDrop) onDrop(ticketId, COLUMN_STATUS[title]);
  };

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={`transition-all rounded-xl ${dragOver ? 'bg-foreground/[0.04] ring-2 ring-foreground/10' : ''}`}>
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground">({tickets.length})</span>
      </div>
      <div className="space-y-4 min-h-[180px] px-1">
        {tickets.length === 0 ? (
          <div className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center text-muted-foreground/25 text-xs">
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
  const { logout } = useAuth();
  const [destination, setDestination] = useState('kitchen');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayedPopup, setDelayedPopup] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const loadTickets = useCallback(async () => {
    try { const res = await kdsAPI.getTickets(VENUE_ID(), destination); setTickets(res.data.tickets || []); } catch (err) { console.error(err); }
    setLoading(false);
  }, [destination]);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { const interval = setInterval(loadTickets, 10000); return () => clearInterval(interval); }, [loadTickets]);

  useEffect(() => {
    const checkDelayed = () => {
      const now = Date.now();
      const delayedTickets = tickets.filter(t => {
        if (t.status === 'delayed') return true;
        if (t.status !== 'preparing' || !t.estimated_minutes || !t.started_at) return false;
        return now > new Date(t.started_at).getTime() + t.estimated_minutes * 60000;
      });
      const unDismissed = delayedTickets.filter(t => !dismissedIds.has(t.id));
      if (delayedPopup && dismissedIds.has(delayedPopup.id)) { setDelayedPopup(null); return; }
      if (unDismissed.length > 0 && !delayedPopup) setDelayedPopup(unDismissed[0]);
      if (unDismissed.length === 0 && delayedPopup) setDelayedPopup(null);
    };
    const iv = setInterval(checkDelayed, 5000); checkDelayed();
    return () => clearInterval(iv);
  }, [tickets, delayedPopup, dismissedIds]);

  const [etaModal, setEtaModal] = useState(null);

  const handleStatusChange = async (ticketId, newStatus, etaMinutes) => {
    try {
      const fd = new FormData(); fd.append('status', newStatus);
      if (etaMinutes) fd.append('estimated_minutes', etaMinutes.toString());
      await kdsAPI.updateStatus(ticketId, fd);
      if (delayedPopup?.id === ticketId) setDelayedPopup(null);
      setDismissedIds(prev => { const next = new Set(prev); next.delete(ticketId); return next; });
      await loadTickets();
    } catch { toast.error('Failed to update'); }
  };

  const handleRequestStatusChange = (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && ticket.status === 'pending' && newStatus === 'preparing') {
      setEtaModal({ ticketId, etaValue: '' }); return;
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
      const fd = new FormData(); fd.append('status', 'preparing'); fd.append('estimated_minutes', minutes.toString());
      await kdsAPI.updateStatus(ticketId, fd);
      toast.success(`Estimated ${minutes}m`); await loadTickets();
    } catch { toast.error('Failed'); }
  };

  const handleDrop = async (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;
    handleRequestStatusChange(ticketId, newStatus);
  };

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
      {/* Delayed Popup */}
      {delayedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) { setDismissedIds(prev => new Set(prev).add(delayedPopup.id)); setDelayedPopup(null); } }}
          data-testid="delayed-popup">
          <div className="bg-card border-2 border-red-500 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
              <div>
                <h2 className="text-xl font-bold text-red-500">ORDER DELAYED</h2>
                <p className="text-sm text-muted-foreground">Exceeded estimated time</p>
              </div>
            </div>
            <div className="bg-red-500/8 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                {delayedPopup.table_number && <span className="text-lg font-bold">T{delayedPopup.table_number}</span>}
                <span className="text-muted-foreground">{delayedPopup.guest_name}</span>
              </div>
              {delayedPopup.items.map((item, i) => (
                <div key={i} className="text-sm font-medium">{item.qty}x {item.name}</div>
              ))}
              <div className="mt-3">
                <LiveTimer startTime={delayedPopup.started_at} estimatedMinutes={delayedPopup.estimated_minutes} isDelayed />
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* ETA Modal */}
      {etaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="eta-modal">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-lg font-bold mb-1">Estimated Time</h2>
            <p className="text-sm text-muted-foreground mb-5">Set prep time before starting</p>
            <div className="flex items-center gap-3 mb-5">
              <input type="number" min="1" max="120" autoFocus value={etaModal.etaValue}
                onChange={e => setEtaModal(prev => ({ ...prev, etaValue: e.target.value }))}
                placeholder="Minutes"
                className="flex-1 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-background focus:border-blue-500 focus:outline-none"
                data-testid="eta-minutes-input" />
              <span className="text-lg text-muted-foreground font-medium">min</span>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold"
                disabled={!etaModal.etaValue || parseInt(etaModal.etaValue) < 1}
                onClick={handleConfirmEta} data-testid="eta-confirm-btn">
                <CheckCircle className="h-5 w-5 mr-2" /> Start
              </Button>
              <Button variant="outline" className="h-12" onClick={() => setEtaModal(null)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* Header — minimal, operational */}
      <header className="h-12 border-b border-border px-5 flex items-center justify-between bg-card relative z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <SpetLogo size="default" />
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">{destination === 'kitchen' ? 'Kitchen' : 'Bar'} Display</span>
          {delayed.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
              {delayed.length} late
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setDestination('kitchen')}
              className={`px-3 py-1 text-xs font-medium transition-all ${destination === 'kitchen' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="filter-kitchen">
              <UtensilsCrossed className="h-3.5 w-3.5 inline mr-1" /> Kitchen
            </button>
            <button onClick={() => setDestination('bar')}
              className={`px-3 py-1 text-xs font-medium transition-all ${destination === 'bar' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="filter-bar">
              <Beer className="h-3.5 w-3.5 inline mr-1" /> Bar
            </button>
          </div>
          <div className="h-4 w-px bg-border" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/venue/home')} data-testid="home-btn"><Home className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { const { handleFullLogout } = await import('../utils/logout'); await handleFullLogout(logout); }} data-testid="logout-btn"><LogOut className="h-3.5 w-3.5" /></Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <div className="grid grid-cols-5 gap-6">
          <KanbanColumn title="Pending" tickets={pending} status="pending" onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Preparing" tickets={preparing} status="preparing" onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Ready" tickets={ready} status="ready" onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Delivered" tickets={delivered} status="delivered" onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} onDrop={handleDrop} />
          <KanbanColumn title="Delayed" tickets={delayed} status="delayed" onStatusChange={handleRequestStatusChange} onSetTime={handleSetTime} isDelayed onDrop={handleDrop} />
        </div>
      </main>
    </div>
  );
};

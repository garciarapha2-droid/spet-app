import React, { useState, useEffect, useCallback } from 'react';
import { kdsAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  UtensilsCrossed, Beer, Clock, ChefHat, CheckCircle,
  ArrowLeft, Timer, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

const STATUS_STYLES = {
  pending: { bg: 'border-yellow-500/50 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-600', label: 'Pending' },
  preparing: { bg: 'border-primary/50 bg-primary/5', badge: 'bg-primary/20 text-primary', label: 'Preparing' },
  ready: { bg: 'border-green-500/50 bg-green-500/5', badge: 'bg-green-500/20 text-green-600', label: 'Ready' },
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' };
const ACTION_LABELS = { pending: 'Start Preparing', preparing: 'Mark Ready', ready: 'Complete' };

const TicketCard = ({ ticket, onStatusChange, onSetTime }) => {
  const style = STATUS_STYLES[ticket.status] || STATUS_STYLES.pending;
  const [estimateInput, setEstimateInput] = useState('');
  const [showEstimate, setShowEstimate] = useState(false);

  const elapsed = ticket.created_at
    ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000)
    : 0;

  return (
    <div className={`rounded-xl border-2 p-5 transition-all ${style.bg}`} data-testid={`ticket-${ticket.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {ticket.table_number && (
            <span className="text-lg font-bold">T{ticket.table_number}</span>
          )}
          {ticket.guest_name && (
            <span className="text-sm text-muted-foreground truncate">{ticket.guest_name}</span>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {ticket.items.map((item, i) => (
          <div key={item.id || i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{item.qty}x</span>
              <span className="font-medium">{item.name}</span>
            </div>
            {item.notes && <span className="text-xs text-muted-foreground italic">{item.notes}</span>}
          </div>
        ))}
      </div>

      {/* Time info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {elapsed}m ago</span>
        {ticket.estimated_minutes && (
          <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> ~{ticket.estimated_minutes}m</span>
        )}
      </div>

      {/* Estimate input */}
      {showEstimate && (
        <div className="flex gap-2 mb-3">
          <input type="number" min="1" max="60" value={estimateInput}
            onChange={e => setEstimateInput(e.target.value)}
            placeholder="Minutes"
            className="w-20 px-2 py-1 text-sm rounded border border-border bg-background"
            data-testid="estimate-input" />
          <Button size="sm" variant="outline"
            onClick={() => { onSetTime(ticket.id, parseInt(estimateInput)); setShowEstimate(false); setEstimateInput(''); }}
            disabled={!estimateInput}>Set</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowEstimate(false)}>
            <Clock className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {NEXT_STATUS[ticket.status] && (
          <Button size="sm" className="flex-1"
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

export const KitchenPage = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('kitchen');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(loadTickets, 10000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      await kdsAPI.updateStatus(ticketId, fd);
      await loadTickets();
    } catch (err) { toast.error('Failed to update'); }
  };

  const handleSetTime = async (ticketId, minutes) => {
    try {
      const fd = new FormData();
      fd.append('status', 'preparing');
      fd.append('estimated_minutes', minutes.toString());
      await kdsAPI.updateStatus(ticketId, fd);
      toast.success(`Estimated ${minutes}m`);
      await loadTickets();
    } catch (err) { toast.error('Failed to set time'); }
  };

  const pending = tickets.filter(t => t.status === 'pending');
  const preparing = tickets.filter(t => t.status === 'preparing');
  const ready = tickets.filter(t => t.status === 'ready');

  return (
    <div className="min-h-screen bg-background" data-testid="kds-page">
      <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/table')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">SPETAP</h1>
          <span className="text-sm text-muted-foreground">KDS — Kitchen Display</span>
        </div>
        <div className="flex items-center gap-3">
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
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/home')}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-8 py-8">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <ChefHat className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-xl">No {destination} orders</p>
            <p className="text-sm">Orders will appear here when sent from Table or TAP</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {/* Pending */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                Pending <span className="text-muted-foreground font-normal">({pending.length})</span>
              </h2>
              <div className="space-y-4">
                {pending.map(t => (
                  <TicketCard key={t.id} ticket={t} onStatusChange={handleStatusChange} onSetTime={handleSetTime} />
                ))}
              </div>
            </div>

            {/* Preparing */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                Preparing <span className="text-muted-foreground font-normal">({preparing.length})</span>
              </h2>
              <div className="space-y-4">
                {preparing.map(t => (
                  <TicketCard key={t.id} ticket={t} onStatusChange={handleStatusChange} onSetTime={handleSetTime} />
                ))}
              </div>
            </div>

            {/* Ready */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Ready <span className="text-muted-foreground font-normal">({ready.length})</span>
              </h2>
              <div className="space-y-4">
                {ready.map(t => (
                  <TicketCard key={t.id} ticket={t} onStatusChange={handleStatusChange} onSetTime={handleSetTime} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

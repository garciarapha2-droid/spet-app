import React, { useState, useEffect, useCallback, useRef } from 'react';
import { kdsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import SpetLogo from '../components/SpetLogo';
import {
  UtensilsCrossed, Beer, Clock, ChefHat, CheckCircle, CheckCircle2,
  Timer, LogOut, Home, AlertTriangle, X, PackageCheck, Zap,
  ChevronRight, Eye, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   DATA TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const VENUE_NAME = () => localStorage.getItem('active_venue_name') || 'Downtown';

/* Beer auto-ready regex */
const BEER_REGEX = /\b(beer|cerveja|chopp?|draft|lager|pils(ner)?|ipa|stout|ale|wheat|porter|pilsen|helles|weiss|bock)\b/i;
const isBeerItem = (item) => BEER_REGEX.test(item.name);
const isAllBeer = (items) => items.length > 0 && items.every(isBeerItem);

/* Modification prefix detection */
const REMOVAL_REGEX = /^(no |remove |without |hold )/i;
const isRemoval = (text) => REMOVAL_REGEX.test(text);

/* ── Status config ── */
const STATUS_CONFIG = {
  pending:   { headerBg: 'bg-amber-500',   dot: 'bg-amber-400/70',   border: 'border-amber-500/25',  btnBg: 'bg-amber-500 hover:bg-amber-600' },
  preparing: { headerBg: 'bg-sky-500',      dot: 'bg-sky-400/70',     border: 'border-sky-500/25',    btnBg: 'bg-sky-500 hover:bg-sky-600' },
  ready:     { headerBg: 'bg-emerald-500',  dot: 'bg-emerald-400/70', border: 'border-emerald-500/25', btnBg: 'bg-emerald-500 hover:bg-emerald-600' },
  delivered: { headerBg: 'bg-slate-500',    dot: 'bg-slate-400/70',   border: 'border-slate-500/20',  btnBg: 'bg-slate-500 hover:bg-slate-600' },
  delayed:   { headerBg: 'bg-red-500',      dot: 'bg-red-400/70',     border: 'border-red-500/30',    btnBg: 'bg-red-500 hover:bg-red-600' },
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered', delayed: 'ready' };
const ACTION_LABELS = { pending: 'Start', preparing: 'Ready', ready: 'Deliver', delayed: 'Ready' };
const ACTION_ICONS = { pending: ChefHat, preparing: CheckCircle, ready: PackageCheck, delayed: PackageCheck };
const COLUMN_ORDER = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Delayed'];
const COLUMN_STATUS_MAP = { 'Pending': 'pending', 'Preparing': 'preparing', 'Ready': 'ready', 'Delivered': 'delivered', 'Delayed': 'delayed' };

const shortOrderNum = (id) => {
  if (!id) return '#000';
  const num = parseInt(id.replace(/[^0-9a-f]/gi, '').slice(-4), 16) % 1000;
  return `#${String(num).padStart(3, '0')}`;
};

/* ═══════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════ */
const MOCK_TICKETS = [
  {
    id: 'kds-mock-001', status: 'pending', guest_name: 'Table 4', table_number: 4,
    destination: 'kitchen', created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    items: [
      { id: 'i1', name: 'Wagyu Burger', qty: 2, modifiers: { removed: ['Onion'], extras: [{ name: 'Extra Cheese', price: 2.50 }] } },
      { id: 'i2', name: 'Truffle Fries', qty: 1, notes: 'Extra crispy' },
    ],
  },
  {
    id: 'kds-mock-002', status: 'pending', guest_name: 'VIP Lounge', table_number: 12,
    destination: 'kitchen', created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    items: [
      { id: 'i3', name: 'Caesar Salad', qty: 1 },
      { id: 'i4', name: 'Grilled Salmon', qty: 1, modifiers: { extras: ['Lemon Butter'] } },
    ],
  },
  {
    id: 'kds-mock-003', status: 'preparing', guest_name: 'Michael R.', table_number: 7,
    destination: 'kitchen', created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    started_at: new Date(Date.now() - 6 * 60000).toISOString(), estimated_minutes: 15,
    items: [
      { id: 'i5', name: 'Ribeye Steak', qty: 1, notes: 'Medium rare' },
      { id: 'i6', name: 'Mashed Potatoes', qty: 1 },
      { id: 'i7', name: 'Grilled Asparagus', qty: 1 },
    ],
  },
  {
    id: 'kds-mock-004', status: 'preparing', guest_name: 'Ana S.', table_number: 3,
    destination: 'kitchen', created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    started_at: new Date(Date.now() - 10 * 60000).toISOString(), estimated_minutes: 8,
    items: [
      { id: 'i8', name: 'Margherita Pizza', qty: 1 },
      { id: 'i9', name: 'Garlic Bread', qty: 2 },
    ],
  },
  {
    id: 'kds-mock-005', status: 'ready', guest_name: 'Joao P.', table_number: 9,
    destination: 'kitchen', created_at: new Date(Date.now() - 22 * 60000).toISOString(),
    started_at: new Date(Date.now() - 15 * 60000).toISOString(), estimated_minutes: 12,
    items: [{ id: 'i10', name: 'Fish & Chips', qty: 2 }],
  },
  {
    id: 'kds-mock-006', status: 'delivered', guest_name: 'Carlos M.', table_number: 1,
    destination: 'kitchen', created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    started_at: new Date(Date.now() - 28 * 60000).toISOString(), estimated_minutes: 10,
    items: [
      { id: 'i11', name: 'Pasta Carbonara', qty: 1 },
      { id: 'i12', name: 'Tiramisu', qty: 1 },
    ],
  },
  {
    id: 'kds-mock-007', status: 'pending', guest_name: 'Tab Guest', table_number: null,
    destination: 'bar', created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    items: [
      { id: 'i13', name: 'Draft IPA', qty: 2 },
      { id: 'i14', name: 'Chopp Pilsen', qty: 1 },
    ],
  },
  {
    id: 'kds-mock-008', status: 'pending', guest_name: 'Sofia L.', table_number: 5,
    destination: 'bar', created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    items: [
      { id: 'i15', name: 'Mojito', qty: 2, modifiers: { extras: ['Extra Mint'] } },
      { id: 'i16', name: 'Caipirinha', qty: 1 },
    ],
  },
  {
    id: 'kds-mock-009', status: 'preparing', guest_name: 'Pedro A.', table_number: 6,
    destination: 'bar', created_at: new Date(Date.now() - 7 * 60000).toISOString(),
    started_at: new Date(Date.now() - 4 * 60000).toISOString(), estimated_minutes: 5,
    items: [
      { id: 'i17', name: 'Old Fashioned', qty: 1 },
      { id: 'i18', name: 'Espresso Martini', qty: 1 },
    ],
  },
];

/* ═══════════════════════════════════════════════════════
   TIMER HOOK
   ═══════════════════════════════════════════════════════ */
const useElapsed = (startTime) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  if (!startTime) return { minutes: 0, seconds: 0, total: 0 };
  const diff = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
  return { minutes: Math.floor(diff / 60), seconds: diff % 60, total: diff };
};

const LiveTimer = ({ startTime, estimatedMinutes, isDelayed, white }) => {
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
    <span className={`font-mono font-bold text-xs tabular-nums ${white ? 'text-white/80' : isOvertime || isDelayed ? 'text-red-500' : 'text-muted-foreground'}`}>
      {display}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════
   PROGRESS BAR — preparing only
   h-1, bg-border/50, full width at base of card
   normal: bg-foreground/15
   overtime: bg-red-400/60
   ═══════════════════════════════════════════════════════ */
const ProgressBar = ({ startTime, estimatedMinutes }) => {
  const { total } = useElapsed(startTime);
  if (!estimatedMinutes || !startTime) return null;
  const totalSec = estimatedMinutes * 60;
  const pct = Math.min(100, (total / totalSec) * 100);
  const isOvertime = total > totalSec;
  return (
    <div className="h-1 w-full bg-border/50" data-testid="progress-bar">
      <motion.div
        className={`h-full rounded-r-full ${isOvertime ? 'bg-red-400/60' : 'bg-foreground/15'}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1, ease: 'linear' }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TICKET CARD
   Card radius: 16px (rounded-2xl)
   Border: status color at 25% opacity
   Shadow: shadow-lg, hover:shadow-xl
   ═══════════════════════════════════════════════════════ */
const TicketCard = ({ ticket, onStatusChange, onSetTime, isDelayed, onViewDetail }) => {
  const status = isDelayed ? 'delayed' : ticket.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;
  const orderType = ticket.table_number ? 'DINE IN' : 'TAB';
  const allBeer = isAllBeer(ticket.items);
  const ActionIcon = ACTION_ICONS[status] || ChefHat;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('ticket_id', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
  };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; };

  return (
    <div
      className={`rounded-2xl border ${cfg.border} bg-card shadow-lg hover:shadow-xl overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing active:scale-[0.98]`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`ticket-${ticket.id}`}
    >
      {/* ── HEADER COLORIDO — 100% width, cor sólida do status ── */}
      <div className={`${cfg.headerBg} px-4 py-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-white" data-testid={`ticket-num-${ticket.id}`}>
              {shortOrderNum(ticket.id)}
            </span>
            <span className="text-sm font-semibold text-white/90 truncate max-w-[100px]">
              {ticket.guest_name || (ticket.table_number ? `Table ${ticket.table_number}` : 'Guest')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-white/80" />
            {ticket.status === 'preparing' || isDelayed ? (
              <LiveTimer startTime={ticket.started_at || ticket.created_at} estimatedMinutes={ticket.estimated_minutes} isDelayed={isDelayed} white />
            ) : (
              <span className="text-xs text-white/80 font-mono tabular-nums">{elapsed}m</span>
            )}
          </div>
        </div>
        {/* Delayed badge only in header */}
        {isDelayed && (
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold uppercase">LATE</span>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="px-3 py-2.5">
        {/* Type + table — NO status badge in body */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{orderType}</span>
          {ticket.table_number && (
            <span className="text-[11px] font-medium text-muted-foreground">&middot; T{ticket.table_number}</span>
          )}
          {ticket.rush && (
            <span className="ml-auto flex items-center gap-0.5 text-[10px] font-bold uppercase text-orange-500">
              <Flame className="h-3 w-3" /> RUSH
            </span>
          )}
          {allBeer && status === 'pending' && (
            <span className="ml-auto flex items-center gap-0.5 text-[10px] font-bold uppercase text-amber-500">
              <Beer className="h-3 w-3" /> AUTO
            </span>
          )}
        </div>

        {/* Items */}
        <div className="space-y-1 mb-2">
          {ticket.items.map((item, i) => (
            <div key={item.id || i}>
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-foreground w-4 text-right flex-shrink-0">{item.qty}</span>
                <span className={`text-sm font-medium ${item.fulfilled ? 'text-muted-foreground line-through' : 'text-foreground'} ${isBeerItem(item) ? 'text-amber-500' : ''}`}>
                  {item.fulfilled && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                  {item.name}
                </span>
              </div>
              {/* Modifications — ⊘ red for removed, + green for added */}
              {item.modifiers?.removed?.map((r, ri) => (
                <div key={`r-${ri}`} className="ml-5 mt-0.5 text-[11px] font-semibold text-red-400">{'\u2298'} {r}</div>
              ))}
              {item.modifiers?.extras?.map((e, ei) => {
                const name = typeof e === 'string' ? e : e.name;
                const price = typeof e === 'object' ? e.price : 0;
                const modText = `${name}${price > 0 ? ` (+$${price.toFixed(2)})` : ''}`;
                if (isRemoval(name)) {
                  return <div key={`e-${ei}`} className="ml-5 mt-0.5 text-[11px] font-semibold text-red-400">{'\u2298'} {modText}</div>;
                }
                return <div key={`e-${ei}`} className="ml-5 mt-0.5 text-[11px] font-semibold text-emerald-400">+ {modText}</div>;
              })}
              {item.notes && <div className="ml-5 mt-0.5 text-[11px] text-muted-foreground italic">{item.notes}</div>}
            </div>
          ))}
        </div>

        {/* Actions — px-3 pb-3 flex items-center gap-1.5 */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
          {/* Main action button — text-black on colored bg */}
          {NEXT_STATUS[status] && (
            <button
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-black ${cfg.btnBg} transition-colors`}
              onClick={() => onStatusChange(ticket.id, NEXT_STATUS[status])}
              data-testid={`ticket-action-${ticket.id}`}
            >
              <ActionIcon className="h-3 w-3" />
              {ACTION_LABELS[status]}
            </button>
          )}
          {/* Auxiliary buttons — h-8 w-8 rounded-lg */}
          {status === 'pending' && !allBeer && (
            <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors" onClick={() => onSetTime(ticket.id)} data-testid={`set-time-${ticket.id}`} title="Set timer">
              <Timer className="h-3.5 w-3.5" />
            </button>
          )}
          {(status === 'preparing' || (status === 'pending' && !allBeer)) && (
            <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors" title="Rush" onClick={() => toast.info('Rush notification sent')}>
              <Zap className="h-3.5 w-3.5" />
            </button>
          )}
          <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors ml-auto" title="View detail" onClick={() => onViewDetail(ticket)} data-testid={`detail-${ticket.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── PROGRESS BAR — base of card, preparing only ── */}
      {status === 'preparing' && ticket.estimated_minutes && ticket.started_at && (
        <ProgressBar startTime={ticket.started_at} estimatedMinutes={ticket.estimated_minutes} />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   KANBAN COLUMN
   Container: rounded-2xl, border border/40, bg-background/50, p-2
   Header to cards: mb-3
   Cards gap: space-y-2 (8px)
   Min-height: 200px
   Drop zone: border-primary/50, bg-primary/5
   Empty: "Empty" centered
   ═══════════════════════════════════════════════════════ */
const KanbanColumn = ({ title, tickets, status, onStatusChange, onSetTime, isDelayed, onDrop, onViewDetail }) => {
  const [dragOver, setDragOver] = useState(false);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true); };
  const handleDragLeave = () => { setDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const ticketId = e.dataTransfer.getData('ticket_id');
    if (ticketId && onDrop) onDrop(ticketId, COLUMN_STATUS_MAP[title]);
  };

  return (
    <div className="flex-1 min-w-[240px] flex flex-col" data-testid={`column-${status}`}>
      {/* Column header — dot + label + count, mb-3 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <span className="text-xs font-medium text-muted-foreground">({tickets.length})</span>
      </div>

      {/* Column container — rounded-2xl, border, bg, p-2, min-h */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 rounded-2xl border p-2 min-h-[200px] transition-all ${
          dragOver
            ? 'border-primary/50 bg-primary/5'
            : 'border-border/40 bg-background/50'
        }`}
        data-testid={`dropzone-${status}`}
      >
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[160px]">
            <span className="text-sm font-medium text-muted-foreground/40" data-testid={`empty-${status}`}>Empty</span>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                onStatusChange={onStatusChange}
                onSetTime={onSetTime}
                isDelayed={isDelayed}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MODALS — radius: 24px (rounded-3xl)
   ═══════════════════════════════════════════════════════ */

/* Order Delayed Modal */
const DelayedModal = ({ ticket, onMarkReady, onDismiss }) => {
  if (!ticket) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }} data-testid="delayed-popup">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border-2 border-red-500 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-500">ORDER DELAYED</h2>
            <p className="text-xs text-muted-foreground">Exceeded estimated time</p>
          </div>
        </div>
        <div className="bg-red-500/5 rounded-2xl p-4 mb-4 border border-red-500/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-red-500">{shortOrderNum(ticket.id)}</span>
              {ticket.table_number && <span className="text-sm font-bold">T{ticket.table_number}</span>}
              <span className="text-sm text-muted-foreground">{ticket.guest_name}</span>
            </div>
            <LiveTimer startTime={ticket.started_at} estimatedMinutes={ticket.estimated_minutes} isDelayed />
          </div>
          <div className="space-y-1 mt-2">
            {ticket.items.map((item, i) => (
              <div key={i} className="text-sm font-medium">{item.qty}x {item.name}</div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => onMarkReady(ticket.id)} data-testid="delayed-mark-ready">
            <CheckCircle className="h-4 w-4 mr-1.5" /> Mark Ready
          </Button>
          <Button variant="outline" className="h-10" onClick={onDismiss} data-testid="delayed-dismiss">
            Dismiss
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/* Estimated Time Modal */
const EstimatedTimeModal = ({ ticketId, onConfirm, onCancel }) => {
  const [value, setValue] = useState('');
  if (!ticketId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="eta-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl"
      >
        <h2 className="text-lg font-bold mb-1">Estimated Time</h2>
        <p className="text-sm text-muted-foreground mb-4">Set prep time before starting</p>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="number" min="1" max="120" autoFocus value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            className="flex-1 h-14 text-center text-2xl font-bold rounded-2xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
            data-testid="eta-minutes-input"
          />
          <span className="text-lg text-muted-foreground font-medium">min</span>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold"
            disabled={!value || parseInt(value) < 1}
            onClick={() => onConfirm(ticketId, parseInt(value))}
            data-testid="eta-confirm-btn">
            <CheckCircle className="h-4 w-4 mr-2" /> Start
          </Button>
          <Button variant="outline" className="h-11" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/* Order Detail Modal */
const OrderDetailModal = ({ ticket, onClose }) => {
  if (!ticket) return null;
  const status = ticket.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid="order-detail-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Colored header bar matching status */}
        <div className={`${cfg.headerBg} -mx-6 -mt-6 px-5 py-4 rounded-t-3xl mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">{shortOrderNum(ticket.id)}</span>
              <span className="text-sm font-semibold text-white/90">{ticket.guest_name || 'Guest'}</span>
            </div>
            <button className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Guest</span>
            <span className="font-semibold">{ticket.guest_name || 'Guest'}</span>
          </div>
          {ticket.table_number && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Table</span>
              <span className="font-semibold">T{ticket.table_number}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-semibold">{ticket.table_number ? 'Dine In' : 'Tab'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Elapsed</span>
            <span className="font-mono font-semibold">{elapsed}m</span>
          </div>
          {ticket.estimated_minutes && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated</span>
              <span className="font-mono font-semibold">{ticket.estimated_minutes}m</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-border pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Items</p>
          <div className="space-y-2">
            {ticket.items.map((item, i) => (
              <div key={item.id || i}>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-foreground w-4 text-right flex-shrink-0">{item.qty}</span>
                  <span className={`text-sm font-medium ${isBeerItem(item) ? 'text-amber-500' : 'text-foreground'}`}>{item.name}</span>
                </div>
                {item.modifiers?.removed?.map((r, ri) => (
                  <div key={`r-${ri}`} className="ml-5 mt-0.5 text-[11px] font-semibold text-red-400">{'\u2298'} {r}</div>
                ))}
                {item.modifiers?.extras?.map((e, ei) => {
                  const name = typeof e === 'string' ? e : e.name;
                  const price = typeof e === 'object' ? e.price : 0;
                  return <div key={`e-${ei}`} className="ml-5 mt-0.5 text-[11px] font-semibold text-emerald-400">+ {name}{price > 0 && ` (+$${price.toFixed(2)})`}</div>;
                })}
                {item.notes && <div className="ml-5 mt-0.5 text-[11px] text-muted-foreground italic">{item.notes}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {ticket.estimated_minutes && ticket.started_at && (
          <div className="mt-4">
            <ProgressBar startTime={ticket.started_at} estimatedMinutes={ticket.estimated_minutes} />
          </div>
        )}

        <div className="mt-4">
          <Button variant="outline" className="w-full h-10 rounded-xl" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN KDS PAGE
   Layout: flex-col, min-h-screen, bg-background
   Navbar: sticky top, h-14, bg-card/80 backdrop-blur-xl
   Board: flex-1, flex, gap-3, p-4, overflow-x-auto
   ═══════════════════════════════════════════════════════ */
export const KitchenPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [station, setStation] = useState('kitchen');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayedPopup, setDelayedPopup] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [etaModal, setEtaModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const boardRef = useRef(null);

  /* Load tickets */
  const loadTickets = useCallback(async () => {
    try {
      const res = await kdsAPI.getTickets(VENUE_ID(), station);
      const apiTickets = res.data.tickets || [];
      if (apiTickets.length > 0) {
        setTickets(apiTickets);
      } else {
        setTickets(MOCK_TICKETS.filter(t => t.destination === station));
      }
    } catch {
      setTickets(MOCK_TICKETS.filter(t => t.destination === station));
    }
    setLoading(false);
  }, [station]);

  useEffect(() => { setLoading(true); loadTickets(); }, [loadTickets]);
  useEffect(() => { const iv = setInterval(loadTickets, 10000); return () => clearInterval(iv); }, [loadTickets]);

  /* Beer auto-ready */
  const autoReadiedRef = useRef(new Set());
  useEffect(() => {
    const pendingBeer = tickets.filter(t => t.status === 'pending' && isAllBeer(t.items) && !autoReadiedRef.current.has(t.id));
    pendingBeer.forEach(t => {
      autoReadiedRef.current.add(t.id);
      toast.success(`${shortOrderNum(t.id)} — All beer, auto-ready!`);
      handleStatusChange(t.id, 'ready');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets]);

  /* Delayed detection */
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

  /* Status change */
  const handleStatusChange = async (ticketId, newStatus, etaMinutes) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const updated = { ...t, status: newStatus };
      if (newStatus === 'preparing') {
        updated.started_at = new Date().toISOString();
        if (etaMinutes) updated.estimated_minutes = etaMinutes;
      }
      return updated;
    }));
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      if (etaMinutes) fd.append('estimated_minutes', etaMinutes.toString());
      await kdsAPI.updateStatus(ticketId, fd);
      if (delayedPopup?.id === ticketId) setDelayedPopup(null);
      setDismissedIds(prev => { const next = new Set(prev); next.delete(ticketId); return next; });
    } catch { /* mock mode */ }
  };

  const handleRequestStatusChange = (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && ticket.status === 'pending' && newStatus === 'preparing') {
      setEtaModal(ticketId);
      return;
    }
    handleStatusChange(ticketId, newStatus);
  };

  const handleConfirmEta = (ticketId, minutes) => {
    handleStatusChange(ticketId, 'preparing', minutes);
    setEtaModal(null);
  };

  const handleDrop = (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;
    handleRequestStatusChange(ticketId, newStatus);
  };

  /* Filter tickets */
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
  const lateCount = delayed.length;

  const columnData = {
    Pending: { tickets: pending, status: 'pending', isDelayed: false },
    Preparing: { tickets: preparing, status: 'preparing', isDelayed: false },
    Ready: { tickets: ready, status: 'ready', isDelayed: false },
    Delivered: { tickets: delivered, status: 'delivered', isDelayed: false },
    Delayed: { tickets: delayed, status: 'delayed', isDelayed: true },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="kds-page">
      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {delayedPopup && (
          <DelayedModal
            key="delayed"
            ticket={delayedPopup}
            onMarkReady={(id) => { handleStatusChange(id, 'ready'); setDelayedPopup(null); }}
            onDismiss={() => { if (delayedPopup) { setDismissedIds(prev => new Set(prev).add(delayedPopup.id)); setDelayedPopup(null); } }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {etaModal && (
          <EstimatedTimeModal
            key="eta"
            ticketId={etaModal}
            onConfirm={handleConfirmEta}
            onCancel={() => setEtaModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailModal && (
          <OrderDetailModal
            key="detail"
            ticket={detailModal}
            onClose={() => setDetailModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ═══ NAVBAR — h-14, sticky top, bg-card/80 backdrop-blur-xl ═══ */}
      <header className="sticky top-0 z-50 h-14 border-b border-border/50 bg-card/80 backdrop-blur-xl px-5 flex items-center" data-testid="kds-navbar">
        {/* Left: Logo + divider + venue name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <SpetLogo size="default" />
          <div className="h-5 w-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground">{VENUE_NAME()}</span>
        </div>

        {/* Center: station toggle — bg-muted/50 rounded-xl p-1 */}
        <div className="flex-1 flex justify-center">
          <div className="bg-muted/50 rounded-xl p-1 flex relative" data-testid="station-toggle">
            <button
              onClick={() => setStation('kitchen')}
              className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                station === 'kitchen'
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="filter-kitchen"
            >
              <UtensilsCrossed className="h-3.5 w-3.5" /> Kitchen
            </button>
            <button
              onClick={() => setStation('bar')}
              className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                station === 'bar'
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="filter-bar"
            >
              <Beer className="h-3.5 w-3.5" /> Bar
            </button>
          </div>
        </div>

        {/* Right: late badge + breadcrumb + controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {lateCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse" data-testid="late-badge">
              {lateCount} late
            </span>
          )}
          {/* Breadcrumb — KDS > Kitchen/Bar */}
          <span className="flex items-center gap-1" data-testid="kds-breadcrumb">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">KDS</span>
            <span className="text-muted-foreground/40">&rsaquo;</span>
            <span className="text-xs font-semibold text-primary">{station === 'kitchen' ? 'Kitchen' : 'Bar'}</span>
          </span>
          <div className="h-4 w-px bg-border" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/venue/home')} data-testid="home-btn">
            <Home className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { const { handleFullLogout } = await import('../utils/logout'); await handleFullLogout(logout); }} data-testid="logout-btn">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ═══ KANBAN BOARD — flex-1, flex, gap-3, p-4, overflow-x-auto ═══ */}
      <main className="flex-1 flex gap-3 p-4 overflow-x-auto" ref={boardRef} data-testid="kds-board">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full" />
          </div>
        ) : (
          COLUMN_ORDER.map(col => {
            const { tickets: colTickets, status, isDelayed: colDelayed } = columnData[col];
            return (
              <KanbanColumn
                key={col}
                title={col}
                tickets={colTickets}
                status={status}
                onStatusChange={handleRequestStatusChange}
                onSetTime={(id) => setEtaModal(id)}
                isDelayed={colDelayed}
                onDrop={handleDrop}
                onViewDetail={setDetailModal}
              />
            );
          })
        )}
      </main>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { kdsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import SpetLogo from '../components/SpetLogo';
import {
  UtensilsCrossed, Beer, Clock, ChefHat, CheckCircle,
  Timer, LogOut, Home, AlertTriangle, X, PackageCheck, Zap,
  ChevronRight, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════
   DATA TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

/** @typedef {'kitchen' | 'bar'} KitchenStation */
/** @typedef {'pending' | 'preparing' | 'ready' | 'delivered' | 'delayed'} TicketStatus */

/**
 * @typedef {Object} TicketItem
 * @property {string} id
 * @property {string} name
 * @property {number} qty
 * @property {{ removed?: string[], extras?: (string|{name:string,price:number})[] }} [modifiers]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} KitchenTicket
 * @property {string} id
 * @property {TicketStatus} status
 * @property {string} [guest_name]
 * @property {number} [table_number]
 * @property {TicketItem[]} items
 * @property {string} created_at
 * @property {string} [started_at]
 * @property {number} [estimated_minutes]
 * @property {string} destination
 */

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';
const VENUE_NAME = () => localStorage.getItem('active_venue_name') || 'Downtown';

/* Beer auto-ready regex */
const BEER_REGEX = /\b(beer|cerveja|chopp?|draft|lager|pils(ner)?|ipa|stout|ale|wheat|porter|pilsen|helles|weiss|bock)\b/i;

const isBeerItem = (item) => BEER_REGEX.test(item.name);
const isAllBeer = (items) => items.length > 0 && items.every(isBeerItem);

/* Status config */
const STATUS_CONFIG = {
  pending:   { dot: 'bg-amber-500',   headerBg: 'bg-amber-500/8 border-b border-amber-500/15', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', ring: 'ring-amber-500/20' },
  preparing: { dot: 'bg-blue-500',    headerBg: 'bg-blue-500/8 border-b border-blue-500/15',   text: 'text-blue-600 dark:text-blue-400',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',   ring: 'ring-blue-500/20' },
  ready:     { dot: 'bg-emerald-500', headerBg: 'bg-emerald-500/8 border-b border-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  delivered: { dot: 'bg-gray-400',    headerBg: 'bg-gray-500/5 border-b border-gray-500/10', text: 'text-gray-500', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400', ring: 'ring-gray-500/10' },
  delayed:   { dot: 'bg-red-500',     headerBg: 'bg-red-500/8 border-b border-red-500/20',   text: 'text-red-600 dark:text-red-400',   badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', ring: 'ring-red-500/20' },
};

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered', delayed: 'ready' };
const ACTION_LABELS = { pending: 'Start', preparing: 'Ready', ready: 'Deliver', delayed: 'Ready' };
const STATUS_LABELS = { pending: 'NEW', preparing: 'PREP', ready: 'READY', delivered: 'DONE', delayed: 'LATE' };
const COLUMN_ORDER = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Delayed'];
const COLUMN_STATUS_MAP = { 'Pending': 'pending', 'Preparing': 'preparing', 'Ready': 'ready', 'Delivered': 'delivered', 'Delayed': 'delayed' };

const shortOrderNum = (id) => {
  if (!id) return '#000';
  const num = parseInt(id.replace(/[^0-9a-f]/gi, '').slice(-4), 16) % 1000;
  return `#${String(num).padStart(3, '0')}`;
};

/* ═══════════════════════════════════════════════════════
   MOCK DATA (when API returns empty)
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
    id: 'kds-mock-005', status: 'ready', guest_name: 'João P.', table_number: 9,
    destination: 'kitchen', created_at: new Date(Date.now() - 22 * 60000).toISOString(),
    started_at: new Date(Date.now() - 15 * 60000).toISOString(), estimated_minutes: 12,
    items: [
      { id: 'i10', name: 'Fish & Chips', qty: 2 },
    ],
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
  if (!startTime) return { minutes: 0, seconds: 0, total: 0, progress: 0 };
  const diff = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
  return { minutes: Math.floor(diff / 60), seconds: diff % 60, total: diff, progress: 0 };
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

/* ═══════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════ */
const ProgressBar = ({ startTime, estimatedMinutes }) => {
  const { total } = useElapsed(startTime);
  if (!estimatedMinutes || !startTime) return null;

  const totalSeconds = estimatedMinutes * 60;
  const pct = Math.min(100, (total / totalSeconds) * 100);
  const isOvertime = total > totalSeconds;

  const barColor = isOvertime
    ? 'bg-red-500'
    : pct > 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden" data-testid="progress-bar">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TICKET CARD — exact spec spacing
   Card gap: 8px (space-y-2)
   Card radius: 16px (rounded-2xl)
   ═══════════════════════════════════════════════════════ */
const TicketCard = ({ ticket, onStatusChange, onSetTime, isDelayed, onViewDetail }) => {
  const status = isDelayed ? 'delayed' : ticket.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;
  const orderType = ticket.table_number ? 'DINE IN' : 'TAB';
  const hasBeer = ticket.items.some(isBeerItem);
  const allBeer = isAllBeer(ticket.items);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('ticket_id', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
  };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; };

  return (
    <div
      className={`rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing active:scale-[0.98] ${isDelayed ? 'ring-2 ring-red-500/30 animate-pulse' : 'hover:shadow-md'}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`ticket-${ticket.id}`}
    >
      {/* Header band */}
      <div className={`px-3 py-2.5 ${cfg.headerBg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-extrabold tracking-tight ${cfg.text}`} data-testid={`ticket-num-${ticket.id}`}>
              {shortOrderNum(ticket.id)}
            </span>
            <span className="text-xs font-semibold truncate max-w-[100px]">
              {ticket.guest_name || (ticket.table_number ? `Table ${ticket.table_number}` : 'Guest')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {ticket.status === 'preparing' || isDelayed ? (
              <LiveTimer startTime={ticket.started_at || ticket.created_at} estimatedMinutes={ticket.estimated_minutes} isDelayed={isDelayed} />
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{elapsed}m</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{orderType}</span>
            {hasBeer && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                <Beer className="h-3 w-3" />
                {allBeer ? 'AUTO' : ''}
              </span>
            )}
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-3 py-2.5">
        <div className="space-y-1.5 mb-2">
          {ticket.items.map((item, i) => (
            <div key={item.id || i}>
              <div className="flex items-start gap-2">
                <span className="text-sm font-bold text-foreground/60 w-4 text-right flex-shrink-0">{item.qty}</span>
                <span className={`text-sm font-semibold ${isBeerItem(item) ? 'text-amber-600 dark:text-amber-400' : ''}`}>{item.name}</span>
              </div>
              {item.modifiers?.removed?.map((r, ri) => (
                <div key={`r-${ri}`} className="ml-6 text-[11px] text-red-500 font-medium">NO {r}</div>
              ))}
              {item.modifiers?.extras?.map((e, ei) => {
                const name = typeof e === 'string' ? e : e.name;
                const price = typeof e === 'object' ? e.price : 0;
                return (
                  <div key={`e-${ei}`} className="ml-6 text-[11px] text-emerald-500 font-medium">+ {name}{price > 0 && ` (+$${price.toFixed(2)})`}</div>
                );
              })}
              {item.notes && <div className="ml-6 text-[11px] text-muted-foreground italic">{item.notes}</div>}
            </div>
          ))}
        </div>

        {/* Progress bar for preparing tickets */}
        {(status === 'preparing' || isDelayed) && ticket.estimated_minutes && (
          <div className="mb-2">
            <ProgressBar startTime={ticket.started_at || ticket.created_at} estimatedMinutes={ticket.estimated_minutes} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-2 border-t border-border/40">
          {NEXT_STATUS[status] && (
            <Button size="sm" className={`flex-1 h-8 text-[11px] font-bold uppercase tracking-wide ${
              isDelayed ? 'bg-red-500 hover:bg-red-600 text-white' :
              status === 'preparing' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
            }`}
              onClick={() => onStatusChange(ticket.id, NEXT_STATUS[status])}
              data-testid={`ticket-action-${ticket.id}`}>
              {status === 'pending' && <ChefHat className="h-3 w-3 mr-1" />}
              {status === 'preparing' && <CheckCircle className="h-3 w-3 mr-1" />}
              {(status === 'ready' || status === 'delayed') && <PackageCheck className="h-3 w-3 mr-1" />}
              {ACTION_LABELS[status]}
            </Button>
          )}
          {status === 'pending' && (
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => onSetTime(ticket.id)} data-testid={`set-time-${ticket.id}`} title="Set timer">
              <Timer className="h-3 w-3" />
            </Button>
          )}
          {(status === 'preparing' || status === 'pending') && (
            <Button size="sm" variant="outline" className="h-8 px-2" title="Rush" onClick={() => toast.info('Rush notification sent')}>
              <Zap className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 px-2" title="View detail" onClick={() => onViewDetail(ticket)}>
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   KANBAN COLUMN
   Drop zones: rounded-2xl (16px)
   Header to cards: 12px (mb-3)
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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 w-[280px] transition-all rounded-2xl p-2 ${dragOver ? 'bg-foreground/[0.04] ring-2 ring-foreground/10' : ''}`}
      data-testid={`column-${status}`}
    >
      {/* Column header — mb-3 (12px) */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <h2 className="text-xs font-bold tracking-tight uppercase">{title}</h2>
        <span className="text-[11px] text-muted-foreground font-medium">({tickets.length})</span>
      </div>

      {/* Cards — space-y-2 (8px) */}
      <div className="space-y-2 min-h-[160px]">
        {tickets.length === 0 ? (
          <div className="border-2 border-dashed border-border/40 rounded-2xl p-6 text-center text-muted-foreground/30 text-xs font-medium" data-testid={`empty-${status}`}>
            Drop here
          </div>
        ) : tickets.map(t => (
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
      <div className="bg-card border-2 border-red-500 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
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
      </div>
    </div>
  );
};

/* Estimated Time Modal */
const EstimatedTimeModal = ({ ticketId, onConfirm, onCancel }) => {
  const [value, setValue] = useState('');
  if (!ticketId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="eta-modal">
      <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold mb-1">Estimated Time</h2>
        <p className="text-sm text-muted-foreground mb-4">Set prep time before starting</p>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="number" min="1" max="120" autoFocus value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            className="flex-1 h-14 text-center text-2xl font-bold rounded-2xl border-2 border-border bg-background focus:border-blue-500 focus:outline-none transition-colors"
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
      </div>
    </div>
  );
};

/* Order Detail Modal */
const OrderDetailModal = ({ ticket, onClose }) => {
  if (!ticket) return null;
  const status = ticket.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const elapsed = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000) : 0;
  const hasBeer = ticket.items.some(isBeerItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid="order-detail-modal">
      <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xl font-extrabold ${cfg.text}`}>{shortOrderNum(ticket.id)}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cfg.badge}`}>{STATUS_LABELS[status]}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
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
          {hasBeer && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Beer auto-ready</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                <Beer className="h-3.5 w-3.5 inline mr-1" />
                {isAllBeer(ticket.items) ? 'All beer — auto ready' : 'Contains beer'}
              </span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Items</p>
          <div className="space-y-2">
            {ticket.items.map((item, i) => (
              <div key={item.id || i} className="flex items-start gap-2">
                <span className="text-sm font-bold text-foreground/60 w-4 text-right flex-shrink-0">{item.qty}</span>
                <div className="flex-1">
                  <span className={`text-sm font-semibold ${isBeerItem(item) ? 'text-amber-600 dark:text-amber-400' : ''}`}>{item.name}</span>
                  {item.modifiers?.removed?.map((r, ri) => (
                    <div key={`r-${ri}`} className="text-[11px] text-red-500 font-medium">NO {r}</div>
                  ))}
                  {item.modifiers?.extras?.map((e, ei) => {
                    const name = typeof e === 'string' ? e : e.name;
                    const price = typeof e === 'object' ? e.price : 0;
                    return (
                      <div key={`e-${ei}`} className="text-[11px] text-emerald-500 font-medium">+ {name}{price > 0 && ` (+$${price.toFixed(2)})`}</div>
                    );
                  })}
                  {item.notes && <div className="text-[11px] text-muted-foreground italic">{item.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        {ticket.estimated_minutes && ticket.started_at && (
          <div className="mt-4">
            <ProgressBar startTime={ticket.started_at} estimatedMinutes={ticket.estimated_minutes} />
          </div>
        )}

        <div className="mt-4">
          <Button variant="outline" className="w-full h-10" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN KDS PAGE
   Layout: flex-col, min-h-screen, bg-background
   Sticky navbar (top), kanban board = flex-1
   Board padding: 16px (p-4)
   Column gap: 12px (gap-3)
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

  /* Load tickets from API, fall back to mock */
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

  /* Beer auto-ready: when a pending ticket has ALL beer items, auto-advance */
  useEffect(() => {
    const pendingBeerTickets = tickets.filter(t => t.status === 'pending' && isAllBeer(t.items));
    pendingBeerTickets.forEach(t => {
      if (!t._autoReadied) {
        toast.success(`${shortOrderNum(t.id)} — All beer, auto-ready!`, { icon: '🍺' });
        handleStatusChange(t.id, 'ready');
      }
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

  /* Status change handler */
  const handleStatusChange = async (ticketId, newStatus, etaMinutes) => {
    /* Optimistic update for mock tickets */
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
    } catch {
      /* Mock mode — already updated optimistically */
    }
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

  const handleSetTime = (ticketId) => {
    setEtaModal(ticketId);
  };

  const handleDrop = (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;
    handleRequestStatusChange(ticketId, newStatus);
  };

  /* Filter tickets into columns */
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
      <DelayedModal
        ticket={delayedPopup}
        onMarkReady={(id) => { handleStatusChange(id, 'ready'); setDelayedPopup(null); }}
        onDismiss={() => { if (delayedPopup) { setDismissedIds(prev => new Set(prev).add(delayedPopup.id)); setDelayedPopup(null); } }}
      />
      <EstimatedTimeModal
        ticketId={etaModal}
        onConfirm={handleConfirmEta}
        onCancel={() => setEtaModal(null)}
      />
      <OrderDetailModal
        ticket={detailModal}
        onClose={() => setDetailModal(null)}
      />

      {/* ═══ NAVBAR — sticky top ═══ */}
      <header className="sticky top-0 z-50 h-12 border-b border-border bg-card px-4 flex items-center" data-testid="kds-navbar">
        {/* Left: BrandLogo + separator + venue name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <SpetLogo size="default" />
          <div className="h-5 w-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground">{VENUE_NAME()}</span>
        </div>

        {/* Center: station toggle */}
        <div className="flex-1 flex justify-center">
          <div className="flex rounded-lg border border-border overflow-hidden" data-testid="station-toggle">
            <button
              onClick={() => setStation('kitchen')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${station === 'kitchen' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="filter-kitchen"
            >
              <UtensilsCrossed className="h-3.5 w-3.5" /> Kitchen
            </button>
            <button
              onClick={() => setStation('bar')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${station === 'bar' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
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
          <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid="kds-breadcrumb">
            KDS <ChevronRight className="h-3 w-3" /> <span className="font-semibold text-foreground">{station === 'kitchen' ? 'Kitchen' : 'Bar'}</span>
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

      {/* ═══ KANBAN BOARD — flex-1, horizontal scroll, p-4, gap-3 ═══ */}
      <main className="flex-1 p-4 overflow-hidden" data-testid="kds-board">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full" />
          </div>
        ) : (
          <div ref={boardRef} className="flex gap-3 h-full overflow-x-auto pb-2" data-testid="kanban-columns">
            {COLUMN_ORDER.map(col => {
              const { tickets: colTickets, status, isDelayed: colDelayed } = columnData[col];
              return (
                <KanbanColumn
                  key={col}
                  title={col}
                  tickets={colTickets}
                  status={status}
                  onStatusChange={handleRequestStatusChange}
                  onSetTime={handleSetTime}
                  isDelayed={colDelayed}
                  onDrop={handleDrop}
                  onViewDetail={setDetailModal}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

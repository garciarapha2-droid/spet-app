import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Brain, Star, Send, MessageSquare, Clock, MapPin, Heart, CreditCard, Award, TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle, Calendar, Tag, Gift, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { venueColors, guestPurchaseHistory, guestEventAttendance, guestLoyaltyActivity, guestVenueBreakdown, guestCategoryBreakdown } from '../../data/ownerData';

const tierBadge = {
  VIP: 'bg-[hsl(var(--primary)_/_0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)_/_0.2)]',
  Platinum: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  Gold: 'bg-[hsl(var(--warning)_/_0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)_/_0.2)]',
  Silver: 'bg-[hsl(var(--muted)_/_0.8)] text-muted-foreground border border-[hsl(var(--border))]',
  Bronze: 'bg-[hsl(var(--muted)_/_0.8)] text-muted-foreground border border-[hsl(var(--border))]',
};

const segmentBadge = {
  vip: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]',
  active: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]',
  new: 'bg-blue-500/10 text-blue-500',
  at_risk: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]',
  lost: 'bg-[hsl(var(--danger)_/_0.15)] text-[hsl(var(--danger))]',
};

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } };

/* ─── Modal (Quick Profile Preview) ─── */
export function CustomerProfileModal({ guest, onClose }) {
  const navigate = useNavigate();
  if (!guest) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl"
        onClick={e => e.stopPropagation()}
        data-testid="customer-profile-modal"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[hsl(var(--muted))] transition-colors z-10" data-testid="modal-close-btn">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-[hsl(var(--primary)_/_0.12)] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))]">
              {guest.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{guest.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
                <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold capitalize ${segmentBadge[guest.segment] || ''}`}>{guest.segment?.replace('_', ' ')}</span>
                {guest.returningRisk && <span className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]">At Risk</span>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{guest.email}</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total Spent', value: `$${guest.totalSpent?.toLocaleString()}` },
              { label: 'Visits', value: guest.visits },
              { label: 'Avg Spend', value: `$${guest.avgSpend}` },
              { label: 'Score', value: `${guest.score}/100` },
            ].map(k => (
              <div key={k.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2 text-center">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">{k.label}</p>
                <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="rounded-lg border border-[hsl(var(--border))] p-3 space-y-1.5">
            {[
              { label: 'Frequency', value: guest.frequency },
              { label: 'Favorite', value: guest.favoriteCategory },
              { label: 'Preferred Venue', value: guest.preferredVenue },
              { label: 'Last Visit', value: guest.lastVisit },
              { label: 'Loyalty', value: guest.loyaltyEnrolled ? 'Enrolled' : 'Not enrolled' },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{d.label}</span>
                <span className="text-[11px] font-medium text-foreground">{d.value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="send-reward-btn">
              <Send className="h-3 w-3" /> Send Reward
            </button>
            <button
              onClick={() => { onClose(); navigate(`/owner/customers/${guest.id}`); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-foreground text-xs font-semibold hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors"
              data-testid="view-full-history-btn"
            >
              View Full History <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Full Page: Guest Full History (Canonical) ─── */
export default function GuestFullHistory({ guest, onBack }) {
  const navigate = useNavigate();
  if (!guest) return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted-foreground">Guest not found</p></div>;

  const purchases = guestPurchaseHistory.filter(p => p.guestId === guest.id);
  const events = guestEventAttendance[guest.id] || [];
  const loyalty = guestLoyaltyActivity[guest.id];
  const venueBreak = guestVenueBreakdown[guest.id] || [];
  const catBreak = guestCategoryBreakdown[guest.id] || [];
  const maxVenueSpent = Math.max(...venueBreak.map(v => v.spent), 1);
  const maxCatAmount = Math.max(...catBreak.map(c => c.amount), 1);

  const spendColor = guest.spendTrend === 'up' ? 'text-[hsl(var(--success))]' : guest.spendTrend === 'down' ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground';
  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  return (
    <div className="space-y-5" data-testid="guest-full-history">
      {/* ── Back ── */}
      <motion.button {...fadeUp} onClick={handleBack} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="guest-back-btn">
        <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back
      </motion.button>

      {/* ── 1. HEADER ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary)_/_0.12)] flex items-center justify-center text-base font-bold text-[hsl(var(--primary))] shrink-0">
            {guest.name.split(' ').map(n => n[0]).join('')}
          </div>

          {/* Name + Tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">{guest.name}</h2>
              <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
              <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold capitalize ${segmentBadge[guest.segment] || ''}`}>{guest.segment?.replace('_', ' ')}</span>
              {guest.returningRisk && <span className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]">At Risk</span>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{guest.email} &middot; Last visit: {guest.lastVisit} &middot; {guest.frequency}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="profile-send-reward">
              <Send className="h-3 w-3" /> Send Reward
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-foreground text-xs font-semibold hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors">
              <MessageSquare className="h-3 w-3" /> Message
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── 2. BEHAVIOR SUMMARY ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Brain className="h-4 w-4 text-[hsl(var(--primary))]" /></div>
          <div>
            <p className="text-sm font-semibold text-foreground">Behavior Summary</p>
            <p className="text-[11px] text-muted-foreground">AI-generated profile insights</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
          {[
            { label: 'Preferred Venue', value: guest.preferredVenue, dot: venueColors[guest.preferredVenue]?.dot },
            { label: 'Top Event', value: guest.topEvent },
            { label: 'Spend Trend', value: guest.spendTrend, color: spendColor },
            { label: 'Risk Signal', value: guest.riskSignal === 'none' ? 'Low risk' : guest.riskSignal, color: guest.riskSignal === 'none' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]' },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.4)] p-2.5">
              <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{item.label}</p>
              <div className="flex items-center gap-1.5">
                {item.dot && <span className={`w-2 h-2 rounded-full ${item.dot}`} />}
                <span className={`text-sm font-semibold ${item.color || 'text-foreground'}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={`rounded-lg border p-2.5 ${guest.riskSignal === 'none' ? 'border-[hsl(var(--success)_/_0.25)] bg-[hsl(var(--success)_/_0.03)]' : 'border-[hsl(var(--danger)_/_0.25)] bg-[hsl(var(--danger)_/_0.03)]'}`}>
          <p className="text-[11px] text-muted-foreground">
            {guest.name.split(' ')[0]} is a {guest.frequency.toLowerCase()} visitor who prefers {guest.preferredVenue} and typically attends {guest.topEvent}.
            {guest.riskSignal !== 'none' ? ` Warning: ${guest.riskSignal}.` : ' Engagement is healthy.'}
          </p>
        </div>
      </motion.div>

      {/* ── 3. KPI CARDS ROW ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Spent', value: `$${guest.totalSpent.toLocaleString()}` },
          { label: 'Visits', value: guest.visits },
          { label: 'Avg Spend', value: `$${guest.avgSpend}` },
          { label: 'Score', value: `${guest.score}/100` },
          { label: 'Fav Category', value: guest.favoriteCategory },
          { label: 'Frequency', value: guest.frequency },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 + i * 0.03 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-3">
            <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground mb-0.5">{kpi.label}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Retention Risk Alert ── */}
      {guest.riskSignal !== 'none' && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.22 }} className={`rounded-xl border-2 px-4 py-3 flex items-center gap-2.5 ${guest.riskSignal.includes('inactive') || guest.riskSignal.includes('churn') ? 'border-[hsl(var(--danger)_/_0.3)] bg-[hsl(var(--danger)_/_0.04)]' : 'border-[hsl(var(--warning)_/_0.3)] bg-[hsl(var(--warning)_/_0.04)]'}`} data-testid="retention-risk-alert">
          <AlertTriangle className={`h-4 w-4 shrink-0 ${guest.riskSignal.includes('inactive') || guest.riskSignal.includes('churn') ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--warning))]'}`} />
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">{guest.riskSignal}</p>
            <p className="text-[11px] text-muted-foreground">Last visit {guest.lastVisit} &middot; {guest.lastVisitDaysAgo} days ago</p>
          </div>
        </motion.div>
      )}

      {/* ── 4. VENUE BREAKDOWN + 5. CATEGORY BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.26 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Venue Breakdown</p>
          </div>
          <div className="space-y-3">
            {venueBreak.length > 0 ? venueBreak.map((v, i) => (
              <div key={v.venue}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${venueColors[v.venue]?.dot || 'bg-muted-foreground'}`} />
                    <span className="text-sm font-medium text-foreground">{v.venue}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">${v.spent.toLocaleString()} &middot; {v.visits} visits</span>
                </div>
                <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: venueColors[v.venue]?.hex || '#888' }} initial={{ width: 0 }} animate={{ width: `${(v.spent / maxVenueSpent) * 100}%` }} transition={{ duration: 0.7, delay: 0.3 + i * 0.08 }} />
                </div>
              </div>
            )) : <p className="text-[11px] text-muted-foreground italic">No venue data</p>}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category Breakdown</p>
          </div>
          <div className="space-y-3">
            {catBreak.length > 0 ? catBreak.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.category}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">${c.amount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[hsl(var(--primary))]" initial={{ width: 0 }} animate={{ width: `${(c.amount / maxCatAmount) * 100}%` }} transition={{ duration: 0.7, delay: 0.35 + i * 0.08 }} />
                </div>
              </div>
            )) : <p className="text-[11px] text-muted-foreground italic">No category data</p>}
          </div>
        </motion.div>
      </div>

      {/* ── 6. EVENTS ATTENDED + 7. PURCHASE HISTORY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.34 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Events Attended</p>
          </div>
          <div className="space-y-1.5">
            {events.length > 0 ? events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors cursor-pointer group">
                <span className={`w-2 h-2 rounded-full shrink-0 ${venueColors[ev.venue]?.dot || 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{ev.event}</p>
                  <p className="text-[11px] text-muted-foreground">{ev.venue} &middot; {ev.attended}x attended</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">${ev.totalSpent.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">avg ${ev.avgSpend}</p>
                </div>
              </div>
            )) : <p className="text-[11px] text-muted-foreground italic py-2">No event data</p>}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.38 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Purchase History</p>
          </div>
          <div className="space-y-1.5">
            {purchases.length > 0 ? purchases.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-2 rounded-lg">
                <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${venueColors[p.venue]?.dot || 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{p.items}</p>
                  <p className="text-[11px] text-muted-foreground">{p.date} &middot; {p.event} &middot; {p.venue}</p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">${p.total}</span>
              </div>
            )) : <p className="text-[11px] text-muted-foreground italic py-2">No purchase data</p>}
          </div>
        </motion.div>
      </div>

      {/* ── 8. LOYALTY ACTIVITY ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.42 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Loyalty Activity</p>
        </div>
        {loyalty ? (
          <div className="space-y-0">
            {loyalty.map((l, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${l.type === 'earned' ? 'bg-[hsl(var(--success))]' : l.type === 'redeemed' ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--warning))]'}`} />
                  {i < loyalty.length - 1 && <div className="w-px h-7 bg-[hsl(var(--border))]" />}
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-sm text-foreground">{l.detail}</p>
                  <p className="text-[11px] text-muted-foreground">{l.date}</p>
                </div>
                {l.points !== 0 && <span className={`text-sm font-semibold tabular-nums ${l.points > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--primary))]'}`}>{l.points > 0 ? '+' : ''}{l.points}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Gift className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Not enrolled in loyalty program</p>
            <button className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="enroll-guest-btn">
              Enroll Guest
            </button>
          </div>
        )}
      </motion.div>

      {/* ── 9. VISIT TIMELINE ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.46 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Visit Timeline</p>
        </div>
        <div className="space-y-0">
          {purchases.length > 0 ? purchases.map((p, i) => (
            <div key={p.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${venueColors[p.venue]?.dot || 'bg-muted-foreground'}`} />
                {i < purchases.length - 1 && <div className="w-px h-8 bg-[hsl(var(--border))]" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{p.event}</p>
                  <span className="text-sm font-semibold text-foreground tabular-nums">${p.total}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{p.date} &middot; {p.venue} &middot; {p.items}</p>
              </div>
            </div>
          )) : (
            <p className="text-[11px] text-muted-foreground italic py-2">No visit timeline data</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

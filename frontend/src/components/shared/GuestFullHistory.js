import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Brain, Star, Send, MessageSquare, Clock, MapPin, Heart, CreditCard, Award, TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { venueColors, guestPurchaseHistory, guestEventAttendance, guestLoyaltyActivity, guestVenueBreakdown, guestCategoryBreakdown } from '../../data/ownerData';

const tierBadge = {
  VIP: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]',
  Platinum: 'bg-purple-500/10 text-purple-400',
  Gold: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]',
  Silver: 'bg-[hsl(var(--muted))] text-muted-foreground',
  Bronze: 'bg-[hsl(var(--muted))] text-muted-foreground',
};

const segmentBadge = {
  vip: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]',
  active: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]',
  new: 'bg-blue-500/10 text-blue-500',
  at_risk: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]',
  lost: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]',
};

const riskBorder = {
  none: 'border-[hsl(var(--success)_/_0.3)]',
  'declining visits': 'border-[hsl(var(--warning)_/_0.3)]',
  'declining frequency': 'border-[hsl(var(--warning)_/_0.3)]',
  'high churn probability': 'border-[hsl(var(--danger)_/_0.3)]',
  'inactive 30+ days': 'border-[hsl(var(--danger)_/_0.3)]',
};

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

/**
 * CustomerProfileModal - Quick preview modal opened when clicking a guest row.
 * Shows summary KPIs + actions. "View Full History" navigates to full page.
 */
export function CustomerProfileModal({ guest, onClose }) {
  const navigate = useNavigate();
  if (!guest) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl"
        onClick={e => e.stopPropagation()}
        data-testid="customer-profile-modal"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[hsl(var(--muted))] transition-colors z-10" data-testid="modal-close-btn">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))]">
              {guest.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">{guest.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
                {guest.returningRisk && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]">At Risk</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{guest.email}</p>
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
              <div key={k.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{k.label}</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Profile details */}
          <div className="rounded-lg border border-[hsl(var(--border))] p-3 space-y-2">
            {[
              { label: 'Tier', value: guest.tier },
              { label: 'Segment', value: guest.segment },
              { label: 'Frequency', value: guest.frequency },
              { label: 'Favorite Category', value: guest.favoriteCategory },
              { label: 'Last Visit', value: guest.lastVisit },
              { label: 'Loyalty', value: guest.loyaltyEnrolled ? 'Enrolled' : 'Not enrolled' },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{d.label}</span>
                <span className="text-xs font-medium text-foreground">{d.value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="send-reward-btn">
              <Send className="h-3.5 w-3.5" /> Send Reward
            </button>
            <button
              onClick={() => { onClose(); navigate(`/owner/customers/${guest.id}`); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-foreground text-xs font-semibold hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors"
              data-testid="view-full-history-btn"
            >
              View Full History <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * GuestFullHistory - The canonical full-page guest profile.
 * Used at /owner/customers/:guestId AND anywhere else via the shared component.
 */
export default function GuestFullHistory({ guest, onBack }) {
  const navigate = useNavigate();
  if (!guest) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Guest not found</p></div>;

  const purchases = guestPurchaseHistory.filter(p => p.guestId === guest.id);
  const events = guestEventAttendance[guest.id] || [];
  const loyalty = guestLoyaltyActivity[guest.id];
  const venueBreak = guestVenueBreakdown[guest.id] || [];
  const catBreak = guestCategoryBreakdown[guest.id] || [];
  const maxVenueSpent = Math.max(...venueBreak.map(v => v.spent), 1);
  const maxCatAmount = Math.max(...catBreak.map(c => c.amount), 1);

  const spendColor = guest.spendTrend === 'up' ? 'text-[hsl(var(--success))]' : guest.spendTrend === 'down' ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground';
  const riskBorderClass = riskBorder[guest.riskSignal] || riskBorder.none;

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  return (
    <div className="space-y-6" data-testid="guest-full-history">
      {/* Back */}
      <motion.button {...fadeUp} onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="guest-back-btn">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center text-lg font-bold text-[hsl(var(--primary))]">
            {guest.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{guest.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${segmentBadge[guest.segment] || ''}`}>{guest.segment?.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{guest.email} &middot; Last visit: {guest.lastVisit}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="profile-send-reward">
              <Send className="h-3.5 w-3.5" /> Send Reward
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-foreground text-xs font-semibold hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </button>
          </div>
        </div>
      </motion.div>

      {/* AI Behavior Summary */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Brain className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
          <div><p className="text-base font-semibold text-foreground">Behavior Summary</p><p className="text-xs text-muted-foreground">AI-generated profile insights</p></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Preferred Venue</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${venueColors[guest.preferredVenue]?.dot || 'bg-muted-foreground'}`} />
              <span className="text-sm font-semibold text-foreground">{guest.preferredVenue}</span>
            </div>
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Top Event</p>
            <span className="text-sm font-semibold text-foreground">{guest.topEvent}</span>
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Spend Trend</p>
            <span className={`text-sm font-semibold flex items-center gap-1 ${spendColor}`}>
              {guest.spendTrend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : guest.spendTrend === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : null}
              {guest.spendTrend}
            </span>
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Risk Signal</p>
            <span className={`text-sm font-semibold ${guest.riskSignal === 'none' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{guest.riskSignal === 'none' ? 'Low risk' : guest.riskSignal}</span>
          </div>
        </div>
        <div className={`rounded-lg border p-3 ${riskBorderClass}`}>
          <p className="text-xs text-muted-foreground italic">
            {guest.name.split(' ')[0]} is a {guest.frequency.toLowerCase()} visitor who prefers {guest.preferredVenue} and typically attends {guest.topEvent}.
            {guest.riskSignal !== 'none' ? ` Warning: ${guest.riskSignal}.` : ' Engagement is healthy.'}
          </p>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Spent', value: `$${guest.totalSpent.toLocaleString()}` },
          { label: 'Visits', value: guest.visits },
          { label: 'Avg Spend', value: `$${guest.avgSpend}` },
          { label: 'Score', value: `${guest.score}/100` },
          { label: 'Favorite Category', value: guest.favoriteCategory },
          { label: 'Frequency', value: guest.frequency },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Retention Risk Alert */}
      {guest.riskSignal !== 'none' && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className={`rounded-xl border-2 p-4 ${guest.riskSignal.includes('inactive') || guest.riskSignal.includes('churn') ? 'border-[hsl(var(--danger)_/_0.3)] bg-[hsl(var(--danger)_/_0.05)]' : 'border-[hsl(var(--warning)_/_0.3)] bg-[hsl(var(--warning)_/_0.05)]'}`} data-testid="retention-risk-alert">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${guest.riskSignal.includes('inactive') || guest.riskSignal.includes('churn') ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--warning))]'}`} />
            <p className="text-sm font-semibold text-foreground">{guest.riskSignal}</p>
          </div>
        </motion.div>
      )}

      {/* Venue + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Venue Breakdown</p>
          <div className="space-y-3">
            {venueBreak.map((v, i) => (
              <div key={v.venue}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${venueColors[v.venue]?.dot || 'bg-muted-foreground'}`} /><span className="text-sm font-medium text-foreground">{v.venue}</span></div>
                  <span className="text-xs text-muted-foreground tabular-nums">${v.spent.toLocaleString()} &middot; {v.visits} visits</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: venueColors[v.venue]?.hex || '#888' }} initial={{ width: 0 }} animate={{ width: `${(v.spent / maxVenueSpent) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Category Breakdown</p>
          <div className="space-y-3">
            {catBreak.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.category}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">${c.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[hsl(var(--success))]" initial={{ width: 0 }} animate={{ width: `${(c.amount / maxCatAmount) * 100}%` }} transition={{ duration: 0.8, delay: 0.35 + i * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Events Attended + Event Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Events Attended</p>
          <div className="space-y-2">
            {events.length > 0 ? events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors cursor-pointer group" onClick={() => navigate(`/owner/system/venues/${guest.preferredVenue === ev.venue ? 'v1' : 'v2'}/events/e1`)}>
                <span className={`w-2 h-2 rounded-full ${venueColors[ev.venue]?.dot || 'bg-muted-foreground'}`} />
                <div className="flex-1"><p className="text-sm font-medium text-foreground">{ev.event}</p><p className="text-xs text-muted-foreground">{ev.venue} &middot; {ev.attended}x</p></div>
                <span className="text-sm font-semibold text-foreground tabular-nums">${ev.totalSpent.toLocaleString()}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )) : <p className="text-xs text-muted-foreground italic">No event data available</p>}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.45 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Purchase History</p>
          <div className="space-y-2">
            {purchases.length > 0 ? purchases.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-2 rounded-lg">
                <span className={`w-2 h-2 mt-1.5 rounded-full ${venueColors[p.venue]?.dot || 'bg-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{p.items}</p>
                  <p className="text-xs text-muted-foreground">{p.date} &middot; {p.event} &middot; {p.venue}</p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">${p.total}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground italic">No purchase data available</p>}
          </div>
        </motion.div>
      </div>

      {/* Loyalty Activity */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.5 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Loyalty Activity</p>
        {loyalty ? (
          <div className="space-y-3">
            {loyalty.map((l, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.type === 'earned' ? 'bg-[hsl(var(--success))]' : l.type === 'redeemed' ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--warning))]'}`} />
                  {i < loyalty.length - 1 && <div className="w-px h-6 bg-[hsl(var(--border))]" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{l.detail}</p>
                  <p className="text-xs text-muted-foreground">{l.date}</p>
                </div>
                {l.points !== 0 && <span className={`text-sm font-semibold tabular-nums ${l.points > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--primary))]'}`}>{l.points > 0 ? '+' : ''}{l.points}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Not enrolled in loyalty program</p>
            <button className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="enroll-guest-btn">
              Enroll Guest
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

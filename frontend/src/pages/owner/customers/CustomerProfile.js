import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Brain, DollarSign, Calendar, ShoppingBag, TrendingUp,
  Heart, Clock, ArrowUpRight, ArrowDownRight, Zap, MapPin, Star, Gift
} from 'lucide-react';
import {
  ownerGuests, ownerEvents,
  guestPurchaseHistory, guestEventAttendance, guestLoyaltyActivity,
  guestVenueBreakdown, guestCategoryBreakdown, guestVisitTimeline
} from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

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

const venueDot = { Downtown: 'bg-[hsl(var(--success))]', Midtown: 'bg-blue-500', Uptown: 'bg-purple-500' };
const venueBarBg = { Downtown: 'bg-[hsl(var(--success)_/_0.6)]', Midtown: 'bg-blue-500/60', Uptown: 'bg-purple-500/60' };

function getRiskLevel(g) {
  if (!g.riskSignal || g.riskSignal === 'none') return 'low';
  if (g.riskSignal.includes('high') || g.riskSignal.includes('inactive')) return 'high';
  return 'medium';
}

function getFreqLabel(f) {
  if (f === 'Weekly') return 'Every 7d';
  if (f === 'Bi-weekly') return 'Every 14d';
  if (f === 'Monthly') return 'Every 30d';
  return f;
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function CustomerProfile() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const guest = ownerGuests.find(g => g.id === guestId);

  if (!guest) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-muted-foreground">Guest not found</p>
    </div>
  );

  const risk = getRiskLevel(guest);
  const venues = guestVenueBreakdown[guest.id] || [{ venue: guest.preferredVenue, spent: guest.totalSpent, visits: guest.visits }];
  const categories = guestCategoryBreakdown[guest.id] || [{ category: guest.favoriteCategory, amount: guest.totalSpent }];
  const events = guestEventAttendance[guest.id] || [];
  const purchases = guestPurchaseHistory.filter(p => p.guestId === guest.id);
  const loyalty = guestLoyaltyActivity[guest.id];
  const timeline = guestVisitTimeline[guest.id] || [];
  const totalVenueSpent = venues.reduce((s, v) => s + v.spent, 0) || 1;
  const totalCatAmount = categories.reduce((s, c) => s + c.amount, 0) || 1;
  const maxCatAmount = Math.max(...categories.map(c => c.amount), 1);
  const isHealthy = risk === 'low';
  const spendLabel = guest.spendTrend === 'up' ? 'Increasing' : guest.spendTrend === 'down' ? 'Declining' : 'Stable';
  const riskSignalLabel = isHealthy ? 'Healthy' : risk === 'medium' ? 'Monitor' : 'High Risk';

  const riskStyles = {
    low: { border: 'border-[hsl(var(--success)_/_0.3)]', bg: 'bg-[hsl(var(--success)_/_0.05)]', text: 'text-[hsl(var(--success))]', label: 'Healthy', emoji: '\u2705' },
    medium: { border: 'border-[hsl(var(--warning)_/_0.3)]', bg: 'bg-[hsl(var(--warning)_/_0.05)]', text: 'text-[hsl(var(--warning))]', label: 'Medium Risk', emoji: '\u26A1' },
    high: { border: 'border-[hsl(var(--danger)_/_0.3)]', bg: 'bg-[hsl(var(--danger)_/_0.05)]', text: 'text-[hsl(var(--danger))]', label: 'High Risk', emoji: '\u26A0\uFE0F' },
  };
  const rs = riskStyles[risk];

  const insightBarStyles = {
    low: { bg: 'bg-[hsl(var(--success)_/_0.05)]', border: 'border border-[hsl(var(--success)_/_0.2)]', text: 'text-[hsl(var(--success))]' },
    medium: { bg: 'bg-[hsl(var(--warning)_/_0.05)]', border: 'border border-[hsl(var(--warning)_/_0.2)]', text: 'text-[hsl(var(--warning))]' },
    high: { bg: 'bg-[hsl(var(--danger)_/_0.05)]', border: 'border border-[hsl(var(--danger)_/_0.2)]', text: 'text-[hsl(var(--danger))]' },
  };
  const ib = insightBarStyles[risk];

  const insightText = isHealthy
    ? `No risk signals detected. Guest favors ${guest.preferredVenue} (${Math.round((venues.find(v => v.venue === guest.preferredVenue)?.spent || 0) / totalVenueSpent * 100)}% of spend)`
    : `${guest.riskSignal} \u00B7 Last visit ${guest.lastVisitDaysAgo} days ago`;

  // Visit timeline helpers
  const venueKeys = ['Downtown', 'Midtown', 'Uptown'];
  const maxMonthlyVisits = Math.max(...timeline.map(m => venueKeys.reduce((s, v) => s + (m[v] || 0), 0)), 1);

  return (
    <div className="flex flex-col gap-6" data-testid="customer-profile">

      {/* 1. Back button */}
      <motion.button
        {...fadeUp}
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start mb-[-8px]"
        data-testid="back-button"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </motion.button>

      {/* 2. Header Card */}
      <motion.div {...fadeUp} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="profile-header">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-[hsl(var(--primary))]">{guest.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground">{guest.name}</p>
            <div className="flex gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${segmentBadge[guest.segment] || ''}`}>{guest.segment?.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{guest.email} &middot; Last visit {guest.lastVisit} ({guest.lastVisitDaysAgo}d ago)</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="send-reward-btn">Send Reward</button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-[hsl(var(--muted))] transition-colors" data-testid="message-btn">Message</button>
          </div>
        </div>
      </motion.div>

      {/* 3. Behavior Summary */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.03 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="behavior-summary">
        <SectionHeader icon={Brain} title="Behavior Summary" subtitle="AI-generated profile insights" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Preferred Venue */}
          <div className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Preferred Venue</p>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${venueDot[guest.preferredVenue] || 'bg-muted-foreground'}`} />
              <span className="text-sm font-semibold text-foreground">{guest.preferredVenue}</span>
            </div>
          </div>
          {/* Top Event */}
          <div className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Top Event</p>
            <span className="text-sm font-semibold text-foreground">{guest.topEvent}</span>
          </div>
          {/* Spend Trend */}
          <div className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Spend Trend</p>
            <div className="flex items-center gap-1">
              {guest.spendTrend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> : guest.spendTrend === 'down' ? <ArrowDownRight className="h-3.5 w-3.5 text-[hsl(var(--danger))]" /> : null}
              <span className={`text-sm font-semibold ${guest.spendTrend === 'up' ? 'text-[hsl(var(--success))]' : guest.spendTrend === 'down' ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground'}`}>{spendLabel}</span>
            </div>
          </div>
          {/* Risk Signal */}
          <div className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Risk Signal</p>
            <span className={`text-sm font-semibold ${isHealthy ? 'text-[hsl(var(--success))]' : risk === 'medium' ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--danger))]'}`}>{riskSignalLabel}</span>
          </div>
        </div>
        {/* Insight Bar */}
        <div className={`mt-3 p-3 rounded-lg text-xs ${ib.bg} ${ib.border} ${ib.text}`}>
          <Zap className="h-3 w-3 inline mr-1.5" />
          {insightText}
        </div>
      </motion.div>

      {/* 4. KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { icon: DollarSign, value: `$${guest.totalSpent.toLocaleString()}`, label: 'Total Spent' },
          { icon: Calendar, value: guest.visits, label: 'Visits' },
          { icon: ShoppingBag, value: `$${guest.avgSpend}`, label: 'Avg Spend' },
          { icon: TrendingUp, value: `${guest.score}/100`, label: 'Score' },
          { icon: Heart, value: guest.favoriteCategory, label: 'Favorite' },
          { icon: Clock, value: getFreqLabel(guest.frequency), label: 'Frequency' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.03 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-3 flex flex-col gap-1"
            data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
          </motion.div>
        ))}
      </div>

      {/* 5. Retention Risk Alert */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.05 }}
        className={`rounded-xl ${rs.border} ${rs.bg} p-4`}
        data-testid="risk-alert"
      >
        <p className={`text-xs font-semibold uppercase ${rs.text}`}>{rs.emoji} {rs.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isHealthy ? `Active and healthy. Last visit ${guest.lastVisitDaysAgo} day(s) ago — within expected frequency.`
            : risk === 'medium' ? `Visit frequency declining. Last seen ${guest.lastVisit}. Consider targeted re-engagement.`
            : `${guest.riskSignal}. Last visit ${guest.lastVisitDaysAgo} day(s) ago. Immediate intervention recommended.`}
        </p>
      </motion.div>

      {/* 6. Venue Breakdown + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="venue-breakdown">
          <SectionHeader icon={MapPin} title="Venue Breakdown" subtitle="Where they spend" />
          <div className="flex flex-col gap-3">
            {venues.map((v, i) => {
              const pct = Math.round((v.spent / totalVenueSpent) * 100);
              return (
                <div key={v.venue} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${venueDot[v.venue] || 'bg-muted-foreground'}`} />
                    <span className="text-xs font-medium text-foreground truncate">{v.venue}</span>
                  </div>
                  <div className="flex-1 h-7 rounded-md bg-[hsl(var(--muted)_/_0.4)] relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 15)}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                      className={`h-full rounded-md ${venueBarBg[v.venue] || 'bg-muted-foreground/60'}`}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                      ${v.spent.toLocaleString()} &middot; {v.visits} visits
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="category-breakdown">
          <SectionHeader icon={ShoppingBag} title="Category Breakdown" subtitle="What they buy" />
          <div className="flex flex-col gap-3">
            {categories.map((c, i) => {
              const pct = Math.round((c.amount / totalCatAmount) * 100);
              const barPct = Math.max((c.amount / maxCatAmount) * 100, 15);
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-24 shrink-0 truncate">{c.category}</span>
                  <div className="flex-1 h-7 rounded-md bg-[hsl(var(--muted)_/_0.4)] relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-md bg-emerald-500/60"
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                      ${c.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* 7. Events Attended + Event Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Attended */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="events-attended">
          <SectionHeader icon={Star} title="Events Attended" subtitle="Click to view event detail" />
          <div className="flex flex-col gap-2">
            {events.length > 0 ? events.map((ev, i) => {
              const oe = ownerEvents.find(e => e.name === ev.event && e.venueName === ev.venue);
              return (
                <div
                  key={i}
                  onClick={() => oe && navigate(`/owner/system/venues/${oe.venueId}/events/${oe.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors"
                  data-testid={`event-${i}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${venueDot[ev.venue] || 'bg-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ev.event}</p>
                      <p className="text-xs text-muted-foreground">{ev.venue} &middot; {ev.attended} times</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground tabular-nums">${ev.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Avg ${ev.avgSpend}</p>
                  </div>
                </div>
              );
            }) : <p className="text-xs text-muted-foreground text-center py-4">No event data</p>}
          </div>
        </motion.div>

        {/* Event Timeline */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="event-timeline">
          <SectionHeader icon={Calendar} title="Event Timeline" subtitle="Chronological attendance" />
          {/* Auto-insight */}
          <div className="p-2.5 rounded-lg bg-[hsl(var(--primary)_/_0.05)] border border-[hsl(var(--primary)_/_0.15)] mb-4">
            <p className="text-xs text-[hsl(var(--primary))]">
              <Zap className="h-3 w-3 inline mr-1.5" />
              Most active at {guest.preferredVenue} events — {guest.topEvent} is the favorite
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {purchases.length > 0 ? purchases.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2 text-xs">
                <span className="w-14 text-muted-foreground tabular-nums">{p.date}</span>
                <span className={`h-2 w-2 rounded-full shrink-0 ${venueDot[p.venue] || 'bg-muted-foreground'}`} />
                <span className="font-medium text-foreground flex-1">{p.event} &middot; {p.venue}</span>
                <span className="font-bold tabular-nums text-foreground">${p.total}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground text-center py-4">No timeline data</p>}
          </div>
        </motion.div>
      </div>

      {/* 8. Loyalty Activity + Visit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loyalty Activity */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="loyalty-activity">
          <SectionHeader icon={Gift} title="Loyalty Activity" subtitle={guest.loyaltyEnrolled ? 'Enrolled' : 'Not enrolled'} />
          {loyalty ? (
            <div className="flex flex-col gap-2">
              {loyalty.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(var(--muted)_/_0.3)] text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{l.detail.split('\n')[0]}</p>
                    <p className="text-muted-foreground">{l.detail.includes('\n') ? l.detail.split('\n')[1] : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-muted-foreground">{l.date}</p>
                    <p className="font-bold text-foreground tabular-nums">{l.balance.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Not enrolled in loyalty program</p>
              <button className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="enroll-guest-btn">
                Enroll Guest
              </button>
            </div>
          )}
        </motion.div>

        {/* Visit Timeline (vertical bars) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="visit-timeline">
          <SectionHeader icon={TrendingUp} title="Visit Timeline" subtitle="Monthly behavior" />
          {timeline.length > 0 ? (
            <>
              <div className="flex items-end gap-4" style={{ height: 180 }}>
                {timeline.map((m) => {
                  const total = venueKeys.reduce((s, v) => s + (m[v] || 0), 0);
                  const dominant = venueKeys.reduce((best, v) => (m[v] || 0) > (m[best] || 0) ? v : best, venueKeys[0]);
                  const barH = Math.max(30, (total / maxMonthlyVisits) * 130);
                  return (
                    <div key={m.month} className="flex-1 text-center flex flex-col items-center justify-end">
                      <span className="text-xs font-bold tabular-nums text-foreground mb-1">{total} visits</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: barH }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={`w-full rounded-md ${venueBarBg[dominant] || 'bg-muted-foreground/60'}`}
                      />
                      <div className="flex items-center gap-1 mt-2">
                        <span className={`h-2 w-2 rounded-full ${venueDot[dominant] || 'bg-muted-foreground'}`} />
                        <span className="text-[10px] text-muted-foreground">{m.month}</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">${(m.totalSpent || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                {venueKeys.filter(v => timeline.some(m => (m[v] || 0) > 0)).map(v => (
                  <div key={v} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${venueDot[v]}`} />
                    <span className="text-[10px] text-muted-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No visit timeline data</p>
          )}
        </motion.div>
      </div>

      {/* 9. Purchase History */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.22 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="purchase-history">
        <SectionHeader icon={ShoppingBag} title="Purchase History" subtitle="Recent orders" />
        <div className="flex flex-col gap-2">
          {purchases.length > 0 ? purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] text-xs">
              <div className="flex items-start gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${venueDot[p.venue] || 'bg-muted-foreground'}`} />
                <div>
                  <p className="font-semibold text-foreground">{p.items}</p>
                  <p className="text-muted-foreground">{p.date} &middot; {p.event} &middot; {p.venue}</p>
                </div>
              </div>
              <span className="font-bold text-foreground tabular-nums shrink-0">${p.total}</span>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-4">No purchase data</p>}
        </div>
      </motion.div>
    </div>
  );
}

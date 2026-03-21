import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Brain, Star, Send, MessageSquare, Clock, MapPin, Heart, CreditCard, Award, TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle, Calendar, Tag, Gift, History, DollarSign, Zap, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { venueColors, guestPurchaseHistory, guestEventAttendance, guestLoyaltyActivity, guestVenueBreakdown, guestCategoryBreakdown, guestVisitTimeline } from '../../data/ownerData';

const tierBadge = {
  VIP: 'bg-[hsl(var(--primary)_/_0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)_/_0.25)]',
  Platinum: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  Gold: 'bg-[hsl(var(--warning)_/_0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)_/_0.25)]',
  Silver: 'bg-[hsl(var(--muted))] text-muted-foreground border border-[hsl(var(--border))]',
  Bronze: 'bg-[hsl(var(--muted))] text-muted-foreground border border-[hsl(var(--border))]',
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

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary)_/_0.12)] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))] shrink-0">
              {guest.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground">{guest.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${segmentBadge[guest.segment] || ''}`}>{guest.segment?.replace('_', ' ')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{guest.email}</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: 'Total Spent', value: `$${guest.totalSpent?.toLocaleString()}` },
              { label: 'Visits', value: guest.visits },
              { label: 'Avg Spend', value: `$${guest.avgSpend}` },
              { label: 'Score', value: `${guest.score}/100` },
            ].map(k => (
              <div key={k.label} className="rounded-xl bg-[hsl(var(--muted)_/_0.4)] p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">{k.label}</p>
                <p className="text-base font-bold text-foreground tabular-nums mt-0.5">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-2">
            {[
              { label: 'Frequency', value: guest.frequency },
              { label: 'Favorite', value: guest.favoriteCategory },
              { label: 'Preferred Venue', value: guest.preferredVenue },
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
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="send-reward-btn">
              <Send className="h-3.5 w-3.5" /> Send Reward
            </button>
            <button
              onClick={() => { onClose(); navigate(`/owner/customers/${guest.id}`); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-foreground text-xs font-semibold hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors"
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

/* ─── Full Page: Guest Full History (Canonical) ─── */
export default function GuestFullHistory({ guest, onBack }) {
  const navigate = useNavigate();
  if (!guest) return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted-foreground">Guest not found</p></div>;

  const purchases = guestPurchaseHistory.filter(p => p.guestId === guest.id);
  const events = guestEventAttendance[guest.id] || [];
  const loyalty = guestLoyaltyActivity[guest.id];
  const venueBreak = guestVenueBreakdown[guest.id] || [];
  const catBreak = guestCategoryBreakdown[guest.id] || [];
  const visitTimeline = guestVisitTimeline?.[guest.id] || [];
  const totalVenueSpent = venueBreak.reduce((s, v) => s + v.spent, 0) || 1;
  const maxCatAmount = Math.max(...catBreak.map(c => c.amount), 1);
  const totalCatAmount = catBreak.reduce((s, c) => s + c.amount, 0) || 1;

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  const isHealthy = guest.riskSignal === 'none' || !guest.riskSignal;
  const spendTrendLabel = guest.spendTrend === 'up' ? 'Increasing' : guest.spendTrend === 'down' ? 'Declining' : 'Stable';
  const riskLabel = isHealthy ? 'Healthy' : guest.riskSignal;

  return (
    <div className="space-y-6" data-testid="guest-full-history">
      {/* ── Back ── */}
      <motion.button {...fadeUp} onClick={handleBack} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="guest-back-btn">
        <ChevronLeft className="h-4 w-4" /> Back
      </motion.button>

      {/* ── 1. HEADER ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.04 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--primary)_/_0.12)] flex items-center justify-center text-lg font-bold text-[hsl(var(--primary))] shrink-0">
            {guest.name.split(' ').map(n => n[0]).join('')}
          </div>

          {/* Name + Tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{guest.name.split(' ')[0]} {guest.name.split(' ')[1]?.[0]}.</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[guest.tier] || ''}`}>{guest.tier}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${segmentBadge[guest.segment] || ''}`}>{guest.segment?.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{guest.email} &middot; Last visit {guest.lastVisit} ({guest.lastVisitDaysAgo}d ago)</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 shrink-0">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="profile-send-reward">
              <Send className="h-3.5 w-3.5" /> Send Reward
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[hsl(var(--border))] text-foreground text-xs font-semibold hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── 2. BEHAVIOR SUMMARY ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Brain className="h-5 w-5 text-[hsl(var(--primary))]" /></div>
          <div>
            <p className="text-base font-bold text-foreground">Behavior Summary</p>
            <p className="text-xs text-muted-foreground">AI-generated profile insights</p>
          </div>
        </div>

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Preferred Venue', value: guest.preferredVenue, dot: venueColors[guest.preferredVenue]?.dot },
            { label: 'Top Event', value: guest.topEvent },
            { label: 'Spend Trend', value: spendTrendLabel, color: guest.spendTrend === 'up' ? 'text-[hsl(var(--success))]' : guest.spendTrend === 'down' ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground', icon: guest.spendTrend === 'up' ? ArrowUpRight : guest.spendTrend === 'down' ? TrendingDown : null },
            { label: 'Risk Signal', value: riskLabel, color: isHealthy ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]' },
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-[hsl(var(--muted)_/_0.35)] p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">{item.label}</p>
              <div className="flex items-center gap-1.5">
                {item.dot && <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />}
                {item.icon && <item.icon className={`h-3.5 w-3.5 ${item.color}`} />}
                <span className={`text-sm font-semibold ${item.color || 'text-foreground'}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Insight Bar */}
        <div className={`rounded-xl px-4 py-3 ${isHealthy ? 'bg-[hsl(var(--success)_/_0.08)]' : 'bg-[hsl(var(--danger)_/_0.08)]'}`}>
          <p className={`text-xs font-medium ${isHealthy ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
            <Zap className="h-3.5 w-3.5 inline mr-1.5" />
            {isHealthy
              ? `No risk signals detected · Guest favors ${guest.preferredVenue} (${venueBreak.length > 0 ? Math.round((venueBreak.find(v => v.venue === guest.preferredVenue)?.spent || 0) / totalVenueSpent * 100) : 50}% of spend)`
              : `${guest.riskSignal} · Last visit ${guest.lastVisitDaysAgo} days ago`
            }
          </p>
        </div>
      </motion.div>

      {/* ── 3. KPI CARDS ROW (icon top, value large, label bottom) ── */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { icon: DollarSign, value: `$${guest.totalSpent.toLocaleString()}`, label: 'Total Spent' },
          { icon: Calendar, value: guest.visits, label: 'Visits' },
          { icon: CreditCard, value: `$${guest.avgSpend}`, label: 'Avg Spend' },
          { icon: Activity, value: `${guest.score}/100`, label: 'Score' },
          { icon: Heart, value: guest.favoriteCategory, label: 'Favorite' },
          { icon: Clock, value: guest.frequency, label: 'Frequency' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 + i * 0.03 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-4">
            <kpi.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── HEALTH STATUS BANNER ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.22 }} className={`rounded-2xl px-5 py-4 ${isHealthy ? 'bg-[hsl(var(--success)_/_0.08)]' : 'bg-[hsl(var(--danger)_/_0.08)]'}`} data-testid="health-status-banner">
        <p className={`text-sm font-bold ${isHealthy ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
          {isHealthy ? '\u2705 HEALTHY' : '\u26a0\ufe0f AT RISK'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isHealthy
            ? `Active and healthy. Last visit ${guest.lastVisitDaysAgo} day(s) ago — within expected frequency.`
            : `${guest.riskSignal}. Last visit ${guest.lastVisitDaysAgo} day(s) ago.`
          }
        </p>
      </motion.div>

      {/* ── 4+5. VENUE BREAKDOWN + CATEGORY BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Venue Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.26 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center"><MapPin className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <p className="text-base font-bold text-foreground">Venue Breakdown</p>
              <p className="text-xs text-muted-foreground">Where they spend</p>
            </div>
          </div>
          <div className="space-y-4">
            {venueBreak.map((v, i) => {
              const pct = Math.round((v.spent / totalVenueSpent) * 100);
              const barPct = Math.max(pct, 15);
              return (
                <div key={v.venue} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-20 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${venueColors[v.venue]?.dot || 'bg-muted-foreground'}`} />
                    <span className="text-sm text-foreground font-medium truncate">{v.venue}</span>
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-7 rounded-lg bg-[hsl(var(--muted)_/_0.3)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-lg flex items-center px-2.5"
                        style={{ background: venueColors[v.venue]?.hex || '#888' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.1 }}
                      >
                        <span className="text-[11px] font-semibold text-white whitespace-nowrap">${v.spent.toLocaleString()} &middot; {v.visits} visits</span>
                      </motion.div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums w-10 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center"><Tag className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <p className="text-base font-bold text-foreground">Category Breakdown</p>
              <p className="text-xs text-muted-foreground">What they buy</p>
            </div>
          </div>
          <div className="space-y-4">
            {catBreak.map((c, i) => {
              const pct = Math.round((c.amount / totalCatAmount) * 100);
              const barPct = Math.max((c.amount / maxCatAmount) * 100, 15);
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-sm text-foreground font-medium w-20 shrink-0 truncate">{c.category}</span>
                  <div className="flex-1 relative">
                    <div className="h-7 rounded-lg bg-[hsl(var(--muted)_/_0.3)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-lg flex items-center px-2.5 bg-[hsl(var(--success))]"
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.7, delay: 0.35 + i * 0.1 }}
                      >
                        <span className="text-[11px] font-semibold text-white whitespace-nowrap">${c.amount.toLocaleString()}</span>
                      </motion.div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums w-10 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── 6+7. EVENTS ATTENDED + EVENT TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Events Attended */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.34 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center"><Star className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <p className="text-base font-bold text-foreground">Events Attended</p>
              <p className="text-xs text-muted-foreground">Click to view event detail</p>
            </div>
          </div>
          <div className="space-y-0">
            {events.length > 0 ? events.map((ev, i) => (
              <div key={i} className={`flex items-center gap-3 py-3.5 cursor-pointer hover:bg-[hsl(var(--muted)_/_0.2)] -mx-2 px-2 rounded-lg transition-colors ${i < events.length - 1 ? 'border-b border-[hsl(var(--border)_/_0.5)]' : ''}`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${venueColors[ev.venue]?.dot || 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{ev.event}</p>
                  <p className="text-xs text-muted-foreground">{ev.venue} &middot; {ev.attended} times</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">${ev.totalSpent.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">Avg ${ev.avgSpend}</p>
                </div>
              </div>
            )) : <p className="text-xs text-muted-foreground italic py-4">No event data</p>}
          </div>
        </motion.div>

        {/* Visit Timeline (Stacked Bar Chart) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.38 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center"><Activity className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <p className="text-base font-bold text-foreground">Visit Timeline</p>
              <p className="text-xs text-muted-foreground">Monthly behavior</p>
            </div>
          </div>

          {/* Insight bar */}
          <div className="rounded-lg bg-[hsl(var(--primary)_/_0.06)] px-3 py-2 mb-4">
            <p className="text-[11px] text-[hsl(var(--primary))] font-medium">
              <Zap className="h-3 w-3 inline mr-1" />
              Guest favors {guest.preferredVenue} ({venueBreak.length > 0 ? Math.round((venueBreak.find(v => v.venue === guest.preferredVenue)?.spent || 0) / totalVenueSpent * 100) : 50}% of spend)
            </p>
          </div>

          {visitTimeline.length > 0 ? (
            <div>
              <div className="h-52" data-testid="visit-timeline-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitTimeline} margin={{ top: 20, right: 5, left: -10, bottom: 5 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(v, name) => [`${v} visits`, name]}
                    />
                    {Object.keys(venueColors).map(vName => (
                      <Bar key={vName} dataKey={vName} stackId="visits" radius={[0, 0, 0, 0]} fill={venueColors[vName]?.hex || '#888'} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Labels below bars */}
              <div className="flex justify-around mt-1">
                {visitTimeline.map(m => {
                  const total = Object.keys(venueColors).reduce((s, vn) => s + (m[vn] || 0), 0);
                  const totalSpent = m.totalSpent || 0;
                  return (
                    <div key={m.month} className="text-center">
                      <p className="text-xs text-muted-foreground tabular-nums">${totalSpent.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 justify-center">
                {Object.entries(venueColors).map(([name, vc]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${vc.dot}`} />
                    <span className="text-[11px] text-muted-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-4">No visit timeline data</p>
          )}
        </motion.div>
      </div>

      {/* ── 8+9. LOYALTY ACTIVITY + (Visit Timeline alternate) ── */}
      <div className="grid grid-cols-1 gap-5">
        {/* Loyalty Activity */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.42 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Award className="h-5 w-5 text-[hsl(var(--primary))]" /></div>
            <div>
              <p className="text-base font-bold text-foreground">Loyalty Activity</p>
              <p className="text-xs text-muted-foreground">{guest.loyaltyEnrolled ? 'Enrolled' : 'Not enrolled'}</p>
            </div>
          </div>
          {loyalty ? (
            <div className="space-y-0">
              {loyalty.map((l, i) => (
                <div key={i} className={`flex items-center gap-4 py-3.5 ${i < loyalty.length - 1 ? 'border-b border-[hsl(var(--border)_/_0.5)]' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{l.detail.split('\n')[0] || l.detail}</p>
                    <p className="text-xs text-muted-foreground">{l.detail.includes('\n') ? l.detail.split('\n')[1] : `${l.type === 'earned' ? '+' : ''}${l.points} pts from ${l.type}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{l.date}</p>
                  </div>
                  <div className="text-right shrink-0 min-w-[70px]">
                    <p className="text-sm font-bold text-foreground tabular-nums">{l.balance.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Not enrolled in loyalty program</p>
              <button className="px-5 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="enroll-guest-btn">
                Enroll Guest
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── 10. PURCHASE HISTORY (full width) ── */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.46 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--muted)_/_0.5)] flex items-center justify-center"><CreditCard className="h-5 w-5 text-muted-foreground" /></div>
          <div>
            <p className="text-base font-bold text-foreground">Purchase History</p>
            <p className="text-xs text-muted-foreground">Recent orders</p>
          </div>
        </div>
        <div className="space-y-0">
          {purchases.length > 0 ? purchases.map((p, i) => (
            <div key={p.id} className={`flex items-start gap-3 py-4 ${i < purchases.length - 1 ? 'border-b border-[hsl(var(--border)_/_0.4)]' : ''}`}>
              <span className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${venueColors[p.venue]?.dot || 'bg-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{p.items}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.date} &middot; {p.event} &middot; {p.venue}</p>
              </div>
              <span className="text-base font-bold text-foreground tabular-nums shrink-0">${p.total}</span>
            </div>
          )) : <p className="text-xs text-muted-foreground italic py-4">No purchase data</p>}
        </div>
      </motion.div>
    </div>
  );
}

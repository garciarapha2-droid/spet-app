import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, X, MapPin, Clock, CreditCard, Award, Heart } from 'lucide-react';
import { guestProfiles } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const tagColors = {
  VIP: 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] border-[hsl(var(--primary)_/_0.3)]',
  Platinum: 'bg-[hsl(var(--accent)_/_0.15)] text-[hsl(var(--accent))] border-[hsl(var(--accent)_/_0.3)]',
  Gold: 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)_/_0.3)]',
  Silver: 'bg-[hsl(var(--muted))] text-muted-foreground border-[hsl(var(--border))]',
};

const statusBadge = {
  vip: 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]',
  active: 'bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]',
  new: 'bg-[hsl(var(--accent)_/_0.15)] text-[hsl(var(--accent))]',
  churn_risk: 'bg-[hsl(var(--danger)_/_0.15)] text-[hsl(var(--danger))]',
  lost: 'bg-[hsl(var(--danger)_/_0.15)] text-[hsl(var(--danger))]',
  returning: 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]',
};

const scoreColor = (score) => {
  if (score >= 80) return { bg: 'bg-[hsl(var(--success)_/_0.15)]', text: 'text-[hsl(var(--success))]', label: 'High Value' };
  if (score >= 50) return { bg: 'bg-[hsl(var(--warning)_/_0.15)]', text: 'text-[hsl(var(--warning))]', label: 'Medium' };
  return { bg: 'bg-[hsl(var(--danger)_/_0.15)]', text: 'text-[hsl(var(--danger))]', label: 'Low' };
};

const journeyDotColors = {
  visit: 'bg-[hsl(var(--primary))]',
  upgrade: 'bg-[hsl(var(--success))]',
  spend: 'bg-[hsl(var(--warning))]',
  churn: 'bg-[hsl(var(--danger))]',
  reward: 'bg-[hsl(var(--accent))]',
  comeback: 'bg-[hsl(var(--success))]',
};

const smartActions = {
  churn_risk: ['Send re-engagement reward', 'Schedule personal outreach', 'Offer VIP experience'],
  new: ['Send welcome bonus', 'Invite to loyalty program', 'Assign to host'],
  vip: ['Invite to private event', 'Send thank-you gift', 'Offer exclusive preview'],
  active: ['Suggest tier upgrade path', 'Send personalized offer', 'Invite to referral program'],
  returning: ['Welcome back reward', 'Highlight new menu items'],
  lost: ['Win-back campaign', 'Personal call from manager', 'Special discount offer'],
};

export default function NfcGuests() {
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  const filtered = useMemo(() =>
    guestProfiles.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="space-y-4" data-testid="nfc-guests-page">
      {/* Search */}
      <motion.div {...fadeUp} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search guests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          data-testid="guest-search"
        />
      </motion.div>

      {/* Guest List */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border)_/_0.5)]">
        {filtered.map((g, i) => {
          const sc = scoreColor(g.guestScore);
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors cursor-pointer"
              onClick={() => setSelectedGuest(g)}
              data-testid={`guest-row-${g.id}`}
            >
              <div className="w-9 h-9 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-bold text-muted-foreground">
                {g.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{g.name}</span>
                <span className={`ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[g.status] || ''}`}>{g.status.replace('_', ' ')}</span>
              </div>
              <span className="text-xs text-muted-foreground hidden md:block">{g.email}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">${g.totalSpent.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{g.visits} visits</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColors[g.tag] || ''}`}>{g.tag}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{g.guestScore}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Guest Profile Modal */}
      <AnimatePresence>
        {selectedGuest && (
          <GuestProfileModal guest={selectedGuest} onClose={() => setSelectedGuest(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function GuestProfileModal({ guest, onClose }) {
  const sc = scoreColor(guest.guestScore);
  const actions = smartActions[guest.status] || smartActions.active;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[hsl(var(--background)_/_0.8)] backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', bounce: 0.2 }}
        className="relative w-full max-w-2xl rounded-3xl shadow-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        data-testid="guest-profile-modal"
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[hsl(var(--muted))] transition-colors" data-testid="modal-close">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center text-lg font-bold text-[hsl(var(--primary))]">
              {guest.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{guest.name}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[guest.status] || ''}`}>{guest.status.replace('_', ' ')}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColors[guest.tag] || ''}`}>{guest.tag}</span>
              </div>
              <p className="text-xs text-muted-foreground">{guest.email}</p>
            </div>
            <div className={`text-center px-3 py-1.5 rounded-xl ${sc.bg}`}>
              <p className={`text-xl font-bold tabular-nums ${sc.text}`}>{guest.guestScore}</p>
              <p className={`text-[10px] font-semibold ${sc.text}`}>{sc.label}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Spent', value: `$${guest.totalSpent.toLocaleString()}` },
              { label: 'Visits', value: guest.visits },
              { label: 'Avg/Visit', value: `$${guest.avgSpendPerVisit}` },
              { label: 'Points', value: guest.points.toLocaleString() },
            ].map((s, i) => (
              <div key={s.label} className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tier Progress */}
          <div className="rounded-xl border border-[hsl(var(--border))] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{guest.tier} Tier</span>
              {guest.pointsToNextTier > 0 && (
                <span className="text-xs text-muted-foreground">{guest.pointsToNextTier} pts to {guest.nextTier}</span>
              )}
            </div>
            <div className="h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${guest.tierProgress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            {guest.tierProgress >= 75 && guest.pointsToNextTier > 0 && (
              <p className="text-xs text-[hsl(var(--primary))] font-medium mt-1.5">Close to next tier</p>
            )}
          </div>

          {/* Behavior + Spending */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Behavior</p>
              {[
                { icon: Clock, label: 'Last Visit', value: guest.lastVisit },
                { icon: MapPin, label: 'Frequency', value: guest.visitFrequency },
                { icon: Heart, label: 'Favorite', value: guest.favoriteCategory },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-2">
                  <b.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{b.label}:</span>
                  <span className="text-xs font-medium text-foreground">{b.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-l border-[hsl(var(--border))] pl-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Spending</p>
              {[
                { icon: CreditCard, label: 'Highest', value: `$${guest.highestSpend}` },
                { icon: Award, label: 'Tips Given', value: `$${guest.tipsGiven}` },
                { icon: CreditCard, label: 'Avg/Visit', value: `$${guest.avgSpendPerVisit}` },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-2">
                  <b.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{b.label}:</span>
                  <span className="text-xs font-medium text-foreground">{b.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Journey Timeline */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Guest Journey</p>
            <div className="space-y-3">
              {guest.journey.map((j, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${journeyDotColors[j.type] || 'bg-muted-foreground'}`} />
                    {i < guest.journey.length - 1 && <div className="w-px h-6 bg-[hsl(var(--border))]" />}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{j.event}</p>
                    <p className="text-xs text-muted-foreground">{j.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Actions */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Smart Actions</p>
            <div className="flex flex-wrap gap-2">
              {actions.map(a => (
                <button key={a} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)_/_0.2)] transition-colors">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

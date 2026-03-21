import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, CreditCard, Award, Heart, AlertTriangle } from 'lucide-react';
import { guestProfiles } from '../../../data/managerModuleData';

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

export default function LoyaltyGuestProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const guest = guestProfiles.find(g => g.id === id);

  if (!guest) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Guest not found</p>
      </div>
    );
  }

  const sc = scoreColor(guest.guestScore);
  const actions = smartActions[guest.status] || smartActions.active;
  const isChurnRisk = guest.status === 'churn_risk' || guest.status === 'lost';

  return (
    <div className="space-y-6" data-testid="loyalty-guest-profile-page">
      {/* Back Button */}
      <motion.button
        {...fadeUp}
        onClick={() => navigate('/manager/loyalty/guests')}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-testid="back-to-guests"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Guests
      </motion.button>

      {/* Profile Header */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center text-xl font-bold text-[hsl(var(--primary))]">
          {guest.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">{guest.name}</h2>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[guest.status] || ''}`}>{guest.status.replace('_', ' ')}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColors[guest.tag] || ''}`}>{guest.tag}</span>
            {isChurnRisk && <AlertTriangle className="h-4 w-4 text-[hsl(var(--danger))]" />}
          </div>
          <p className="text-xs text-muted-foreground">{guest.email}</p>
        </div>
        <div className={`text-center px-4 py-2 rounded-xl ${sc.bg}`}>
          <p className={`text-3xl font-bold tabular-nums ${sc.text}`}>{guest.guestScore}</p>
          <p className={`text-[10px] font-semibold ${sc.text}`}>{sc.label}</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spent', value: `$${guest.totalSpent.toLocaleString()}` },
          { label: 'Visits', value: guest.visits },
          { label: 'Avg/Visit', value: `$${guest.avgSpendPerVisit}` },
          { label: 'Points', value: guest.points.toLocaleString() },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tier + Behavior + Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tier Progress */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Tier Progress</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">{guest.tier}</span>
            {guest.pointsToNextTier > 0 && <span className="text-xs text-muted-foreground">{guest.pointsToNextTier} pts to {guest.nextTier}</span>}
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
        </motion.div>

        {/* Behavior */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Behavior</p>
          <div className="space-y-2.5">
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
        </motion.div>

        {/* Spending */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Spending</p>
          <div className="space-y-2.5">
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
        </motion.div>
      </div>

      {/* Journey + Smart Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journey Timeline */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="lg:col-span-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
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
        </motion.div>

        {/* Smart Actions */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Smart Actions</p>
          <div className="space-y-2">
            {actions.map(a => (
              <button key={a} className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)_/_0.2)] transition-colors" data-testid={`action-${a.toLowerCase().replace(/\s+/g, '-')}`}>
                {a}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Churn Risk Warning */}
      {isChurnRisk && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.45 }} className="rounded-xl border border-[hsl(var(--danger)_/_0.2)] bg-[hsl(var(--danger)_/_0.05)] p-4" data-testid="churn-warning">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--danger))] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Churn Risk Detected</p>
              <p className="text-xs text-muted-foreground">This guest has shown declining engagement. Consider immediate re-engagement actions.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

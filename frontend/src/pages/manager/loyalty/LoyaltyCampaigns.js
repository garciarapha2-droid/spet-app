import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Rocket, Clock, ShoppingBag, Users, X, Plus, BarChart2 } from 'lucide-react';
import { campaigns } from '../../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const statusColors = {
  active: 'bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]',
  scheduled: 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]',
  ended: 'bg-[hsl(var(--muted))] text-muted-foreground',
};

const typeIcons = {
  spend: ShoppingBag,
  time: Clock,
  item: Target,
  referral: Users,
};

const suggestedCampaigns = [
  { name: 'Weekend Warrior', trigger: 'Visit 3 weekends in a row', reward: 'Free drink + 500 pts' },
  { name: 'Bring a Friend Night', trigger: 'Check in with a new guest', reward: 'Both earn 300 pts' },
  { name: 'Late Night Bonus', trigger: 'Order after 11 PM', reward: '2x points on all items' },
];

export default function LoyaltyCampaigns() {
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length;
  const endedCount = campaigns.filter(c => c.status === 'ended').length;

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter);

  return (
    <div className="space-y-6" data-testid="loyalty-campaigns-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: activeCount, color: 'text-[hsl(var(--success))]' },
          { label: 'Scheduled', value: scheduledCount, color: 'text-[hsl(var(--warning))]' },
          { label: 'Ended', value: endedCount },
          { label: 'Total', value: campaigns.length },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold tabular-nums ${kpi.color || 'text-foreground'}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {['all', 'active', 'scheduled', 'ended'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`campaign-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-colors"
          data-testid="create-campaign-btn"
        >
          <Plus className="h-4 w-4" /> Create Campaign
        </button>
      </motion.div>

      {/* Campaign List */}
      <div className="space-y-3">
        {filtered.map((c, i) => {
          const Icon = typeIcons[c.type] || Target;
          return (
            <motion.div
              key={c.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.04 }}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--primary)_/_0.3)] transition-colors group"
              data-testid={`campaign-card-${c.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--primary)_/_0.1)]">
                  <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[c.status] || ''}`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.trigger} → {c.reward}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.duration}</p>
                </div>
                <BarChart2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Suggested Campaigns */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Suggested Campaigns</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestedCampaigns.map((s, i) => (
            <motion.div
              key={s.name}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-[hsl(var(--warning)_/_0.2)] bg-[hsl(var(--warning)_/_0.05)] p-4"
            >
              <h4 className="text-sm font-semibold text-foreground mb-1">{s.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">{s.trigger} → {s.reward}</p>
              <button className="text-xs font-medium text-[hsl(var(--primary))] hover:underline">Create this campaign</button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateCampaignModal onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateCampaignModal({ onClose }) {
  const [type, setType] = useState('spend');

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
        className="relative w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
        onClick={e => e.stopPropagation()}
        data-testid="create-campaign-modal"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[hsl(var(--muted))]">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <h3 className="text-lg font-bold text-foreground mb-6">Create Campaign</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Campaign Name</label>
            <input type="text" placeholder="e.g. Double Points Friday" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]" data-testid="campaign-name-input" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
            <div className="flex gap-2">
              {['spend', 'time', 'item', 'referral'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    type === t ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Trigger / Condition</label>
            <input type="text" placeholder="e.g. Any purchase on Friday" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]" data-testid="campaign-trigger-input" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reward</label>
            <input type="text" placeholder="e.g. 2x points" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]" data-testid="campaign-reward-input" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration</label>
            <input type="text" placeholder="e.g. Every Friday" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]" data-testid="campaign-duration-input" />
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.8)] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:opacity-90 transition-opacity mt-2"
            data-testid="launch-campaign-btn"
          >
            <Rocket className="h-4 w-4" /> Launch Campaign
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

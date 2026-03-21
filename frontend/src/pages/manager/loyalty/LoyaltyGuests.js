import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
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
  if (score >= 80) return { bg: 'bg-[hsl(var(--success)_/_0.15)]', text: 'text-[hsl(var(--success))]' };
  if (score >= 50) return { bg: 'bg-[hsl(var(--warning)_/_0.15)]', text: 'text-[hsl(var(--warning))]' };
  return { bg: 'bg-[hsl(var(--danger)_/_0.15)]', text: 'text-[hsl(var(--danger))]' };
};

const statusFilters = ['all', 'vip', 'active', 'churn_risk', 'new', 'returning', 'lost'];
const tierFilters = ['all', 'VIP', 'Platinum', 'Gold', 'Silver'];

export default function LoyaltyGuests() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const vipCount = guestProfiles.filter(g => g.status === 'vip').length;
  const churnCount = guestProfiles.filter(g => g.status === 'churn_risk' || g.status === 'lost').length;
  const avgScore = Math.round(guestProfiles.reduce((s, g) => s + g.guestScore, 0) / guestProfiles.length);

  const filtered = useMemo(() =>
    guestProfiles.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;
      const matchTier = tierFilter === 'all' || g.tier === tierFilter;
      return matchSearch && matchStatus && matchTier;
    }),
    [search, statusFilter, tierFilter]
  );

  return (
    <div className="flex flex-col gap-4" data-testid="loyalty-guests-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Guests', value: guestProfiles.length },
          { label: 'VIP Guests', value: vipCount, color: 'text-[hsl(var(--primary))]' },
          { label: 'Churn Risk', value: churnCount, color: 'text-[hsl(var(--danger))]' },
          { label: 'Avg Score', value: avgScore, color: 'text-[hsl(var(--success))]' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold tabular-nums ${kpi.color || 'text-foreground'}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            data-testid="loyalty-guest-search"
          />
        </div>
        <div className="flex items-center gap-1">
          {statusFilters.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`status-filter-${f}`}
            >
              {f === 'churn_risk' ? 'churn' : f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {tierFilters.map(f => (
            <button
              key={f}
              onClick={() => setTierFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tierFilter === f ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tier-filter-${f.toLowerCase()}`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Guest List */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border)_/_0.5)]">
        {filtered.map((g, i) => {
          const sc = scoreColor(g.guestScore);
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors cursor-pointer"
              onClick={() => navigate(`/manager/loyalty/guests/${g.id}`)}
              data-testid={`loyalty-guest-row-${g.id}`}
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
    </div>
  );
}

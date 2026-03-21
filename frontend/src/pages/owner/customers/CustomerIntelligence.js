import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, ChevronRight, ArrowUpRight, ArrowDownRight, Star, Search, Filter
} from 'lucide-react';
import { ownerGuests, venueColors } from '../../../data/ownerData';
import { CustomerProfileModal } from '../../../components/shared/GuestFullHistory';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const tierBadge = { VIP: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]', Platinum: 'bg-purple-500/10 text-purple-400', Gold: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]', Silver: 'bg-[hsl(var(--muted))] text-muted-foreground', Bronze: 'bg-[hsl(var(--muted))] text-muted-foreground' };
const segmentBadge = { vip: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]', active: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]', new: 'bg-blue-500/10 text-blue-500', at_risk: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]', lost: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' };

const totalGuests = ownerGuests.length;
const avgSpend = Math.round(ownerGuests.reduce((s, g) => s + g.avgSpend, 0) / totalGuests);
const avgScore = Math.round(ownerGuests.reduce((s, g) => s + g.score, 0) / totalGuests);
const riskCount = ownerGuests.filter(g => g.returningRisk).length;

export default function CustomerIntelligence() {
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [selectedGuest, setSelectedGuest] = useState(null);

  const segments = ['all', 'vip', 'active', 'new', 'at_risk', 'lost'];

  const filtered = ownerGuests
    .filter(g => filterSegment === 'all' || g.segment === filterSegment)
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-6" data-testid="customer-intelligence">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Guests', value: totalGuests, delta: '+12', up: true },
          { label: 'Avg Spend', value: `$${avgSpend}`, delta: '+5.3%', up: true },
          { label: 'Avg Score', value: `${avgScore}/100`, delta: '+2.1', up: true },
          { label: 'At Risk', value: riskCount, delta: `${riskCount} guests`, up: false },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`ci-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
              {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {kpi.delta}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            data-testid="ci-search"
          />
        </div>
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] p-[3px] rounded-full">
          {segments.map(s => (
            <button key={s} onClick={() => setFilterSegment(s)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${filterSegment === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`ci-seg-${s}`}>{s.replace('_', ' ')}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-foreground" data-testid="ci-sort">
          <option value="totalSpent">Total Spent</option>
          <option value="visits">Visits</option>
          <option value="score">Score</option>
          <option value="avgSpend">Avg Spend</option>
        </select>
      </motion.div>

      {/* Guest List */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto" data-testid="ci-guest-list">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                {['Guest', 'Tier', 'Segment', 'Total Spent', 'Visits', 'Avg Spend', 'Score', 'Last Visit', 'Trend'].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr key={g.id}
                  onClick={() => setSelectedGuest(g)}
                  className="border-b border-[hsl(var(--border)_/_0.5)] hover:bg-[hsl(var(--muted)_/_0.3)] cursor-pointer transition-colors group"
                  data-testid={`ci-row-${g.id}`}
                >
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">
                        {g.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{g.name}</p>
                        <p className="text-[10px] text-muted-foreground">{g.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[g.tier] || ''}`}>{g.tier}</span></td>
                  <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${segmentBadge[g.segment] || ''}`}>{g.segment?.replace('_', ' ')}</span></td>
                  <td className="p-3 font-semibold tabular-nums">${g.totalSpent.toLocaleString()}</td>
                  <td className="p-3 tabular-nums">{g.visits}</td>
                  <td className="p-3 tabular-nums">${g.avgSpend}</td>
                  <td className="p-3 tabular-nums">{g.score}</td>
                  <td className="p-3 text-muted-foreground">{g.lastVisit}</td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${g.spendTrend === 'up' ? 'text-[hsl(var(--success))]' : g.spendTrend === 'down' ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground'}`}>{g.spendTrend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No guests match your filter</p>}
      </motion.div>

      {selectedGuest && <CustomerProfileModal guest={selectedGuest} onClose={() => setSelectedGuest(null)} />}
    </div>
  );
}

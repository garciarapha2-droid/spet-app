import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, BarChart3, Users, Building2, Heart,
  Crown, Sparkles, AlertCircle, Target, AlertTriangle,
  ChevronRight, ArrowUpRight, ArrowDownRight, Star, Flame
} from 'lucide-react';
import { ownerVenues, venueColors, ownerGuests, ownerInsights, ownerActions } from '../../data/ownerData';
import { CustomerProfileModal } from '../../components/shared/GuestFullHistory';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const statusLabel = { top: { text: 'Top performer', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' }, attention: { text: 'Needs attention', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' }, underperforming: { text: 'Underperforming', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' } };
const impactDot = { high: 'bg-[hsl(var(--danger))]', medium: 'bg-[hsl(var(--warning))]', low: 'bg-muted-foreground' };
const impactBadge = { high: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]', medium: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]', low: 'bg-[hsl(var(--muted))] text-muted-foreground' };
const catDot = { critical: 'bg-[hsl(var(--danger))]', attention: 'bg-[hsl(var(--warning))]', opportunity: 'bg-[hsl(var(--success))]', growth: 'bg-[hsl(var(--primary))]' };
const tierBadge = { VIP: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]', Platinum: 'bg-purple-500/10 text-purple-400', Gold: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]', Silver: 'bg-[hsl(var(--muted))] text-muted-foreground', Bronze: 'bg-[hsl(var(--muted))] text-muted-foreground' };

const totalRevenue = ownerVenues.reduce((s, v) => s + v.revenue, 0);
const totalProfit = ownerVenues.reduce((s, v) => s + v.profit, 0);
const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);
const totalGuests = ownerVenues.reduce((s, v) => s + v.guests, 0);
const revPerGuest = Math.round(totalRevenue / totalGuests);

const topGuests = [...ownerGuests].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
const criticalInsights = ownerInsights.filter(i => i.category === 'critical');
const smartInsights = ownerInsights.filter(i => i.category !== 'critical').slice(0, 5);
const topActions = [...ownerActions].sort((a, b) => { const o = { high: 0, medium: 1, low: 2 }; return o[a.impact] - o[b.impact]; }).slice(0, 5);

const avgRetention = Math.round(ownerVenues.reduce((s, v) => s + v.retention, 0) / ownerVenues.length);
const loyaltyPct = Math.round(ownerGuests.filter(g => g.loyaltyEnrolled).length / ownerGuests.length * 100);
const churnRiskCount = ownerGuests.filter(g => g.returningRisk).length;

export default function OwnerOverview() {
  const navigate = useNavigate();
  const [selectedGuest, setSelectedGuest] = useState(null);

  return (
    <div className="flex flex-col gap-6" data-testid="owner-overview">
      {/* Period Filter placeholder (top-right) */}
      <div className="flex justify-end">
        <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-sm p-[3px] rounded-full shadow-[0_1px_3px_0_hsl(var(--foreground)_/_0.04)]">
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map((p, i) => (
            <button key={p} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors ${i === 2 ? 'bg-foreground text-background shadow-[0_1px_4px_0_hsl(var(--foreground)_/_0.15)]' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`period-${p.toLowerCase()}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, delta: '+8.2%', up: true, path: '/owner/performance/revenue' },
          { icon: TrendingUp, label: 'Profit', value: `$${(totalProfit / 1000).toFixed(0)}K`, delta: '+12.1%', up: true, path: '/owner/performance/profit' },
          { icon: BarChart3, label: 'Margin', value: `${avgMargin}%`, delta: '+1.4%', up: true, path: '/owner/performance/profit' },
          { icon: Users, label: 'Rev/Guest', value: `$${revPerGuest}`, delta: '+5.3%', up: true, path: '/owner/customers/intelligence' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }}
            onClick={() => navigate(kpi.path)}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 cursor-pointer hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm transition-all group"
            data-testid={`overview-kpi-${kpi.label.toLowerCase()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
              <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {kpi.delta}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Venue Performance + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Performance */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Building2 className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
            <div><p className="text-base font-semibold text-foreground">Venue Performance</p><p className="text-xs text-muted-foreground">Ranked by revenue</p></div>
          </div>
          <div className="flex flex-col gap-2">
            {ownerVenues.map((v, i) => {
              const st = statusLabel[v.status];
              const vc = venueColors[v.name];
              return (
                <motion.div key={v.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.03 }}
                  onClick={() => navigate(`/owner/system/venues/${v.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors group"
                  data-testid={`venue-row-${v.id}`}
                >
                  <span className={`w-2 h-2 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{v.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st?.cls || ''}`}>{st?.text}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic truncate">{v.insight}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground tabular-nums">${(v.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground tabular-nums">Profit ${(v.profit / 1000).toFixed(0)}K &middot; Ret {v.retention}%</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Retention & Loyalty */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Heart className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
            <div><p className="text-base font-semibold text-foreground">Retention & Loyalty</p><p className="text-xs text-muted-foreground">Guest return health</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Returning</p>
              <p className={`text-xl font-bold tabular-nums ${avgRetention < 55 ? 'text-[hsl(var(--danger))]' : 'text-foreground'}`}>{avgRetention}%</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Loyalty</p>
              <p className="text-xl font-bold tabular-nums text-foreground">{loyaltyPct}%</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Churn Risk</p>
              <p className="text-xl font-bold tabular-nums text-[hsl(var(--danger))]">{churnRiskCount}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Loyalty members spend 2.4x more than non-members</p>
            <p className="text-xs text-muted-foreground">34% of guests are not yet enrolled in loyalty</p>
            <p className="text-xs text-muted-foreground">Week 2 is the biggest churn drop-off point (28% loss)</p>
          </div>
        </motion.div>
      </div>

      {/* AI Hero */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Sparkles className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[hsl(var(--primary))]">Business Overview</p>
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug mb-3">Your business generated $170K this month with a 38.5% margin. Downtown leads, but Uptown needs immediate attention on costs.</p>
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-xs text-muted-foreground flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted-foreground" /> Churn increased 18% — 23 high-value guests at risk</p>
          <p className="text-xs text-muted-foreground flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted-foreground" /> Uptown labor ratio at 42%, well above the 35% target</p>
          <p className="text-xs text-muted-foreground flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-muted-foreground" /> Referral program ROI of 410% — scale opportunity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Fix Retention', path: '/owner/customers/churn' },
            { label: 'Create Campaign', path: '/owner/growth/campaigns' },
            { label: 'Review Venues', path: '/owner/system/venues' },
            { label: 'View Customers', path: '/owner/customers/intelligence' },
          ].map(b => (
            <button key={b.label} onClick={() => navigate(b.path)} className="bg-gradient-to-b from-foreground to-foreground/90 text-background rounded-lg px-4 py-2 text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity" data-testid={`cta-${b.label.toLowerCase().replace(/\s/g, '-')}`}>{b.label}</button>
          ))}
        </div>
      </motion.div>

      {/* Top Customers + Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Crown className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
            <p className="text-base font-semibold text-foreground">Top Customers</p>
          </div>
          <div className="flex flex-col gap-1">
            {topGuests.map((g, i) => (
              <motion.div key={g.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.03 }}
                onClick={() => setSelectedGuest(g)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors group"
                data-testid={`top-guest-${g.id}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'ring-1 ring-[hsl(var(--primary)_/_0.3)] bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'}`}>
                  {g.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{g.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge[g.tier] || ''}`}>{g.tier}</span>
                    {g.returningRisk && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]">At Risk</span>}
                    {g.tier === 'VIP' && <Star className="h-3 w-3 text-[hsl(var(--warning))]" fill="hsl(var(--warning))" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{g.visits} visits &middot; {g.lastVisit}</p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">${g.totalSpent.toLocaleString()}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Sparkles className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
            <div><p className="text-base font-semibold text-foreground">Smart Insights</p><p className="text-xs text-muted-foreground">Opportunities & risks</p></div>
          </div>
          <div className="flex flex-col gap-2">
            {smartInsights.map((ins, i) => (
              <motion.div key={ins.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.03 }} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors group">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${catDot[ins.category] || 'bg-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{ins.title}</p>
                  <p className="text-xs text-muted-foreground">{ins.detail}</p>
                  {ins.cta && <span className="text-xs font-medium text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity">{ins.cta}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Attention Points */}
      {criticalInsights.length > 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><AlertCircle className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
            <div><p className="text-base font-semibold text-foreground">Attention Points</p><p className="text-xs text-muted-foreground">Issues requiring immediate action</p></div>
          </div>
          <div className="flex flex-col gap-2">
            {criticalInsights.map((ins, i) => (
              <div key={ins.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors group">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--danger))] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{ins.title}</p>
                  <p className="text-xs text-muted-foreground">{ins.detail}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]">{ins.metric}</span>
                {ins.cta && <span className="text-xs font-medium text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">{ins.cta}</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Center */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center"><Target className="h-[18px] w-[18px] text-[hsl(var(--primary))]" /></div>
          <div><p className="text-base font-semibold text-foreground">What should I do today?</p><p className="text-xs text-muted-foreground">Prioritized by impact</p></div>
        </div>
        <div className="flex flex-col gap-2">
          {topActions.map((a, i) => (
            <motion.div key={a.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.45 + i * 0.03 }}
              onClick={() => navigate('/owner/insights/actions')}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors group"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${impactDot[a.impact]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground truncate">{a.explanation}</p>
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--success))] tabular-nums shrink-0">{a.estimatedRevenue}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${impactBadge[a.impact]}`}>{a.impact}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Customer Profile Modal */}
      <AnimatePresence>
        {selectedGuest && <CustomerProfileModal guest={selectedGuest} onClose={() => setSelectedGuest(null)} />}
      </AnimatePresence>
    </div>
  );
}

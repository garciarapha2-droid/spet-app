import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ownerCampaigns } from '../../../data/ownerData';
import { Target, DollarSign, TrendingUp, Users, ArrowUpRight, Edit, X } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const periods = ['Today', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

const statusBadge = {
  active: 'text-[hsl(var(--success))] bg-[hsl(var(--success)_/_0.1)]',
  ended: 'text-muted-foreground bg-[hsl(var(--muted))]',
  draft: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning)_/_0.1)]',
};

const typeLabel = { spend: 'Spend-based', loyalty: 'Tier-based', retention: 'Time-based', referral: 'Referral', event: 'Event-based' };

export default function CampaignPerformance() {
  const [period, setPeriod] = useState('Monthly');
  const [selected, setSelected] = useState(null);

  const activeCampaigns = ownerCampaigns.filter(c => c.status === 'active');
  const totalRevenue = activeCampaigns.reduce((s, c) => s + c.revenueGenerated, 0);
  const avgROI = activeCampaigns.length > 0 ? Math.round(activeCampaigns.reduce((s, c) => s + c.roi, 0) / activeCampaigns.length) : 0;
  const totalReached = ownerCampaigns.reduce((s, c) => s + c.guestsReached, 0);

  const kpis = [
    { label: 'Active Campaigns', value: activeCampaigns.length, icon: Target },
    { label: 'Revenue Generated', value: `$${(totalRevenue / 1000).toFixed(1)}K`, icon: DollarSign },
    { label: 'Avg ROI', value: `${avgROI}%`, icon: TrendingUp },
    { label: 'Guests Reached', value: totalReached.toLocaleString(), icon: Users },
  ];

  const best = [...ownerCampaigns].filter(c => c.status === 'active').sort((a, b) => b.roi - a.roi)[0];

  return (
    <div className="flex flex-col gap-6" data-testid="campaign-performance">
      {/* Period Filter — top right, mb-4 */}
      <div className="flex items-center justify-end mb-[-8px]">
        <div className="flex rounded-full bg-[hsl(var(--muted)_/_0.5)] p-1 backdrop-blur">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`period-${p.toLowerCase()}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs — grid-cols-2 md:grid-cols-4, gap-4, mb-6 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4 flex flex-col gap-1"
            data-testid={`kpi-${i}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* All Campaigns — rounded-xl, border, bg-card, p-5, mb-6 */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
            <Target className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">All Campaigns</h3>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </div>
        </div>

        {/* Campaign list — flex flex-col gap-3 */}
        <div className="flex flex-col gap-3">
          {ownerCampaigns.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className="p-4 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors cursor-pointer"
              data-testid={`campaign-${c.id}`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadge[c.status] || ''}`}>{c.status}</span>
                  <span className="text-[10px] text-muted-foreground">{typeLabel[c.type] || c.type}</span>
                </div>
                {c.revenueGenerated > 0 && (
                  <span className="text-sm font-bold text-foreground tabular-nums">${c.revenueGenerated.toLocaleString()}</span>
                )}
              </div>
              {/* Bottom row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Reached: <span className="font-semibold text-foreground">{c.guestsReached}</span></span>
                <span>Conversion: <span className="font-semibold text-foreground">{c.conversionRate}%</span></span>
                <span>ROI: <span className={`font-semibold ${c.roi > 200 ? 'text-[hsl(var(--success))]' : c.roi > 100 ? 'text-foreground' : 'text-[hsl(var(--warning))]'}`}>{c.roi}%</span></span>
                <span>{c.startDate}{c.endDate ? ` → ${c.endDate}` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Best Performer */}
      {best && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-border bg-[hsl(var(--card))] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
              <ArrowUpRight className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Best Performer</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{best.name}</span> leads with {best.roi}% ROI, reaching {best.guestsReached} guests at {best.conversionRate}% conversion.
            Consider increasing budget allocation for this campaign type ({typeLabel[best.type]}) to maximize returns.
          </p>
          <button className="mt-3 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity" data-testid="best-performer-cta">
            View Campaign Details
          </button>
        </motion.div>
      )}

      {/* Modal — campaign detail */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }} data-testid="campaign-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[hsl(var(--card))] border border-border rounded-2xl w-full max-w-lg shadow-xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">{selected.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadge[selected.status] || ''}`}>{selected.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{typeLabel[selected.type] || selected.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-colors" onClick={() => setSelected(null)} data-testid="modal-close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Metrics grid — grid-cols-4 gap-3 p-5 */}
              <div className="grid grid-cols-4 gap-3 p-5">
                {[
                  { label: 'Revenue', value: `$${selected.revenueGenerated.toLocaleString()}` },
                  { label: 'Reached', value: selected.guestsReached },
                  { label: 'Conversion', value: `${selected.conversionRate}%` },
                  { label: 'ROI', value: `${selected.roi}%` },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] text-center">
                    <p className="text-sm font-bold text-foreground tabular-nums">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="px-5 pb-5">
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-border p-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Started</span>
                      <span className="font-medium text-foreground">{selected.startDate}</span>
                    </div>
                    {selected.endDate && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Ended</span>
                        <span className="font-medium text-foreground">{selected.endDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-foreground capitalize">{selected.status}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium text-foreground">{typeLabel[selected.type]}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button className="flex-1 px-3 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity">
                      Edit Campaign
                    </button>
                    {selected.status === 'active' && (
                      <button className="flex-1 px-3 py-2 rounded-lg border border-[hsl(var(--danger)_/_0.3)] text-[hsl(var(--danger))] text-xs font-semibold hover:bg-[hsl(var(--danger)_/_0.05)] transition-colors">
                        Pause Campaign
                      </button>
                    )}
                    {selected.status === 'draft' && (
                      <button className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--success))] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                        Launch Campaign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

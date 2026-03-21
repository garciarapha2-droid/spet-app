import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, ChevronRight } from 'lucide-react';
import { guestSegments, ownerGuests } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
};

const totalSegmentGuests = guestSegments.reduce((s, seg) => s + seg.count, 0);

export default function Segments() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6" data-testid="segments-page">
      {/* Donut Chart + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-1">Guest Distribution</p>
          <p className="text-xs text-muted-foreground mb-4">By segment</p>
          <div className="h-64" data-testid="segments-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={guestSegments} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                  {guestSegments.map((seg, i) => <Cell key={i} fill={seg.color} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(v, name) => [`${v} guests (${(v / totalSegmentGuests * 100).toFixed(0)}%)`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <p className="text-base font-semibold text-foreground mb-4">Segment Breakdown</p>
          <div className="flex flex-col gap-4">
            {guestSegments.map((seg, i) => (
              <motion.div key={seg.name} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.04 }} className="p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.3)] cursor-pointer transition-all" onClick={() => navigate(`/owner/customers/intelligence`)} data-testid={`segment-${seg.name.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                  <span className="text-sm font-semibold text-foreground">{seg.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">{seg.count} guests ({seg.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden mb-2">
                  <motion.div className="h-full rounded-full" style={{ background: seg.color }} initial={{ width: 0 }} animate={{ width: `${seg.pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Avg Spend: <span className="font-semibold text-foreground">${seg.avgSpend}</span></span>
                  <span className="italic">{seg.description}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

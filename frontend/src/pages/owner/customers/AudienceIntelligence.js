import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Users, ChevronRight, Music } from 'lucide-react';
import { audienceGenres } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const genreColors = ['hsl(var(--primary))', '#3B82F6', '#F59E0B', '#EF4444', '#22C55E', '#8B5CF6'];

const chartTooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
};

const totalAudienceGuests = audienceGenres.reduce((s, g) => s + g.guests, 0);
const avgAudienceSpend = Math.round(audienceGenres.reduce((s, g) => s + g.avgSpend * g.guests, 0) / totalAudienceGuests);

export default function AudienceIntelligence() {
  const navigate = useNavigate();
  const [metric, setMetric] = useState('guests');

  return (
    <div className="flex flex-col gap-6" data-testid="audience-intelligence">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Audience Groups', value: audienceGenres.length },
          { label: 'Total Reach', value: totalAudienceGuests.toLocaleString() },
          { label: 'Avg Spend', value: `$${avgAudienceSpend}` },
          { label: 'Top Genre', value: [...audienceGenres].sort((a, b) => b.revenue - a.revenue)[0].name },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`audience-kpi-${i}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Metric Toggle + Chart */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-semibold text-foreground">Audience by Genre</p>
            <p className="text-xs text-muted-foreground">Comparing genres across metrics</p>
          </div>
          <div className="flex items-center border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.8)] p-[3px] rounded-full">
            {['guests', 'revenue', 'avgSpend'].map(m => (
              <button key={m} onClick={() => setMetric(m)} className={`px-3 py-1 text-[11px] font-medium tracking-wide rounded-full transition-colors capitalize ${metric === m ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground/80'}`} data-testid={`audience-metric-${m}`}>{m === 'avgSpend' ? 'Avg Spend' : m}</button>
            ))}
          </div>
        </div>
        <div className="h-56" data-testid="audience-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={audienceGenres} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => metric === 'revenue' ? `$${(v / 1000).toFixed(0)}K` : metric === 'avgSpend' ? `$${v}` : v} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [metric === 'revenue' ? `$${v.toLocaleString()}` : metric === 'avgSpend' ? `$${v}` : v, '']} />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                {audienceGenres.map((_, i) => <Cell key={i} fill={genreColors[i % genreColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Genre Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audienceGenres.map((g, i) => (
          <motion.div key={g.slug} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.04 }}
            onClick={() => navigate(`/owner/customers/audience/${g.slug}`)}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm cursor-pointer transition-all group"
            data-testid={`audience-genre-${g.slug}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Music className="h-4 w-4" style={{ color: genreColors[i % genreColors.length] }} />
              <span className="text-sm font-semibold text-foreground">{g.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Guests</span><p className="font-semibold text-foreground tabular-nums">{g.guests}</p></div>
              <div><span className="text-muted-foreground">Revenue</span><p className="font-semibold text-foreground tabular-nums">${(g.revenue / 1000).toFixed(0)}K</p></div>
              <div><span className="text-muted-foreground">Avg Spend</span><p className="font-semibold text-foreground tabular-nums">${g.avgSpend}</p></div>
              <div><span className="text-muted-foreground">Avg Age</span><p className="font-semibold text-foreground tabular-nums">{g.avgAge}</p></div>
              <div><span className="text-muted-foreground">Top Drink</span><p className="font-semibold text-foreground">{g.topDrink}</p></div>
              <div><span className="text-muted-foreground">Peak Time</span><p className="font-semibold text-foreground">{g.peakTime}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

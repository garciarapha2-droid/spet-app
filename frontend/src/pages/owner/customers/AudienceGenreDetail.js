import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { audienceGenres } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

export default function AudienceGenreDetail() {
  const { genreSlug } = useParams();
  const navigate = useNavigate();
  const genre = audienceGenres.find(g => g.slug === genreSlug);

  if (!genre) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Genre not found</p></div>;

  return (
    <div className="space-y-6" data-testid="genre-detail">
      <motion.button {...fadeUp} onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="genre-back-btn">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <h2 className="text-lg font-bold text-foreground">{genre.name}</h2>
        <p className="text-xs text-muted-foreground mt-1">Audience genre analysis</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Guests', value: genre.guests },
          { label: 'Revenue', value: `$${(genre.revenue / 1000).toFixed(0)}K` },
          { label: 'Avg Spend', value: `$${genre.avgSpend}` },
          { label: 'Avg Age', value: genre.avgAge },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.04 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" data-testid={`genre-kpi-${i}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-1">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Demographics */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-base font-semibold text-foreground mb-4">Demographics</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Gender Split</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${genre.genderSplit.male}%` }} />
              </div>
              <span className="text-xs font-semibold text-foreground tabular-nums">{genre.genderSplit.male}M / {genre.genderSplit.female}F</span>
            </div>
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Top Drink</p>
            <p className="text-sm font-semibold text-foreground">{genre.topDrink}</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Top Food</p>
            <p className="text-sm font-semibold text-foreground">{genre.topFood}</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Peak Time</p>
            <p className="text-sm font-semibold text-foreground">{genre.peakTime}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

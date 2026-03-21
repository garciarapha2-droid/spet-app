import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, ArrowUpRight, ArrowDownRight, Users, Calendar } from 'lucide-react';
import { ownerVenues, venueColors } from '../../../data/ownerData';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const statusLabel = { top: { text: 'Top performer', cls: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' }, attention: { text: 'Needs attention', cls: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' }, underperforming: { text: 'Underperforming', cls: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' } };

export default function VenueManagement() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6" data-testid="venue-management">
      {/* Venue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ownerVenues.map((v, i) => {
          const vc = venueColors[v.name];
          const st = statusLabel[v.status];
          return (
            <motion.div key={v.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(`/owner/system/venues/${v.id}`)}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm cursor-pointer transition-all group"
              data-testid={`venue-card-${v.id}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${vc?.dot || 'bg-muted-foreground'}`} />
                <span className="text-base font-semibold text-foreground">{v.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st?.cls || ''}`}>{st?.text}</span>
              <p className="text-xs text-muted-foreground mt-2">{v.address}</p>
              <p className="text-xs text-muted-foreground">{v.hours}</p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Revenue</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">${(v.revenue / 1000).toFixed(0)}K</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Profit</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">${(v.profit / 1000).toFixed(0)}K</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Guests</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{v.guests}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--muted)_/_0.5)] p-2.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Retention</p>
                  <p className={`text-sm font-bold tabular-nums ${v.retention < 55 ? 'text-[hsl(var(--danger))]' : 'text-foreground'}`}>{v.retention}%</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.staffCount} staff</span>
                <span>{v.tables} tables</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {v.events} events</span>
              </div>

              <div className="mt-3 flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Growth</span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${v.growth > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                  {v.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {v.growth > 0 ? '+' : ''}{v.growth}%
                </span>
              </div>

              <p className="text-xs text-muted-foreground italic mt-2">{v.insight}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

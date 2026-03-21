import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

export default function ManagerSettings() {
  return (
    <div className="flex flex-col gap-6" data-testid="manager-settings-page">
      {/* General */}
      <motion.div {...fadeUp} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">General</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Venue Name</label>
            <input
              type="text"
              defaultValue="The Velvet Room"
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              data-testid="setting-venue-name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Operating Mode</label>
            <select
              defaultValue="Club"
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              data-testid="setting-mode"
            >
              <option>Club</option>
              <option>Restaurant</option>
              <option>Bar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Currency</label>
            <select
              defaultValue="USD"
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              data-testid="setting-currency"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>BRL</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">Integrations</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
            <div>
              <p className="text-sm font-medium text-foreground">Stripe</p>
              <p className="text-xs text-muted-foreground">Payment processing</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
            <div>
              <p className="text-sm font-medium text-foreground">NFC Wristbands</p>
              <p className="text-xs text-muted-foreground">Guest identification</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]">
              Available
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

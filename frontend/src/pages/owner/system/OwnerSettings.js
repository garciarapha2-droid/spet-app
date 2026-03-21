import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Building2, Shield, Bell, Database, Palette } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

const settingSections = [
  { icon: Building2, label: 'Venue Configuration', description: 'Manage venue details, hours, and capacity', items: ['Venue names and addresses', 'Operating hours', 'Table count and layout', 'Capacity limits'] },
  { icon: Shield, label: 'Security & Access', description: 'Control who can access the Owner dashboard', items: ['Access permissions', 'Two-factor authentication', 'Session management', 'Audit logs'] },
  { icon: Bell, label: 'Notifications', description: 'Configure alert thresholds and channels', items: ['Email notifications', 'Push alerts', 'Alert thresholds', 'Daily/weekly digests'] },
  { icon: Database, label: 'Data & Reports', description: 'Export settings and report scheduling', items: ['Export data (CSV/PDF)', 'Scheduled reports', 'Data retention policy', 'API access'] },
  { icon: Palette, label: 'Appearance', description: 'Customize look and feel', items: ['Theme (light/dark)', 'Dashboard layout', 'Default currency', 'Date format'] },
];

export default function OwnerSettings() {
  return (
    <div className="flex flex-col gap-6" data-testid="owner-settings">
      <div className="flex flex-col gap-4">
        {settingSections.map((section, i) => (
          <motion.div key={section.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.05 }}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)_/_0.3)] hover:shadow-sm transition-all cursor-pointer"
            data-testid={`settings-section-${section.label.toLowerCase().replace(/[\s&]/g, '-')}`}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center shrink-0">
                <section.icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground mb-3">{section.description}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {section.items.map(item => (
                    <span key={item} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

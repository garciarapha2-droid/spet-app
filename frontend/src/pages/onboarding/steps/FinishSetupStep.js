import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const CHECKLIST = [
  'Account confirmed',
  'Password secured',
  'Role assigned',
  'Modules configured',
];

export default function FinishSetupStep({ data, onComplete }) {
  return (
    <div data-testid="onboarding-finish" className="flex flex-col items-center text-center py-8">
      {/* Icon */}
      <motion.img
        src="/spet-icon-hd.png"
        alt="spet"
        className="w-20 h-20 rounded-2xl mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Title */}
      <motion.h1
        className="text-2xl font-bold tracking-tight text-foreground mb-2"
        style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        You're all set
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-muted-foreground text-sm max-w-xs mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        {data.venueName || 'Your venue'} is ready to go. Welcome aboard.
      </motion.p>

      {/* Checklist */}
      <div className="w-full max-w-xs space-y-2 mb-10">
        {CHECKLIST.map((item, i) => (
          <motion.div
            key={item}
            className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/50"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.35 }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[hsl(var(--success)/0.15)]">
              <Check size={12} className="text-[hsl(var(--success))]" />
            </div>
            <span className="text-sm text-foreground">{item}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Button
          data-testid="onboarding-enter-system"
          size="lg"
          onClick={onComplete}
          className="px-10 text-base font-semibold active:scale-[0.97] transition-transform"
        >
          Enter System
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

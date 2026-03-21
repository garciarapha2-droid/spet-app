import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function WelcomeStep({ onNext }) {
  return (
    <div data-testid="onboarding-welcome" className="flex flex-col items-center text-center py-12 relative">
      {/* Ambient Glow */}
      <div
        className="absolute rounded-full opacity-[0.07] pointer-events-none"
        style={{
          width: 600,
          height: 600,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
        }}
      />

      {/* Icon */}
      <motion.img
        src="/spet-icon-hd.png"
        alt="spet"
        className="w-28 h-28 rounded-3xl shadow-lg mb-8 relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Title */}
      <motion.h1
        className="text-3xl font-bold tracking-tight text-foreground mb-3 relative z-10"
        style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Welcome to spet<span className="text-primary">.</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-muted-foreground text-base max-w-sm leading-relaxed mb-14 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Your venue operations, unified. Let's set up your workspace in a few quick steps.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <Button
          data-testid="onboarding-get-started"
          size="lg"
          onClick={onNext}
          className="px-10 text-base font-semibold active:scale-[0.97] transition-transform"
        >
          Get Started
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

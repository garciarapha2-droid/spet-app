import React from 'react';

/**
 * BrandLogo — Reusable SPET brand component
 *
 * Variants:
 *   navbar  → icon (h-8 w-8 rounded-lg) + "spet." text (22px Space Grotesk bold)
 *   footer  → icon (h-6 w-6 rounded-md) + "spet." text (semibold)
 *   icon    → icon only (no text)
 *
 * Sizes:  sm | default | lg
 *
 * Uses `/spet-icon-hd.png` when available, falls back to CSS icon.
 */

const SIZE_MAP = {
  sm:      { icon: 'h-6 w-6', iconRound: 'rounded-md',  text: 'text-[15px]', dot: 'text-[15px]' },
  default: { icon: 'h-8 w-8', iconRound: 'rounded-lg',  text: 'text-[22px]', dot: 'text-[22px]' },
  lg:      { icon: 'h-11 w-11', iconRound: 'rounded-xl', text: 'text-[28px]', dot: 'text-[28px]' },
};

const VARIANT_DEFAULTS = {
  navbar: 'default',
  footer: 'sm',
  icon:   'default',
};

function SpetIconFallback({ className, rounded }) {
  return (
    <div className={`${className} ${rounded} bg-foreground/90 flex items-center justify-center relative`}>
      <span className="text-background font-extrabold leading-none" style={{ fontSize: '55%' }}>S</span>
      <span className="w-[22%] h-[22%] rounded-full bg-primary absolute" style={{ bottom: '12%', right: '12%' }} />
    </div>
  );
}

export default function BrandLogo({ variant = 'navbar', size, className = '', onClick }) {
  const s = SIZE_MAP[size || VARIANT_DEFAULTS[variant] || 'default'];

  const icon = (
    <img
      src="/spet-icon-hd.png"
      alt="SPET"
      className={`${s.icon} ${s.iconRound} object-contain`}
      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
    />
  );

  const fallback = (
    <SpetIconFallback className={s.icon} rounded={s.iconRound} />
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`} onClick={onClick} data-testid="brand-logo">
        {icon}
        <div style={{ display: 'none' }}>{fallback}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      onClick={onClick}
      data-testid="brand-logo"
    >
      <div className="relative">
        {icon}
        <div style={{ display: 'none' }}>{fallback}</div>
      </div>
      <span
        className={`${s.text} font-bold tracking-tight text-foreground`}
        style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
      >
        spet<span className="text-primary">.</span>
      </span>
    </div>
  );
}

export { SpetIconFallback };

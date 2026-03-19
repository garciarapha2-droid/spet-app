import React from 'react';
import BrandLogo from './BrandLogo';

/**
 * SpetLogo — Backwards-compatible wrapper around BrandLogo.
 * Legacy usage: <SpetLogo size="sm" />
 * Preferred: <BrandLogo variant="navbar" />
 */
const SpetLogo = ({ size = 'default', showText = true }) => {
  return (
    <BrandLogo
      variant={showText ? 'navbar' : 'icon'}
      size={size}
    />
  );
};

export default SpetLogo;

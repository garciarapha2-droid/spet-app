import React from 'react';

const SpetLogo = ({ size = "default" }) => {
  const config = {
    sm: { icon: "h-6", text: "text-[15px]" },
    default: { icon: "h-7", text: "text-lg" },
    lg: { icon: "h-9", text: "text-2xl" },
  };
  const s = config[size] || config.default;

  return (
    <div className="flex items-center gap-2" data-testid="spet-logo">
      <img
        src="/spet-logo-icon.png"
        alt="spet"
        className={`${s.icon} w-auto object-contain`}
        draggable={false}
      />
      <span className={`${s.text} font-bold tracking-tight`}>
        spet<span className="text-primary">.</span>
      </span>
    </div>
  );
};

export default SpetLogo;

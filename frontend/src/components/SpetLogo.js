import React from 'react';

const SpetIcon = ({ className = "h-7 w-6" }) => (
  <div className={`${className} rounded-[22%] bg-[#2A2D35] flex items-center justify-center relative`}>
    <span className="text-white font-extrabold leading-none" style={{ fontSize: '70%', marginTop: '-4%' }}>S</span>
    <span className="w-[20%] h-[20%] rounded-full bg-primary absolute" style={{ bottom: '10%', right: '10%' }} />
  </div>
);

const SpetLogo = ({ size = "default" }) => {
  const config = {
    sm: { icon: "h-7 w-[1.35rem]", text: "text-[15px]" },
    default: { icon: "h-8 w-[1.6rem]", text: "text-lg" },
    lg: { icon: "h-11 w-[2.15rem]", text: "text-2xl" },
  };
  const s = config[size] || config.default;

  return (
    <div className="flex items-center gap-2" data-testid="spet-logo">
      <SpetIcon className={s.icon} />
      <span className={`${s.text} font-bold tracking-tight`}>
        spet<span className="text-primary">.</span>
      </span>
    </div>
  );
};

export default SpetLogo;

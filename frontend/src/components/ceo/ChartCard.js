export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`bg-card border border-border rounded-[12px] p-6 ${className}`}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <h3 className="text-[16px] font-semibold tracking-[-0.01em] leading-[1.3] text-foreground">{title}</h3>
      {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
      <div className="mt-6 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

export function ListCard({ title, subtitle, items, onItemClick, className = '' }) {
  return (
    <div
      className={`bg-card border border-border rounded-[12px] p-6 ${className}`}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <h3 className="text-[16px] font-semibold tracking-[-0.01em] leading-[1.3] text-foreground">{title}</h3>
      {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
      <div className="mt-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            onClick={() => onItemClick?.(item)}
            className={`flex items-center justify-between py-3 ${
              i < items.length - 1 ? 'border-b border-border' : ''
            } ${onItemClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
          >
            <span className="text-[14px] text-foreground">{item.label}</span>
            <span className="text-[14px] font-semibold text-foreground tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

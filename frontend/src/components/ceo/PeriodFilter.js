import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';

const options = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function PeriodFilter({ period, onChange, className = '' }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customRange, setCustomRange] = useState(undefined);

  const handleCustomSelect = (range) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      onChange('custom', range);
      setCalendarOpen(false);
    }
  };

  const periodLabel = () => {
    const now = new Date(2026, 2, 24);
    switch (period) {
      case 'today': return `Mar 24, 2026`;
      case 'week': return `Mar 17 – Mar 23, 2026`;
      case 'month': return `Mar 1 – Mar 31, 2026`;
      case 'year': return `Jan 1 – Dec 31, 2026`;
      case 'custom': return customRange?.from && customRange?.to ? `${fmtDate(customRange.from)} – ${fmtDate(customRange.to)}` : 'Select dates';
      default: return '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex gap-1 bg-muted rounded-lg p-1" data-testid="period-filter">
        {options.map(opt => (
          opt.key === 'custom' ? (
            <Popover key="custom" open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                    period === 'custom' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50'
                  }`}
                  data-testid="period-custom"
                >
                  Custom
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={customRange} onSelect={handleCustomSelect} numberOfMonths={1} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          ) : (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                period === opt.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50'
              }`}
              data-testid={`period-${opt.key}`}
            >
              {opt.label}
            </button>
          )
        ))}
      </div>
      <p className="text-[13px] text-muted-foreground italic" data-testid="period-label">
        Showing data for: {periodLabel()}
      </p>
    </div>
  );
}

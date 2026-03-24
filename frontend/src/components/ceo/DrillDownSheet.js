import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

const planBadge = {
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  starter: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
};

const statusBadge = {
  active: 'text-[#1FAA6B]',
  trial: 'text-[#F59F00]',
  past_due: 'text-[#E03131]',
  cancelled: 'text-muted-foreground',
};

export function DrillDownSheet({ open, onClose, title, subtitle, children, count }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[640px] max-h-[80vh] overflow-y-auto rounded-[16px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {subtitle && <DialogDescription className="text-[13px] text-muted-foreground">{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4">
          {children}
        </div>
        {count !== undefined && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-[13px] text-muted-foreground">Showing {count} results</span>
            <Button variant="outline" size="sm" className="text-[13px]">Export CSV</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Pre-built drill-down table for company lists (MRR, Active Customers, etc.)
export function CompanyListDrillDown({ data }) {
  if (!data || data.length === 0) return <p className="text-[13px] text-muted-foreground py-4 text-center">No data for this period</p>;
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          {['Company', 'Plan', 'MRR', 'Status', 'Since'].map(h => (
            <th key={h} className="text-left px-3 py-2 text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {data.map((row, i) => (
          <tr key={i} className="text-[13px]">
            <td className="px-3 py-2 font-medium text-foreground">{row.company}</td>
            <td className="px-3 py-2">
              <span className={`text-[11px] font-semibold capitalize rounded-[6px] px-2 py-0.5 ${planBadge[row.plan] || ''}`}>{row.plan}</span>
            </td>
            <td className="px-3 py-2 text-foreground tabular-nums font-medium">${row.mrr}</td>
            <td className="px-3 py-2">
              <span className={`text-[12px] font-medium capitalize ${statusBadge[row.status] || ''}`}>
                {row.status === 'past_due' ? 'Past Due' : row.status}
              </span>
            </td>
            <td className="px-3 py-2 text-muted-foreground">{row.since}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Breakdown drill-down (for Net New MRR, etc.)
export function BreakdownDrillDown({ items, total, totalLabel }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-[13px] py-1.5">
          <span className={item.negative ? 'text-[#E03131]' : 'text-foreground'}>{item.label}</span>
          <span className={`tabular-nums font-medium ${item.negative ? 'text-[#E03131]' : 'text-foreground'}`}>{item.value}</span>
        </div>
      ))}
      {total !== undefined && (
        <div className="border-t-2 border-border pt-3 flex justify-between">
          <span className="text-[14px] font-bold text-foreground">{totalLabel || 'Total'}</span>
          <span className="text-[14px] font-bold text-foreground tabular-nums">{total}</span>
        </div>
      )}
    </div>
  );
}

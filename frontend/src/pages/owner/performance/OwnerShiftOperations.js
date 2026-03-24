import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, UtensilsCrossed, Users, Banknote, Calculator, Info, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Calendar } from '../../../components/ui/calendar';
import { staffMembers, shiftsData, transactionsData, dayRevenueData } from '../../../data/ownerShiftStaffData';

const fmtR = (v) => `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
const fmtR2 = (v) => `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtYear = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

const kpiConfig = [
  { key: 'revenue', label: 'Revenue', icon: DollarSign, tip: 'Sum of all transaction amounts in the selected period' },
  { key: 'tables', label: 'Tables Closed', icon: UtensilsCrossed, tip: 'Unique table sessions closed in the selected period' },
  { key: 'staffCost', label: 'Staff Cost (Wages)', icon: Users, tip: 'Sum of (hours_worked x hourly_rate) for all shifts. Does NOT include tips.' },
  { key: 'tips', label: 'Tips', icon: Banknote, tip: 'Sum of tips_amount from all transactions. Tips go to staff, not to business cost.' },
  { key: 'netResult', label: 'Net Result', icon: Calculator, tip: 'Net Result = Revenue - Staff Cost (Wages). Tips are excluded from cost as they come from customers.' },
];

const roleBadgeColors = {
  waiter: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  bartender: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  cashier: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  host: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  cook: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  dj: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  security: 'bg-red-500/15 text-red-400 border-red-500/20',
  manager: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  cleaner: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

export default function OwnerShiftOperations() {
  const [period, setPeriod] = useState('week');
  const [customRange, setCustomRange] = useState(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [kpiDrill, setKpiDrill] = useState(null);
  const [staffDetail, setStaffDetail] = useState(null);

  const dateRange = useMemo(() => {
    if (period === 'today') return { from: '2026-03-23', to: '2026-03-23' };
    if (period === 'yesterday') return { from: '2026-03-22', to: '2026-03-22' };
    if (period === 'week') return { from: '2026-03-17', to: '2026-03-23' };
    if (period === 'custom' && customRange?.from) {
      const fmt = d => d.toISOString().split('T')[0];
      return { from: fmt(customRange.from), to: fmt(customRange.to || customRange.from) };
    }
    return { from: '2026-03-17', to: '2026-03-23' };
  }, [period, customRange]);

  const periodLabel = period === 'today' ? 'Today' : period === 'yesterday' ? 'Yesterday' : period === 'week' ? 'This Week' : 'Custom';

  const displayRange = useMemo(() => {
    const f = new Date(dateRange.from + 'T00:00:00');
    const t = new Date(dateRange.to + 'T00:00:00');
    return `${fmtDate(f)} \u2013 ${fmtYear(t)}`;
  }, [dateRange]);

  // Filter & compute
  const { staffEarnings, dayPerf, kpis, filteredTx } = useMemo(() => {
    const fShifts = shiftsData.filter(s => s.date >= dateRange.from && s.date <= dateRange.to);
    const fTx = transactionsData.filter(t => t.closedAt.split('T')[0] >= dateRange.from && t.closedAt.split('T')[0] <= dateRange.to);
    const fDays = dayRevenueData.filter(d => d.date >= dateRange.from && d.date <= dateRange.to);

    // Staff earnings
    const map = {};
    for (const s of fShifts) {
      const staff = staffMembers.find(m => m.id === s.staffId);
      if (!staff) continue;
      if (!map[s.staffId]) map[s.staffId] = { id: s.staffId, name: staff.fullName, role: staff.role, hourlyRate: staff.hourlyRate, hours: 0, wages: 0, tips: 0, shifts: [], tipTx: [] };
      map[s.staffId].hours += s.hoursWorked;
      map[s.staffId].shifts.push(s);
    }
    for (const id in map) map[id].wages = map[id].hours * map[id].hourlyRate;
    for (const tx of fTx) {
      if (map[tx.staffId]) { map[tx.staffId].tips += tx.tipsAmount; map[tx.staffId].tipTx.push(tx); }
    }
    for (const id in map) map[id].total = map[id].wages + map[id].tips;
    const earnings = Object.values(map).sort((a, b) => b.total - a.total);

    // Day performance (staffCost computed from shifts)
    const dayP = fDays.map(d => {
      const dayShifts = fShifts.filter(s => s.date === d.date);
      const sc = dayShifts.reduce((sum, s) => {
        const staff = staffMembers.find(m => m.id === s.staffId);
        return sum + (s.hoursWorked * (staff?.hourlyRate || 0));
      }, 0);
      return { ...d, staffCost: sc, result: d.revenue - sc, status: d.revenue - sc >= 0 ? 'positive' : 'negative' };
    });

    // KPIs
    const revenue = dayP.reduce((s, d) => s + d.revenue, 0);
    const tablesClosed = dayP.reduce((s, d) => s + d.tables, 0);
    const staffCost = earnings.reduce((s, e) => s + e.wages, 0);
    const tips = earnings.reduce((s, e) => s + e.tips, 0);

    return {
      staffEarnings: earnings,
      dayPerf: dayP,
      kpis: { revenue, tables: tablesClosed, staffCost, tips, netResult: revenue - staffCost },
      filteredTx: fTx,
    };
  }, [dateRange]);

  const totals = useMemo(() => ({
    hours: staffEarnings.reduce((s, e) => s + e.hours, 0),
    wages: staffEarnings.reduce((s, e) => s + e.wages, 0),
    tips: staffEarnings.reduce((s, e) => s + e.tips, 0),
    total: staffEarnings.reduce((s, e) => s + e.total, 0),
  }), [staffEarnings]);

  const kpiValues = {
    revenue: fmtR(kpis.revenue),
    tables: kpis.tables.toString(),
    staffCost: fmtR(kpis.staffCost),
    tips: fmtR(kpis.tips),
    netResult: fmtR(kpis.netResult),
  };

  const handlePeriod = (p) => { setPeriod(p); if (p !== 'custom') setCalendarOpen(false); };
  const handleCustomSelect = (range) => { setCustomRange(range); if (range?.from && range?.to) { setPeriod('custom'); setCalendarOpen(false); } };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="max-w-[1400px] mx-auto space-y-6" data-testid="owner-shift-operations">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Shift vs Operations</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Financial reconciliation dashboard &mdash; all numbers from real data</p>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-2" data-testid="period-filter">
          {['today', 'yesterday', 'week'].map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriod(p)}
              className={`text-[13px] h-8 ${period === p ? 'text-white' : ''}`}
              style={period === p ? { background: 'linear-gradient(135deg, hsl(258 75% 58%), hsl(263 80% 66%))' } : undefined}
              data-testid={`period-${p}`}
            >
              {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : 'This Week'}
            </Button>
          ))}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={period === 'custom' ? 'default' : 'outline'}
                size="sm"
                className={`text-[13px] h-8 gap-1.5 ${period === 'custom' ? 'text-white' : ''}`}
                style={period === 'custom' ? { background: 'linear-gradient(135deg, hsl(258 75% 58%), hsl(263 80% 66%))' } : undefined}
                data-testid="period-custom"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={customRange} onSelect={handleCustomSelect} numberOfMonths={1} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="ml-auto text-[12px] text-muted-foreground font-medium" data-testid="period-display">
            Showing data for: <span className="text-foreground">{displayRange}</span>
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="kpi-grid">
          {kpiConfig.map((kpi, i) => {
            const Icon = kpi.icon;
            const val = kpiValues[kpi.key];
            const isNeg = kpi.key === 'netResult' && kpis.netResult < 0;
            return (
              <motion.div
                key={kpi.key}
                {...fadeUp}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setKpiDrill(kpi.key)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-primary/30"
                data-testid={`kpi-${kpi.key}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{kpi.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-auto"><Info className="h-3 w-3 text-muted-foreground/50" /></button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-[12px]"><p>{kpi.tip}</p></TooltipContent>
                  </Tooltip>
                </div>
                <p className={`text-[28px] font-bold tracking-tight tabular-nums ${isNeg ? 'text-destructive' : 'text-foreground'}`}>{val}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{periodLabel}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Staff Earnings Table */}
        <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.3 }} className="bg-card border border-border rounded-xl overflow-hidden" data-testid="staff-earnings-table">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Staff Earnings</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button><Info className="h-3.5 w-3.5 text-muted-foreground/50" /></button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-[12px]">
                <p>Wages = hours x hourly_rate (from shifts table). Tips = tips_amount (from transactions). Total = Wages + Tips. Click a row to drill down.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {staffEarnings.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
              <p className="text-[15px] font-semibold text-foreground">No shift data for this period</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Role', 'R$/Hr', 'Hours', 'Wages', 'Tips', 'Total'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffEarnings.map(s => (
                  <tr key={s.id} onClick={() => setStaffDetail(s)} className="hover:bg-muted/30 cursor-pointer transition-colors duration-150" data-testid={`staff-row-${s.id}`}>
                    <td className="px-5 py-3 text-[13px] font-medium text-foreground">{s.name}</td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground capitalize">{s.role}</td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums">R${s.hourlyRate}</td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums">{s.hours}h</td>
                    <td className="px-5 py-3 text-[13px] text-foreground tabular-nums font-medium">{fmtR(s.wages)}</td>
                    <td className="px-5 py-3 text-[13px] text-emerald-400 tabular-nums font-medium">{fmtR(s.tips)}</td>
                    <td className="px-5 py-3 text-[13px] text-foreground tabular-nums font-bold">{fmtR(s.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/20">
                  <td colSpan={3} className="px-5 py-2.5 text-[13px] font-semibold text-foreground">Totals</td>
                  <td className="px-5 py-2.5 text-[13px] font-semibold text-foreground tabular-nums">{totals.hours}h</td>
                  <td className="px-5 py-2.5 text-[13px] font-semibold text-foreground tabular-nums">{fmtR(totals.wages)}</td>
                  <td className="px-5 py-2.5 text-[13px] font-semibold text-emerald-400 tabular-nums">{fmtR(totals.tips)}</td>
                  <td className="px-5 py-2.5 text-[13px] font-bold text-foreground tabular-nums">{fmtR(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </motion.div>

        {/* Day Performance Table */}
        <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.4 }} className="bg-card border border-border rounded-xl overflow-hidden" data-testid="day-performance-table">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Day Performance ({periodLabel})</span>
          </div>
          {dayPerf.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
              <p className="text-[15px] font-semibold text-foreground">No data for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Date', 'Day', 'Revenue', 'Staff Cost', 'Tables', 'Tabs', 'Result', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dayPerf.map(d => (
                    <tr key={d.date} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums">{d.label}</td>
                      <td className="px-5 py-3 text-[13px] font-medium text-foreground">{d.day}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-foreground">{fmtR(d.revenue)}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-muted-foreground">{fmtR(d.staffCost)}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-muted-foreground">{d.tables}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-muted-foreground">{d.tabs}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums font-semibold text-foreground">{fmtR(d.result)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${d.status === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* KPI Drill-Down Dialog */}
        <Dialog open={!!kpiDrill} onOpenChange={() => setKpiDrill(null)}>
          <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
            {kpiDrill === 'revenue' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Revenue &mdash; Detail</DialogTitle>
                  <DialogDescription>All transactions in the period:</DialogDescription>
                </DialogHeader>
                <table className="w-full mt-3">
                  <thead>
                    <tr className="border-b border-border">
                      {['Time', 'Table', 'Staff', 'Amount', 'Tips'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredTx.map(tx => (
                      <tr key={tx.id} className="text-[12px]">
                        <td className="px-3 py-2 text-muted-foreground tabular-nums">{new Date(tx.closedAt).toLocaleString('pt-BR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-3 py-2 text-foreground">#{tx.tableNumber}</td>
                        <td className="px-3 py-2 text-foreground">{tx.staffName}</td>
                        <td className="px-3 py-2 text-foreground tabular-nums font-medium">{fmtR2(tx.amount)}</td>
                        <td className="px-3 py-2 text-emerald-400 tabular-nums">{fmtR2(tx.tipsAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-border pt-3 mt-2 flex justify-between text-[13px]">
                  <span className="font-bold text-foreground">Total Revenue</span>
                  <span className="font-bold text-foreground tabular-nums">{fmtR(kpis.revenue)}</span>
                </div>
              </>
            )}
            {kpiDrill === 'tables' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Tables Closed &mdash; Detail</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-3">
                  <p className="text-[13px] text-foreground">Unique table sessions closed: <span className="font-bold">{kpis.tables}</span></p>
                  <p className="text-[13px] text-muted-foreground">Average ticket: <span className="font-medium text-foreground">{kpis.tables > 0 ? fmtR2(kpis.revenue / kpis.tables) : 'R$0'}</span></p>
                </div>
              </>
            )}
            {kpiDrill === 'staffCost' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Staff Cost (Wages) &mdash; Detail</DialogTitle>
                  <DialogDescription>Staff Cost = sum(hours_worked x hourly_rate). Tips excluded.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-3">
                  {staffEarnings.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-[13px] py-1.5">
                      <span className="text-foreground">{s.name} <span className="text-muted-foreground">({s.hours}h x R${s.hourlyRate})</span></span>
                      <span className="text-foreground tabular-nums font-medium">{fmtR(s.wages)}</span>
                    </div>
                  ))}
                  <div className="border-t-2 border-border pt-3 flex justify-between text-[13px]">
                    <span className="font-bold text-foreground">Total Staff Cost</span>
                    <span className="font-bold text-foreground tabular-nums">{fmtR(kpis.staffCost)}</span>
                  </div>
                </div>
              </>
            )}
            {kpiDrill === 'tips' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Tips &mdash; Detail</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-3">
                  {staffEarnings.filter(s => s.tips > 0).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-[13px] py-1.5">
                      <span className="text-foreground">{s.name}</span>
                      <span className="text-emerald-400 tabular-nums font-medium">{fmtR(s.tips)}</span>
                    </div>
                  ))}
                  <div className="border-t-2 border-border pt-3 flex justify-between text-[13px]">
                    <span className="font-bold text-emerald-400">Total Tips</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{fmtR(kpis.tips)}</span>
                  </div>
                </div>
              </>
            )}
            {kpiDrill === 'netResult' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Net Result &mdash; Detail</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-foreground">Revenue</span>
                    <span className="text-foreground tabular-nums font-medium">{fmtR(kpis.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-destructive">&minus; Staff Cost (Wages)</span>
                    <span className="text-destructive tabular-nums font-medium">{fmtR(kpis.staffCost)}</span>
                  </div>
                  <div className="border-t-2 border-border pt-3 flex justify-between">
                    <span className="text-[15px] font-semibold text-foreground">Net Result</span>
                    <span className={`text-[15px] font-semibold tabular-nums ${kpis.netResult >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>{fmtR(kpis.netResult)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Formula: Revenue ({fmtR(kpis.revenue)}) &minus; Staff Cost ({fmtR(kpis.staffCost)}) = {fmtR(kpis.netResult)}</p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Staff Detail Dialog */}
        <Dialog open={!!staffDetail} onOpenChange={() => setStaffDetail(null)}>
          <DialogContent className="max-w-[500px]">
            {staffDetail && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">{staffDetail.name}</DialogTitle>
                  <DialogDescription className="text-[12px] text-muted-foreground capitalize">{staffDetail.role} &middot; {periodLabel}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: 'Hourly Rate', value: `R$${staffDetail.hourlyRate}` },
                    { label: 'Hours Worked', value: `${staffDetail.hours}h` },
                    { label: 'Wages', value: fmtR(staffDetail.wages) },
                    { label: 'Tips Received', value: fmtR(staffDetail.tips) },
                  ].map(stat => (
                    <div key={stat.label} className="bg-card border border-border rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                      <p className="text-[20px] font-bold text-foreground mt-1 tabular-nums">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card border border-border rounded-lg p-4 mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Earnings</p>
                  <p className="text-[28px] font-bold text-foreground mt-1 tabular-nums">{fmtR(staffDetail.total)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Wages ({fmtR(staffDetail.wages)}) + Tips ({fmtR(staffDetail.tips)})</p>
                </div>
                {staffDetail.shifts.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shifts in Period</p>
                    <div className="space-y-1">
                      {staffDetail.shifts.map((sh, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px] py-1">
                          <span className="text-muted-foreground">{sh.date}</span>
                          <span className="text-foreground tabular-nums">{sh.hoursWorked}h</span>
                          <span className="text-foreground tabular-nums">{fmtR(sh.hoursWorked * staffDetail.hourlyRate)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {staffDetail.tipTx.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tips by Transaction</p>
                    <div className="space-y-1">
                      {staffDetail.tipTx.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-[12px] py-1">
                          <span className="text-muted-foreground">{new Date(tx.closedAt).toLocaleString('pt-BR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-foreground">Table #{tx.tableNumber}</span>
                          <span className="text-emerald-400 tabular-nums font-medium">{fmtR(tx.tipsAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

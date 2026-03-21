import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DollarSign, TrendingUp, BarChart3, Users, Clock } from 'lucide-react';
import { ownerEvents, eventHourlyRevenue } from '../../../data/ownerData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#FFFFFF', border: '1px solid #E6E8EC', borderRadius: '8px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', color: '#111827' }
};

const costBreakdown = [
  { name: 'Staff Wages', amount: 2800 },
  { name: 'Product Cost', amount: 1600 },
  { name: 'DJ / Entertainment', amount: 800 },
  { name: 'Supplies', amount: 400 },
  { name: 'Other', amount: 600 },
];
const totalCostAmount = costBreakdown.reduce((s, c) => s + c.amount, 0);
const maxCostAmount = Math.max(...costBreakdown.map(c => c.amount));

const staffData = [
  { name: 'Sarah M.', role: 'Bartender', shift: '6 PM – 2 AM', cost: 320 },
  { name: 'Jake R.', role: 'Bartender', shift: '6 PM – 2 AM', cost: 320 },
  { name: 'Mia T.', role: 'Server', shift: '7 PM – 1 AM', cost: 240 },
  { name: 'Leo W.', role: 'Server', shift: '7 PM – 1 AM', cost: 240 },
  { name: 'Ana P.', role: 'Host', shift: '8 PM – 12 AM', cost: 200 },
  { name: 'Tom K.', role: 'Security', shift: '8 PM – 2 AM', cost: 260 },
  { name: 'Nia C.', role: 'Barback', shift: '6 PM – 2 AM', cost: 200 },
];
const totalStaffCost = staffData.reduce((s, st) => s + st.cost, 0);

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = ownerEvents.find(e => e.id === eventId);

  if (!event) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Event not found</p>
    </div>
  );

  const kpiRow1 = [
    { label: 'Revenue', value: `$${event.revenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Profit', value: `$${event.profit.toLocaleString()}`, icon: TrendingUp },
    { label: 'Margin', value: `${event.margin}%`, icon: BarChart3 },
    { label: 'Avg Ticket', value: `$${event.avgTicket}`, icon: Users },
  ];

  const kpiRow2 = [
    { label: 'Guests', value: event.guests, icon: Users },
    { label: 'Total Costs', value: `$${event.totalCosts.toLocaleString()}`, icon: DollarSign },
    { label: 'Labor Cost', value: `$${event.laborCost.toLocaleString()}`, icon: Users },
    { label: 'Peak Hour', value: event.peakHour, icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="event-detail">

      {/* 1. KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiRow1.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4" data-testid={`event-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* 2. KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-[-8px]">
        {kpiRow2.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 + i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4" data-testid={`event-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* 3. Revenue by Hour */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}
        className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="event-hourly-chart">
        <SectionHeader icon={Clock} title="Revenue by Hour" subtitle="Hourly performance breakdown" />
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventHourlyRevenue}>
              <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 4. Cost Breakdown + Staff on Duty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4a. Cost Breakdown */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="cost-breakdown">
          <SectionHeader icon={BarChart3} title="Cost Breakdown" subtitle={`Total: $${totalCostAmount.toLocaleString()}`} />
          <div className="flex flex-col gap-3">
            {costBreakdown.map((c, i) => {
              const pct = Math.round((c.amount / totalCostAmount) * 100);
              const barPct = (c.amount / maxCostAmount) * 100;
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">{c.name}</span>
                  <div className="flex-1 h-7 rounded-md bg-[hsl(var(--muted)_/_0.4)] relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                      className="h-full rounded-md bg-blue-500/60"
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                      ${c.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 4b. Staff on Duty */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.17 }}
          className="rounded-xl border border-border bg-[hsl(var(--card))] p-5" data-testid="staff-on-duty">
          <SectionHeader icon={Users} title="Staff on Duty" subtitle={`${staffData.length} members · $${totalStaffCost.toLocaleString()} total`} />
          <div className="flex flex-col gap-2">
            {staffData.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[hsl(var(--muted)_/_0.3)]" data-testid={`staff-${i}`}>
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[hsl(var(--primary))]">{s.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.role} &middot; {s.shift}</p>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums shrink-0">${s.cost}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

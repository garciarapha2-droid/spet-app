import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Users } from 'lucide-react';
import { tableAssignments, operationalStaff } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const statusColors = {
  occupied: { dot: 'bg-[hsl(var(--success))]', text: 'text-[hsl(var(--success))]' },
  free: { dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
  reserved: { dot: 'bg-[hsl(var(--warning))]', text: 'text-[hsl(var(--warning))]' },
  unassigned: { dot: 'bg-[hsl(var(--danger))]', text: 'text-[hsl(var(--danger))]' },
};

export default function TablesByServer() {
  const unassigned = tableAssignments.filter(t => !t.server || t.status === 'unassigned');
  const openTables = tableAssignments.filter(t => !t.server || t.status === 'free' || t.status === 'unassigned');

  const serverNames = [...new Set(operationalStaff.filter(s => s.role === 'server' || s.role === 'bartender').map(s => s.name))];
  const serverColumns = serverNames.map(name => ({
    name,
    tables: tableAssignments.filter(t => t.server === name && t.status !== 'free'),
  }));

  return (
    <div className="flex flex-col gap-4" data-testid="tables-by-server-page">
      {/* Unassigned Alert */}
      {unassigned.length > 0 && (
        <motion.div
          {...fadeUp}
          className="rounded-xl border p-4 border-[hsl(var(--danger)_/_0.2)] bg-[hsl(var(--danger)_/_0.05)]"
          data-testid="unassigned-alert"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--danger))]" />
            <span className="text-sm font-semibold text-foreground">
              {unassigned.length} unassigned table{unassigned.length > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              — Tables {unassigned.map(t => `#${t.tableNumber}`).join(', ')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {/* Open Column */}
        <motion.div {...fadeUp} className="min-w-[240px] w-[260px] shrink-0">
          <div className="rounded-t-xl px-3 py-2.5 bg-[hsl(var(--muted)_/_0.6)] border-2 border-[hsl(var(--border)_/_0.8)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Open</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-muted-foreground">
                {openTables.length}
              </span>
            </div>
          </div>
          <div className="border-2 border-t-0 border-[hsl(var(--border)_/_0.8)] bg-[hsl(var(--card)_/_0.5)] shadow-sm rounded-b-xl p-2 min-h-[120px] flex flex-col gap-2">
            {openTables.map((t, i) => (
              <TableCard key={t.id} table={t} delay={i * 0.03} />
            ))}
          </div>
        </motion.div>

        {/* Server Columns */}
        {serverColumns.map((col, ci) => (
          <motion.div key={col.name} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + ci * 0.05 }} className="min-w-[240px] w-[260px] shrink-0">
            <div className="rounded-t-xl px-3 py-2.5 bg-[hsl(var(--primary)_/_0.1)] border-2 border-[hsl(var(--border)_/_0.8)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{col.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-muted-foreground">
                    {col.tables.length}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]">
                    ${col.tables.reduce((sum, t) => sum + t.revenue, 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-2 border-t-0 border-[hsl(var(--border)_/_0.8)] bg-[hsl(var(--card)_/_0.5)] shadow-sm rounded-b-xl p-2 min-h-[120px] flex flex-col gap-2">
              {col.tables.map((t, i) => (
                <TableCard key={t.id} table={t} delay={0.15 + i * 0.03} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TableCard({ table, delay = 0 }) {
  const sc = statusColors[table.status] || statusColors.free;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="border-2 border-[hsl(var(--border)_/_0.7)] bg-[hsl(var(--card))] p-3 rounded-lg shadow-sm hover:border-[hsl(var(--primary)_/_0.3)] transition-colors"
      data-testid={`table-card-${table.tableNumber}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-foreground">Table #{table.tableNumber}</span>
        <span className={`flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {table.status}
        </span>
      </div>
      {table.guests > 0 && <p className="text-xs text-muted-foreground">{table.guests} guest{table.guests > 1 ? 's' : ''}</p>}
      {table.openedAt && <p className="text-xs text-muted-foreground">Opened {table.openedAt}</p>}
      {table.revenue > 0 && <p className="text-xs font-semibold text-[hsl(var(--success))] tabular-nums mt-1">${table.revenue}</p>}
    </motion.div>
  );
}

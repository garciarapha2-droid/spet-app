import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Users, Plus, Star, Edit2, Trash2 } from 'lucide-react';
import { systemUsers, operationalStaff } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const roleBadgeColors = {
  owner: 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]',
  admin: 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]',
  manager: 'bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]',
  bartender: 'bg-[hsl(var(--accent)_/_0.15)] text-[hsl(var(--accent))]',
  server: 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]',
  cashier: 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]',
  host: 'bg-[hsl(var(--accent)_/_0.15)] text-[hsl(var(--accent))]',
  busser: 'bg-[hsl(var(--muted))] text-muted-foreground',
};

const statusColors = {
  active: 'bg-[hsl(var(--success)_/_0.15)] text-[hsl(var(--success))]',
  trial: 'bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))]',
  canceled: 'bg-[hsl(var(--danger)_/_0.15)] text-[hsl(var(--danger))]',
};

export default function StaffRoles() {
  return (
    <div className="space-y-6" data-testid="staff-roles-page">
      {/* System Users */}
      <motion.div {...fadeUp} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">System Users</p>
        </div>
        <div className="space-y-2">
          {systemUsers.map((u, i) => (
            <motion.div
              key={u.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.03 }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{u.email}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColors[u.role] || ''}`}>
                {u.role}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[u.status] || ''}`}>
                {u.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Operational Staff */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Operational Staff</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-colors" data-testid="add-staff-btn">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </div>
        <div className="space-y-1">
          {operationalStaff.map((s, i) => (
            <motion.div
              key={s.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.03 }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors group"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                s.isTopPerformer ? 'ring-2 ring-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'
              }`}>
                {s.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  {s.isTopPerformer && <Star className="h-3 w-3 text-[hsl(var(--warning))]" fill="hsl(var(--warning))" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{s.shifts.join(', ')}</span>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColors[s.role] || ''}`}>
                {s.role}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">${s.revenue}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors" data-testid={`edit-staff-${s.id}`}>
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-[hsl(var(--danger)_/_0.1)] transition-colors" data-testid={`delete-staff-${s.id}`}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-[hsl(var(--danger))]" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

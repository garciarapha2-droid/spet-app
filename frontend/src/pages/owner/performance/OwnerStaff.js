import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Search, Plus, Pencil, RotateCcw, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { staffMembers as initialStaff, ownerSystemUsers, venues } from '../../../data/ownerShiftStaffData';

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

const roleBadgeColors = {
  owner: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  manager: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  bartender: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  waiter: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  host: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  cook: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  dj: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  security: 'bg-red-500/15 text-red-400 border-red-500/20',
  cashier: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  cleaner: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

const statusColors = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const avatarPalette = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-pink-600', 'bg-cyan-600', 'bg-rose-600', 'bg-indigo-600'];
const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
};
const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const emptyForm = { fullName: '', email: '', phone: '', role: 'waiter', venueId: '', hourlyRate: '', fixedSalary: '' };

export default function OwnerStaff() {
  const [staffList, setStaffList] = useState(initialStaff);
  const [search, setSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    let list = staffList;
    if (venueFilter !== 'all') list = list.filter(s => s.venueId === venueFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    return list;
  }, [staffList, search, venueFilter]);

  const filteredSystem = useMemo(() => {
    if (!search) return ownerSystemUsers;
    const q = search.toLowerCase();
    return ownerSystemUsers.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [search]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({ fullName: s.fullName, email: s.email, phone: s.phone || '', role: s.role, venueId: s.venueId || '', hourlyRate: s.hourlyRate?.toString() || '', fixedSalary: s.fixedSalary?.toString() || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.fullName || !form.email) { toast.error('Name and email are required'); return; }
    const venue = venues.find(v => v.id === form.venueId);
    const data = { ...form, hourlyRate: parseFloat(form.hourlyRate) || 0, fixedSalary: parseFloat(form.fixedSalary) || null, venueName: venue?.name || '', isActive: true };
    if (editingId) {
      setStaffList(prev => prev.map(s => s.id === editingId ? { ...s, ...data } : s));
      toast.success('Staff updated');
    } else {
      setStaffList(prev => [...prev, { ...data, id: `sm-${Date.now()}` }]);
      toast.success('Staff added');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
    toast.success('Staff removed');
  };

  const updateField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-6" data-testid="owner-staff-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & Roles</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Manage your team members and their roles</p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 text-[13px] h-9 px-4 text-white hover:translate-y-[-1px] hover:scale-[1.03] transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, hsl(258 75% 58%), hsl(263 80% 66%))' }}
          data-testid="add-staff-btn"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Add Staff
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="pl-9 h-9 text-[13px]"
            data-testid="staff-search"
          />
        </div>
        <Select value={venueFilter} onValueChange={setVenueFilter}>
          <SelectTrigger className="w-[160px] h-9 text-[13px]" data-testid="venue-filter">
            <SelectValue placeholder="All Venues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Venues</SelectItem>
            {venues.map(v => <SelectItem key={v.id} value={v.id} className="text-[13px]">{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* System Users */}
      <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="bg-card border border-border rounded-xl overflow-hidden" data-testid="system-users-section">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">System Users</span>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{filteredSystem.length} members</span>
        </div>
        <div className="divide-y divide-border">
          {filteredSystem.map(u => (
            <div key={u.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors duration-150">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white leading-none ${getAvatarColor(u.fullName)}`}>
                {getInitials(u.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-foreground truncate">{u.fullName}</span>
                  <span className="text-[11px] text-muted-foreground hidden md:inline">&middot; {u.venueName}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[12px] text-muted-foreground truncate">{u.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize border ${roleBadgeColors[u.role] || ''}`}>{u.role}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${u.isActive ? statusColors.active : statusColors.inactive}`}>{u.isActive ? 'active' : 'inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Operational Staff */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }} className="bg-card border border-border rounded-xl overflow-hidden" data-testid="operational-staff-section">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Operational Staff</span>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{filtered.length} members</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-[15px] font-semibold text-foreground">No staff members</p>
            <p className="text-[13px] text-muted-foreground mt-1">{search ? 'No results match your search' : 'Add your first team member to get started'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(s => (
              <div key={s.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors duration-150" data-testid={`staff-${s.id}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white leading-none ${getAvatarColor(s.fullName)}`}>
                  {getInitials(s.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-medium text-foreground truncate">{s.fullName}</span>
                    <span className="text-[11px] text-muted-foreground hidden md:inline">&middot; {s.venueName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[12px] text-muted-foreground truncate">{s.email}</span>
                  </div>
                </div>
                <span className="text-[13px] text-muted-foreground tabular-nums hidden sm:block">R${s.hourlyRate}/hr</span>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize border ${roleBadgeColors[s.role] || ''}`}>{s.role}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${s.isActive ? statusColors.active : statusColors.inactive}`}>{s.isActive ? 'active' : 'inactive'}</span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-muted transition-colors" data-testid={`edit-staff-${s.id}`}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" data-testid={`delete-staff-${s.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingId ? 'Edit Staff Member' : 'New Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Full Name *</Label>
              <Input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="João Silva" className="mt-1.5 h-9 text-[13px]" data-testid="form-name" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Email *</Label>
              <Input value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="joao@venue.com" className="mt-1.5 h-9 text-[13px]" data-testid="form-email" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Phone</Label>
              <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+55 11 99999-0000" className="mt-1.5 h-9 text-[13px]" data-testid="form-phone" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Role</Label>
              <Select value={form.role} onValueChange={v => updateField('role', v)}>
                <SelectTrigger className="mt-1.5 h-9 text-[13px]" data-testid="form-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['manager', 'bartender', 'waiter', 'host', 'cook', 'dj', 'security', 'cashier', 'cleaner'].map(r => (
                    <SelectItem key={r} value={r} className="text-[13px] capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Venue</Label>
              <Select value={form.venueId} onValueChange={v => updateField('venueId', v)}>
                <SelectTrigger className="mt-1.5 h-9 text-[13px]" data-testid="form-venue"><SelectValue placeholder="Select venue" /></SelectTrigger>
                <SelectContent>
                  {venues.map(v => <SelectItem key={v.id} value={v.id} className="text-[13px]">{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Hourly Rate (R$)</Label>
              <Input type="number" value={form.hourlyRate} onChange={e => updateField('hourlyRate', e.target.value)} placeholder="25.00" className="mt-1.5 h-9 text-[13px]" data-testid="form-rate" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Fixed Salary (R$)</Label>
              <Input type="number" value={form.fixedSalary} onChange={e => updateField('fixedSalary', e.target.value)} placeholder="2500.00" className="mt-1.5 h-9 text-[13px]" data-testid="form-salary" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="outline" className="h-9 text-[13px]" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              className="h-9 text-[13px] text-white"
              style={{ background: 'linear-gradient(135deg, hsl(258 75% 58%), hsl(263 80% 66%))' }}
              data-testid="form-save"
            >
              {editingId ? 'Save Changes' : 'Add Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

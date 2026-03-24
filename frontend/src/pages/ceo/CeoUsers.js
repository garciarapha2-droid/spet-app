import { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { KpiCard } from '../../components/ceo/KpiCard';
import { PeriodFilter } from '../../components/ceo/PeriodFilter';
import { ChartCard } from '../../components/ceo/ChartCard';
import { DrillDownSheet, BreakdownDrillDown } from '../../components/ceo/DrillDownSheet';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, PieChart, Pie, Cell } from 'recharts';
import { usersKpis, customers, allModules, customerEvents } from '../../data/ceoData';

const planBadge = {
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  starter: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
};

const statusColors = {
  active: 'text-[#1FAA6B]',
  trial: 'text-[#F59F00]',
  past_due: 'text-[#E03131]',
  cancelled: 'text-muted-foreground',
};

const statusDot = {
  active: 'bg-[#1FAA6B]',
  trial: 'bg-[#F59F00]',
  past_due: 'bg-[#E03131]',
  cancelled: 'bg-muted-foreground',
};

const statusLabel = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
};

// Derived chart data
const planDistribution = [
  { name: 'Enterprise', value: customers.filter(c => c.plan === 'enterprise').length, color: '#7C3AED' },
  { name: 'Pro', value: customers.filter(c => c.plan === 'pro').length, color: '#3B82F6' },
  { name: 'Starter', value: customers.filter(c => c.plan === 'starter').length, color: '#06B6D4' },
];

const statusDistribution = [
  { name: 'Active', value: customers.filter(c => c.status === 'active').length, color: '#1FAA6B' },
  { name: 'Trial', value: customers.filter(c => c.status === 'trial').length, color: '#F59F00' },
  { name: 'Past Due', value: customers.filter(c => c.status === 'past_due').length, color: '#E03131' },
];

const mrrByPlan = [
  { plan: 'Enterprise', mrr: customers.filter(c => c.plan === 'enterprise').reduce((s, c) => s + c.mrr, 0) },
  { plan: 'Pro', mrr: customers.filter(c => c.plan === 'pro').reduce((s, c) => s + c.mrr, 0) },
  { plan: 'Starter', mrr: customers.filter(c => c.plan === 'starter').reduce((s, c) => s + c.mrr, 0) },
];

export default function CeoUsers() {
  const [period, setPeriod] = useState('month');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('mrr');
  const [sortDir, setSortDir] = useState('desc');
  const [drill, setDrill] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.company.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q)
      );
    }

    if (filterPlan !== 'all') list = list.filter(c => c.plan === filterPlan);
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [search, filterPlan, filterStatus, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const handleKpiClick = (key) => setDrill(key);

  const drillContent = () => {
    if (selectedCustomer) {
      const c = selectedCustomer;
      const events = customerEvents.filter(e => e.customerId === c.id);
      return (
        <DrillDownSheet open title={c.company} subtitle={`${c.name} — ${c.contact}`} onClose={() => setSelectedCustomer(null)}>
          <div className="space-y-5">
            {/* Customer details */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Plan', value: c.plan.charAt(0).toUpperCase() + c.plan.slice(1) },
                { label: 'MRR', value: `$${c.mrr}` },
                { label: 'Status', value: statusLabel[c.status] || c.status },
                { label: 'Modules', value: `${c.modules} / ${allModules.length}` },
                { label: 'Signup', value: c.signup },
                { label: 'Payment', value: c.payment || 'N/A' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                  <p className="text-[14px] font-medium text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Activity log */}
            {events.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Activity Log</p>
                <div className="space-y-2">
                  {events.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 text-[13px]">
                      <span className="text-muted-foreground whitespace-nowrap">{e.date}</span>
                      <span className="text-foreground">{e.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrillDownSheet>
      );
    }

    switch (drill) {
      case 'totalUsers':
        return (
          <DrillDownSheet open title="Total Users — Breakdown" subtitle="Users by plan and status" onClose={() => setDrill(null)}>
            <BreakdownDrillDown
              items={[
                { label: 'Enterprise', value: `${customers.filter(c => c.plan === 'enterprise').length}` },
                { label: 'Pro', value: `${customers.filter(c => c.plan === 'pro').length}` },
                { label: 'Starter', value: `${customers.filter(c => c.plan === 'starter').length}` },
              ]}
              total="39"
              totalLabel="Total Users"
            />
          </DrillDownSheet>
        );
      case 'paidActive':
        return (
          <DrillDownSheet open title="Paid & Active — Breakdown" subtitle="Revenue contribution by plan" onClose={() => setDrill(null)}>
            <BreakdownDrillDown
              items={[
                { label: 'Enterprise (7)', value: `$${customers.filter(c => c.plan === 'enterprise' && c.status === 'active').reduce((s, c) => s + c.mrr, 0).toLocaleString()}` },
                { label: 'Pro (14)', value: `$${customers.filter(c => c.plan === 'pro' && c.status === 'active').reduce((s, c) => s + c.mrr, 0).toLocaleString()}` },
                { label: 'Starter (11)', value: `$${customers.filter(c => c.plan === 'starter' && c.status === 'active').reduce((s, c) => s + c.mrr, 0).toLocaleString()}` },
              ]}
              total={`$${customers.filter(c => c.status === 'active').reduce((s, c) => s + c.mrr, 0).toLocaleString()}`}
              totalLabel="Total Active MRR"
            />
          </DrillDownSheet>
        );
      case 'trial':
        return (
          <DrillDownSheet open title="Trial Users" subtitle="Customers currently in trial period" onClose={() => setDrill(null)} count={customers.filter(c => c.status === 'trial').length}>
            <div className="space-y-2">
              {customers.filter(c => c.status === 'trial').map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{c.company}</p>
                    <p className="text-[12px] text-muted-foreground">{c.name} — {c.contact}</p>
                  </div>
                  <span className="text-[12px] text-muted-foreground">Since {c.signup}</span>
                </div>
              ))}
            </div>
          </DrillDownSheet>
        );
      case 'pastDue':
        return (
          <DrillDownSheet open title="Past Due Accounts" subtitle="Accounts with payment issues" onClose={() => setDrill(null)} count={customers.filter(c => c.status === 'past_due').length}>
            <div className="space-y-2">
              {customers.filter(c => c.status === 'past_due').map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{c.company}</p>
                    <p className="text-[12px] text-muted-foreground">{c.payment}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#E03131]">${c.mrr}/mo at risk</span>
                </div>
              ))}
            </div>
          </DrillDownSheet>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="ceo-users">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] leading-[1.08] text-foreground">Users & Subscribers</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Customer base overview, subscription health, and account management</p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="users-kpis">
        {usersKpis.map(kpi => (
          <KpiCard
            key={kpi.key}
            icon={kpi.icon}
            color={kpi.color}
            value={kpi.value}
            label={kpi.label}
            onClick={() => handleKpiClick(kpi.key)}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Users by Plan" subtitle="Distribution across plan tiers">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {planDistribution.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 -mt-2">
            {planDistribution.map(r => (
              <div key={r.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-[12px] text-muted-foreground">{r.name} ({r.value})</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="MRR by Plan" subtitle="Revenue contribution per tier">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mrrByPlan} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="plan" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={80} />
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} formatter={v => [`$${v.toLocaleString()}`, 'MRR']} />
              <Bar dataKey="mrr" fill="#7C3AED" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Distribution" subtitle="Account health overview">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {statusDistribution.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 -mt-2">
            {statusDistribution.map(r => (
              <div key={r.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-[12px] text-muted-foreground">{r.name} ({r.value})</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Customer Table */}
      <div className="bg-card border border-border rounded-[12px]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} data-testid="users-table">
        {/* Table Header */}
        <div className="p-5 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search company, name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                data-testid="users-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                data-testid="filter-plan"
              >
                <option value="all">All Plans</option>
                <option value="enterprise">Enterprise</option>
                <option value="pro">Pro</option>
                <option value="starter">Starter</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                data-testid="filter-status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground">{filteredCustomers.length} of {customers.length} users</span>
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground hover:bg-muted transition-colors" data-testid="export-csv">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="users-data-table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { key: 'company', label: 'Company' },
                  { key: 'name', label: 'Contact' },
                  { key: 'plan', label: 'Plan' },
                  { key: 'mrr', label: 'MRR' },
                  { key: 'status', label: 'Status' },
                  { key: 'modules', label: 'Modules' },
                  { key: 'signup', label: 'Signup Date' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-4 py-3 text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredCustomers.map(customer => (
                <tr
                  key={customer.id}
                  className="group hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                  data-testid={`user-row-${customer.id}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-foreground">{customer.company}</p>
                    <p className="text-[12px] text-muted-foreground">{customer.contact}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{customer.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold capitalize rounded-[6px] px-2 py-0.5 ${planBadge[customer.plan] || ''}`}>
                      {customer.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-foreground tabular-nums">
                    ${customer.mrr}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[customer.status]}`} />
                      <span className={`text-[12px] font-medium ${statusColors[customer.status]}`}>
                        {statusLabel[customer.status] || customer.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground tabular-nums">
                    {customer.modules} / {allModules.length}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{customer.signup}</td>
                  <td className="px-4 py-3">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[14px] text-muted-foreground">No users match your filters</p>
          </div>
        )}
      </div>

      {/* Drill-Downs */}
      {drillContent()}
    </div>
  );
}

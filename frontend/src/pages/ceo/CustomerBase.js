import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Users } from 'lucide-react';
import { useCustomers } from '../../hooks/useCrmData';
import { CrmDetailDialog } from '../../components/ceo/CrmDetailDialog';
import { getPlanName } from '../../services/crmService';

const statusBadge = {
  active: 'bg-green-500/10 text-green-500',
  paused: 'bg-amber-500/10 text-amber-500',
  churned: 'bg-red-500/10 text-red-500',
};

const statusDot = {
  active: 'bg-green-500',
  paused: 'bg-amber-500',
  churned: 'bg-red-500',
};

const planBadge = {
  os: 'bg-primary/15 text-primary',
  sync: 'bg-primary/10 text-primary',
  flow: 'bg-blue-500/10 text-blue-400',
  core: 'bg-muted text-muted-foreground',
};

export default function CustomerBase() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Build API filters
  const apiFilters = useMemo(() => {
    const f = {};
    if (filterStatus) f.status = filterStatus;
    if (filterPlan) f.plan_id = filterPlan;
    if (search.length >= 2) f.search = search;
    return f;
  }, [filterStatus, filterPlan, search]);

  const { customers, loading, refetch } = useCustomers(apiFilters);

  // Update filter when URL param changes
  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setFilterStatus(s);
  }, [searchParams]);

  return (
    <div className="space-y-6" data-testid="customer-base">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Customer Base</h1>
          <p className="text-[13px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live data
          </p>
        </div>
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border/40 bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="customer-search"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border/40 bg-background text-[13px] text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-testid="filter-plan"
        >
          <option value="">All Plans</option>
          <option value="core">Core</option>
          <option value="flow">Flow</option>
          <option value="sync">Sync</option>
          <option value="os">OS</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border/40 bg-background text-[13px] text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-testid="filter-status"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
        {filterStatus && (
          <button onClick={() => setFilterStatus('')} className="text-[12px] text-primary hover:underline">
            Clear filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} data-testid="customer-table-card">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-[13px] text-muted-foreground mt-3">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-[14px] text-foreground mt-3">No customers found</p>
            <p className="text-[12px] text-muted-foreground mt-1">Closed deals will appear here automatically</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="customer-data-table">
              <thead>
                <tr className="border-b border-border">
                  {['Company', 'Contact', 'Plan', 'MRR', 'Status', 'Modules', 'Signup'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="h-14 border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors group"
                    data-testid={`customer-row-${c.id}`}
                  >
                    <td className="px-4">
                      <p className="text-[14px] font-medium text-foreground">{c.company_name}</p>
                      <p className="text-[12px] text-muted-foreground">{c.contact_email}</p>
                    </td>
                    <td className="px-4 text-[13px] text-foreground">{c.contact_name}</td>
                    <td className="px-4">
                      <span className={`text-[11px] font-medium rounded px-2 py-0.5 ${planBadge[c.plan_id] || 'bg-primary/10 text-primary'}`}>
                        {getPlanName(c.plan_id)}
                      </span>
                    </td>
                    <td className="px-4 font-mono text-[13px] font-semibold text-foreground tabular-nums">${c.mrr}</td>
                    <td className="px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[c.status] || 'bg-muted-foreground'}`} />
                        <span className="text-[12px] font-medium capitalize">{c.status}</span>
                      </span>
                    </td>
                    <td className="px-4 text-[13px] text-muted-foreground tabular-nums">
                      {(c.modules_enabled || []).length} / 8
                    </td>
                    <td className="px-4 text-[13px] text-muted-foreground">{c.signup_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <CrmDetailDialog
        item={selectedCustomer}
        mode="customer"
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onRefresh={refetch}
      />
    </div>
  );
}

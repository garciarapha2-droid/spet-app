import { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useCustomers } from '../../hooks/useCrmData';
import { CrmDetailDialog } from '../../components/ceo/CrmDetailDialog';
import { getPlanName } from '../../services/crmService';

const planBadge = {
  os: 'bg-primary/15 text-primary',
  sync: 'bg-primary/10 text-primary',
  flow: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400',
  core: 'bg-muted text-muted-foreground',
};

const statusDot = {
  active: 'bg-[#1FAA6B]',
  paused: 'bg-[#F59F00]',
  churned: 'bg-[#E03131]',
};

const statusLabel = {
  active: 'Active',
  paused: 'Paused',
  churned: 'Churned',
};

const statusColor = {
  active: 'text-[#1FAA6B]',
  paused: 'text-[#F59F00]',
  churned: 'text-[#E03131]',
};

export default function CeoUsers() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('mrr');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const apiFilters = useMemo(() => {
    const f = {};
    if (search.length >= 2) f.search = search;
    return f;
  }, [search]);

  const { customers, loading, refetch } = useCustomers(apiFilters);

  const filtered = useMemo(() => {
    let list = [...customers];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [customers, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const columns = [
    { key: 'company_name', label: 'Company' },
    { key: 'contact_name', label: 'Contact' },
    { key: 'plan_id', label: 'Plan' },
    { key: 'mrr', label: 'MRR' },
    { key: 'status', label: 'Status' },
    { key: 'modules_enabled', label: 'Modules' },
    { key: 'signup_date', label: 'Signup' },
  ];

  return (
    <div className="space-y-6" data-testid="ceo-users">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-foreground">Users & Subscribers</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Manage customer accounts, plans and module access</p>
      </div>

      {/* Table Card */}
      <div className="bg-card border border-border rounded-xl" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} data-testid="users-table-card">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search company, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              data-testid="users-search"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground">{filtered.length} of {customers.length} users</span>
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground hover:bg-muted transition-colors" data-testid="export-btn">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]" data-testid="users-data-table">
            <thead>
              <tr className="border-b border-border">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.key} />
                    </span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="py-12 text-center text-[13px] text-muted-foreground">Loading...</td></tr>
              ) : filtered.map(customer => (
                <tr
                  key={customer.id}
                  className="group h-12 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                  data-testid={`user-row-${customer.id}`}
                >
                  <td className="px-4 py-2.5">
                    <p className="text-[14px] font-medium text-foreground leading-tight">{customer.company_name}</p>
                    <p className="text-[12px] text-muted-foreground">{customer.contact_email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-foreground">{customer.contact_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${planBadge[customer.plan_id] || 'bg-muted text-muted-foreground'}`}>
                      {getPlanName(customer.plan_id)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-foreground tabular-nums">
                    ${customer.mrr}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[customer.status] || 'bg-muted-foreground'}`} />
                      <span className={`text-[12px] font-medium ${statusColor[customer.status] || 'text-muted-foreground'}`}>
                        {statusLabel[customer.status] || customer.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-muted-foreground tabular-nums">
                    {(customer.modules_enabled || []).length} / 8
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-muted-foreground">
                    {customer.signup_date ? new Date(customer.signup_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-muted-foreground">No users match your search</p>
          </div>
        )}
      </div>

      {/* Detail Dialog — CrmDetailDialog in customer mode */}
      <CrmDetailDialog
        item={selectedCustomer}
        mode="customer"
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onRefresh={() => { setSelectedCustomer(null); refetch(); }}
      />
    </div>
  );
}

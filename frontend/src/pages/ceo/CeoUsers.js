import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Download, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getCustomers, getPlanName, PLANS } from '../../services/ceoService';
import { CustomerDetailDialog } from '../../components/ceo/CustomerDetailDialog';

const planBadge = {
  os: 'bg-primary/15 text-primary',
  sync: 'bg-primary/10 text-primary',
  flow: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400',
  core: 'bg-muted text-muted-foreground',
};

const statusDot = {
  active: 'bg-[#1FAA6B]',
  trial: 'bg-[#F59F00]',
  past_due: 'bg-[#E03131]',
  churned: 'bg-muted-foreground',
};

const statusLabel = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past Due',
  churned: 'Churned',
};

const statusColor = {
  active: 'text-[#1FAA6B]',
  trial: 'text-[#F59F00]',
  past_due: 'text-[#E03131]',
  churned: 'text-muted-foreground',
};

export default function CeoUsers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('mrr');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadCustomers = useCallback(async () => {
    const data = await getCustomers();
    setCustomers(data);
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = useMemo(() => {
    let list = [...customers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.company.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [customers, search, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const handleCustomerUpdate = (updated) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedCustomer(updated);
  };

  const columns = [
    { key: 'company', label: 'Company' },
    { key: 'name', label: 'Contact' },
    { key: 'plan', label: 'Plan' },
    { key: 'mrr', label: 'MRR' },
    { key: 'status', label: 'Status' },
    { key: 'modules', label: 'Modules', sortKey: 'modules' },
    { key: 'signup', label: 'Signup' },
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
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-[320px]">
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
          <table className="w-full" data-testid="users-data-table">
            <thead>
              <tr className="border-b border-border">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.sortKey || col.key)}
                    className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.sortKey || col.key} />
                    </span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(customer => (
                <tr
                  key={customer.id}
                  className="group h-12 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                  data-testid={`user-row-${customer.id}`}
                >
                  <td className="px-4 py-2.5">
                    <p className="text-[14px] font-medium text-foreground leading-tight">{customer.company}</p>
                    <p className="text-[12px] text-muted-foreground">{customer.email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-foreground">{customer.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${planBadge[customer.plan] || 'bg-muted text-muted-foreground'}`}>
                      {getPlanName(customer.plan)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-foreground tabular-nums">
                    ${customer.mrr}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[customer.status]}`} />
                      <span className={`text-[12px] font-medium ${statusColor[customer.status]}`}>
                        {statusLabel[customer.status] || customer.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-muted-foreground tabular-nums">
                    {customer.modules.length} / 8
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{customer.signup}</td>
                  <td className="px-4 py-2.5">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-muted-foreground">No users match your search</p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <CustomerDetailDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdate={handleCustomerUpdate}
      />
    </div>
  );
}

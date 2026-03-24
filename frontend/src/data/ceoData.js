// CEO OS — Mock Data (v1.0)
// Currency: USD ($) | Locale: en-US
// Architecture ready for backend swap

// ─── Revenue Targets ───
export const revenueTargets = {
  weekly:  { current: 0, target: 15000 },
  monthly: { current: 7741, target: 60000 },
  annual:  { current: 7741, target: 0 },
};

// ─── Customers (39 total) ───
// 32 active, 5 trial, 2 past_due
// MRR from active+past_due = $7,741
const genCustomers = () => {
  const ent = [
    { company: 'Nexus Global Entertainment', contact: 'john@nexus.com', name: 'John Smith', mrr: 724, modules: 8, signup: '2025-08-15', payment: 'Visa ****4242' },
    { company: 'Platinum Nightlife Group', contact: 'sarah@platinum.com', name: 'Sarah Chen', mrr: 499, modules: 8, signup: '2025-09-01', payment: 'MC ****8821' },
    { company: 'Meridian Hospitality Corp', contact: 'mike@meridian.com', name: 'Mike Torres', mrr: 499, modules: 7, signup: '2025-10-10', payment: 'Visa ****3310' },
    { company: 'Stellar Events International', contact: 'emma@stellar.com', name: 'Emma Davis', mrr: 499, modules: 8, signup: '2025-11-20', payment: 'Amex ****1005' },
    { company: 'Crown Venue Holdings', contact: 'david@crown.com', name: 'David Kim', mrr: 499, modules: 7, signup: '2025-12-01', payment: 'Visa ****5567' },
    { company: 'Apex Lounge Empire', contact: 'lisa@apex.com', name: 'Lisa Wang', mrr: 499, modules: 8, signup: '2026-01-05', payment: 'MC ****2290' },
    { company: 'Royal Night Group', contact: 'james@royal.com', name: 'James Brown', mrr: 499, modules: 6, signup: '2026-01-18', payment: 'Visa ****7744' },
  ].map((c, i) => ({ id: `c${i + 1}`, ...c, plan: 'enterprise', status: 'active' }));

  const pro = [
    { company: 'Blue Wave Bar', contact: 'anna@bluewave.com', name: 'Anna Lee' },
    { company: 'Sunset Terrace', contact: 'tom@sunset.com', name: 'Tom Garcia' },
    { company: 'Metro Club', contact: 'nina@metro.com', name: 'Nina Patel' },
    { company: 'Urban Edge', contact: 'ryan@urban.com', name: 'Ryan Costa' },
    { company: 'Neon District', contact: 'mia@neon.com', name: 'Mia Johnson' },
    { company: 'Velvet Room', contact: 'alex@velvet.com', name: 'Alex Turner' },
    { company: 'Crystal Lounge', contact: 'sofia@crystal.com', name: 'Sofia Reyes' },
    { company: 'Silver Moon', contact: 'chris@silver.com', name: 'Chris Park' },
    { company: 'Gold Rush Bar', contact: 'diana@gold.com', name: 'Diana Cruz' },
    { company: 'The Basement', contact: 'mark@basement.com', name: 'Mark Wilson' },
    { company: 'Cloud Nine', contact: 'julia@cloud.com', name: 'Julia Ferreira' },
    { company: 'Electric Avenue', contact: 'lucas@electric.com', name: 'Lucas Almeida' },
    { company: 'Midnight Express', contact: 'kate@midnight.com', name: 'Kate Murphy' },
    { company: 'The Rooftop', contact: 'ben@rooftop.com', name: 'Ben Cooper' },
  ].map((c, i) => ({ id: `c${i + 8}`, ...c, plan: 'pro', mrr: 199, status: 'active', modules: 6, signup: `2026-0${1 + (i % 3)}-${10 + i}`, payment: 'Visa ****' + (1000 + i) }));

  const starter = [
    { company: 'Corner Pub', contact: 'pat@corner.com', name: 'Pat Miller' },
    { company: 'Little Italy', contact: 'gina@little.com', name: 'Gina Romano' },
    { company: 'The Garden', contact: 'sam@garden.com', name: 'Sam Reed' },
    { company: 'Jazz Corner', contact: 'miles@jazz.com', name: 'Miles Davis Jr' },
    { company: 'Craft House', contact: 'dan@craft.com', name: 'Dan Foster' },
    { company: 'The Barrel', contact: 'amy@barrel.com', name: 'Amy Chen' },
    { company: 'Brew Brothers', contact: 'joe@brew.com', name: 'Joe Martinez' },
    { company: 'The Pint', contact: 'meg@pint.com', name: 'Meg Taylor' },
    { company: 'Hop House', contact: 'ian@hop.com', name: 'Ian Blake' },
    { company: 'Ale Works', contact: 'zoe@ale.com', name: 'Zoe Adams' },
    { company: 'Draft Kings Bar', contact: 'leo@draft.com', name: 'Leo Vance' },
  ].map((c, i) => ({ id: `c${i + 22}`, ...c, plan: 'starter', mrr: 49, status: 'active', modules: 3, signup: `2026-02-${5 + i}`, payment: 'Visa ****' + (3000 + i) }));

  const trial = [
    { company: 'New Venture', contact: 'pedro@newventure.com', name: 'Pedro Souza' },
    { company: 'Startup Hub', contact: 'clara@startup.com', name: 'Clara Nunes' },
    { company: 'Fresh Start', contact: 'rick@fresh.com', name: 'Rick Santos' },
    { company: 'Launch Pad', contact: 'vera@launch.com', name: 'Vera Lima' },
    { company: 'Day One', contact: 'hugo@dayone.com', name: 'Hugo Mendes' },
  ].map((c, i) => ({ id: `c${i + 33}`, ...c, plan: 'starter', mrr: 0, status: 'trial', modules: 3, signup: `2026-03-${15 + i}`, payment: null }));

  const pastDue = [
    { id: 'c38', company: 'Overdue Corp', contact: 'val@overdue.com', name: 'Val Harris', plan: 'enterprise', mrr: 499, status: 'past_due', modules: 7, signup: '2025-11-01', payment: 'Visa ****9900 (declined)' },
    { id: 'c39', company: 'Late Pay LLC', contact: 'greg@latepay.com', name: 'Greg Stone', plan: 'pro', mrr: 199, status: 'past_due', modules: 5, signup: '2026-01-20', payment: 'MC ****4455 (expired)' },
  ];

  return [...ent, ...pro, ...starter, ...trial, ...pastDue];
};
export const customers = genCustomers();

// ─── Modules ───
export const allModules = [
  { key: 'pulse', name: 'Pulse', description: 'CRM & Guest Intelligence' },
  { key: 'tap', name: 'Tap', description: 'NFC Entry' },
  { key: 'table', name: 'Table', description: 'Floor Management' },
  { key: 'kds', name: 'KDS', description: 'Kitchen Display' },
  { key: 'bar', name: 'Bar', description: 'Bar Operations' },
  { key: 'finance', name: 'Finance', description: 'Cashier' },
  { key: 'analytics', name: 'Analytics', description: 'Advanced Reporting' },
  { key: 'ai', name: 'AI', description: 'Intelligent Insights' },
];

// ─── Customer Events (for activity log) ───
export const customerEvents = [
  { customerId: 'c1', type: 'module_activated', description: 'Module "AI" activated', date: '2026-03-20' },
  { customerId: 'c1', type: 'payment_received', description: 'Payment received ($724)', date: '2026-03-15' },
  { customerId: 'c1', type: 'plan_changed', description: 'Plan upgraded from Enterprise base', date: '2026-03-01' },
  { customerId: 'c1', type: 'account_created', description: 'Account created', date: '2025-08-15' },
  { customerId: 'c2', type: 'payment_received', description: 'Payment received ($499)', date: '2026-03-15' },
  { customerId: 'c2', type: 'account_created', description: 'Account created', date: '2025-09-01' },
  { customerId: 'c38', type: 'payment_failed', description: 'Payment failed — card declined', date: '2026-03-15' },
  { customerId: 'c39', type: 'payment_failed', description: 'Payment failed — card expired', date: '2026-03-15' },
];

// ─── Pre-computed KPIs ───
// Overview page
export const overviewKpis = [
  { key: 'mrr', icon: 'DollarSign', color: '#7C3AED', value: '$7,741', raw: 7741, label: 'MRR', description: 'Monthly Recurring Revenue', trend: null },
  { key: 'netNewMrr', icon: 'TrendingUp', color: '#1FAA6B', value: '$7,741', raw: 7741, label: 'Net New MRR', description: null, trend: null },
  { key: 'activeCustomers', icon: 'Users', color: '#3B82F6', value: '39', raw: 39, label: 'Active Customers', description: null, trend: null },
  { key: 'churnRate', icon: 'RefreshCw', color: '#1FAA6B', value: '0%', raw: 0, label: 'Churn Rate', description: 'Healthy', trend: null },
  { key: 'arpu', icon: 'Target', color: '#F59F00', value: '$198.49', raw: 198.49, label: 'ARPU', description: null, trend: null },
  { key: 'ltvCac', icon: 'Zap', color: '#F59F00', value: '4.1x', raw: 4.1, label: 'LTV / CAC', description: 'Strong unit economics', trend: null },
];

export const growthBanner = {
  momGrowth: '0%',
  arr: '$92,892',
  revenueYtd: '$7,741',
  today: '$0',
};

// Revenue page
export const revenueKpisRow1 = [
  { key: 'mrr', icon: 'DollarSign', color: '#7C3AED', value: '$7,741', raw: 7741, label: 'MRR', description: null, trend: null },
  { key: 'arr', icon: 'TrendingUp', color: '#1FAA6B', value: '$92,892', raw: 92892, label: 'ARR', description: 'Annual Run Rate', trend: null },
  { key: 'netNewMrr', icon: 'TrendingUp', color: '#1FAA6B', value: '$7,741', raw: 7741, label: 'Net New MRR', description: null, trend: null },
  { key: 'netCashFlow', icon: 'BarChart3', color: '#7C3AED', value: '$5,031.65', raw: 5031.65, label: 'Net Cash Flow', description: null, trend: null },
];

export const revenueKpisRow2 = [
  { key: 'expansionMrr', icon: 'TrendingUp', color: '#1FAA6B', value: '$1,935.25', raw: 1935.25, label: 'Expansion MRR', description: null, trend: null },
  { key: 'contractionMrr', icon: 'TrendingDown', color: '#F59F00', value: '$387.05', raw: 387.05, label: 'Contraction MRR', description: null, trend: null },
  { key: 'churnedMrr', icon: 'TrendingDown', color: '#E03131', value: '$0', raw: 0, label: 'Churned MRR', description: null, trend: null },
  { key: 'previousMrr', icon: 'DollarSign', color: '#8494BD', value: '$0', raw: 0, label: 'Previous MRR', description: 'Last month', trend: null },
];

// Users page summary
export const usersKpis = [
  { key: 'totalUsers', icon: 'Users', color: '#3B82F6', value: '39', raw: 39, label: 'Total Users' },
  { key: 'paidActive', icon: 'DollarSign', color: '#1FAA6B', value: '32', raw: 32, label: 'Paid & Active' },
  { key: 'trial', icon: 'Clock', color: '#F59F00', value: '5', raw: 5, label: 'Trial' },
  { key: 'pastDue', icon: 'AlertTriangle', color: '#E03131', value: '2', raw: 2, label: 'Past Due' },
];

// ─── Chart Data ───
export const mrrGrowthData = [
  { month: 'Apr', mrr: 0 }, { month: 'May', mrr: 0 }, { month: 'Jun', mrr: 0 },
  { month: 'Jul', mrr: 0 }, { month: 'Aug', mrr: 820 }, { month: 'Sep', mrr: 1640 },
  { month: 'Oct', mrr: 2380 }, { month: 'Nov', mrr: 3200 }, { month: 'Dec', mrr: 4100 },
  { month: 'Jan', mrr: 5200 }, { month: 'Feb', mrr: 6400 }, { month: 'Mar', mrr: 7741 },
];

export const customerGrowthData = [
  { month: 'Apr', customers: 0 }, { month: 'May', customers: 0 }, { month: 'Jun', customers: 0 },
  { month: 'Jul', customers: 0 }, { month: 'Aug', customers: 3 }, { month: 'Sep', customers: 7 },
  { month: 'Oct', customers: 12 }, { month: 'Nov', customers: 16 }, { month: 'Dec', customers: 21 },
  { month: 'Jan', customers: 27 }, { month: 'Feb', customers: 33 }, { month: 'Mar', customers: 39 },
];

export const revenueLast30Days = Array.from({ length: 30 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  revenue: Math.round(180 + Math.random() * 200),
  profit: Math.round(80 + Math.random() * 120),
}));

export const mrrBreakdownMonthly = [
  { month: 'Apr', newMrr: 0, expansion: 0, churned: 0 },
  { month: 'May', newMrr: 0, expansion: 0, churned: 0 },
  { month: 'Jun', newMrr: 0, expansion: 0, churned: 0 },
  { month: 'Jul', newMrr: 0, expansion: 0, churned: 0 },
  { month: 'Aug', newMrr: 820, expansion: 0, churned: 0 },
  { month: 'Sep', newMrr: 680, expansion: 140, churned: 0 },
  { month: 'Oct', newMrr: 540, expansion: 200, churned: 0 },
  { month: 'Nov', newMrr: 620, expansion: 200, churned: 0 },
  { month: 'Dec', newMrr: 680, expansion: 220, churned: 0 },
  { month: 'Jan', newMrr: 840, expansion: 260, churned: 0 },
  { month: 'Feb', newMrr: 920, expansion: 280, churned: 0 },
  { month: 'Mar', newMrr: 6193, expansion: 1935, churned: 387 },
];

export const revenueBreakdown = [
  { name: 'Enterprise', value: 4217, color: '#7C3AED' },
  { name: 'Pro', value: 2985, color: '#3B82F6' },
  { name: 'Starter', value: 539, color: '#06B6D4' },
];

export const quickStats = [
  { label: 'Avg. Revenue / Customer', value: '$198.49' },
  { label: 'Highest MRR Customer', value: '$724' },
  { label: 'Lowest MRR Customer', value: '$49' },
  { label: 'Customers Added (Month)', value: '12' },
  { label: 'Trials Converting', value: '3' },
  { label: 'Support Tickets Open', value: '7' },
];

// ─── Lead Funnel ───
export const leadFunnel = [
  { stage: 'Captured', value: 1240 },
  { stage: 'Qualified', value: 680 },
  { stage: 'Accepted', value: 320 },
  { stage: 'Opportunities', value: 145 },
  { stage: 'Won', value: 52 },
];

// ─── Drill-Down Data ───
export const mrrDrillDown = customers
  .filter(c => c.status === 'active' || c.status === 'past_due')
  .map(c => ({ company: c.company, plan: c.plan, mrr: c.mrr, status: c.status, since: c.signup }))
  .sort((a, b) => b.mrr - a.mrr);

export const netNewMrrBreakdown = {
  newMrr: 6192.80,
  expansion: 1935.25,
  contraction: 387.05,
  churned: 0,
  net: 7741,
};

// CEO OS — Data Service Layer
// Architecture: All data access goes through this service.
// Currently returns mock data. To connect to a real backend,
// replace the function bodies with API calls (fetch/axios).
// No component should import from ceoData.js directly.

// ─── Plans ───
export const PLANS = [
  { id: 'core', name: 'Spet Core', price: 149, modules: 3 },
  { id: 'flow', name: 'Spet Flow', price: 299, modules: 5 },
  { id: 'sync', name: 'Spet Sync', price: 499, modules: 7 },
  { id: 'os', name: 'Spet OS', price: 724, modules: 8 },
];

export const ALL_MODULES = [
  { key: 'pulse', name: 'Pulse', description: 'CRM & Guest Intelligence' },
  { key: 'tap', name: 'Tap', description: 'NFC Entry System' },
  { key: 'table', name: 'Table', description: 'Floor Management' },
  { key: 'kds', name: 'KDS', description: 'Kitchen Display' },
  { key: 'bar', name: 'Bar', description: 'Bar Operations' },
  { key: 'finance', name: 'Finance', description: 'Cashier & Billing' },
  { key: 'analytics', name: 'Analytics', description: 'Advanced Reporting' },
  { key: 'ai', name: 'AI', description: 'Intelligent Insights' },
];

export const STATUSES = ['active', 'trial', 'past_due', 'churned'];

export const PIPELINE_STAGES = [
  { key: 'new', label: 'New', color: '#3B82F6', next: 'qualification' },
  { key: 'qualification', label: 'Qualification', color: '#F59F00', next: 'presentation' },
  { key: 'presentation', label: 'Presentation', color: '#EC4899', next: 'negotiation' },
  { key: 'negotiation', label: 'Negotiation', color: '#E03131', next: 'evaluation' },
  { key: 'evaluation', label: 'Evaluation', color: '#06B6D4', next: 'won' },
  { key: 'won', label: 'Won', color: '#1FAA6B', next: null },
  { key: 'lost', label: 'Lost', color: '#6B7280', next: null },
];

// ─── Internal Mock Store (mutable, simulates DB) ───
let _customers = [
  { id: 'c1', company: 'Nexus Global Entertainment', name: 'John Smith', email: 'john@nexus.com', plan: 'os', mrr: 724, status: 'active', modules: ['pulse','tap','table','kds','bar','finance','analytics','ai'], signup: '2025-08-15', payment: 'Visa ****4242' },
  { id: 'c2', company: 'Platinum Nightlife Group', name: 'Sarah Chen', email: 'sarah@platinum.com', plan: 'os', mrr: 724, status: 'active', modules: ['pulse','tap','table','kds','bar','finance','analytics','ai'], signup: '2025-09-01', payment: 'MC ****8821' },
  { id: 'c3', company: 'Meridian Hospitality Corp', name: 'Mike Torres', email: 'mike@meridian.com', plan: 'sync', mrr: 499, status: 'active', modules: ['pulse','tap','table','kds','bar','finance','analytics'], signup: '2025-10-10', payment: 'Visa ****3310' },
  { id: 'c4', company: 'Stellar Events International', name: 'Emma Davis', email: 'emma@stellar.com', plan: 'os', mrr: 499, status: 'active', modules: ['pulse','tap','table','kds','bar','finance','analytics','ai'], signup: '2025-11-20', payment: 'Amex ****1005' },
  { id: 'c5', company: 'Crown Venue Holdings', name: 'David Kim', email: 'david@crown.com', plan: 'os', mrr: 499, status: 'active', modules: ['pulse','tap','table','kds','bar','finance','analytics'], signup: '2025-12-01', payment: 'Visa ****5567' },
  { id: 'c6', company: 'Apex Lounge Empire', name: 'Lisa Wang', email: 'lisa@apex.com', plan: 'os', mrr: 499, status: 'active', modules: ['pulse','tap','table','kds','bar','finance','analytics','ai'], signup: '2026-01-05', payment: 'MC ****2290' },
  { id: 'c7', company: 'Urban Social Collective', name: 'Carlos Mendes', email: 'carlos@urban.com', plan: 'flow', mrr: 299, status: 'trial', modules: ['pulse','tap','table'], signup: '2026-03-10', payment: null },
  { id: 'c8', company: 'Sunset Bar & Grill', name: 'Ana Torres', email: 'ana@sunset.com', plan: 'core', mrr: 149, status: 'past_due', modules: ['pulse'], signup: '2026-02-15', payment: 'Visa ****9900 (declined)' },
];

let _deals = [
  { id: 'd1', title: 'Spet OS Enterprise', company: 'NightVibe Inc.', contact: 'James Rodriguez', email: 'james@nightvibe.com', phone: '+1 (555) 234-5678', location: 'Miami, FL', stage: 'new', value: 24000, type: 'Enterprise', expectedClose: 'Q1 2026', notes: 'Interested in full platform deployment for 3 venues. Decision expected by end of Q1.', tags: ['Enterprise', 'Q1'], activity: [{ date: '2026-03-20', text: 'Moved to "New" stage' }, { date: '2026-03-18', text: 'Lead qualified by sales team' }, { date: '2026-03-15', text: 'Initial contact via website' }] },
  { id: 'd2', title: 'Spet Sync Setup', company: 'ClubMatrix LLC', contact: 'Rachel Foster', email: 'rachel@clubmatrix.com', phone: '+1 (555) 345-6789', location: 'Las Vegas, NV', stage: 'new', value: 12000, type: 'Mid-Market', expectedClose: 'Q2 2026', notes: 'Single venue, high-volume nightclub', tags: ['Mid-Market'], activity: [{ date: '2026-03-19', text: 'Created deal' }] },
  { id: 'd3', title: 'Expansion — Spet Flow', company: 'Bar Central', contact: 'Tom Hartley', email: 'tom@barcentral.com', phone: '+1 (555) 456-7890', location: 'Austin, TX', stage: 'qualification', value: 8400, type: 'Expansion', expectedClose: 'Q1 2026', notes: 'Existing Core customer, wants Flow upgrade', tags: ['Expansion'], activity: [{ date: '2026-03-17', text: 'Moved to Qualification' }, { date: '2026-03-14', text: 'Initial outreach' }] },
  { id: 'd4', title: 'Full Platform Deal', company: 'EventPro Corp', contact: 'Diana Wells', email: 'diana@eventpro.com', phone: '+1 (555) 567-8901', location: 'New York, NY', stage: 'qualification', value: 36000, type: 'Enterprise', expectedClose: 'Q2 2026', notes: 'Annual deal, 5 venues', tags: ['Enterprise', 'Annual'], activity: [{ date: '2026-03-16', text: 'Presentation scheduled' }] },
  { id: 'd5', title: 'Spet Core Migration', company: 'Lounge 360', contact: 'Kevin Park', email: 'kevin@lounge360.com', phone: '+1 (555) 678-9012', location: 'Chicago, IL', stage: 'presentation', value: 6000, type: 'Migration', expectedClose: 'Q1 2026', notes: 'Migrating from competitor', tags: ['Migration'], activity: [{ date: '2026-03-15', text: 'Demo completed' }] },
  { id: 'd6', title: 'Multi-Venue Bundle', company: 'HospGroup SA', contact: 'Maria Santos', email: 'maria@hospgroup.com', phone: '+55 11 98765-4321', location: 'São Paulo, BR', stage: 'negotiation', value: 48000, type: 'Enterprise', expectedClose: 'Q1 2026', notes: 'Multi-venue enterprise deal', tags: ['Enterprise', 'Multi-Venue'], activity: [{ date: '2026-03-20', text: 'Negotiation in progress' }] },
  { id: 'd7', title: 'Spet Sync Annual', company: 'DineFlow Inc.', contact: 'Andrew Blake', email: 'andrew@dineflow.com', phone: '+1 (555) 789-0123', location: 'Denver, CO', stage: 'negotiation', value: 14400, type: 'Annual', expectedClose: 'Q2 2026', notes: 'Annual Sync commitment', tags: ['Annual'], activity: [{ date: '2026-03-18', text: 'Contract review' }] },
  { id: 'd8', title: 'Spet OS — Pilot', company: 'MixLab Studios', contact: 'Sophie Chen', email: 'sophie@mixlab.com', phone: '+1 (555) 890-1234', location: 'San Francisco, CA', stage: 'evaluation', value: 9600, type: 'Pilot', expectedClose: 'Q1 2026', notes: 'Pilot program, 1 venue', tags: ['Pilot'], activity: [{ date: '2026-03-19', text: 'Evaluation started' }] },
  { id: 'd9', title: 'Spet Core — Won', company: 'TapHouse Co.', contact: 'Brian Miller', email: 'brian@taphouse.com', phone: '+1 (555) 901-2345', location: 'Portland, OR', stage: 'won', value: 4800, type: 'SMB', expectedClose: 'Q4 2025', notes: 'Closed in December', tags: ['SMB'], activity: [{ date: '2025-12-20', text: 'Deal won' }] },
  { id: 'd10', title: 'Full Stack Deal', company: 'Premier Events', contact: 'Lisa Chang', email: 'lisa@premier.com', phone: '+1 (555) 012-3456', location: 'Los Angeles, CA', stage: 'won', value: 28800, type: 'Enterprise', expectedClose: 'Q1 2026', notes: 'Full OS deployment, 2 venues', tags: ['Enterprise'], activity: [{ date: '2026-03-10', text: 'Deal won' }, { date: '2026-03-05', text: 'Final negotiation' }] },
];

const _lossReasons = [
  { reason: 'Price too high', percentage: 34 },
  { reason: 'Chose competitor', percentage: 22 },
  { reason: 'No budget', percentage: 18 },
  { reason: 'Timing', percentage: 14 },
  { reason: 'Other', percentage: 12 },
];

const _pipelineHistory = [
  { month: 'Oct', value: 180000 },
  { month: 'Nov', value: 220000 },
  { month: 'Dec', value: 195000 },
  { month: 'Jan', value: 280000 },
  { month: 'Feb', value: 350000 },
  { month: 'Mar', value: 451800 },
];

// ─── Customer Service ───

export async function getCustomers() {
  // Future: return fetch('/api/ceo/customers').then(r => r.json());
  return [..._customers];
}

export async function updateCustomerPlan(customerId, planId) {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid plan');
  _customers = _customers.map(c =>
    c.id === customerId ? { ...c, plan: planId, mrr: plan.price } : c
  );
  return { success: true, mrr: plan.price };
}

export async function updateCustomerStatus(customerId, status) {
  if (!STATUSES.includes(status)) throw new Error('Invalid status');
  _customers = _customers.map(c =>
    c.id === customerId ? { ...c, status } : c
  );
  return { success: true };
}

export async function toggleCustomerModule(customerId, moduleKey, enabled) {
  _customers = _customers.map(c => {
    if (c.id !== customerId) return c;
    const modules = enabled
      ? [...c.modules, moduleKey]
      : c.modules.filter(m => m !== moduleKey);
    return { ...c, modules };
  });
  return { success: true };
}

// ─── Deal / Pipeline Service ───

export async function getDeals() {
  return [..._deals];
}

export async function moveDealToStage(dealId, newStage) {
  _deals = _deals.map(d => {
    if (d.id !== dealId) return d;
    const now = new Date().toISOString().split('T')[0];
    return {
      ...d,
      stage: newStage,
      activity: [{ date: now, text: `Moved to "${newStage}" stage` }, ...d.activity],
    };
  });
  return { success: true };
}

export async function markDealAsLost(dealId, reason) {
  _deals = _deals.map(d => {
    if (d.id !== dealId) return d;
    const now = new Date().toISOString().split('T')[0];
    return {
      ...d,
      stage: 'lost',
      lossReason: reason,
      activity: [{ date: now, text: `Marked as Lost — ${reason}` }, ...d.activity],
    };
  });
  return { success: true };
}

// ─── Reports Service ───

export async function getPipelineHistory() {
  return [..._pipelineHistory];
}

export async function getLossReasons() {
  return [..._lossReasons];
}

// ─── Security / Alerts Service ───

export async function computeSecurityAlerts(customers) {
  const alerts = [];
  customers.forEach(c => {
    // Low module usage (< 50% of 8 modules)
    if (c.modules.length < 4) {
      alerts.push({ id: `${c.id}-low-usage`, type: 'low_usage', severity: 'warning', title: 'Low Module Usage', description: `"${c.company}" — only ${c.modules.length}/8 modules active`, context: `Plan: ${getPlanName(c.plan)} • Last activity: ${Math.floor(Math.random() * 20) + 1} days ago`, customer: c });
    }
    // Payment past due
    if (c.status === 'past_due') {
      alerts.push({ id: `${c.id}-past-due`, type: 'payment_past_due', severity: 'critical', title: 'Payment Past Due', description: `"${c.company}" — payment overdue`, context: `MRR at risk: $${c.mrr}`, customer: c });
    }
    // Trial with potential churn risk
    if (c.status === 'trial') {
      alerts.push({ id: `${c.id}-churn`, type: 'churn_risk', severity: 'warning', title: 'Low Engagement Score', description: `"${c.company}" — trial account with limited activity`, context: `Status: Trial • Signup: ${c.signup}`, customer: c });
    }
    // No revenue (trial = $0 effective revenue)
    if (c.status === 'trial' && c.mrr === 0) {
      alerts.push({ id: `${c.id}-no-rev`, type: 'no_revenue', severity: 'critical', title: 'No Revenue This Month', description: `"${c.company}" — $0 revenue in current period`, context: `Plan: ${getPlanName(c.plan)} • Status: Trial`, customer: c });
    }
    // Underutilized plan
    const planDef = PLANS.find(p => p.id === c.plan);
    if (planDef && c.modules.length < planDef.modules) {
      const unused = ALL_MODULES.filter(m => !c.modules.includes(m.key)).map(m => m.name).join(', ');
      alerts.push({ id: `${c.id}-underutil`, type: 'underutilized', severity: 'warning', title: 'Underutilized Plan', description: `"${c.company}" — paying for ${getPlanName(c.plan)}, using ${c.modules.length}/${planDef.modules}`, context: `Unused: ${unused} • MRR: $${c.mrr}`, customer: c });
    }
  });
  return alerts;
}

export function computeRiskScore(alerts) {
  const weights = { critical: 10, warning: 3, info: 1 };
  const score = alerts.reduce((sum, a) => sum + (weights[a.severity] || 0), 0);
  const maxPossible = alerts.length * 10 || 1;
  return Math.min(Math.round((score / maxPossible) * 100), 100);
}

export function computeModuleUsage(customers) {
  const total = customers.length || 1;
  return ALL_MODULES.map(m => ({
    module: m.name,
    percentage: Math.round((customers.filter(c => c.modules.includes(m.key)).length / total) * 100),
  }));
}

// ─── Revenue Targets (sidebar) ───

let _targets = {
  weekly: { current: 0, target: 15000 },
  monthly: { current: 7741, target: 60000 },
  annual: { current: 7741, target: 0 },
};

export async function getRevenueTargets() {
  return { ..._targets };
}

// ─── Helpers ───

export function getPlanName(planId) {
  return PLANS.find(p => p.id === planId)?.name || planId;
}

export function getPlanPrice(planId) {
  return PLANS.find(p => p.id === planId)?.price || 0;
}

// Manager Module — Mock Data (managerData.js)
// Spec-defined data models for Dashboard Overview

export const quickStats = [
  { label: "Today's Revenue", value: '$12,640', delta: '+12.4%' },
  { label: 'Total Orders', value: '287', delta: '+8.2%' },
  { label: 'Avg / Table', value: '$186', delta: '+5.1%' },
  { label: 'Peak Hour', value: '8-9 PM', sub: '$4,280' },
];

export const topSellingItems = [
  { rank: 1, name: 'Old Fashioned', orders: 84, revenue: 1260 },
  { rank: 2, name: 'Wagyu Burger', orders: 62, revenue: 1240 },
  { rank: 3, name: 'Truffle Fries', orders: 71, revenue: 710 },
  { rank: 4, name: 'Espresso Martini', orders: 58, revenue: 870 },
  { rank: 5, name: 'Caesar Salad', orders: 45, revenue: 540 },
];

export const hourlyRevenueData = [
  { hour: '6PM', revenue: 1200 },
  { hour: '7PM', revenue: 2400 },
  { hour: '8PM', revenue: 4280 },
  { hour: '9PM', revenue: 3100 },
  { hour: '10PM', revenue: 1800 },
  { hour: '11PM', revenue: 960 },
  { hour: '12AM', revenue: 420 },
];

export const staffPerformance = [
  { name: 'Ana', revenue: 3840, tips: 480, tablesHandled: 12, isTopPerformer: true },
  { name: 'Carlos', revenue: 2960, tips: 370, tablesHandled: 9, isTopPerformer: false },
  { name: 'Maria', revenue: 2680, tips: 335, tablesHandled: 8, isTopPerformer: false },
  { name: 'João', revenue: 1920, tips: 240, tablesHandled: 6, isTopPerformer: false },
  { name: 'Lucas', revenue: 1240, tips: 155, tablesHandled: 5, isTopPerformer: false },
];

export const tableInsights = [
  { label: 'Small (2-4)', value: 68, avg: '$124' },
  { label: 'Medium (4-6)', value: 42, avg: '$186' },
  { label: 'Large (6+)', value: 18, avg: '$312' },
];

export const riskAlerts = [
  { type: 'danger', message: 'Table 7 open for 3h+', detail: 'Average is 1.5h — consider checking in.' },
  { type: 'warning', message: '3 voids in last hour', detail: 'Review with staff — possible training gap.' },
  { type: 'danger', message: 'Carlos below avg tips', detail: '$8.20 avg vs $14.50 team avg.' },
];

export const suggestions = [
  { message: 'Move Ana to VIP section during peak — she converts 40% more.', impact: 'high' },
  { message: 'Happy hour drinks underperforming — consider 2-for-1 promo.', impact: 'medium' },
  { message: 'Table turnover is 15% slower on Fridays — add a busser.', impact: 'high' },
  { message: 'Top 3 cocktails account for 62% of bar revenue.', impact: 'low' },
];

export const revenueInsights = {
  peakHour: '8-9 PM',
  peakHourRevenue: 4280,
  mostSoldCategory: 'Cocktails',
  mostSoldCategoryOrders: 142,
  avgSpendPerTable: 186,
  totalRevenue: 12640,
  totalOrders: 287,
};

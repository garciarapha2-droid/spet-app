// Owner Module — Mock Data Layer
// 3 venues, 12 guests, 5 campaigns, 12 insights, 7 actions, charts, segments, etc.

export const ownerVenues = [
  { id: 'v1', name: 'Downtown', address: '123 Main St', status: 'top', revenue: 72000, profit: 29000, margin: 40.3, guests: 890, retention: 68, growth: 12.4, insight: 'Strongest venue. Consider expanding capacity on weekends.', staffCount: 18, tables: 24, hours: '6 PM – 2 AM', events: 12 },
  { id: 'v2', name: 'Midtown', address: '456 Center Ave', status: 'attention', revenue: 58000, profit: 21000, margin: 36.2, guests: 720, retention: 52, growth: 3.1, insight: 'Retention declining. Weekend traffic strong but weekday needs work.', staffCount: 14, tables: 18, hours: '7 PM – 1 AM', events: 10 },
  { id: 'v3', name: 'Uptown', address: '789 High Blvd', status: 'underperforming', revenue: 40000, profit: 16000, margin: 40.0, guests: 620, retention: 41, growth: -5.2, insight: 'Costs rising faster than revenue. Staff optimization needed.', staffCount: 12, tables: 15, hours: '8 PM – 2 AM', events: 8 },
];

export const venueColors = {
  Downtown: { bg: 'bg-[hsl(var(--success)_/_0.08)]', text: 'text-[hsl(var(--success))]', border: 'border-[hsl(var(--success)_/_0.25)]', dot: 'bg-[hsl(var(--success))]', hex: '#22C55E' },
  Midtown: { bg: 'bg-blue-500/8', text: 'text-blue-500', border: 'border-blue-500/25', dot: 'bg-blue-500', hex: '#3B82F6' },
  Uptown: { bg: 'bg-purple-500/8', text: 'text-purple-500', border: 'border-purple-500/25', dot: 'bg-purple-500', hex: '#8B5CF6' },
};

export const ownerGuests = [
  { id: 'og1', name: 'Alex Rivera', email: 'alex@email.com', totalSpent: 12400, visits: 48, tier: 'VIP', lastVisit: '2 days ago', lastVisitDaysAgo: 2, returningRisk: false, avgSpend: 258, frequency: 'Weekly', segment: 'vip', score: 95, favoriteCategory: 'Cocktails', loyaltyEnrolled: true, preferredVenue: 'Downtown', topEvent: 'Friday Night', spendTrend: 'up', riskSignal: 'none' },
  { id: 'og2', name: 'Maria Santos', email: 'maria@email.com', totalSpent: 9800, visits: 36, tier: 'Platinum', lastVisit: '5 days ago', lastVisitDaysAgo: 5, returningRisk: false, avgSpend: 272, frequency: 'Weekly', segment: 'vip', score: 91, favoriteCategory: 'Wine', loyaltyEnrolled: true, preferredVenue: 'Midtown', topEvent: 'Jazz Night', spendTrend: 'up', riskSignal: 'none' },
  { id: 'og3', name: 'James Chen', email: 'james@email.com', totalSpent: 7200, visits: 28, tier: 'Gold', lastVisit: '1 week ago', lastVisitDaysAgo: 7, returningRisk: false, avgSpend: 257, frequency: 'Bi-weekly', segment: 'active', score: 82, favoriteCategory: 'Spirits', loyaltyEnrolled: true, preferredVenue: 'Downtown', topEvent: 'Saturday Bash', spendTrend: 'stable', riskSignal: 'none' },
  { id: 'og4', name: 'Sophie Laurent', email: 'sophie@email.com', totalSpent: 5600, visits: 22, tier: 'Gold', lastVisit: '3 days ago', lastVisitDaysAgo: 3, returningRisk: false, avgSpend: 254, frequency: 'Weekly', segment: 'active', score: 78, favoriteCategory: 'Champagne', loyaltyEnrolled: true, preferredVenue: 'Uptown', topEvent: 'VIP Lounge', spendTrend: 'up', riskSignal: 'none' },
  { id: 'og5', name: 'David Kim', email: 'david@email.com', totalSpent: 4800, visits: 19, tier: 'Silver', lastVisit: '12 days ago', lastVisitDaysAgo: 12, returningRisk: true, avgSpend: 252, frequency: 'Bi-weekly', segment: 'at_risk', score: 55, favoriteCategory: 'Beer', loyaltyEnrolled: true, preferredVenue: 'Midtown', topEvent: 'Trivia Night', spendTrend: 'down', riskSignal: 'declining visits' },
  { id: 'og6', name: 'Emma Wilson', email: 'emma@email.com', totalSpent: 3900, visits: 15, tier: 'Silver', lastVisit: '18 days ago', lastVisitDaysAgo: 18, returningRisk: true, avgSpend: 260, frequency: 'Monthly', segment: 'at_risk', score: 48, favoriteCategory: 'Cocktails', loyaltyEnrolled: false, preferredVenue: 'Downtown', topEvent: 'Ladies Night', spendTrend: 'down', riskSignal: 'high churn probability' },
  { id: 'og7', name: 'Carlos Mendez', email: 'carlos@email.com', totalSpent: 3200, visits: 12, tier: 'Bronze', lastVisit: '4 days ago', lastVisitDaysAgo: 4, returningRisk: false, avgSpend: 266, frequency: 'Weekly', segment: 'active', score: 72, favoriteCategory: 'Food', loyaltyEnrolled: true, preferredVenue: 'Uptown', topEvent: 'Happy Hour', spendTrend: 'up', riskSignal: 'none' },
  { id: 'og8', name: 'Nina Petrova', email: 'nina@email.com', totalSpent: 2800, visits: 10, tier: 'Bronze', lastVisit: '6 days ago', lastVisitDaysAgo: 6, returningRisk: false, avgSpend: 280, frequency: 'Bi-weekly', segment: 'active', score: 70, favoriteCategory: 'Cocktails', loyaltyEnrolled: false, preferredVenue: 'Midtown', topEvent: 'DJ Night', spendTrend: 'stable', riskSignal: 'none' },
  { id: 'og9', name: 'Tom Bradley', email: 'tom@email.com', totalSpent: 1600, visits: 5, tier: 'Bronze', lastVisit: '2 days ago', lastVisitDaysAgo: 2, returningRisk: false, avgSpend: 320, frequency: 'New', segment: 'new', score: 65, favoriteCategory: 'Spirits', loyaltyEnrolled: false, preferredVenue: 'Downtown', topEvent: 'Open Mic', spendTrend: 'up', riskSignal: 'none' },
  { id: 'og10', name: 'Lisa Park', email: 'lisa@email.com', totalSpent: 1200, visits: 4, tier: 'Bronze', lastVisit: '1 day ago', lastVisitDaysAgo: 1, returningRisk: false, avgSpend: 300, frequency: 'New', segment: 'new', score: 60, favoriteCategory: 'Wine', loyaltyEnrolled: false, preferredVenue: 'Midtown', topEvent: 'Wine Tasting', spendTrend: 'up', riskSignal: 'none' },
  { id: 'og11', name: 'Ryan Foster', email: 'ryan@email.com', totalSpent: 2100, visits: 8, tier: 'Bronze', lastVisit: '35 days ago', lastVisitDaysAgo: 35, returningRisk: true, avgSpend: 262, frequency: 'Monthly', segment: 'lost', score: 30, favoriteCategory: 'Beer', loyaltyEnrolled: true, preferredVenue: 'Uptown', topEvent: 'Game Night', spendTrend: 'down', riskSignal: 'inactive 30+ days' },
  { id: 'og12', name: 'Anna Wright', email: 'anna@email.com', totalSpent: 1800, visits: 7, tier: 'Silver', lastVisit: '25 days ago', lastVisitDaysAgo: 25, returningRisk: true, avgSpend: 257, frequency: 'Monthly', segment: 'at_risk', score: 42, favoriteCategory: 'Food', loyaltyEnrolled: true, preferredVenue: 'Downtown', topEvent: 'Brunch Party', spendTrend: 'down', riskSignal: 'declining frequency' },
];

export const ownerCampaigns = [
  { id: 'oc1', name: 'Double Points Friday', status: 'active', type: 'spend', revenueGenerated: 18500, guestsReached: 340, conversionRate: 24, roi: 320, startDate: 'Feb 1', endDate: null },
  { id: 'oc2', name: 'VIP Welcome Bonus', status: 'active', type: 'loyalty', revenueGenerated: 12200, guestsReached: 180, conversionRate: 38, roi: 280, startDate: 'Jan 15', endDate: null },
  { id: 'oc3', name: 'Re-Engagement Blast', status: 'ended', type: 'retention', revenueGenerated: 8900, guestsReached: 520, conversionRate: 12, roi: 150, startDate: 'Jan 1', endDate: 'Jan 31' },
  { id: 'oc4', name: 'Referral Bonus', status: 'active', type: 'referral', revenueGenerated: 6400, guestsReached: 95, conversionRate: 42, roi: 410, startDate: 'Feb 10', endDate: null },
  { id: 'oc5', name: 'Summer Launch', status: 'draft', type: 'event', revenueGenerated: 0, guestsReached: 0, conversionRate: 0, roi: 0, startDate: 'Mar 1', endDate: null },
];

export const ownerInsights = [
  { id: 'oi1', category: 'critical', title: 'Uptown staff costs exceed 42% of revenue', detail: 'Labor ratio should be under 35%. Review scheduling and overtime.', metric: '42%', cta: 'Review Costs' },
  { id: 'oi2', category: 'critical', title: 'Churn rate increased 18% this month', detail: '23 high-value guests haven\'t returned in 14+ days.', metric: '+18%', cta: 'View At-Risk' },
  { id: 'oi3', category: 'critical', title: 'Midtown retention dropped below 55%', detail: 'Weekday traffic declining. Consider targeted promotions.', metric: '52%', cta: 'Fix Retention' },
  { id: 'oi4', category: 'attention', title: 'Downtown weekend capacity at 94%', detail: 'Consider overflow strategy or pricing adjustments.', metric: '94%', cta: 'Plan Capacity' },
  { id: 'oi5', category: 'attention', title: 'VIP tier showing 8% spend decline', detail: 'Top 10 VIPs spending less per visit than last month.', metric: '-8%', cta: 'Engage VIPs' },
  { id: 'oi6', category: 'attention', title: 'Tuesday-Wednesday revenue gap widening', detail: 'Dead hours 6-8 PM need activation strategy.', metric: '-22%', cta: 'View Time Analysis' },
  { id: 'oi7', category: 'opportunity', title: '34% of guests not enrolled in loyalty', detail: 'Enrollment at entry could capture $12K/month additional.', metric: '34%', cta: 'Boost Enrollment' },
  { id: 'oi8', category: 'opportunity', title: 'Referral program ROI is 410%', detail: 'Scaling referral rewards could drive 15% growth.', metric: '410%', cta: 'Scale Referrals' },
  { id: 'oi9', category: 'opportunity', title: 'Cocktail category margin is 78%', detail: 'Promoting cocktails over beer could add $8K/month.', metric: '78%', cta: 'Menu Strategy' },
  { id: 'oi10', category: 'growth', title: 'New customer acquisition up 15%', detail: '42 new guests this week vs 36 last week.', metric: '+15%', cta: 'View New Guests' },
  { id: 'oi11', category: 'growth', title: 'Loyalty members spend 2.4x more', detail: 'Average loyal spend $186 vs non-loyal $78.', metric: '2.4x', cta: 'View Loyalty' },
  { id: 'oi12', category: 'growth', title: 'Saturday revenue up 22% month-over-month', detail: 'DJ partnership driving strong weekend performance.', metric: '+22%', cta: 'View Weekends' },
];

export const ownerActions = [
  { id: 'oa1', title: 'Launch re-engagement campaign for 23 at-risk guests', explanation: 'These guests haven\'t visited in 14+ days and represent $4,800/month in potential revenue.', impact: 'high', cta: 'Create Campaign', estimatedRevenue: '$4,800/mo', timeToExecute: '30 min', status: 'todo' },
  { id: 'oa2', title: 'Review Uptown staffing schedule', explanation: 'Staff costs at 42% are eating into margins. Optimize shift allocation.', impact: 'high', cta: 'Review Schedule', estimatedRevenue: '$2,100/mo savings', timeToExecute: '1 hour', status: 'todo' },
  { id: 'oa3', title: 'Activate Tuesday-Wednesday promotion', explanation: 'Dead hours losing $1,200/week. Happy hour promotion could recover 60%.', impact: 'medium', cta: 'Create Promotion', estimatedRevenue: '$720/week', timeToExecute: '20 min', status: 'in_progress' },
  { id: 'oa4', title: 'Scale referral bonus program', explanation: 'Current ROI of 410%. Increasing reward by 20% projected to add 25 referrals/month.', impact: 'medium', cta: 'Update Campaign', estimatedRevenue: '$3,200/mo', timeToExecute: '15 min', status: 'todo' },
  { id: 'oa5', title: 'Send VIP appreciation package to top 10', explanation: 'VIP spend declining 8%. Personal touch could reverse the trend.', impact: 'medium', cta: 'Send Package', estimatedRevenue: '$1,800/mo', timeToExecute: '45 min', status: 'todo' },
  { id: 'oa6', title: 'Enroll 34% unenrolled guests in loyalty', explanation: 'Push enrollment at check-in. Each enrolled guest spends 2.4x more.', impact: 'high', cta: 'Update Check-in Flow', estimatedRevenue: '$6,400/mo', timeToExecute: '1 hour', status: 'todo' },
  { id: 'oa7', title: 'Promote cocktail specials across all venues', explanation: 'Cocktails have 78% margin. Shifting 10% of beer orders to cocktails adds significant margin.', impact: 'low', cta: 'Update Menu', estimatedRevenue: '$1,100/mo', timeToExecute: '30 min', status: 'done' },
];

// 30-day revenue trend
export const dailyRevenueTrend = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  const base = 4500 + Math.sin(i * 0.8) * 1500 + (i > 20 ? 800 : 0);
  const rev = Math.round(base + Math.random() * 1000);
  return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: rev, profit: Math.round(rev * (0.35 + Math.random() * 0.08)) };
});

// Hourly revenue (14 hours)
export const hourlyRevenue = [
  { hour: '11 AM', revenue: 420 }, { hour: '12 PM', revenue: 680 },
  { hour: '1 PM', revenue: 540 }, { hour: '2 PM', revenue: 380 },
  { hour: '3 PM', revenue: 290 }, { hour: '4 PM', revenue: 350 },
  { hour: '5 PM', revenue: 520 }, { hour: '6 PM', revenue: 1280 },
  { hour: '7 PM', revenue: 2400 }, { hour: '8 PM', revenue: 3600 },
  { hour: '9 PM', revenue: 4280 }, { hour: '10 PM', revenue: 3800 },
  { hour: '11 PM', revenue: 2900 }, { hour: '12 AM', revenue: 1600 },
];

// Day-of-week revenue
export const dayOfWeekRevenue = [
  { day: 'Mon', revenue: 3200 }, { day: 'Tue', revenue: 2800 },
  { day: 'Wed', revenue: 3100 }, { day: 'Thu', revenue: 4500 },
  { day: 'Fri', revenue: 7800 }, { day: 'Sat', revenue: 8200 },
  { day: 'Sun', revenue: 5400 },
];

// Revenue by category
export const revenueByCategory = [
  { name: 'Cocktails', revenue: 52000, prevRevenue: 46000, margin: 78 },
  { name: 'Spirits', revenue: 38000, prevRevenue: 35000, margin: 72 },
  { name: 'Wine', revenue: 28000, prevRevenue: 30000, margin: 65 },
  { name: 'Beer', revenue: 24000, prevRevenue: 22000, margin: 58 },
  { name: 'Food', revenue: 18000, prevRevenue: 19000, margin: 45 },
  { name: 'Non-Alcoholic', revenue: 10000, prevRevenue: 8000, margin: 82 },
];

// Monthly financial data (6 months)
export const monthlyFinancials = [
  { month: 'Sep', revenue: 145000, costs: 92000, profit: 53000 },
  { month: 'Oct', revenue: 152000, costs: 95000, profit: 57000 },
  { month: 'Nov', revenue: 158000, costs: 98000, profit: 60000 },
  { month: 'Dec', revenue: 168000, costs: 102000, profit: 66000 },
  { month: 'Jan', revenue: 162000, costs: 99000, profit: 63000 },
  { month: 'Feb', revenue: 170000, costs: 104000, profit: 66000 },
];

// Segments
export const guestSegments = [
  { name: 'New', count: 142, pct: 22, avgSpend: 85, color: '#3B82F6', description: 'First-time visitors in the last 30 days' },
  { name: 'Active', count: 218, pct: 34, avgSpend: 156, color: '#22C55E', description: 'Regular visitors with consistent engagement' },
  { name: 'VIP', count: 64, pct: 10, avgSpend: 310, color: '#8B5CF6', description: 'Top spenders and most loyal guests' },
  { name: 'At Risk', count: 128, pct: 20, avgSpend: 124, color: '#F59E0B', description: 'Declining visit frequency or spend' },
  { name: 'Lost', count: 90, pct: 14, avgSpend: 92, color: '#EF4444', description: 'No visit in 30+ days' },
];

// Retention curve (8 weeks)
export const retentionCurve = [
  { week: 'Week 1', rate: 100 }, { week: 'Week 2', rate: 72 },
  { week: 'Week 3', rate: 58 }, { week: 'Week 4', rate: 48 },
  { week: 'Week 5', rate: 42 }, { week: 'Week 6', rate: 38 },
  { week: 'Week 7', rate: 35 }, { week: 'Week 8', rate: 32 },
];

// Retention trend (monthly)
export const retentionTrend = [
  { month: 'Sep', rate: 64 }, { month: 'Oct', rate: 61 },
  { month: 'Nov', rate: 58 }, { month: 'Dec', rate: 55 },
  { month: 'Jan', rate: 52 }, { month: 'Feb', rate: 50 },
];

// Loyalty tiers
export const ownerLoyaltyTiers = [
  { name: 'Bronze', count: 180, revenue: 24000, avgSpend: 133, color: 'hsl(30, 60%, 50%)' },
  { name: 'Silver', count: 120, revenue: 32000, avgSpend: 267, color: 'hsl(220, 10%, 60%)' },
  { name: 'Gold', count: 68, revenue: 28000, avgSpend: 412, color: 'hsl(45, 90%, 50%)' },
  { name: 'Platinum', count: 32, revenue: 22000, avgSpend: 688, color: 'hsl(260, 20%, 70%)' },
  { name: 'VIP', count: 18, revenue: 18000, avgSpend: 1000, color: '#8B5CF6' },
];

// Cost breakdown
export const costBreakdown = [
  { name: 'Staff Wages', amount: 42000, pct: 40, trend: 'up', trendValue: '+5%' },
  { name: 'Product / COGS', amount: 28000, pct: 27, trend: 'stable', trendValue: '0%' },
  { name: 'Rent', amount: 18000, pct: 17, trend: 'stable', trendValue: '0%' },
  { name: 'Utilities', amount: 8000, pct: 8, trend: 'up', trendValue: '+3%' },
  { name: 'Marketing', amount: 5000, pct: 5, trend: 'down', trendValue: '-2%' },
  { name: 'Other', amount: 3000, pct: 3, trend: 'stable', trendValue: '0%' },
];

// Staff cost by venue
export const staffCostByVenue = [
  { venue: 'Downtown', revenue: 72000, staffCost: 24000, ratio: 33 },
  { venue: 'Midtown', staffCost: 16000, revenue: 58000, ratio: 28 },
  { venue: 'Uptown', staffCost: 16800, revenue: 40000, ratio: 42 },
];

// Risk alerts
export const riskAlerts = [
  { id: 'r1', severity: 'critical', title: 'Uptown labor ratio exceeds 42%', detail: 'Target is under 35%. Immediate schedule review needed.', metric: '42%', trend: 'up', cta: 'Review Costs' },
  { id: 'r2', severity: 'critical', title: 'Monthly churn rate at 18%', detail: '23 high-value guests at risk of permanent loss.', metric: '18%', trend: 'up', cta: 'Launch Campaign' },
  { id: 'r3', severity: 'warning', title: 'Midtown weekday revenue declining', detail: 'Down 15% vs last month. Promotions may help.', metric: '-15%', trend: 'down', cta: 'Create Promotion' },
  { id: 'r4', severity: 'warning', title: 'VIP spend per visit declining', detail: 'Top tier spending 8% less per visit.', metric: '-8%', trend: 'down', cta: 'Engage VIPs' },
  { id: 'r5', severity: 'info', title: 'New POS integration available', detail: 'Stripe v4 offers lower transaction fees.', metric: '-0.3%', trend: 'stable', cta: 'Learn More' },
  { id: 'r6', severity: 'info', title: 'Staff training due next week', detail: '4 team members require certification renewal.', metric: '4', trend: 'stable', cta: 'Schedule' },
];

// Events / Nights
export const ownerEvents = [
  { id: 'e1', venueId: 'v1', venueName: 'Downtown', name: 'Friday Night Live', date: 'Feb 21', revenue: 8200, profit: 3400, margin: 41, guests: 145, avgTicket: 56, peakHour: '10 PM', totalCosts: 4800, laborCost: 2800, health: 'strong' },
  { id: 'e2', venueId: 'v1', venueName: 'Downtown', name: 'Saturday Bash', date: 'Feb 22', revenue: 9100, profit: 3800, margin: 42, guests: 168, avgTicket: 54, peakHour: '11 PM', totalCosts: 5300, laborCost: 3100, health: 'strong' },
  { id: 'e3', venueId: 'v2', venueName: 'Midtown', name: 'Jazz Night', date: 'Feb 21', revenue: 5800, profit: 2100, margin: 36, guests: 92, avgTicket: 63, peakHour: '9 PM', totalCosts: 3700, laborCost: 2100, health: 'stable' },
  { id: 'e4', venueId: 'v2', venueName: 'Midtown', name: 'DJ Night', date: 'Feb 22', revenue: 6400, profit: 2300, margin: 36, guests: 110, avgTicket: 58, peakHour: '11 PM', totalCosts: 4100, laborCost: 2400, health: 'attention' },
  { id: 'e5', venueId: 'v3', venueName: 'Uptown', name: 'VIP Lounge', date: 'Feb 21', revenue: 4200, profit: 1500, margin: 36, guests: 65, avgTicket: 65, peakHour: '10 PM', totalCosts: 2700, laborCost: 1600, health: 'attention' },
  { id: 'e6', venueId: 'v3', venueName: 'Uptown', name: 'Happy Hour', date: 'Feb 20', revenue: 3800, profit: 1200, margin: 32, guests: 78, avgTicket: 49, peakHour: '7 PM', totalCosts: 2600, laborCost: 1500, health: 'weak' },
  { id: 'e7', venueId: 'v1', venueName: 'Downtown', name: 'Open Mic', date: 'Feb 19', revenue: 4600, profit: 1900, margin: 41, guests: 88, avgTicket: 52, peakHour: '9 PM', totalCosts: 2700, laborCost: 1600, health: 'stable' },
  { id: 'e8', venueId: 'v2', venueName: 'Midtown', name: 'Trivia Night', date: 'Feb 19', revenue: 3200, profit: 1100, margin: 34, guests: 72, avgTicket: 44, peakHour: '8 PM', totalCosts: 2100, laborCost: 1200, health: 'weak' },
];

// Event hourly revenue (for event detail)
export const eventHourlyRevenue = [
  { hour: '6 PM', revenue: 480 }, { hour: '7 PM', revenue: 920 },
  { hour: '8 PM', revenue: 1640 }, { hour: '9 PM', revenue: 2200 },
  { hour: '10 PM', revenue: 1800 }, { hour: '11 PM', revenue: 1420 },
  { hour: '12 AM', revenue: 740 },
];

// Event cost breakdown
export const eventCostBreakdown = [
  { name: 'Staff Wages', amount: 2800 },
  { name: 'Product', amount: 1200 },
  { name: 'DJ', amount: 400 },
  { name: 'Security', amount: 300 },
  { name: 'Utilities', amount: 150 },
  { name: 'Other', amount: 100 },
];

// Event staff
export const eventStaff = [
  { name: 'Sarah M.', role: 'Server', hours: 8, cost: 160 },
  { name: 'Jake R.', role: 'Bartender', hours: 8, cost: 200 },
  { name: 'Mia T.', role: 'Server', hours: 6, cost: 120 },
  { name: 'Leo W.', role: 'Bartender', hours: 8, cost: 200 },
  { name: 'Ana P.', role: 'Host', hours: 5, cost: 100 },
];

// Audience genres
export const audienceGenres = [
  { slug: 'electronic', name: 'Electronic / EDM', guests: 280, revenue: 42000, avgSpend: 150, avgAge: 26, genderSplit: { male: 58, female: 42 }, topDrink: 'Vodka Red Bull', topFood: 'Nachos', peakTime: '11 PM' },
  { slug: 'jazz', name: 'Jazz & Blues', guests: 120, revenue: 22000, avgSpend: 183, avgAge: 35, genderSplit: { male: 48, female: 52 }, topDrink: 'Whiskey Sour', topFood: 'Cheese Board', peakTime: '9 PM' },
  { slug: 'latin', name: 'Latin Night', guests: 200, revenue: 32000, avgSpend: 160, avgAge: 29, genderSplit: { male: 45, female: 55 }, topDrink: 'Margarita', topFood: 'Tapas', peakTime: '10 PM' },
  { slug: 'hiphop', name: 'Hip Hop', guests: 240, revenue: 36000, avgSpend: 150, avgAge: 25, genderSplit: { male: 62, female: 38 }, topDrink: 'Hennessy', topFood: 'Wings', peakTime: '11 PM' },
  { slug: 'lounge', name: 'Lounge / Chill', guests: 90, revenue: 18000, avgSpend: 200, avgAge: 32, genderSplit: { male: 50, female: 50 }, topDrink: 'Martini', topFood: 'Sushi', peakTime: '8 PM' },
  { slug: 'live', name: 'Live Music', guests: 160, revenue: 24000, avgSpend: 150, avgAge: 30, genderSplit: { male: 52, female: 48 }, topDrink: 'Craft Beer', topFood: 'Burger', peakTime: '9 PM' },
];

// Guest purchase history (for profile)
export const guestPurchaseHistory = [
  { id: 'p1', guestId: 'og1', date: 'Feb 21', event: 'Friday Night Live', venue: 'Downtown', items: 'Vodka Martini x2, Nachos', total: 68 },
  { id: 'p2', guestId: 'og1', date: 'Feb 15', event: 'Saturday Bash', venue: 'Downtown', items: 'Champagne, Cheese Board', total: 120 },
  { id: 'p3', guestId: 'og1', date: 'Feb 8', event: 'Friday Night Live', venue: 'Downtown', items: 'Old Fashioned x3, Wings', total: 85 },
  { id: 'p4', guestId: 'og2', date: 'Feb 21', event: 'Jazz Night', venue: 'Midtown', items: 'Wine Flight, Tapas', total: 95 },
  { id: 'p5', guestId: 'og2', date: 'Feb 14', event: 'Jazz Night', venue: 'Midtown', items: 'Champagne x2, Dessert', total: 180 },
];

// Guest event attendance (for profile)
export const guestEventAttendance = {
  og1: [
    { event: 'Friday Night Live', venue: 'Downtown', attended: 18, totalSpent: 4200, avgSpend: 233 },
    { event: 'Saturday Bash', venue: 'Downtown', attended: 12, totalSpent: 3600, avgSpend: 300 },
    { event: 'Open Mic', venue: 'Downtown', attended: 6, totalSpent: 1800, avgSpend: 300 },
  ],
  og2: [
    { event: 'Jazz Night', venue: 'Midtown', attended: 20, totalSpent: 5400, avgSpend: 270 },
    { event: 'Wine Tasting', venue: 'Midtown', attended: 8, totalSpent: 2400, avgSpend: 300 },
  ],
};

// Guest loyalty activity (for profile)
export const guestLoyaltyActivity = {
  og1: [
    { date: 'Feb 21', type: 'earned', detail: '+120 points (purchase)', points: 120 },
    { date: 'Feb 15', type: 'redeemed', detail: 'Free drink reward (-200 pts)', points: -200 },
    { date: 'Feb 8', type: 'earned', detail: '+85 points (purchase)', points: 85 },
    { date: 'Jan 28', type: 'upgrade', detail: 'Upgraded to VIP tier', points: 0 },
  ],
  og6: null, // not enrolled
};

// Guest venue breakdown (for profile)
export const guestVenueBreakdown = {
  og1: [{ venue: 'Downtown', spent: 9800, visits: 36 }, { venue: 'Midtown', spent: 1800, visits: 8 }, { venue: 'Uptown', spent: 800, visits: 4 }],
  og2: [{ venue: 'Midtown', spent: 7800, visits: 28 }, { venue: 'Downtown', spent: 2000, visits: 8 }],
};

// Guest category breakdown (for profile)
export const guestCategoryBreakdown = {
  og1: [{ category: 'Cocktails', amount: 5200 }, { category: 'Spirits', amount: 3800 }, { category: 'Food', amount: 2400 }, { category: 'Wine', amount: 1000 }],
  og2: [{ category: 'Wine', amount: 4200 }, { category: 'Champagne', amount: 3000 }, { category: 'Food', amount: 1800 }, { category: 'Cocktails', amount: 800 }],
};

// Venue cost detail (for drill-down)
export const venueCostDetails = {
  Downtown: {
    totalCost: 38000, revenue: 72000, margin: 47, laborRatio: 33, staffCost: 24000,
    breakdown: [{ name: 'Staff', amount: 24000 }, { name: 'Product', amount: 8000 }, { name: 'Rent', amount: 3500 }, { name: 'Utilities', amount: 1500 }, { name: 'Marketing', amount: 1000 }],
    staffBreakdown: [{ role: 'Servers', count: 8, cost: 9600 }, { role: 'Bartenders', count: 4, cost: 7200 }, { role: 'Hosts', count: 2, cost: 2400 }, { role: 'Security', count: 2, cost: 2800 }, { role: 'Management', count: 2, cost: 2000 }],
    costTrend: [{ month: 'Sep', revenue: 68000, cost: 35000 }, { month: 'Oct', revenue: 70000, cost: 36000 }, { month: 'Nov', revenue: 71000, cost: 37000 }, { month: 'Dec', revenue: 74000, cost: 38000 }, { month: 'Jan', revenue: 72000, cost: 37500 }, { month: 'Feb', revenue: 72000, cost: 38000 }],
    recommendations: [{ title: 'Optimize weekend server overlap', detail: 'Reduce 2 overlapping shifts on Saturday', impact: '$800/mo savings' }, { title: 'Renegotiate product supplier', detail: 'Switch to bulk ordering for top 5 spirits', impact: '$400/mo savings' }],
  },
  Midtown: {
    totalCost: 32000, revenue: 58000, margin: 45, laborRatio: 28, staffCost: 16000,
    breakdown: [{ name: 'Staff', amount: 16000 }, { name: 'Product', amount: 9000 }, { name: 'Rent', amount: 4000 }, { name: 'Utilities', amount: 2000 }, { name: 'Marketing', amount: 1000 }],
    staffBreakdown: [{ role: 'Servers', count: 6, cost: 7200 }, { role: 'Bartenders', count: 3, cost: 4500 }, { role: 'Hosts', count: 2, cost: 1800 }, { role: 'Security', count: 2, cost: 1500 }, { role: 'Management', count: 1, cost: 1000 }],
    costTrend: [{ month: 'Sep', revenue: 54000, cost: 30000 }, { month: 'Oct', revenue: 56000, cost: 31000 }, { month: 'Nov', revenue: 57000, cost: 31500 }, { month: 'Dec', revenue: 60000, cost: 32000 }, { month: 'Jan', revenue: 58000, cost: 32000 }, { month: 'Feb', revenue: 58000, cost: 32000 }],
    recommendations: [{ title: 'Add weekday happy hour staff', detail: 'One extra server Tue-Wed could boost revenue', impact: '$1,200/mo revenue' }],
  },
  Uptown: {
    totalCost: 34000, revenue: 40000, margin: 15, laborRatio: 42, staffCost: 16800,
    breakdown: [{ name: 'Staff', amount: 16800 }, { name: 'Product', amount: 8200 }, { name: 'Rent', amount: 5000 }, { name: 'Utilities', amount: 2500 }, { name: 'Marketing', amount: 1500 }],
    staffBreakdown: [{ role: 'Servers', count: 5, cost: 6000 }, { role: 'Bartenders', count: 3, cost: 5400 }, { role: 'Hosts', count: 1, cost: 1200 }, { role: 'Security', count: 2, cost: 2800 }, { role: 'Management', count: 1, cost: 1400 }],
    costTrend: [{ month: 'Sep', revenue: 44000, cost: 30000 }, { month: 'Oct', revenue: 42000, cost: 31000 }, { month: 'Nov', revenue: 41000, cost: 32000 }, { month: 'Dec', revenue: 42000, cost: 33000 }, { month: 'Jan', revenue: 40000, cost: 33500 }, { month: 'Feb', revenue: 40000, cost: 34000 }],
    recommendations: [{ title: 'Critical: Reduce overtime hours', detail: 'Overtime accounts for 22% of labor cost', impact: '$3,600/mo savings' }, { title: 'Review security staffing', detail: 'Consider shared security with nearby venue', impact: '$1,400/mo savings' }],
  },
};

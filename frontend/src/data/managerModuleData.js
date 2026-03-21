// Manager Module — Extended Mock Data (managerModuleData.js)
// Spec-defined data models for all Manager sub-pages

export const smartInsights = [
  { id: 'si1', type: 'critical', message: 'Table 7 has been open for over 3 hours', detail: 'Average table time is 1.5h. Staff should check in.', metric: '3h 12m', trend: 'up', trendValue: '+45%' },
  { id: 'si2', type: 'opportunity', message: 'VIP guests spend 2.4x more on cocktails', detail: 'Consider a VIP cocktail menu or upselling training.', metric: '2.4x', trend: 'up', trendValue: '+18%' },
  { id: 'si3', type: 'performance', message: 'Ana is outperforming the team by 32%', detail: 'She handles VIP tables more frequently.', metric: '$3,840', trend: 'up', trendValue: '+32%' },
  { id: 'si4', type: 'action', message: '3 guests are close to VIP tier upgrade', detail: 'Send them a reward to push conversion.', metric: '3', trend: 'stable', trendValue: '' },
  { id: 'si5', type: 'critical', message: 'Void rate spiked in last 2 hours', detail: '3 voids — review with bartenders.', metric: '3', trend: 'up', trendValue: '+200%' },
  { id: 'si6', type: 'opportunity', message: 'Friday peak is 30 min earlier than usual', detail: 'Shift staff start time accordingly.', metric: '7:30 PM', trend: 'stable', trendValue: '' },
  { id: 'si7', type: 'performance', message: 'Average tip is $14.50 tonight', detail: 'Above weekly average of $12.20.', metric: '$14.50', trend: 'up', trendValue: '+19%' },
];

export const systemUsers = [
  { id: 'su1', email: 'garcia.rapha2@gmail.com', role: 'owner', status: 'active' },
  { id: 'su2', email: 'teste@teste.com', role: 'manager', status: 'active' },
  { id: 'su3', email: 'bartender@venue.com', role: 'bartender', status: 'trial' },
];

export const operationalStaff = [
  { id: 'os1', name: 'Ana Silva', role: 'server', phone: '+1 555-0101', shifts: ['Mon', 'Wed', 'Fri', 'Sat'], revenue: 3840, tips: 480, tablesHandled: 12, isTopPerformer: true, hourlyRate: 18, hoursWorked: 32 },
  { id: 'os2', name: 'Carlos Mendes', role: 'bartender', phone: '+1 555-0102', shifts: ['Tue', 'Thu', 'Fri', 'Sat'], revenue: 2960, tips: 370, tablesHandled: 9, isTopPerformer: false, hourlyRate: 20, hoursWorked: 28 },
  { id: 'os3', name: 'Maria Costa', role: 'server', phone: '+1 555-0103', shifts: ['Mon', 'Tue', 'Wed', 'Thu'], revenue: 2680, tips: 335, tablesHandled: 8, isTopPerformer: false, hourlyRate: 18, hoursWorked: 30 },
  { id: 'os4', name: 'João Lima', role: 'cashier', phone: '+1 555-0104', shifts: ['Fri', 'Sat', 'Sun'], revenue: 1920, tips: 240, tablesHandled: 6, isTopPerformer: false, hourlyRate: 16, hoursWorked: 24 },
  { id: 'os5', name: 'Lucas Pereira', role: 'host', shifts: ['Wed', 'Thu', 'Fri', 'Sat'], revenue: 1240, tips: 155, tablesHandled: 5, isTopPerformer: false, hourlyRate: 15, hoursWorked: 20 },
];

export const tableAssignments = [
  { id: 't1', tableNumber: 1, server: 'Ana Silva', revenue: 480, status: 'occupied', guests: 4, openedAt: '19:15' },
  { id: 't2', tableNumber: 2, server: 'Ana Silva', revenue: 320, status: 'occupied', guests: 2, openedAt: '20:00' },
  { id: 't3', tableNumber: 3, server: 'Carlos Mendes', revenue: 0, status: 'reserved', guests: 0 },
  { id: 't4', tableNumber: 4, server: 'Carlos Mendes', revenue: 580, status: 'occupied', guests: 6, openedAt: '18:45' },
  { id: 't5', tableNumber: 5, server: 'Maria Costa', revenue: 240, status: 'occupied', guests: 3, openedAt: '20:30' },
  { id: 't6', tableNumber: 6, server: null, revenue: 0, status: 'free', guests: 0 },
  { id: 't7', tableNumber: 7, server: null, revenue: 0, status: 'free', guests: 0 },
  { id: 't8', tableNumber: 8, server: null, revenue: 0, status: 'unassigned', guests: 2 },
  { id: 't9', tableNumber: 9, server: 'Ana Silva', revenue: 190, status: 'occupied', guests: 2, openedAt: '21:00' },
  { id: 't10', tableNumber: 10, server: 'Maria Costa', revenue: 0, status: 'reserved', guests: 0 },
];

export const menuItems = [
  { id: 'm1', name: 'Old Fashioned', category: 'Cocktails', price: 15, type: 'alcohol', quantitySold: 84, revenue: 1260, cost: 4.5 },
  { id: 'm2', name: 'Wagyu Burger', category: 'Mains', price: 28, type: 'food', quantitySold: 62, revenue: 1736, cost: 12 },
  { id: 'm3', name: 'Truffle Fries', category: 'Starters', price: 14, type: 'food', quantitySold: 71, revenue: 994, cost: 3.5 },
  { id: 'm4', name: 'Espresso Martini', category: 'Cocktails', price: 16, type: 'alcohol', quantitySold: 58, revenue: 928, cost: 5 },
  { id: 'm5', name: 'Caesar Salad', category: 'Starters', price: 12, type: 'food', quantitySold: 45, revenue: 540, cost: 3 },
  { id: 'm6', name: 'Tiramisu', category: 'Desserts', price: 11, type: 'food', quantitySold: 38, revenue: 418, cost: 3.5 },
  { id: 'm7', name: 'Sparkling Water', category: 'Non-Alcoholic', price: 5, type: 'non-alcohol', quantitySold: 92, revenue: 460, cost: 0.8 },
  { id: 'm8', name: 'Negroni', category: 'Cocktails', price: 14, type: 'alcohol', quantitySold: 41, revenue: 574, cost: 4 },
  { id: 'm9', name: 'Fish Tacos', category: 'Mains', price: 18, type: 'food', quantitySold: 33, revenue: 594, cost: 7 },
  { id: 'm10', name: 'Lemonade', category: 'Non-Alcoholic', price: 6, type: 'non-alcohol', quantitySold: 55, revenue: 330, cost: 1 },
];

export const shiftKpis = [
  { label: 'Revenue', value: '$12,640', delta: '+12%' },
  { label: 'Tables Closed', value: '34', delta: '+8%' },
  { label: 'Staff Cost', value: '$1,842' },
  { label: 'Tips', value: '$1,835', delta: '+19%' },
  { label: 'Net Result', value: '$10,798', delta: '+14%' },
];

export const dayPerformance = [
  { date: '03/14', day: 'Fri', revenue: 14200, staffCost: 2100, tables: 42, tabs: 56, result: 12100, status: 'positive' },
  { date: '03/15', day: 'Sat', revenue: 16800, staffCost: 2400, tables: 48, tabs: 64, result: 14400, status: 'positive' },
  { date: '03/16', day: 'Sun', revenue: 8400, staffCost: 1800, tables: 28, tabs: 32, result: 6600, status: 'positive' },
  { date: '03/17', day: 'Mon', revenue: 5200, staffCost: 1600, tables: 18, tabs: 22, result: 3600, status: 'positive' },
  { date: '03/18', day: 'Tue', revenue: 6100, staffCost: 1700, tables: 22, tabs: 28, result: 4400, status: 'positive' },
  { date: '03/19', day: 'Wed', revenue: 7800, staffCost: 1900, tables: 26, tabs: 34, result: 5900, status: 'positive' },
  { date: '03/20', day: 'Thu', revenue: 9400, staffCost: 1950, tables: 30, tabs: 38, result: 7450, status: 'positive' },
];

export const revenueCostChart = [
  { day: 'Fri', revenue: 14200, staffCost: 2100 },
  { day: 'Sat', revenue: 16800, staffCost: 2400 },
  { day: 'Sun', revenue: 8400, staffCost: 1800 },
  { day: 'Mon', revenue: 5200, staffCost: 1600 },
  { day: 'Tue', revenue: 6100, staffCost: 1700 },
  { day: 'Wed', revenue: 7800, staffCost: 1900 },
  { day: 'Thu', revenue: 9400, staffCost: 1950 },
];

export const tipRecords = [
  { id: 'tr1', server: 'Ana Silva', guestName: 'Michael R.', tabNumber: 'T-1042', totalSpent: 186, tipAmount: 32, tipPercent: 17.2, time: '21:45', date: '03/20' },
  { id: 'tr2', server: 'Carlos Mendes', guestName: 'Sarah L.', tabNumber: 'T-1038', totalSpent: 142, tipAmount: 24, tipPercent: 16.9, time: '21:30', date: '03/20' },
  { id: 'tr3', server: 'Ana Silva', guestName: 'David K.', tabNumber: 'T-1045', totalSpent: 220, tipAmount: 40, tipPercent: 18.2, time: '22:00', date: '03/20' },
  { id: 'tr4', server: 'Maria Costa', guestName: 'Emma W.', tabNumber: 'T-1039', totalSpent: 98, tipAmount: 15, tipPercent: 15.3, time: '20:15', date: '03/20' },
  { id: 'tr5', server: 'João Lima', guestName: 'James P.', tabNumber: 'T-1041', totalSpent: 164, tipAmount: 28, tipPercent: 17.1, time: '21:00', date: '03/20' },
  { id: 'tr6', server: 'Maria Costa', guestName: 'Lisa M.', tabNumber: 'T-1044', totalSpent: 76, tipAmount: 10, tipPercent: 13.2, time: '21:15', date: '03/20' },
  { id: 'tr7', server: 'Carlos Mendes', guestName: 'Robert H.', tabNumber: 'T-1046', totalSpent: 310, tipAmount: 55, tipPercent: 17.7, time: '22:30', date: '03/20' },
  { id: 'tr8', server: 'Ana Silva', guestName: 'Jennifer T.', tabNumber: 'T-1048', totalSpent: 128, tipAmount: 20, tipPercent: 15.6, time: '22:45', date: '03/20' },
];

export const guestProfiles = [
  { id: 'g1', name: 'Michael Roberts', email: 'michael@email.com', visits: 24, totalSpent: 4280, tag: 'VIP', lastVisit: '2 days ago', avgSpendPerVisit: 178, favoriteCategory: 'Cocktails', visitFrequency: '2x/week', highestSpend: 420, tipsGiven: 680, points: 8560, tier: 'Platinum', tierProgress: 85, pointsToNextTier: 1440, nextTier: 'VIP', status: 'vip', guestScore: 92, journey: [
    { date: 'Mar 20', event: 'Spent $186 at Table 4', type: 'spend' },
    { date: 'Mar 18', event: 'Upgraded to Platinum', type: 'upgrade' },
    { date: 'Mar 15', event: 'Visited — 3h session', type: 'visit' },
    { date: 'Mar 10', event: 'Redeemed Free Cocktail', type: 'reward' },
    { date: 'Mar 5', event: 'Spent $220 — highest ever', type: 'spend' },
  ]},
  { id: 'g2', name: 'Sarah Lee', email: 'sarah@email.com', visits: 18, totalSpent: 3120, tag: 'Gold', lastVisit: '5 days ago', avgSpendPerVisit: 173, favoriteCategory: 'Mains', visitFrequency: '1x/week', highestSpend: 310, tipsGiven: 520, points: 6240, tier: 'Gold', tierProgress: 62, pointsToNextTier: 3760, nextTier: 'Platinum', status: 'active', guestScore: 78, journey: [
    { date: 'Mar 15', event: 'Spent $142 at Table 2', type: 'spend' },
    { date: 'Mar 8', event: 'Visited — 2h session', type: 'visit' },
    { date: 'Mar 1', event: 'Earned Gold tier', type: 'upgrade' },
  ]},
  { id: 'g3', name: 'David Kim', email: 'david@email.com', visits: 32, totalSpent: 5640, tag: 'VIP', lastVisit: '1 day ago', avgSpendPerVisit: 176, favoriteCategory: 'Spirits', visitFrequency: '3x/week', highestSpend: 480, tipsGiven: 920, points: 11280, tier: 'VIP', tierProgress: 100, pointsToNextTier: 0, nextTier: 'VIP', status: 'vip', guestScore: 96, journey: [
    { date: 'Mar 20', event: 'Spent $220 — VIP table', type: 'spend' },
    { date: 'Mar 19', event: 'Visited — quick drink', type: 'visit' },
    { date: 'Mar 17', event: 'Referred 2 friends', type: 'reward' },
  ]},
  { id: 'g4', name: 'Emma Wilson', email: 'emma@email.com', visits: 8, totalSpent: 860, tag: 'Silver', lastVisit: '18 days ago', avgSpendPerVisit: 108, favoriteCategory: 'Non-Alcoholic', visitFrequency: '1x/2weeks', highestSpend: 180, tipsGiven: 120, points: 1720, tier: 'Silver', tierProgress: 34, pointsToNextTier: 3280, nextTier: 'Gold', status: 'churn_risk', guestScore: 42, journey: [
    { date: 'Mar 2', event: 'Last visit — $98', type: 'visit' },
    { date: 'Feb 15', event: 'Skipped 2 weeks', type: 'churn' },
    { date: 'Feb 1', event: 'Earned Silver tier', type: 'upgrade' },
  ]},
  { id: 'g5', name: 'James Park', email: 'james@email.com', visits: 3, totalSpent: 420, tag: 'Silver', lastVisit: '1 week ago', avgSpendPerVisit: 140, favoriteCategory: 'Cocktails', visitFrequency: 'New', highestSpend: 164, tipsGiven: 65, points: 840, tier: 'Bronze', tierProgress: 17, pointsToNextTier: 4160, nextTier: 'Silver', status: 'new', guestScore: 55, journey: [
    { date: 'Mar 20', event: 'Third visit — $164', type: 'spend' },
    { date: 'Mar 13', event: 'Second visit', type: 'visit' },
    { date: 'Mar 6', event: 'First visit — signed up', type: 'visit' },
  ]},
  { id: 'g6', name: 'Lisa Martinez', email: 'lisa@email.com', visits: 12, totalSpent: 1640, tag: 'Gold', lastVisit: '3 days ago', avgSpendPerVisit: 137, favoriteCategory: 'Starters', visitFrequency: '1x/week', highestSpend: 240, tipsGiven: 280, points: 3280, tier: 'Gold', tierProgress: 55, pointsToNextTier: 1720, nextTier: 'Platinum', status: 'returning', guestScore: 71, journey: [
    { date: 'Mar 17', event: 'Came back after 3 weeks', type: 'comeback' },
    { date: 'Feb 24', event: 'Last visit before break', type: 'visit' },
  ]},
  { id: 'g7', name: 'Robert Harris', email: 'robert@email.com', visits: 28, totalSpent: 6200, tag: 'Platinum', lastVisit: '30 days ago', avgSpendPerVisit: 221, favoriteCategory: 'Spirits', visitFrequency: 'Lost', highestSpend: 520, tipsGiven: 1100, points: 12400, tier: 'Platinum', tierProgress: 92, pointsToNextTier: 600, nextTier: 'VIP', status: 'lost', guestScore: 35, journey: [
    { date: 'Feb 20', event: 'Last visit — $310', type: 'spend' },
    { date: 'Feb 5', event: 'Inactive 30+ days', type: 'churn' },
  ]},
];

export const loyaltyTiers = [
  { name: 'Bronze', pointsRequired: 0, discount: 0, color: 'hsl(30, 60%, 50%)', benefits: ['Earn points on every purchase', 'Member-only updates', 'Birthday notification'] },
  { name: 'Silver', pointsRequired: 500, discount: 5, color: 'hsl(220, 10%, 60%)', benefits: ['5% discount on all orders', 'Priority entry', 'Early event access'] },
  { name: 'Gold', pointsRequired: 1500, discount: 10, color: 'hsl(45, 90%, 50%)', benefits: ['10% discount', 'Free drink per visit', 'VIP section access', 'Skip the line'] },
  { name: 'Platinum', pointsRequired: 5000, discount: 15, color: 'hsl(260, 20%, 70%)', benefits: ['15% discount', 'Free drink + appetizer', 'Reserved table', 'Personal host'] },
  { name: 'VIP', pointsRequired: 10000, discount: 20, color: 'hsl(258, 75%, 58%)', benefits: ['20% discount', 'Private lounge access', 'Dedicated concierge', 'Exclusive events'] },
];

export const campaigns = [
  { id: 'c1', name: 'Double Points Friday', type: 'spend', status: 'active', trigger: 'Any purchase on Friday', reward: '2x points', duration: 'Every Friday' },
  { id: 'c2', name: 'Happy Hour Boost', type: 'time', status: 'active', trigger: 'Visit between 2-5 PM', reward: '3x points', duration: 'Daily, 2-5 PM' },
  { id: 'c3', name: 'Big Spender Bonus', type: 'spend', status: 'scheduled', trigger: 'Spend over $200', reward: '+500 bonus points', duration: 'Mar 25 - Apr 10' },
  { id: 'c4', name: 'Refer a Friend', type: 'referral', status: 'active', trigger: 'Friend signs up', reward: 'Both earn 200 pts', duration: 'Ongoing' },
  { id: 'c5', name: 'Cocktail Month', type: 'item', status: 'ended', trigger: 'Order any cocktail', reward: 'Extra 50 pts', duration: 'Feb 1-28' },
];

export const loyaltyRewards = [
  { id: 'lr1', name: '10% Off Next Visit', type: 'discount', value: '10%', tier: 'Silver+', active: true },
  { id: 'lr2', name: 'Free Beer', type: 'free_item', value: '1 beer', tier: 'Bronze+', active: true },
  { id: 'lr3', name: 'Free Cocktail', type: 'free_item', value: '1 cocktail', tier: 'Gold+', active: true },
  { id: 'lr4', name: 'VIP Table (1h)', type: 'experience', value: '1 hour', tier: 'Platinum+', active: true },
  { id: 'lr5', name: 'Private Event Invite', type: 'experience', value: 'Access', tier: 'VIP', active: true },
  { id: 'lr6', name: '25% Off Birthday', type: 'discount', value: '25%', tier: 'All', active: false },
  { id: 'lr7', name: 'Skip the Line Pass', type: 'experience', value: 'Priority', tier: 'Gold+', active: true },
  { id: 'lr8', name: 'Custom Gift', type: 'custom', value: 'Varies', tier: 'VIP', active: true },
];

export const loyaltyInsightsData = [
  { id: 'li1', type: 'critical', message: 'Robert Harris hasn\'t visited in 30 days', detail: 'High-value Platinum guest at risk. Total spend: $6,200.', metric: '30d', trend: 'down', trendValue: '-100%' },
  { id: 'li2', type: 'opportunity', message: '3 guests are within 200pts of next tier', detail: 'A small reward could push them to upgrade.', metric: '3', trend: 'stable', trendValue: '' },
  { id: 'li3', type: 'critical', message: 'Emma Wilson showing churn signals', detail: 'Visits dropped from weekly to biweekly.', metric: '42', trend: 'down', trendValue: '-18 pts' },
  { id: 'li4', type: 'performance', message: 'VIP guests average 2.4x more spend', detail: 'Invest in upgrading Gold guests to VIP.', metric: '2.4x', trend: 'up', trendValue: '+12%' },
  { id: 'li5', type: 'opportunity', message: 'Double Points Friday increased visits 27%', detail: 'Consider extending to Thursday as well.', metric: '+27%', trend: 'up', trendValue: '+27%' },
  { id: 'li6', type: 'action', message: 'Only 18% return rate this month', detail: 'Below 25% target. Launch re-engagement campaign.', metric: '18%', trend: 'down', trendValue: '-7%' },
];

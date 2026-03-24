// Owner Shift & Staff — Mock Data (reconciliation-guaranteed)
// All totals are verified: KPI = sum(staffRows) = sum(dayRows)

export const venues = [
  { id: 'v1', name: 'Downtown' },
  { id: 'v2', name: 'Midtown' },
  { id: 'v3', name: 'Uptown' },
];

export const staffMembers = [
  { id: 'sm1', fullName: 'Ana Silva', email: 'ana@democlub.com', phone: '+55 11 99999-0101', role: 'waiter', venueId: 'v1', venueName: 'Downtown', hourlyRate: 18, fixedSalary: null, isActive: true },
  { id: 'sm2', fullName: 'Carlos Mendes', email: 'carlos@democlub.com', phone: '+55 11 99999-0102', role: 'bartender', venueId: 'v1', venueName: 'Downtown', hourlyRate: 20, fixedSalary: null, isActive: true },
  { id: 'sm3', fullName: 'Maria Costa', email: 'maria@democlub.com', phone: '+55 11 99999-0103', role: 'waiter', venueId: 'v2', venueName: 'Midtown', hourlyRate: 18, fixedSalary: null, isActive: true },
  { id: 'sm4', fullName: 'João Lima', email: 'joao@democlub.com', phone: '+55 11 99999-0104', role: 'cashier', venueId: 'v1', venueName: 'Downtown', hourlyRate: 16, fixedSalary: null, isActive: true },
  { id: 'sm5', fullName: 'Lucas Pereira', email: 'lucas@democlub.com', phone: '+55 11 99999-0105', role: 'host', venueId: 'v2', venueName: 'Midtown', hourlyRate: 15, fixedSalary: null, isActive: true },
  { id: 'sm6', fullName: 'Fernanda Oliveira', email: 'fernanda@democlub.com', phone: '+55 11 99999-0106', role: 'dj', venueId: 'v1', venueName: 'Downtown', hourlyRate: 35, fixedSalary: 3000, isActive: true },
  { id: 'sm7', fullName: 'Ricardo Santos', email: 'ricardo@democlub.com', phone: '+55 11 99999-0107', role: 'security', venueId: 'v3', venueName: 'Uptown', hourlyRate: 22, fixedSalary: null, isActive: true },
  { id: 'sm8', fullName: 'Patricia Alves', email: 'patricia@democlub.com', phone: '+55 11 99999-0108', role: 'cook', venueId: 'v1', venueName: 'Downtown', hourlyRate: 25, fixedSalary: null, isActive: false },
];

export const ownerSystemUsers = [
  { id: 'su1', fullName: 'Raphael Garcia', email: 'garcia.rapha2@gmail.com', role: 'owner', venueName: 'All Venues', isActive: true },
  { id: 'su2', fullName: 'Teste Manager', email: 'teste@teste.com', role: 'manager', venueName: 'Downtown', isActive: true },
  { id: 'su3', fullName: 'Bar User', email: 'bartender@venue.com', role: 'bartender', venueName: 'Downtown', isActive: true },
];

// Shifts — Mar 17-23, 2026 (This Week)
// Total hours: Ana=32, Carlos=28, Maria=30, João=24, Lucas=20
// Total wages: 576+560+540+384+300 = R$2,360
export const shiftsData = [
  { staffId: 'sm1', date: '2026-03-17', hoursWorked: 7 },
  { staffId: 'sm1', date: '2026-03-19', hoursWorked: 8 },
  { staffId: 'sm1', date: '2026-03-21', hoursWorked: 9 },
  { staffId: 'sm1', date: '2026-03-22', hoursWorked: 8 },
  { staffId: 'sm2', date: '2026-03-18', hoursWorked: 7 },
  { staffId: 'sm2', date: '2026-03-20', hoursWorked: 7 },
  { staffId: 'sm2', date: '2026-03-21', hoursWorked: 8 },
  { staffId: 'sm2', date: '2026-03-22', hoursWorked: 6 },
  { staffId: 'sm3', date: '2026-03-17', hoursWorked: 7.5 },
  { staffId: 'sm3', date: '2026-03-18', hoursWorked: 7.5 },
  { staffId: 'sm3', date: '2026-03-19', hoursWorked: 7.5 },
  { staffId: 'sm3', date: '2026-03-20', hoursWorked: 7.5 },
  { staffId: 'sm4', date: '2026-03-21', hoursWorked: 8 },
  { staffId: 'sm4', date: '2026-03-22', hoursWorked: 8 },
  { staffId: 'sm4', date: '2026-03-23', hoursWorked: 8 },
  { staffId: 'sm5', date: '2026-03-19', hoursWorked: 5 },
  { staffId: 'sm5', date: '2026-03-20', hoursWorked: 5 },
  { staffId: 'sm5', date: '2026-03-21', hoursWorked: 5 },
  { staffId: 'sm5', date: '2026-03-22', hoursWorked: 5 },
];

// Transactions — Mar 17-23, 2026
// Total revenue: R$12,640 | Total tips: R$1,580
// Per staff tips: Ana=480, Carlos=370, Maria=335, João=240, Lucas=155
export const transactionsData = [
  { id: 'tx1', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 2, amount: 520, tipsAmount: 70, closedAt: '2026-03-17T21:30' },
  { id: 'tx2', staffId: 'sm3', staffName: 'Maria Costa', tableNumber: 5, amount: 440, tipsAmount: 70, closedAt: '2026-03-17T22:00' },
  { id: 'tx3', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 8, amount: 280, tipsAmount: 40, closedAt: '2026-03-17T22:30' },
  { id: 'tx4', staffId: 'sm3', staffName: 'Maria Costa', tableNumber: 3, amount: 180, tipsAmount: 30, closedAt: '2026-03-17T23:00' },
  { id: 'tx5', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 1, amount: 460, tipsAmount: 55, closedAt: '2026-03-18T21:00' },
  { id: 'tx6', staffId: 'sm3', staffName: 'Maria Costa', tableNumber: 4, amount: 380, tipsAmount: 60, closedAt: '2026-03-18T21:45' },
  { id: 'tx7', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 6, amount: 420, tipsAmount: 50, closedAt: '2026-03-18T22:30' },
  { id: 'tx8', staffId: 'sm3', staffName: 'Maria Costa', tableNumber: 9, amount: 320, tipsAmount: 50, closedAt: '2026-03-18T23:00' },
  { id: 'tx9', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 2, amount: 480, tipsAmount: 65, closedAt: '2026-03-19T21:00' },
  { id: 'tx10', staffId: 'sm3', staffName: 'Maria Costa', tableNumber: 7, amount: 360, tipsAmount: 60, closedAt: '2026-03-19T21:30' },
  { id: 'tx11', staffId: 'sm5', staffName: 'Lucas Pereira', tableNumber: 3, amount: 340, tipsAmount: 35, closedAt: '2026-03-19T22:00' },
  { id: 'tx12', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 10, amount: 380, tipsAmount: 55, closedAt: '2026-03-19T22:30' },
  { id: 'tx13', staffId: 'sm5', staffName: 'Lucas Pereira', tableNumber: 5, amount: 300, tipsAmount: 30, closedAt: '2026-03-19T23:00' },
  { id: 'tx14', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 1, amount: 480, tipsAmount: 55, closedAt: '2026-03-20T21:00' },
  { id: 'tx15', staffId: 'sm5', staffName: 'Lucas Pereira', tableNumber: 4, amount: 360, tipsAmount: 35, closedAt: '2026-03-20T21:30' },
  { id: 'tx16', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 6, amount: 420, tipsAmount: 50, closedAt: '2026-03-20T22:00' },
  { id: 'tx17', staffId: 'sm3', staffName: 'Maria Costa', tableNumber: 8, amount: 300, tipsAmount: 65, closedAt: '2026-03-20T22:30' },
  { id: 'tx18', staffId: 'sm5', staffName: 'Lucas Pereira', tableNumber: 2, amount: 180, tipsAmount: 20, closedAt: '2026-03-20T23:00' },
  { id: 'tx19', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 2, amount: 580, tipsAmount: 80, closedAt: '2026-03-21T21:00' },
  { id: 'tx20', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 3, amount: 480, tipsAmount: 60, closedAt: '2026-03-21T21:30' },
  { id: 'tx21', staffId: 'sm4', staffName: 'João Lima', tableNumber: 7, amount: 380, tipsAmount: 55, closedAt: '2026-03-21T22:00' },
  { id: 'tx22', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 9, amount: 420, tipsAmount: 60, closedAt: '2026-03-21T22:30' },
  { id: 'tx23', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 1, amount: 280, tipsAmount: 40, closedAt: '2026-03-21T23:00' },
  { id: 'tx24', staffId: 'sm4', staffName: 'João Lima', tableNumber: 5, amount: 160, tipsAmount: 25, closedAt: '2026-03-21T23:30' },
  { id: 'tx25', staffId: 'sm5', staffName: 'Lucas Pereira', tableNumber: 10, amount: 120, tipsAmount: 15, closedAt: '2026-03-21T23:45' },
  { id: 'tx26', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 4, amount: 640, tipsAmount: 80, closedAt: '2026-03-22T21:00' },
  { id: 'tx27', staffId: 'sm2', staffName: 'Carlos Mendes', tableNumber: 2, amount: 520, tipsAmount: 60, closedAt: '2026-03-22T21:30' },
  { id: 'tx28', staffId: 'sm4', staffName: 'João Lima', tableNumber: 6, amount: 460, tipsAmount: 70, closedAt: '2026-03-22T22:00' },
  { id: 'tx29', staffId: 'sm1', staffName: 'Ana Silva', tableNumber: 8, amount: 380, tipsAmount: 30, closedAt: '2026-03-22T22:30' },
  { id: 'tx30', staffId: 'sm4', staffName: 'João Lima', tableNumber: 3, amount: 300, tipsAmount: 40, closedAt: '2026-03-22T23:00' },
  { id: 'tx31', staffId: 'sm5', staffName: 'Lucas Pereira', tableNumber: 10, amount: 220, tipsAmount: 20, closedAt: '2026-03-22T23:30' },
  { id: 'tx32', staffId: 'sm4', staffName: 'João Lima', tableNumber: 2, amount: 420, tipsAmount: 25, closedAt: '2026-03-23T20:00' },
  { id: 'tx33', staffId: 'sm4', staffName: 'João Lima', tableNumber: 5, amount: 380, tipsAmount: 15, closedAt: '2026-03-23T21:00' },
  { id: 'tx34', staffId: 'sm4', staffName: 'João Lima', tableNumber: 7, amount: 300, tipsAmount: 10, closedAt: '2026-03-23T22:00' },
];

// Per-day revenue base data
export const dayRevenueData = [
  { date: '2026-03-17', label: '03/17', day: 'Mon', revenue: 1420, tables: 4, tabs: 6 },
  { date: '2026-03-18', label: '03/18', day: 'Tue', revenue: 1580, tables: 5, tabs: 7 },
  { date: '2026-03-19', label: '03/19', day: 'Wed', revenue: 1860, tables: 5, tabs: 8 },
  { date: '2026-03-20', label: '03/20', day: 'Thu', revenue: 1740, tables: 5, tabs: 7 },
  { date: '2026-03-21', label: '03/21', day: 'Fri', revenue: 2420, tables: 6, tabs: 10 },
  { date: '2026-03-22', label: '03/22', day: 'Sat', revenue: 2520, tables: 6, tabs: 10 },
  { date: '2026-03-23', label: '03/23', day: 'Sun', revenue: 1100, tables: 3, tabs: 5 },
];

// ── Guest (TAP mode) ──
export const mockGuests = [
  {
    id: "g1", name: "Sofia Cardoso", tabNumber: 106, nfcId: "NFC-0042",
    phone: "+55 11 99999-1234", status: "inside", tier: "Gold", points: 2450,
    totalSpent: 78.00, checkedInAt: "2026-03-20T21:15:00",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "g2", name: "Lucas Oliveira", tabNumber: 107, nfcId: "NFC-0088",
    status: "inside", tier: "Silver", points: 680,
    totalSpent: 34.00, checkedInAt: "2026-03-20T22:00:00",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "g3", name: "John Smith", tabNumber: 104,
    status: "inside", tier: "Bronze", points: 120,
    totalSpent: 27.00, checkedInAt: "2026-03-20T22:30:00",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "g4", name: "Maria Santos", tabNumber: 101, nfcId: "NFC-0015",
    status: "exited", tier: "Platinum", points: 5200,
    totalSpent: 156.00, checkedInAt: "2026-03-20T19:00:00",
    checkedOutAt: "2026-03-20T23:00:00",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "g5", name: "Pedro Almeida", tabNumber: 102,
    status: "exited", tier: "Bronze", points: 80,
    totalSpent: 42.00, checkedInAt: "2026-03-20T20:00:00",
    checkedOutAt: "2026-03-20T22:30:00",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  },
];

// ── VenueTable (TABLE mode) ──
export const mockTables = [
  { id: "t1", number: 1, seats: 4, status: "free" },
  { id: "t2", number: 2, seats: 2, status: "busy", guestName: "Sofia Cardoso", tabNumber: 106, totalSpent: 78.00, openedAt: "2026-03-20T21:15:00", server: "Carlos Silva" },
  { id: "t3", number: 3, seats: 6, status: "free" },
  { id: "t4", number: 4, seats: 4, status: "busy", guestName: "Lucas Oliveira", tabNumber: 107, totalSpent: 34.00, openedAt: "2026-03-20T22:00:00", server: "Ana Costa" },
  { id: "t5", number: 5, seats: 2, status: "free" },
  { id: "t6", number: 6, seats: 8, status: "busy", guestName: "John Smith", tabNumber: 104, totalSpent: 27.00, openedAt: "2026-03-20T22:30:00", server: "Bruno Dias" },
  { id: "t7", number: 7, seats: 4, status: "free" },
  { id: "t8", number: 8, seats: 2, status: "free" },
];

// ── Menu Items ──
export const menuItems = [
  // Cocktails
  { id: "m1", name: "Mojito", price: 14.00, category: "Cocktails", extras: [
    { id: "e1", name: "Double shot", price: 4.00 },
    { id: "e2", name: "Premium rum", price: 6.00 },
  ]},
  { id: "m2", name: "Margarita", price: 16.00, category: "Cocktails", extras: [
    { id: "e3", name: "Salt rim", price: 0, defaultSelected: true },
    { id: "e4", name: "Premium tequila", price: 5.00 },
  ]},
  { id: "m3", name: "Old Fashioned", price: 18.00, category: "Cocktails", extras: [
    { id: "e5", name: "Large", price: 6.00 },
  ]},
  { id: "m4", name: "Espresso Martini", price: 17.00, category: "Cocktails" },
  { id: "m5", name: "Caipirinha", price: 13.00, category: "Cocktails", extras: [
    { id: "e6", name: "Passion fruit", price: 2.00 },
  ]},
  { id: "m6", name: "Negroni", price: 15.00, category: "Cocktails" },
  // Beers
  { id: "m7", name: "IPA Draft", price: 9.00, category: "Beers" },
  { id: "m8", name: "Pilsner", price: 7.00, category: "Beers" },
  { id: "m9", name: "Stout", price: 10.00, category: "Beers" },
  { id: "m10", name: "Wheat Beer", price: 8.00, category: "Beers" },
  { id: "m11", name: "Lager", price: 6.00, category: "Beers" },
  // Spirits
  { id: "m12", name: "Whisky Shot", price: 12.00, category: "Spirits", extras: [
    { id: "e7", name: "Premium", price: 8.00 },
  ]},
  { id: "m13", name: "Vodka Shot", price: 10.00, category: "Spirits" },
  { id: "m14", name: "Tequila Shot", price: 11.00, category: "Spirits" },
  { id: "m15", name: "Gin & Tonic", price: 14.00, category: "Spirits", extras: [
    { id: "e8", name: "Premium gin", price: 5.00 },
    { id: "e9", name: "Elderflower tonic", price: 2.00 },
  ]},
  // Non-alcoholic
  { id: "m16", name: "Virgin Mojito", price: 9.00, category: "Non-alcoholic" },
  { id: "m17", name: "Fresh Juice", price: 7.00, category: "Non-alcoholic" },
  { id: "m18", name: "Sparkling Water", price: 4.00, category: "Non-alcoholic" },
  { id: "m19", name: "Soft Drink", price: 5.00, category: "Non-alcoholic" },
  // Snacks
  { id: "m20", name: "Mixed Nuts", price: 8.00, category: "Snacks" },
  { id: "m21", name: "Popcorn", price: 6.00, category: "Snacks" },
  { id: "m22", name: "Chips & Dip", price: 10.00, category: "Snacks" },
  // Starters
  { id: "m23", name: "Bruschetta", price: 12.00, category: "Starters" },
  { id: "m24", name: "Caesar Salad", price: 14.00, category: "Starters" },
  { id: "m25", name: "Garlic Bread", price: 8.00, category: "Starters" },
];

// ── Servers ──
export const servers = ["Carlos Silva", "Ana Costa", "Bruno Dias"];

// ── Category Configuration ──
export const categories = ["Cocktails", "Beers", "Spirits", "Non-alcoholic", "Snacks", "Starters"];

export const categoryEmojis = {
  "Cocktails": "\u{1F378}",
  "Beers": "\u{1F37A}",
  "Spirits": "\u{1F943}",
  "Non-alcoholic": "\u{1F9C3}",
  "Snacks": "\u{1F37F}",
  "Starters": "\u{1F957}",
};

export const categoryColors = {
  "Cocktails": "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30",
  "Beers": "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
  "Spirits": "from-rose-500/20 to-orange-500/20 border-rose-500/30",
  "Non-alcoholic": "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  "Snacks": "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  "Starters": "from-green-500/20 to-lime-500/20 border-green-500/30",
};

export const categoryAccents = {
  "Cocktails": "text-violet-400",
  "Beers": "text-amber-400",
  "Spirits": "text-rose-400",
  "Non-alcoholic": "text-emerald-400",
  "Snacks": "text-orange-400",
  "Starters": "text-green-400",
};

export const alcoholicCategories = ["Cocktails", "Beers", "Spirits"];

export const pointsPerDollar = 2;


// ── Membership Tiers ──
export const membershipTiers = [
  { name: "Bronze", minPoints: 0, color: "#CD7F32", perks: "Basic member" },
  { name: "Silver", minPoints: 500, color: "#A0A0A0", perks: "Priority entry" },
  { name: "Gold", minPoints: 2000, color: "#DAA520", perks: "VIP access + free drink" },
  { name: "Platinum", minPoints: 5000, color: "#7B7B7B", perks: "All perks + reserved table" },
];

// ── Available Rewards ──
export const availableRewards = [
  { id: "r1", name: "Free Beer", pointsCost: 100, active: true },
  { id: "r2", name: "Free Cocktail", pointsCost: 200, active: true },
  { id: "r3", name: "VIP Table (1h)", pointsCost: 500, active: true },
  { id: "r4", name: "Bottle Service", pointsCost: 1500, active: true },
  { id: "r5", name: "Private Event Access", pointsCost: 3000, active: true },
];

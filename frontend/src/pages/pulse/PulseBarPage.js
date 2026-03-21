import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, ChevronDown,
  CreditCard, X, Check, Pencil, MessageSquare,
  User, LayoutGrid, Zap, Shield, Clock,
} from "lucide-react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import {
  mockGuests, mockTables, menuItems, servers,
  categories, categoryEmojis, categoryColors, categoryAccents, alcoholicCategories,
} from "../../data/pulseData";

function cn(...classes) { return classes.filter(Boolean).join(" "); }

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 }
};

export default function PulseBarPage() {
  const [mode, setMode] = useState("tap");
  const [activeCategory, setActiveCategory] = useState("Cocktails");
  const [order, setOrder] = useState([]);
  const [tabSearch, setTabSearch] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState("tip");
  const [selectedTip, setSelectedTip] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [showAgeCheck, setShowAgeCheck] = useState(null);
  const [server, setServer] = useState(null);
  const [verifiedTables, setVerifiedTables] = useState(new Set());
  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  const insideGuests = mockGuests.filter(g => g.status === "inside");
  const filteredGuests = insideGuests.filter(g =>
    !tabSearch || g.name.toLowerCase().includes(tabSearch.toLowerCase()) || g.tabNumber.toString().includes(tabSearch)
  );
  const filteredTables = mockTables.filter(t =>
    !tabSearch || t.number.toString().includes(tabSearch) || t.guestName?.toLowerCase().includes(tabSearch.toLowerCase())
  );
  const categoryItems = menuItems.filter(m => m.category === activeCategory);
  const selectedGuest = insideGuests.find(g => g.id === selectedTab);
  const selectedTableObj = mockTables.find(t => t.id === selectedTable);
  const hasTarget = !!(selectedTab || selectedTable);

  const orderTotal = order.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
    return sum + (item.menuItem.price + extrasTotal) * item.quantity;
  }, 0);
  const tipAmount = selectedTip ? (orderTotal * selectedTip) / 100 : 0;
  const totalWithTip = orderTotal + tipAmount;

  const targetName = mode === "tap" ? selectedGuest?.name : selectedTableObj?.guestName || `Table #${selectedTableObj?.number}`;
  const targetBadge = mode === "tap" ? `#${selectedGuest?.tabNumber}` : `#${selectedTableObj?.number}`;

  const addItemToOrder = (item) => {
    setOrder(prev => {
      const existing = prev.find(o => o.menuItem.id === item.id);
      if (existing) return prev.map(o => o.menuItem.id === item.id ? { ...o, quantity: o.quantity + 1 } : o);
      const defaultExtras = (item.extras || []).filter(e => e.defaultSelected).map(e => ({ extraId: e.id, name: e.name, price: e.price }));
      return [...prev, { menuItem: item, quantity: 1, selectedExtras: defaultExtras, note: "" }];
    });
  };

  const handleAddItem = (item) => {
    if (mode === "tap") { addItemToOrder(item); return; }
    if (alcoholicCategories.includes(item.category)) {
      if (selectedTable && verifiedTables.has(selectedTable)) { addItemToOrder(item); return; }
      setShowAgeCheck(item); return;
    }
    addItemToOrder(item);
  };

  const handleAgeConfirm = () => {
    if (showAgeCheck) {
      if (mode === "table" && selectedTable) setVerifiedTables(prev => new Set(prev).add(selectedTable));
      addItemToOrder(showAgeCheck);
      setShowAgeCheck(null);
    }
  };

  const handleConfirmGuest = () => { setSelectedTab(showConfirm); setSelectedTable(null); setShowConfirm(null); };
  const handleSelectTable = (tableId) => { setSelectedTable(tableId); setSelectedTab(null); };
  const updateItemQty = (itemId, delta) => { setOrder(prev => prev.map(o => o.menuItem.id === itemId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o).filter(o => o.quantity > 0)); };
  const removeItem = (itemId) => { setOrder(prev => prev.filter(o => o.menuItem.id !== itemId)); if (editingItem === itemId) setEditingItem(null); };

  const toggleExtra = (itemId, extra) => {
    setOrder(prev => prev.map(o => {
      if (o.menuItem.id !== itemId) return o;
      const has = o.selectedExtras.find(e => e.extraId === extra.id);
      return { ...o, selectedExtras: has ? o.selectedExtras.filter(e => e.extraId !== extra.id) : [...o.selectedExtras, { extraId: extra.id, name: extra.name, price: extra.price }] };
    }));
  };

  const updateNote = (itemId, note) => { setOrder(prev => prev.map(o => o.menuItem.id === itemId ? { ...o, note } : o)); };

  const handleConfirmOrder = () => {
    if (order.length === 0) return;
    if (mode === "tap" && selectedTab) { setShowIdentityCheck(true); return; }
    setShowPayment(true); setPaymentStep("tip"); setSelectedTip(null);
  };

  const handleIdentityConfirmed = () => { setShowIdentityCheck(false); setShowPayment(true); setPaymentStep("tip"); setSelectedTip(null); };
  const handleCharge = () => { setPaymentStep("done"); };
  const handleClosePayment = () => { setShowPayment(false); setOrder([]); setSelectedTab(null); setSelectedTable(null); setPaymentStep("tip"); setSelectedTip(null); toast.success("Order completed!"); };
  const clearTarget = () => { setSelectedTab(null); setSelectedTable(null); };

  return (
    <PulseLayout>
      <div className="flex flex-col gap-0 -mx-6 -my-8" data-testid="pulse-bar">
        {/* Controls Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          {/* Mode Selector */}
          <div className="inline-flex rounded-full border border-border" data-testid="mode-selector">
            {[
              { key: "tap", label: "TAP", icon: Zap },
              { key: "table", label: "TABLE", icon: LayoutGrid },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors",
                  mode === m.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
                data-testid={`mode-${m.key}`}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Right: Server + Tabs Badge */}
          <div className="flex items-center gap-3">
            <div className="relative" data-testid="server-selector">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={server || ""}
                onChange={e => setServer(e.target.value || null)}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-border/30 bg-transparent text-sm text-muted-foreground focus:outline-none transition-colors"
                data-testid="server-select"
              >
                <option value="">Select server...</option>
                {servers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>

            {mode === "tap" && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary text-primary" data-testid="tab-counter">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-sm font-semibold tabular-nums">Tabs: {insideGuests.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="flex min-h-[calc(100vh-10rem)]">

          {/* Column 1 — Left Sidebar */}
          <div className="w-[280px] shrink-0 border-r border-border/30 p-4 flex flex-col gap-4 overflow-y-auto" data-testid="left-sidebar">
            {mode === "tap" ? (
              <>
                {/* Scan / Search */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">SCAN / SEARCH</span>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={tabSearch}
                      onChange={e => setTabSearch(e.target.value)}
                      placeholder="Name or #tab..."
                      className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/30 border-none text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                      data-testid="tab-search"
                    />
                  </div>
                </div>

                {/* Open Tabs */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">OPEN TABS ({insideGuests.length})</span>
                    <button className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center" data-testid="add-tab-btn">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {filteredGuests.map(guest => (
                      <button
                        key={guest.id}
                        onClick={() => setShowConfirm(guest.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          selectedTab === guest.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30 cursor-pointer"
                        )}
                        data-testid={`tab-${guest.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-sm font-semibold text-foreground flex-1 truncate">{guest.name}</span>
                          <span className="text-[10px] font-bold bg-primary/15 text-primary rounded-md px-1.5 py-0.5">#{guest.tabNumber}</span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                        <div className="flex items-center justify-between mt-1 pl-4">
                          <span className="text-xs text-muted-foreground">Tab #{guest.tabNumber}</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">${guest.totalSpent.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* TABLE mode search */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">TABLES</span>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={tabSearch}
                      onChange={e => setTabSearch(e.target.value)}
                      placeholder="Search table..."
                      className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/30 border-none text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                      data-testid="table-search"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">TABLES ({mockTables.length})</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {filteredTables.map(table => {
                      const isFree = table.status === "free";
                      const isSelected = selectedTable === table.id;
                      return (
                        <button
                          key={table.id}
                          onClick={() => handleSelectTable(table.id)}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-lg border transition-all",
                            isSelected ? "border-primary/40 bg-primary/10" : isFree ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50" : "border-border/30 hover:border-muted-foreground/30"
                          )}
                          data-testid={`table-${table.id}`}
                        >
                          <span className="text-sm font-bold text-foreground">#{table.number}</span>
                          <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1", isFree ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/50 text-muted-foreground")}>{isFree ? "Free" : "Busy"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Column 2 — Center (Category Sidebar + Menu) */}
          <div className="flex-1 flex min-w-0">
            {/* Category Sidebar */}
            <div className="w-[80px] shrink-0 border-r border-border/30 py-4 flex flex-col gap-1 px-1.5" data-testid="category-sidebar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                    activeCategory === cat
                      ? "bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/30"
                  )}
                  data-testid={`cat-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="text-xl">{categoryEmojis[cat]}</span>
                  <span className={cn("text-[10px] font-medium", activeCategory === cat ? "text-primary font-semibold" : "text-muted-foreground")}>{cat}</span>
                </button>
              ))}
              <button className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed border-border/30 hover:border-primary/30 mt-auto transition-colors" data-testid="custom-btn">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Custom</span>
              </button>
            </div>

            {/* Menu Area */}
            <div className="flex-1 p-5 overflow-y-auto" data-testid="menu-area">
              {/* Category Header Banner */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-3 mb-5 p-4 rounded-xl bg-gradient-to-r border ${categoryColors[activeCategory]}`}
                  data-testid="category-header"
                >
                  <span className="text-3xl">{categoryEmojis[activeCategory]}</span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{activeCategory}</h3>
                    <p className="text-xs text-muted-foreground">{categoryItems.length} items</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Product Grid */}
              <div className="grid grid-cols-3 gap-4" data-testid="menu-grid">
                {categoryItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: i * 0.03 }}
                    onClick={() => handleAddItem(item)}
                    className="text-left rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-colors duration-150"
                    data-testid={`menu-${item.id}`}
                  >
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm font-bold text-primary tabular-nums mt-1">${item.price.toFixed(2)}</p>
                    {item.extras?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">{item.extras.length} extras</p>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3 — Right Sidebar (Order) */}
          <div className="w-[280px] shrink-0 border-l border-border/30 flex flex-col" data-testid="order-panel">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border/30">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-base font-semibold text-foreground">Order</span>
              {order.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">{order.length}</span>
              )}
            </div>

            {/* Target Header */}
            {hasTarget && (
              <div className="p-4 border-b border-border/30 bg-primary/5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{targetBadge}</span>
                    <p className="text-sm font-bold text-foreground mt-1">{targetName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      {mode === "tap" && selectedGuest && (
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{new Date(selectedGuest.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      {mode === "table" && selectedTableObj?.server && (
                        <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{selectedTableObj.server}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={clearTarget} className="h-6 w-6 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors" data-testid="clear-target"><X className="h-3 w-3" /></button>
                </div>
              </div>
            )}

            {/* Order Content */}
            <div className="flex-1 overflow-y-auto">
              {order.length === 0 && !hasTarget ? (
                <div className="flex flex-col items-center justify-center h-full py-12 px-4" data-testid="order-empty">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No active order</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Select a tab or scan NFC to start</p>
                </div>
              ) : order.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-xs text-muted-foreground/60">Add items from the menu</p>
                </div>
              ) : (
                <div className="p-4">
                  <AnimatePresence mode="popLayout">
                    {order.map(item => (
                      <motion.div key={item.menuItem.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{item.quantity}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.menuItem.name}</p>
                              {item.selectedExtras.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.selectedExtras.map(e => <span key={e.extraId} className="text-[8px] font-medium bg-primary/10 text-primary px-1 py-0.5 rounded">{e.name}</span>)}
                                </div>
                              )}
                              {item.note && <div className="flex items-center gap-1 mt-0.5"><MessageSquare className="h-2 w-2 text-muted-foreground" /><span className="text-[10px] text-muted-foreground italic">{item.note}</span></div>}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-foreground tabular-nums">${((item.menuItem.price + item.selectedExtras.reduce((s, e) => s + e.price, 0)) * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 pl-8">
                          <button onClick={() => setEditingItem(editingItem === item.menuItem.id ? null : item.menuItem.id)} className={cn("text-[10px] font-medium px-2 py-1 rounded-md border transition-all flex items-center gap-1", editingItem === item.menuItem.id ? "border-primary/30 bg-primary/10 text-primary" : "border-border/20 text-muted-foreground hover:border-primary/20")} data-testid={`edit-${item.menuItem.id}`}><Pencil className="h-2.5 w-2.5" /> Edit</button>
                          <button onClick={() => removeItem(item.menuItem.id)} className="text-[10px] font-medium px-2 py-1 rounded-md border border-border/20 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all flex items-center gap-1" data-testid={`remove-${item.menuItem.id}`}><Trash2 className="h-2.5 w-2.5" /> Remove</button>
                        </div>
                        <AnimatePresence>
                          {editingItem === item.menuItem.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="ml-8 mt-2 p-3 rounded-lg bg-muted/20 border border-border/20 flex flex-col gap-3">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Qty</div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => updateItemQty(item.menuItem.id, -1)} className="h-6 w-6 rounded-md border border-border/30 flex items-center justify-center hover:border-primary/30 transition-colors"><Minus className="h-2.5 w-2.5" /></button>
                                    <span className="text-sm font-bold tabular-nums w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateItemQty(item.menuItem.id, 1)} className="h-6 w-6 rounded-md border border-border/30 flex items-center justify-center hover:border-primary/30 transition-colors"><Plus className="h-2.5 w-2.5" /></button>
                                  </div>
                                </div>
                                {item.menuItem.extras?.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Extras</div>
                                    <div className="flex flex-col gap-1.5">
                                      {item.menuItem.extras.map(extra => {
                                        const isSelected = item.selectedExtras.some(e => e.extraId === extra.id);
                                        return (
                                          <button key={extra.id} onClick={() => toggleExtra(item.menuItem.id, extra)} className="flex items-center gap-2 w-full text-left">
                                            <div className={cn("h-3.5 w-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors", isSelected ? "border-primary bg-primary" : "border-muted-foreground/30")}>{isSelected && <Check className="h-2 w-2 text-primary-foreground" />}</div>
                                            <span className="text-xs text-foreground flex-1">{extra.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{extra.price > 0 ? `+$${extra.price.toFixed(2)}` : "Free"}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Note</div>
                                  <input type="text" value={item.note} onChange={e => updateNote(item.menuItem.id, e.target.value)} placeholder="e.g. no ice..." className="w-full h-7 px-2 rounded-lg border border-border/20 bg-transparent text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Order Footer */}
            {order.length > 0 && (
              <div className="border-t border-border/30 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">${orderTotal.toFixed(2)}</span>
                </div>
                {/* Tip Selector */}
                <div className="flex items-center gap-2">
                  {[18, 20, 22].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setSelectedTip(selectedTip === pct ? null : pct)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                        selectedTip === pct ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/20"
                      )}
                      data-testid={`tip-${pct}`}
                    >{pct}%</button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-primary tabular-nums" data-testid="order-total">${totalWithTip.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleConfirmOrder}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold transition-colors hover:bg-primary/90"
                  data-testid="send-kds-btn"
                >
                  Send to KDS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}

      {/* Guest Confirmation */}
      <AnimatePresence>
        {showConfirm && (() => {
          const guest = insideGuests.find(g => g.id === showConfirm);
          if (!guest) return null;
          return (<>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setShowConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", bounce: 0.2 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-card border border-border/30 rounded-2xl p-8 shadow-2xl text-center" data-testid="guest-confirm-modal">
                {guest.photo ? (
                  <img src={guest.photo} alt={guest.name} className="h-24 w-24 rounded-full object-cover mx-auto border-4 border-primary/30 shadow-xl mb-4" data-testid="guest-confirm-photo" />
                ) : (
                  <div className="mx-auto h-20 w-20 rounded-full bg-muted/30 border-2 border-border/30 flex items-center justify-center mb-4"><User className="h-10 w-10 text-muted-foreground/40" /></div>
                )}
                <h3 className="text-xl font-bold text-foreground">{guest.name}</h3>
                <span className="inline-block text-xs font-mono font-bold bg-muted/50 px-3 py-1 rounded-full mt-2 mb-3">Tab #{guest.tabNumber}</span>
                <p className="text-sm text-muted-foreground mb-6">Confirm this is the correct guest before proceeding.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowConfirm(null)} className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors" data-testid="confirm-cancel">Cancel</button>
                  <button onClick={handleConfirmGuest} className="py-3 rounded-xl bg-primary text-primary-foreground font-bold transition-colors" data-testid="confirm-ok">Confirm</button>
                </div>
              </div>
            </motion.div>
          </>);
        })()}
      </AnimatePresence>

      {/* Identity Verification */}
      <AnimatePresence>
        {showIdentityCheck && selectedGuest && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setShowIdentityCheck(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", bounce: 0.2 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-border/30 rounded-2xl p-8 shadow-2xl text-center" data-testid="identity-verify-modal">
              {selectedGuest.photo ? (
                <img src={selectedGuest.photo} alt={selectedGuest.name} className="h-28 w-28 rounded-full object-cover mx-auto border-4 border-primary/30 shadow-xl mb-5" />
              ) : (
                <div className="h-28 w-28 rounded-full bg-primary/20 border-4 border-primary/30 flex items-center justify-center mx-auto mb-5"><span className="text-3xl font-bold text-primary">{selectedGuest.name.split(" ").map(n => n[0]).join("")}</span></div>
              )}
              <h3 className="text-2xl font-bold text-foreground mb-1">{selectedGuest.name}</h3>
              <span className="inline-block text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full mb-2">Tab #{selectedGuest.tabNumber}</span>
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-5">
                {selectedGuest.tier && <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{selectedGuest.tier}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />In since {new Date(selectedGuest.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 mb-5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order total</span><span className="font-bold text-primary tabular-nums">${orderTotal.toFixed(2)}</span></div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{order.length} {order.length === 1 ? "item" : "items"}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Confirm this is <span className="font-bold text-foreground">{selectedGuest.name}</span> before charging.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowIdentityCheck(false)} className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors" data-testid="identity-cancel">Cancel</button>
                <button onClick={handleIdentityConfirmed} className="py-3 rounded-xl bg-emerald-500 text-white font-bold transition-colors" data-testid="identity-confirm">Confirm Identity</button>
              </div>
            </div>
          </motion.div>
        </>)}
      </AnimatePresence>

      {/* Age Verification */}
      <AnimatePresence>
        {showAgeCheck && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setShowAgeCheck(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", bounce: 0.2 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-border/30 rounded-2xl p-8 shadow-2xl text-center" data-testid="age-verify-modal">
              <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4"><Shield className="h-8 w-8 text-amber-500" /></div>
              <h3 className="text-xl font-bold text-foreground mb-2">Age Verification Required</h3>
              <p className="text-sm text-muted-foreground mb-1"><span className="font-bold text-foreground">{showAgeCheck.name}</span> is an alcoholic beverage.</p>
              <p className="text-sm text-muted-foreground mb-6">I confirm this guest is 21+ years old.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAgeCheck(null)} className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors" data-testid="age-cancel">Cancel</button>
                <button onClick={handleAgeConfirm} className="py-3 rounded-xl bg-emerald-500 text-white font-bold transition-colors" data-testid="age-confirm">Confirm 21+</button>
              </div>
            </div>
          </motion.div>
        </>)}
      </AnimatePresence>

      {/* Payment / Tip Modal */}
      <AnimatePresence>
        {showPayment && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setShowPayment(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", bounce: 0.2 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border/30 rounded-2xl p-6 shadow-2xl relative" data-testid="payment-modal">
              <button onClick={() => setShowPayment(false)} className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors" data-testid="payment-close"><X className="h-4 w-4" /></button>
              {paymentStep === "tip" ? (
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Add Tip</h3>
                  {hasTarget && <p className="text-sm text-foreground font-medium mb-1">{targetName}</p>}
                  <p className="text-sm text-muted-foreground mb-4">Subtotal: <span className="font-bold text-foreground">${orderTotal.toFixed(2)}</span></p>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[18, 20, 22].map(pct => (
                      <button key={pct} onClick={() => setSelectedTip(pct)} className={cn("flex flex-col items-center p-3 rounded-xl border-2 transition-all", selectedTip === pct ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/20")} data-testid={`modal-tip-${pct}`}>
                        <span className="text-lg font-bold">{pct}%</span>
                        <span className="text-[10px] text-muted-foreground">${((orderTotal * pct) / 100).toFixed(2)}</span>
                      </button>
                    ))}
                    <button onClick={() => setSelectedTip(null)} className="flex flex-col items-center p-3 rounded-xl border-2 border-border/30"><span className="text-sm font-bold text-muted-foreground">$</span></button>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 mb-4 flex flex-col gap-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-bold text-foreground tabular-nums">${orderTotal.toFixed(2)}</span></div>
                    {selectedTip && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tip ({selectedTip}%)</span><span className="font-bold text-foreground tabular-nums">${tipAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between border-t border-border/20 pt-2"><span className="font-semibold text-foreground">Total</span><span className="text-xl font-bold text-primary tabular-nums">${totalWithTip.toFixed(2)}</span></div>
                  </div>
                  <button onClick={handleCharge} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 transition-colors" data-testid="charge-btn"><CreditCard className="h-4 w-4" />Charge ${totalWithTip.toFixed(2)}</button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"><Check className="h-8 w-8 text-emerald-400" /></motion.div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Order Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-6">Payment registered successfully</p>
                  <button onClick={handleClosePayment} className="px-6 py-2.5 rounded-xl bg-muted/50 font-semibold text-foreground hover:bg-muted transition-colors" data-testid="close-done">Close</button>
                </div>
              )}
            </div>
          </motion.div>
        </>)}
      </AnimatePresence>
    </PulseLayout>
  );
}

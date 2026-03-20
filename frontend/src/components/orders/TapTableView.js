import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, ChevronDown,
  CreditCard, Banknote, X, Check, Pencil, MessageSquare,
  Users, User, LayoutGrid, Zap, Shield, Clock,
  Moon, Sun, LogOut, Home,
} from "lucide-react";
import {
  mockGuests, mockTables, menuItems, servers,
  categories, categoryEmojis, categoryColors, categoryAccents, alcoholicCategories,
} from "../../data/pulseData";
import spetIcon from "../../assets/spet-icon.png";

export function TapTableView({ defaultMode = "tap", embedded = false, showModeSwitcher = true }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = theme === "dark";

  // ── State (Section 10) ──
  const [mode, setMode] = useState(defaultMode);
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

  // ── Mode change with URL sync ──
  const handleModeChange = (newMode) => {
    setMode(newMode);
    window.history.replaceState(null, "", newMode === "tap" ? "/tap" : "/table");
  };

  const handleLogout = async () => {
    const { handleFullLogout } = await import("../../utils/logout");
    await handleFullLogout(logout);
  };

  // ── Derived data ──
  const insideGuests = mockGuests.filter((g) => g.status === "inside");
  const filteredGuests = insideGuests.filter(
    (g) =>
      !tabSearch ||
      g.name.toLowerCase().includes(tabSearch.toLowerCase()) ||
      g.tabNumber.toString().includes(tabSearch)
  );
  const filteredTables = mockTables.filter(
    (t) =>
      !tabSearch ||
      t.number.toString().includes(tabSearch) ||
      t.guestName?.toLowerCase().includes(tabSearch.toLowerCase())
  );
  const categoryItems = menuItems.filter((m) => m.category === activeCategory);
  const selectedGuest = insideGuests.find((g) => g.id === selectedTab);
  const selectedTableObj = mockTables.find((t) => t.id === selectedTable);
  const hasTarget = !!(selectedTab || selectedTable);

  const orderTotal = order.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
    return sum + (item.menuItem.price + extrasTotal) * item.quantity;
  }, 0);
  const tipAmount = selectedTip ? (orderTotal * selectedTip) / 100 : 0;
  const totalWithTip = orderTotal + tipAmount;

  // ── Handlers ──
  const addItemToOrder = (item) => {
    setOrder((prev) => {
      const existing = prev.find((o) => o.menuItem.id === item.id);
      if (existing) {
        return prev.map((o) =>
          o.menuItem.id === item.id ? { ...o, quantity: o.quantity + 1 } : o
        );
      }
      const defaultExtras = (item.extras || [])
        .filter((e) => e.defaultSelected)
        .map((e) => ({ extraId: e.id, name: e.name, price: e.price }));
      return [...prev, { menuItem: item, quantity: 1, selectedExtras: defaultExtras, note: "" }];
    });
  };

  const handleAddItem = (item) => {
    // TAP mode: no ID verification — add directly
    if (mode === "tap") {
      addItemToOrder(item);
      return;
    }
    // TABLE mode: verify ID once per table for alcoholic items
    if (alcoholicCategories.includes(item.category)) {
      if (selectedTable && verifiedTables.has(selectedTable)) {
        addItemToOrder(item);
        return;
      }
      setShowAgeCheck(item);
      return;
    }
    addItemToOrder(item);
  };

  const handleAgeConfirm = () => {
    if (showAgeCheck) {
      if (mode === "table" && selectedTable) {
        setVerifiedTables((prev) => new Set(prev).add(selectedTable));
      }
      addItemToOrder(showAgeCheck);
      setShowAgeCheck(null);
    }
  };

  const handleConfirmGuest = () => {
    setSelectedTab(showConfirm);
    setSelectedTable(null);
    setShowConfirm(null);
  };

  const handleSelectTable = (tableId) => {
    setSelectedTable(tableId);
    setSelectedTab(null);
  };

  const updateItemQty = (itemId, delta) => {
    setOrder((prev) =>
      prev
        .map((o) =>
          o.menuItem.id === itemId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o
        )
        .filter((o) => o.quantity > 0)
    );
  };

  const removeItem = (itemId) => {
    setOrder((prev) => prev.filter((o) => o.menuItem.id !== itemId));
    if (editingItem === itemId) setEditingItem(null);
  };

  const toggleExtra = (itemId, extra) => {
    setOrder((prev) =>
      prev.map((o) => {
        if (o.menuItem.id !== itemId) return o;
        const has = o.selectedExtras.find((e) => e.extraId === extra.id);
        return {
          ...o,
          selectedExtras: has
            ? o.selectedExtras.filter((e) => e.extraId !== extra.id)
            : [...o.selectedExtras, { extraId: extra.id, name: extra.name, price: extra.price }],
        };
      })
    );
  };

  const updateNote = (itemId, note) => {
    setOrder((prev) =>
      prev.map((o) => (o.menuItem.id === itemId ? { ...o, note } : o))
    );
  };

  const handleConfirmOrder = () => {
    if (order.length === 0) return;
    // TAP mode: verify identity before proceeding to payment
    if (mode === "tap" && selectedTab) {
      setShowIdentityCheck(true);
      return;
    }
    setShowPayment(true);
    setPaymentStep("tip");
    setSelectedTip(null);
  };

  const handleIdentityConfirmed = () => {
    setShowIdentityCheck(false);
    setShowPayment(true);
    setPaymentStep("tip");
    setSelectedTip(null);
  };

  const handleCharge = () => {
    setPaymentStep("done");
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setOrder([]);
    setSelectedTab(null);
    setSelectedTable(null);
    setPaymentStep("tip");
    setSelectedTip(null);
    toast.success("Order completed!");
  };

  const clearTarget = () => {
    setSelectedTab(null);
    setSelectedTable(null);
  };

  // ── Target info for order panel ──
  const targetName =
    mode === "tap"
      ? selectedGuest?.name
      : selectedTableObj?.guestName || `Table #${selectedTableObj?.number}`;
  const targetBadge =
    mode === "tap"
      ? `#${selectedGuest?.tabNumber}`
      : `#${selectedTableObj?.number}`;

  // ── Content blocks (shared between standalone and embedded) ──
  const topBar = (
    <div className="flex items-center justify-between mb-6" data-testid="top-bar">
      {/* Mode Switcher (only in standalone) */}
      {showModeSwitcher && (
        <div
          className="flex items-center gap-2 bg-card/60 backdrop-blur border border-border/30 rounded-2xl p-1.5"
          data-testid="mode-switcher"
        >
          {[
            { key: "tap", label: "TAP", icon: Zap },
            { key: "table", label: "TABLE", icon: LayoutGrid },
          ].map((m) => {
            const isActive = mode === m.key;
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`mode-${m.key}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bar-mode"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right: Server Selector + Tab Count */}
      <div className={cn("flex items-center gap-3", !showModeSwitcher && "ml-auto")}>
        {/* Server Selector */}
        <div className="relative group" data-testid="server-selector">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={server || ""}
            onChange={(e) => setServer(e.target.value || null)}
            className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-border/30 bg-card/60 backdrop-blur text-sm font-medium text-foreground hover:border-primary/30 focus:border-primary/40 focus:outline-none transition-colors"
            data-testid="server-select"
          >
            <option value="">Select server...</option>
            {servers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>

        {/* Tab Counter (TAP only) */}
        {mode === "tap" && (
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20"
            data-testid="tab-counter"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary tabular-nums">
              Tabs: {insideGuests.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Shared grid content ──
  const gridContent = (
          <div
            className="grid grid-cols-1 lg:grid-cols-[200px_72px_1fr_300px] gap-4 min-h-[calc(100vh-12rem)]"
            data-testid="main-grid"
          >
            {/* ── Col 1: Left Panel ── */}
            <div className="space-y-4" data-testid="left-panel">
              {mode === "tap" ? (
                <>
                  {/* Search */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                      <Search className="h-3 w-3" />
                      Scan / Search
                    </div>
                    <input
                      type="text"
                      value={tabSearch}
                      onChange={(e) => setTabSearch(e.target.value)}
                      placeholder="Name or #tab..."
                      className="w-full h-9 px-3 rounded-xl border border-border/30 bg-card/40 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(258_75%_58%/0.1)] transition-all"
                      data-testid="tab-search"
                    />
                  </div>
                  {/* Open Tabs */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                      Open Tabs ({insideGuests.length})
                    </div>
                    <div className="space-y-1.5 max-h-[calc(100vh-24rem)] overflow-y-auto">
                      {filteredGuests.map((guest) => (
                        <motion.button
                          key={guest.id}
                          whileHover={{ x: 2 }}
                          onClick={() => setShowConfirm(guest.id)}
                          className={cn(
                            "w-full text-left px-3 py-3 rounded-xl border transition-all",
                            selectedTab === guest.id
                              ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
                              : "border-border/30 bg-card/40 hover:border-primary/20"
                          )}
                          data-testid={`tab-${guest.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 flex-shrink-0" />
                            <span className="text-xs font-semibold text-foreground flex-1 truncate">
                              {guest.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                              #{guest.tabNumber}
                            </span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="flex items-center justify-between mt-1 pl-4">
                            <span className="text-[10px] text-muted-foreground">
                              Tab #{guest.tabNumber}
                            </span>
                            <span className="text-sm font-extrabold text-foreground tabular-nums">
                              ${guest.totalSpent.toFixed(2)}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* TABLE mode search */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                      <Search className="h-3 w-3" />
                      Tables
                    </div>
                    <input
                      type="text"
                      value={tabSearch}
                      onChange={(e) => setTabSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full h-9 px-3 rounded-xl border border-border/30 bg-card/40 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(258_75%_58%/0.1)] transition-all"
                      data-testid="table-search"
                    />
                  </div>
                  {/* Table Grid */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                      Tables ({mockTables.length})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredTables.map((table) => {
                        const isFree = table.status === "free";
                        const isSelected = selectedTable === table.id;
                        return (
                          <motion.button
                            key={table.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleSelectTable(table.id)}
                            className={cn(
                              "flex flex-col items-center p-3 rounded-xl border transition-all",
                              isSelected
                                ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                                : isFree
                                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                                  : "border-border/30 bg-card/40 hover:border-muted-foreground/30"
                            )}
                            data-testid={`table-${table.id}`}
                          >
                            <span className="text-sm font-extrabold text-foreground">
                              #{table.number}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">
                                {table.seats}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1",
                                isFree
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-muted/50 text-muted-foreground"
                              )}
                            >
                              {isFree ? "Free" : "Busy"}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Col 2: Category Sidebar ── */}
            <div className="flex flex-col gap-1" data-testid="category-sidebar">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border transition-all",
                    activeCategory === cat
                      ? `bg-gradient-to-b ${categoryColors[cat]} shadow-lg`
                      : "border-transparent hover:bg-card/40 hover:border-border/20"
                  )}
                  data-testid={`cat-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="text-xl">{categoryEmojis[cat]}</span>
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      activeCategory === cat
                        ? categoryAccents[cat]
                        : "text-muted-foreground"
                    )}
                  >
                    {cat}
                  </span>
                </motion.button>
              ))}
              {/* Custom button */}
              <button
                className="flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/30 mt-auto transition-colors"
                data-testid="custom-btn"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-[9px] font-bold text-muted-foreground">Custom</span>
              </button>
            </div>

            {/* ── Col 3: Menu Area ── */}
            <div className="min-w-0" data-testid="menu-area">
              {/* Category Header Banner */}
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 mb-5 p-4 rounded-2xl bg-gradient-to-r border ${categoryColors[activeCategory]}`}
                data-testid="category-header"
              >
                <span className="text-3xl">{categoryEmojis[activeCategory]}</span>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground tracking-normal">
                    {activeCategory}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {categoryItems.length} items
                  </p>
                </div>
              </motion.div>

              {/* Menu Grid */}
              <div
                className="grid grid-cols-2 xl:grid-cols-3 gap-3"
                data-testid="menu-grid"
              >
                {categoryItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAddItem(item)}
                    className="text-left p-4 rounded-2xl border border-border/30 bg-card/50 backdrop-blur group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all"
                    data-testid={`menu-${item.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                    <p
                      className={`text-lg font-extrabold tabular-nums ${categoryAccents[activeCategory]}`}
                    >
                      ${item.price.toFixed(2)}
                    </p>
                    {item.extras?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {item.extras.length} extras
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Col 4: Order Panel ── */}
            <div
              className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl h-fit sticky top-24 overflow-hidden"
              data-testid="order-panel"
            >
              {/* Header */}
              <div className="flex items-center gap-2 p-4 border-b border-border/20">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground tracking-normal">Order</span>
                {order.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">
                    {order.length}
                  </span>
                )}
              </div>

              {/* Active Target Header */}
              {hasTarget && (
                <div className="p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {targetBadge}
                      </span>
                      <p className="text-sm font-bold text-foreground mt-1">
                        {targetName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        {mode === "tap" && selectedGuest && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(selectedGuest.checkedInAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                        {mode === "table" && selectedTableObj?.server && (
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {selectedTableObj.server}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={clearTarget}
                      className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                      data-testid="clear-target"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Order Content */}
              {order.length === 0 && !hasTarget ? (
                /* Empty State */
                <div className="text-center py-12 px-4" data-testid="order-empty">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-3">
                    <ShoppingCart className="h-7 w-7 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No active order
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {mode === "tap"
                      ? "Select a tab or scan NFC to start"
                      : "Select a table to start"}
                  </p>
                </div>
              ) : order.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-xs text-muted-foreground/60">
                    Add items from the menu
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  {/* Order Items */}
                  <AnimatePresence mode="popLayout">
                    {order.map((item) => (
                      <motion.div
                        key={item.menuItem.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="mb-3"
                      >
                        {/* Item Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-extrabold text-primary">
                                {item.quantity}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {item.menuItem.name}
                              </p>
                              {item.selectedExtras.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedExtras.map((e) => (
                                    <span
                                      key={e.extraId}
                                      className="text-[8px] font-medium bg-primary/10 text-primary px-1 py-0.5 rounded"
                                    >
                                      {e.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.note && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MessageSquare className="h-2 w-2 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground italic">
                                    {item.note}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            $
                            {(
                              (item.menuItem.price +
                                item.selectedExtras.reduce(
                                  (s, e) => s + e.price,
                                  0
                                )) *
                              item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 mt-1.5 pl-9">
                          <button
                            onClick={() =>
                              setEditingItem(
                                editingItem === item.menuItem.id
                                  ? null
                                  : item.menuItem.id
                              )
                            }
                            className={cn(
                              "text-[10px] font-medium px-2 py-1 rounded-md border transition-all flex items-center gap-1",
                              editingItem === item.menuItem.id
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/20 text-muted-foreground hover:border-primary/20"
                            )}
                            data-testid={`edit-${item.menuItem.id}`}
                          >
                            <Pencil className="h-2.5 w-2.5" /> Item details
                          </button>
                          <button
                            onClick={() => removeItem(item.menuItem.id)}
                            className="text-[10px] font-medium px-2 py-1 rounded-md border border-border/20 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all flex items-center gap-1"
                            data-testid={`remove-${item.menuItem.id}`}
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Remove
                          </button>
                        </div>

                        {/* Edit Panel */}
                        <AnimatePresence>
                          {editingItem === item.menuItem.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-9 mt-2 p-3 rounded-xl bg-muted/20 border border-border/20 space-y-3">
                                {/* Qty */}
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                                    Qty
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        updateItemQty(item.menuItem.id, -1)
                                      }
                                      className="h-6 w-6 rounded-md border border-border/30 bg-card/40 flex items-center justify-center hover:border-primary/30 transition-colors"
                                    >
                                      <Minus className="h-2.5 w-2.5" />
                                    </button>
                                    <span className="text-sm font-bold tabular-nums w-6 text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateItemQty(item.menuItem.id, 1)
                                      }
                                      className="h-6 w-6 rounded-md border border-border/30 bg-card/40 flex items-center justify-center hover:border-primary/30 transition-colors"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                                {/* Extras */}
                                {item.menuItem.extras?.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                                      Extras
                                    </div>
                                    <div className="space-y-1.5">
                                      {item.menuItem.extras.map((extra) => {
                                        const isSelected =
                                          item.selectedExtras.some(
                                            (e) => e.extraId === extra.id
                                          );
                                        return (
                                          <button
                                            key={extra.id}
                                            onClick={() =>
                                              toggleExtra(item.menuItem.id, extra)
                                            }
                                            className="flex items-center gap-2 w-full text-left"
                                          >
                                            <div
                                              className={cn(
                                                "h-3.5 w-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                                isSelected
                                                  ? "border-primary bg-primary"
                                                  : "border-muted-foreground/30"
                                              )}
                                            >
                                              {isSelected && (
                                                <Check className="h-2 w-2 text-primary-foreground" />
                                              )}
                                            </div>
                                            <span className="text-xs text-foreground flex-1">
                                              {extra.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                              {extra.price > 0
                                                ? `+$${extra.price.toFixed(2)}`
                                                : "Free"}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {/* Note */}
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                                    Note
                                  </div>
                                  <input
                                    type="text"
                                    value={item.note}
                                    onChange={(e) =>
                                      updateNote(item.menuItem.id, e.target.value)
                                    }
                                    placeholder="e.g. no ice, double shot..."
                                    className="w-full h-7 px-2 rounded-lg border border-border/20 bg-card/40 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Total + Actions */}
                  <div className="border-t border-border/20 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-foreground">
                        Total
                      </span>
                      <span
                        className="text-2xl font-extrabold text-primary tabular-nums"
                        data-testid="order-total"
                      >
                        ${orderTotal.toFixed(2)}
                      </span>
                    </div>
                    {/* Payment Method */}
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
                      Payment Method
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/30 bg-card/40 text-sm font-medium hover:border-primary/30 transition-colors"
                        data-testid="pay-here-btn"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Pay Here
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/30 bg-card/40 text-sm font-medium hover:border-primary/30 transition-colors"
                        data-testid="register-btn"
                      >
                        <Banknote className="h-3.5 w-3.5" /> Register
                      </motion.button>
                    </div>
                    {/* Confirm */}
                    <button
                      onClick={handleConfirmOrder}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 transition-all"
                      data-testid="confirm-order-btn"
                    >
                      Confirm Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
  );

  // ── Shared modals ──
  const allModals = (
      <>

      {/* Guest Confirmation Modal */}
      <AnimatePresence>
        {showConfirm &&
          (() => {
            const guest = insideGuests.find((g) => g.id === showConfirm);
            if (!guest) return null;
            return (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
                  onClick={() => setShowConfirm(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", bounce: 0.2 }}
                  className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                >
                  <div
                    className="w-full max-w-sm bg-card border border-border/30 rounded-3xl p-8 shadow-2xl text-center"
                    data-testid="guest-confirm-modal"
                  >
                    {guest.photo ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.3, delay: 0.1 }}
                        className="mb-4"
                      >
                        <img
                          src={guest.photo}
                          alt={guest.name}
                          className="h-24 w-24 rounded-full object-cover mx-auto border-4 border-primary/30 shadow-xl shadow-primary/10"
                          data-testid="guest-confirm-photo"
                        />
                      </motion.div>
                    ) : (
                      <div className="mx-auto h-20 w-20 rounded-full bg-muted/30 border-2 border-border/30 flex items-center justify-center mb-4">
                        <User className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <h3 className="text-xl font-extrabold text-foreground tracking-normal">
                      {guest.name}
                    </h3>
                    <span className="inline-block text-xs font-mono font-bold bg-muted/50 px-3 py-1 rounded-full mt-2 mb-3">
                      Tab #{guest.tabNumber}
                    </span>
                    <p className="text-sm text-muted-foreground mb-6">
                      Confirm this is the correct guest before proceeding.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors"
                        data-testid="confirm-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmGuest}
                        className="py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                        data-testid="confirm-ok"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            );
          })()}
      </AnimatePresence>

      {/* Identity Verification Modal (TAP anti-fraud) */}
      <AnimatePresence>
        {showIdentityCheck && selectedGuest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
              onClick={() => setShowIdentityCheck(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-sm bg-card border border-border/30 rounded-3xl p-8 shadow-2xl text-center"
                data-testid="identity-verify-modal"
              >
                {/* Photo */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.3, delay: 0.1 }}
                  className="mx-auto mb-5"
                >
                  {selectedGuest.photo ? (
                    <img
                      src={selectedGuest.photo}
                      alt={selectedGuest.name}
                      className="h-28 w-28 rounded-full object-cover mx-auto border-4 border-primary/30 shadow-xl shadow-primary/10"
                      data-testid="identity-photo"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-primary/30 flex items-center justify-center mx-auto">
                      <span className="text-3xl font-extrabold text-primary">
                        {selectedGuest.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Name */}
                <h3
                  className="text-2xl font-extrabold text-foreground tracking-normal mb-1"
                  data-testid="identity-name"
                >
                  {selectedGuest.name}
                </h3>

                {/* Tab badge */}
                <span className="inline-block text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full mb-2">
                  Tab #{selectedGuest.tabNumber}
                </span>

                {/* Tier + check-in time */}
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-5">
                  {selectedGuest.tier && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {selectedGuest.tier}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    In since {new Date(selectedGuest.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Order summary */}
                <div className="bg-muted/20 rounded-xl p-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order total</span>
                    <span className="font-extrabold text-primary tabular-nums">
                      ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {order.length} {order.length === 1 ? "item" : "items"}
                  </p>
                </div>

                {/* Warning */}
                <p className="text-sm text-muted-foreground mb-6">
                  Confirm this is <span className="font-bold text-foreground">{selectedGuest.name}</span> before charging.
                </p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowIdentityCheck(false)}
                    className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors"
                    data-testid="identity-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleIdentityConfirmed}
                    className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all"
                    data-testid="identity-confirm"
                  >
                    Confirm Identity
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Age Verification Modal */}
      <AnimatePresence>
        {showAgeCheck && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
              onClick={() => setShowAgeCheck(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-sm bg-card border border-border/30 rounded-3xl p-8 shadow-2xl text-center"
                data-testid="age-verify-modal"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
                  className="mx-auto h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mb-4"
                >
                  <Shield className="h-8 w-8 text-warning" />
                </motion.div>
                <h3 className="text-xl font-extrabold text-foreground tracking-normal mb-2">
                  Age Verification Required
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-bold text-foreground">
                    {showAgeCheck.name}
                  </span>{" "}
                  is an alcoholic beverage.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  I confirm this guest is 21+ years old.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowAgeCheck(null)}
                    className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors"
                    data-testid="age-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAgeConfirm}
                    className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all"
                    data-testid="age-confirm"
                  >
                    Confirm 21+
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment / Tip Modal */}
      <AnimatePresence>
        {showPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
              onClick={() => setShowPayment(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md bg-card border border-border/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                data-testid="payment-modal"
              >
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/10 blur-[60px] pointer-events-none" />
                {/* Close */}
                <button
                  onClick={() => setShowPayment(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors z-10"
                  data-testid="payment-close"
                >
                  <X className="h-4 w-4" />
                </button>

                {paymentStep === "tip" ? (
                  <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-foreground tracking-normal mb-4">
                      Add Tip
                    </h3>
                    {hasTarget && (
                      <p className="text-sm text-foreground font-medium mb-1">
                        {targetName}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                      Subtotal:{" "}
                      <span className="font-bold text-foreground">
                        ${orderTotal.toFixed(2)}
                      </span>
                    </p>

                    {/* Tip Options */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[18, 20, 22].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setSelectedTip(pct)}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-2xl border-2 transition-all",
                            selectedTip === pct
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                              : "border-border/30 bg-card/40 hover:border-primary/20"
                          )}
                          data-testid={`tip-${pct}`}
                        >
                          <span className="text-lg font-extrabold">{pct}%</span>
                          <span className="text-[10px] text-muted-foreground">
                            ${((orderTotal * pct) / 100).toFixed(2)}
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedTip(null)}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-2xl border-2 transition-all",
                          selectedTip === null ||
                            ![18, 20, 22].includes(selectedTip)
                            ? "border-border/30 bg-card/40"
                            : "border-border/30 bg-card/40 hover:border-primary/20"
                        )}
                      >
                        <span className="text-sm font-bold text-muted-foreground">
                          $
                        </span>
                      </button>
                    </div>

                    {/* Summary */}
                    <div className="bg-muted/20 rounded-xl p-4 mb-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-bold text-foreground tabular-nums">
                          ${orderTotal.toFixed(2)}
                        </span>
                      </div>
                      {selectedTip && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Tip ({selectedTip}%)
                          </span>
                          <span className="font-bold text-foreground tabular-nums">
                            ${tipAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border/20 pt-2">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="text-xl font-extrabold text-primary tabular-nums">
                          ${totalWithTip.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Charge Button */}
                    <button
                      onClick={handleCharge}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                      data-testid="charge-btn"
                    >
                      <CreditCard className="h-4 w-4" />
                      Charge ${totalWithTip.toFixed(2)}
                    </button>
                  </div>
                ) : (
                  /* Done Step */
                  <div className="relative z-10 text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                      className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
                    >
                      <Check className="h-8 w-8 text-emerald-400" />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold text-foreground tracking-normal mb-2">
                      Order Sent!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Payment registered successfully
                    </p>
                    <button
                      onClick={handleClosePayment}
                      className="px-6 py-2.5 rounded-xl bg-muted/50 font-semibold text-foreground hover:bg-muted transition-colors"
                      data-testid="close-done"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </>
  );

  // ── Embedded mode (inside PulseLayout) ──
  if (embedded) {
    return (
      <>
        {topBar}
        {gridContent}
        {allModals}
      </>
    );
  }

  // ── Standalone mode (own navbar) ──
  return (
    <div className="pulse-scope min-h-screen bg-background text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[400px] w-[800px] mx-auto rounded-full bg-primary/5 blur-[120px]" />

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex h-16 items-center gap-2 border-b border-border/50 bg-card/70 px-6 backdrop-blur-xl"
        data-testid="orders-navbar"
      >
        <div className="flex items-center gap-2.5">
          <img src={spetIcon} alt="spet" className="h-6 w-6 rounded-md" />
          <span
            className="text-foreground text-base leading-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
          >
            spet.
          </span>
        </div>
        <div className="mx-4 h-7 w-px bg-border/50" />
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          data-testid="venue-selector"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-primary-foreground">
            DC
          </span>
          Demo Club
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            data-testid="theme-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="h-7 w-px bg-border/50" />
          <button
            onClick={() => navigate("/venue/home")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            data-testid="home-btn"
          >
            <Home className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            data-testid="logout-btn"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-6 py-8"
        >
          {topBar}
          {gridContent}
        </motion.div>
      </main>

      {allModals}
    </div>
  );
}

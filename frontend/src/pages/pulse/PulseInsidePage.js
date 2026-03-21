import { useState } from "react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Zap, Clock, Search, X, ArrowLeft, User,
  Trophy, Calendar, TrendingUp, Hash,
} from "lucide-react";
import { mockGuests } from "../../data/pulseData";

const getStayDuration = (checkedInAt) => {
  const ms = Math.max(0, Date.now() - new Date(checkedInAt).getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export default function PulseInsidePage() {
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState(null);

  const insideGuests = mockGuests.filter((g) => g.status === "inside");
  const filteredGuests = insideGuests.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.tabNumber.toString().includes(search)
  );

  const totalSpend = insideGuests.reduce((s, g) => s + g.totalSpent, 0);

  const avgStayMs =
    insideGuests.length > 0
      ? insideGuests.reduce(
          (s, g) => s + Math.max(0, Date.now() - new Date(g.checkedInAt).getTime()),
          0
        ) / insideGuests.length
      : 0;
  const avgH = Math.floor(avgStayMs / 3600000);
  const avgM = Math.floor((avgStayMs % 3600000) / 60000);

  const kpis = [
    {
      label: "Total Spend", value: `$${totalSpend.toFixed(2)}`,
      icon: Zap, gradient: "from-primary/20 to-primary/5",
      iconColor: "text-amber-500", iconBg: "bg-amber-500/10",
    },
    {
      label: "Avg Stay", value: `${avgH}h ${avgM}m`,
      icon: Clock, gradient: "from-muted/60 to-muted/20",
      iconColor: "text-muted-foreground", iconBg: "bg-muted/50",
    },
  ];

  const guest = selectedGuest
    ? mockGuests.find((g) => g.id === selectedGuest)
    : null;

  return (
    <PulseLayout>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-normal" data-testid="inside-title">
            Live Floor
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time guest presence
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4 mb-6" data-testid="inside-kpis">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${kpi.gradient} p-5`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {kpi.label}
                  </div>
                  <div className="text-xl font-extrabold text-foreground tabular-nums tracking-tight">
                    {kpi.value}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Inside Now */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 p-5"
          data-testid="kpi-inside-now"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" />
              </div>
              <div className="text-5xl font-extrabold text-foreground tabular-nums tracking-tight leading-none">
                {insideGuests.length}
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              Inside Now
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find guest..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border/30 bg-card/40 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(258_75%_58%/0.1)] transition-all"
            data-testid="inside-search"
          />
        </div>
      </motion.div>

      {/* Guest Cards Grid */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-16" data-testid="inside-empty">
          <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "No matches" : "No guests inside right now"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="inside-guests-grid">
          {filteredGuests.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedGuest(g.id)}
              className="bg-gradient-to-br from-violet-400/25 to-transparent p-px rounded-2xl cursor-pointer"
              data-testid={`inside-guest-${g.id}`}
            >
              {/* Inner card */}
              <div className="relative bg-card rounded-[15px] p-5 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-400/10 blur-xl pointer-events-none" />

                {/* Avatar + Name */}
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  {g.photo ? (
                    <img src={g.photo} alt={g.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-violet-400">
                        {g.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-foreground">{g.name}</p>
                    <p className="text-sm text-muted-foreground">#{g.tabNumber}</p>
                  </div>
                </div>

                {/* Stats row — mini-cards */}
                <div className="relative z-10 grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tier</span>
                    <span className="text-sm font-bold text-foreground">{g.tier}</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Spent</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">${g.totalSpent.toFixed(0)}</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Time</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{getStayDuration(g.checkedInAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ Guest Detail Drawer ═══ */}
      <AnimatePresence>
        {guest && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={() => setSelectedGuest(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl flex flex-col"
              data-testid="guest-drawer"
            >
              {/* ── 1. Header ── */}
              <div className="p-6 border-b border-border/30">
                <div className="flex items-start justify-between mb-4">
                  <button
                    onClick={() => setSelectedGuest(null)}
                    className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    data-testid="drawer-close"
                  >
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Inside
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {guest.photo ? (
                    <img
                      src={guest.photo}
                      alt={guest.name}
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border-2 border-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {guest.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground tracking-normal">
                      {guest.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        #{guest.tabNumber}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getStayDuration(guest.checkedInAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* ── 2. Current Session ── */}
                <div data-testid="drawer-session">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Current Session
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Check-in
                      </div>
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {new Date(guest.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Duration
                      </div>
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {getStayDuration(guest.checkedInAt)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-primary/70 mb-1">
                        Spent
                      </div>
                      <p className="text-sm font-extrabold text-primary tabular-nums">
                        ${guest.totalSpent.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── 3. Consumption Timeline ── */}
                {guest.timeline && guest.timeline.length > 0 && (
                  <div data-testid="drawer-timeline">
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                      Consumption
                    </div>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[23px] top-2 bottom-2 w-px bg-border/30" />

                      <div className="space-y-0">
                        {guest.timeline.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-2 relative">
                            {/* Dot */}
                            <div className="relative z-10 flex-shrink-0 w-[47px] text-right">
                              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                                {new Date(entry.time).toLocaleTimeString([], {
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="relative z-10 h-2 w-2 rounded-full bg-primary/60 ring-2 ring-card flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground truncate">
                                {entry.item}
                              </span>
                              <span className="text-xs font-bold text-muted-foreground tabular-nums ml-2">
                                ${entry.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 4. History ── */}
                {guest.history && (
                  <div data-testid="drawer-history">
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                      History
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Visits
                          </span>
                        </div>
                        <p className="text-lg font-extrabold text-foreground tabular-nums">
                          {guest.history.visits}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Last Visit
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(guest.history.lastVisit).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Avg Spend
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          ${guest.history.avgSpend.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Avg Stay
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {guest.history.avgStay}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 5. Profile ── */}
                <div data-testid="drawer-profile">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Profile
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{guest.tier}</p>
                      <p className="text-xs text-muted-foreground">Current tier</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-primary tabular-nums">
                        {guest.points?.toLocaleString() || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">points</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PulseLayout>
  );
}

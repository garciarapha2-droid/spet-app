import { useState } from "react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import { motion } from "framer-motion";
import { Users, Zap, Clock, Search } from "lucide-react";
import { mockGuests } from "../../data/pulseData";

export default function PulseInsidePage() {
  const [search, setSearch] = useState("");

  const insideGuests = mockGuests.filter((g) => g.status === "inside");
  const filteredGuests = insideGuests.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.tabNumber.toString().includes(search)
  );

  const totalSpend = insideGuests.reduce((s, g) => s + g.totalSpent, 0);

  const getStayDuration = (checkedInAt) => {
    const ms = Date.now() - new Date(checkedInAt).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const avgStayMs =
    insideGuests.length > 0
      ? insideGuests.reduce(
          (s, g) => s + (Date.now() - new Date(g.checkedInAt).getTime()),
          0
        ) / insideGuests.length
      : 0;
  const avgH = Math.floor(avgStayMs / 3600000);
  const avgM = Math.floor((avgStayMs % 3600000) / 60000);

  const kpis = [
    {
      label: "Total Spend",
      value: `$${totalSpend.toFixed(2)}`,
      icon: Zap,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Avg Stay",
      value: `${avgH}h ${avgM}m`,
      icon: Clock,
      gradient: "from-muted/60 to-muted/20",
      iconColor: "text-muted-foreground",
      iconBg: "bg-muted/50",
    },
  ];

  return (
    <PulseLayout>
      {/* Title */}
      <div className="flex items-center justify-between mb-8">
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
      <div className="grid grid-cols-3 gap-4 mb-8" data-testid="inside-kpis">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${kpi.gradient} p-5`}
              data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
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

        {/* Inside Now — prominent card */}
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
              <div>
                <div className="text-5xl font-extrabold text-foreground tabular-nums tracking-tight leading-none">
                  {insideGuests.length}
                </div>
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
        className="mb-8"
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
          {filteredGuests.map((guest, i) => (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="p-5 rounded-2xl border border-border/30 bg-card/60 backdrop-blur hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
              data-testid={`inside-guest-${guest.id}`}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                {guest.photo ? (
                  <img
                    src={guest.photo}
                    alt={guest.name}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {guest.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {guest.name}
                  </p>
                  <p className="text-xs font-mono text-primary/70">
                    #{guest.tabNumber}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                    Tier
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {guest.tier}
                  </p>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                    Spent
                  </div>
                  <p className="text-xs font-semibold text-foreground tabular-nums">
                    ${guest.totalSpent.toFixed(0)}
                  </p>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                    Time
                  </div>
                  <p className="text-xs font-semibold text-foreground tabular-nums">
                    {getStayDuration(guest.checkedInAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PulseLayout>
  );
}

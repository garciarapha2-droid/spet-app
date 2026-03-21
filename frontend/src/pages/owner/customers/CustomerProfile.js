import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, TrendingUp, ShieldX, Scan, UserPlus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] },
});

const entryGuests = [
  { id: "pg1", name: "Sofia Cardoso", tabNumber: 106, status: "inside", tier: "Gold", checkedInAt: "2026-03-20T21:15:00" },
  { id: "pg2", name: "Lucas Oliveira", tabNumber: 107, status: "inside", tier: "Silver", checkedInAt: "2026-03-20T22:00:00" },
  { id: "pg3", name: "John Smith", tabNumber: 104, status: "inside", tier: "Bronze", checkedInAt: "2026-03-20T22:30:00" },
  { id: "pg4", name: "Maria Santos", tabNumber: 101, status: "exited", tier: "Platinum", checkedInAt: "2026-03-20T19:00:00" },
  { id: "pg5", name: "Pedro Almeida", tabNumber: 102, status: "exited", tier: "Bronze", checkedInAt: "2026-03-20T20:00:00" },
];

const tierColors = {
  Gold:     { avatar: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  Silver:   { avatar: "bg-gray-100 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300", badge: "bg-gray-100 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300" },
  Bronze:   { avatar: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400", badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
  Platinum: { avatar: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400", badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" },
};

const statusColors = {
  inside: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  exited: "bg-muted text-muted-foreground",
};

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [scanInput, setScanInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const insideCount = entryGuests.filter(g => g.status === "inside").length;
  const deniedCount = 0;

  const kpis = [
    { label: "GUESTS INSIDE", value: insideCount, icon: Users, color: "bg-primary", iconColor: "text-primary", live: true },
    { label: "TOTAL ENTRIES", value: entryGuests.length, icon: TrendingUp, color: "bg-emerald-500", iconColor: "text-emerald-500" },
    { label: "DENIED", value: deniedCount, icon: ShieldX, color: "bg-destructive", iconColor: "text-destructive" },
  ];

  const handleScan = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const q = scanInput.trim().toLowerCase();
    const match = entryGuests.find(g =>
      g.name.toLowerCase().includes(q) || g.tabNumber.toString() === q.replace("#", "")
    );
    if (match) {
      toast.success(`Found ${match.name}`);
    } else {
      toast.error("No matching guest or tab found");
    }
    setScanInput("");
  };

  return (
    <div className="flex flex-col gap-0" data-testid="customer-profile-entry">

      {/* Seção 1 — KPIs */}
      <div className="grid grid-cols-3 gap-6 mb-8" data-testid="cp-kpi-grid">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp(i * 0.08)}
            className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50"
            data-testid={`cp-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className={`w-1 h-10 rounded-full ${kpi.color}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-foreground tabular-nums">{kpi.value}</span>
                {kpi.live && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Seção 2 — Scan NFC + Manual Entry */}
      <motion.div {...fadeUp(0.25)} className="mb-8" data-testid="cp-scan-section">
        <div className="flex items-center gap-2 mb-2">
          <Scan className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">SCAN NFC TAG</span>
        </div>

        <div className="flex items-stretch gap-3">
          {/* Scan Input */}
          <form onSubmit={handleScan} className="flex-1 relative">
            {/* Glow wrapper */}
            <div className={`absolute -inset-px rounded-2xl blur-sm bg-gradient-to-r from-primary/40 via-primary/10 to-transparent transition-opacity duration-500 pointer-events-none ${isFocused ? "opacity-100" : "opacity-0"}`} />
            <div className="relative">
              <Scan className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${isFocused ? "text-primary" : "text-muted-foreground"}`} />
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Scan NFC or type name..."
                autoFocus
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-border/50 bg-card text-foreground text-base font-medium placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
                data-testid="cp-nfc-scan-input"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 pl-1">Place tag on reader or type UID and press Enter</p>
          </form>

          {/* Manual Entry Button */}
          <button
            onClick={() => navigate("/pulse/inside")}
            className="group flex flex-col items-center justify-center px-6 rounded-xl border border-dashed border-border/60 bg-card cursor-pointer min-w-[140px] hover:border-primary/30 hover:bg-primary/5 transition-all"
            data-testid="cp-manual-entry-btn"
          >
            <UserPlus className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-foreground">Manual Entry</span>
            <span className="text-[10px] text-muted-foreground">Without NFC</span>
          </button>
        </div>
      </motion.div>

      {/* Seção 3 — Guests Today */}
      <motion.div {...fadeUp(0.35)} data-testid="cp-guests-today-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Guests Today</h2>
          <span className="text-sm font-semibold text-primary tabular-nums">{entryGuests.length} guests</span>
        </div>

        {entryGuests.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card flex flex-col items-center justify-center py-16" data-testid="cp-guests-empty">
            <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No guests registered yet</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden" data-testid="cp-guests-list">
            {entryGuests.map((guest, idx) => {
              const tc = tierColors[guest.tier] || tierColors.Bronze;
              const sc = statusColors[guest.status] || statusColors.exited;
              return (
                <div
                  key={guest.id}
                  onClick={() => navigate(`/owner/customers/${guest.id}`)}
                  className={`flex items-center px-5 py-3.5 hover:bg-muted/20 transition-colors cursor-pointer group ${idx > 0 ? "border-t border-border/30" : ""}`}
                  data-testid={`cp-guest-row-${guest.id}`}
                >
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${tc.avatar}`}>
                    {getInitials(guest.name)}
                  </div>

                  {/* Name + Tab */}
                  <span className="text-sm font-semibold text-foreground ml-3 group-hover:text-primary transition-colors">{guest.name}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-2">#{guest.tabNumber}</span>

                  <span className="flex-1" />

                  {/* Time */}
                  <span className="text-xs text-muted-foreground tabular-nums mr-3">{formatTime(guest.checkedInAt)}</span>

                  {/* Tier Badge */}
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full mr-3 ${tc.badge}`}>{guest.tier}</span>

                  {/* Status Pill */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${sc}`}>{guest.status}</span>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-2 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

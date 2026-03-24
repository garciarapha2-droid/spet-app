import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, TrendingUp, ShieldX, Wifi, UserPlus } from "lucide-react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import GuestRegistrationPanel from "../../components/pulse/GuestRegistrationPanel";
import { toast } from "sonner";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] },
});

const entryGuests = [
  { id: "pg1", name: "Sofia Cardoso", tabNumber: 106, status: "inside", tier: "Gold", checkedInAt: "2026-03-20T21:15:00", spent: 78, points: 890 },
  { id: "pg2", name: "Lucas Oliveira", tabNumber: 107, status: "inside", tier: "Silver", checkedInAt: "2026-03-20T22:00:00", spent: 45, points: 420 },
  { id: "pg3", name: "John Smith", tabNumber: 104, status: "inside", tier: "Bronze", checkedInAt: "2026-03-20T22:30:00", spent: 32, points: 180 },
  { id: "pg4", name: "Maria Santos", tabNumber: 101, status: "exited", tier: "Platinum", checkedInAt: "2026-03-20T19:00:00", spent: 145, points: 1680 },
  { id: "pg5", name: "Pedro Almeida", tabNumber: 102, status: "exited", tier: "Bronze", checkedInAt: "2026-03-20T20:00:00", spent: 38, points: 95 },
];

const tierStyles = {
  Gold:     { avatar: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", border: "border-l-2 border-l-amber-400" },
  Silver:   { avatar: "bg-gray-200 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300", border: "border-l-2 border-l-gray-400" },
  Bronze:   { avatar: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400", border: "border-l-2 border-l-orange-400" },
  Platinum: { avatar: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400", border: "border-l-2 border-l-violet-400" },
};

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PulseGuest() {
  const navigate = useNavigate();
  const [scanInput, setScanInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [guests, setGuests] = useState(entryGuests);
  const inputRef = useRef(null);

  const insideCount = guests.filter(g => g.status === "inside").length;

  const kpis = [
    { label: "INSIDE", value: insideCount, icon: Users, bg: "bg-primary/10", iconColor: "text-primary/60" },
    { label: "ENTRIES", value: guests.length, icon: TrendingUp, bg: "bg-emerald-500/10", iconColor: "text-emerald-500/60" },
    { label: "DENIED", value: 0, icon: ShieldX, bg: "bg-destructive/10", iconColor: "text-destructive/60" },
  ];

  const handleScan = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const q = scanInput.trim().toLowerCase();
    const match = guests.find(g =>
      g.name.toLowerCase().includes(q) || g.tabNumber.toString() === q.replace("#", "")
    );
    if (match) {
      navigate(`/owner/customers/${match.id}`);
      toast.success(`Found ${match.name}`);
    } else {
      toast.error("No matching guest or tab found");
    }
    setScanInput("");
  };

  return (
    <PulseLayout>
      <div className="flex flex-col gap-0" data-testid="pulse-entry">

        {/* Seção 1 — KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8" data-testid="entry-kpi-grid">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} {...fadeUp(i * 0.08)}
              className={`p-5 rounded-2xl ${kpi.bg}`}
              data-testid={`entry-kpi-${kpi.label.toLowerCase()}`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-5xl font-extrabold text-foreground tabular-nums">{kpi.value}</span>
                <kpi.icon className={`h-8 w-8 ${kpi.iconColor}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Seção 2 — Scan or Search + Manual Entry */}
        <motion.div {...fadeUp(0.25)} className="flex items-stretch gap-4 mb-8" data-testid="scan-section">
          {/* Scan or Search Card */}
          <form onSubmit={handleScan} className="flex-1 rounded-2xl border border-border/50 bg-card p-5 relative">
            {/* Glow */}
            <div className={`absolute -inset-px rounded-2xl blur-sm bg-gradient-to-r from-primary/40 via-primary/10 to-transparent transition-opacity duration-500 pointer-events-none ${isFocused ? "opacity-100" : "opacity-0"}`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">SCAN OR SEARCH</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Name, tab number, NFC tag..."
                autoFocus
                className="w-full h-12 bg-transparent border-none text-lg text-foreground font-medium placeholder:text-muted-foreground/40 focus:outline-none"
                data-testid="nfc-scan-input"
              />
              <p className="text-xs text-muted-foreground/60 mt-2">&#10022; Place tag on reader or type UID and press Enter</p>
            </div>
          </form>

          {/* Manual Entry Card */}
          <button
            onClick={() => setShowRegistration(true)}
            className="group min-w-[180px] rounded-2xl border border-dashed border-border/60 bg-card flex flex-col items-center justify-center gap-1.5 p-5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
            data-testid="manual-entry-btn"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Manual Entry</span>
            <span className="text-[11px] text-muted-foreground">No NFC needed</span>
          </button>
        </motion.div>

        {/* Seção 3 — Today's Guests */}
        <motion.div {...fadeUp(0.35)} data-testid="guests-today-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Today&apos;s Guests</h2>
            <span className="text-sm font-semibold text-primary">{insideCount} active</span>
          </div>

          {guests.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card flex flex-col items-center justify-center py-16" data-testid="guests-empty">
              <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No guests registered yet</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden" data-testid="guests-list">
              {guests.map((guest, idx) => {
                const ts = tierStyles[guest.tier] || tierStyles.Bronze;
                return (
                  <div
                    key={guest.id}
                    onClick={() => navigate(`/owner/customers/${guest.id}`)}
                    className={`flex items-center px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer group ${ts.border} ${idx > 0 ? "border-t border-border/20" : ""}`}
                    data-testid={`guest-row-${guest.id}`}
                  >
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${ts.avatar}`}>
                        {getInitials(guest.name)}
                      </div>
                      <div className="leading-tight">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">{guest.name}</span>
                        <span className="text-xs text-muted-foreground">#{guest.tabNumber} &middot; {guest.tier} &middot; {guest.points} pts</span>
                      </div>
                    </div>

                    {/* Spent + Time */}
                    <div className="flex flex-col items-end ml-auto">
                      <span className="text-base font-bold text-foreground tabular-nums">${guest.spent.toFixed(2)}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(guest.checkedInAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Guest Registration Panel */}
      <GuestRegistrationPanel
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onRegister={(data) => {
          const newId = `pg${Date.now()}`;
          const newTab = 100 + guests.length + 1;
          const newGuest = {
            id: newId,
            name: data.name,
            tabNumber: newTab,
            status: "inside",
            tier: "Bronze",
            checkedInAt: new Date().toISOString(),
            photo: data.avatar || null,
            spent: 0,
            points: 0,
          };
          setGuests(prev => [newGuest, ...prev]);
          setShowRegistration(false);
          toast.success(`${data.name} registrado com sucesso!`);
        }}
      />
    </PulseLayout>
  );
}

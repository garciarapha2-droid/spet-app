import { useState } from "react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import { GuestRegistration } from "../../components/pulse/GuestRegistration";
import { Users, TrendingUp, ShieldX, Nfc, UserPlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Mock Data ──
const mockGuests = [
  {
    id: "g1", name: "Sofia Cardoso", tabNumber: 106, nfcId: "NFC-0042",
    phone: "+55 11 99999-1234", status: "inside", tier: "Gold", points: 2450,
    totalSpent: 78.00, checkedInAt: "2026-03-20T21:15:00",
  },
  {
    id: "g2", name: "Lucas Oliveira", tabNumber: 107, nfcId: "NFC-0088",
    status: "inside", tier: "Silver", points: 680,
    totalSpent: 34.00, checkedInAt: "2026-03-20T22:00:00",
  },
  {
    id: "g3", name: "John Smith", tabNumber: 104,
    status: "inside", tier: "Bronze", points: 120,
    totalSpent: 27.00, checkedInAt: "2026-03-20T22:30:00",
  },
  {
    id: "g4", name: "Maria Santos", tabNumber: 101, nfcId: "NFC-0015",
    status: "exited", tier: "Platinum", points: 5200,
    totalSpent: 156.00, checkedInAt: "2026-03-20T19:00:00",
    checkedOutAt: "2026-03-20T23:00:00",
  },
  {
    id: "g5", name: "Pedro Almeida", tabNumber: 102,
    status: "exited", tier: "Bronze", points: 80,
    totalSpent: 42.00, checkedInAt: "2026-03-20T20:00:00",
    checkedOutAt: "2026-03-20T22:30:00",
  },
];

export default function PulseGuest() {
  const [scanInput, setScanInput] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [guests, setGuests] = useState(mockGuests);
  const [prefillNfc, setPrefillNfc] = useState(undefined);

  const insideGuests = guests.filter((g) => g.status === "inside");
  const totalEntries = guests.length;

  const handleManualEntry = () => {
    setPrefillNfc(undefined);
    setShowRegistration(true);
  };

  const handleScanSubmit = (e) => {
    if (e.key !== "Enter" || !scanInput.trim()) return;
    const found = guests.find(
      (g) =>
        g.nfcId?.toLowerCase() === scanInput.trim().toLowerCase() ||
        g.name.toLowerCase().includes(scanInput.trim().toLowerCase()) ||
        g.tabNumber.toString() === scanInput.trim()
    );
    if (found) {
      toast.success(`${found.name} encontrado!`);
      setScanInput("");
    } else {
      setPrefillNfc(scanInput.trim());
      setShowRegistration(true);
      setScanInput("");
    }
  };

  const handleRegister = (data) => {
    const newGuest = {
      id: `g${Date.now()}`,
      name: data.name,
      tabNumber: Math.max(...guests.map((g) => g.tabNumber), 100) + 1,
      nfcId: data.nfcId,
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      status: "inside",
      tier: "Bronze",
      points: 0,
      totalSpent: 0,
      checkedInAt: new Date().toISOString(),
    };
    setGuests((prev) => [newGuest, ...prev]);
    setShowRegistration(false);
    toast.success(`${newGuest.name} registrado com sucesso!`);
  };

  const kpis = [
    { label: "Inside", value: insideGuests.length, icon: Users, gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Entries", value: totalEntries, icon: TrendingUp, gradient: "from-success/20 to-success/5", iconColor: "text-success" },
    { label: "Denied", value: 0, icon: ShieldX, gradient: "from-destructive/20 to-destructive/5", iconColor: "text-destructive" },
  ];

  return (
    <PulseLayout>
      {/* Hero KPIs */}
      <div className="mb-10 grid grid-cols-3 gap-4" data-testid="kpi-grid">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${kpi.gradient} p-6`}
            data-testid={`kpi-${kpi.label.toLowerCase()}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {kpi.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/50 backdrop-blur">
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-foreground/[0.02]" />
          </motion.div>
        ))}
      </div>

      {/* Scan Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]"
        data-testid="scan-section"
      >
        <div className="group relative">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/50 via-primary/20 to-transparent opacity-0 blur-sm transition-opacity duration-500 group-focus-within:opacity-100" />
          <div className="relative rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur transition-colors group-focus-within:border-primary/30">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Nfc className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Scan or Search
              </h3>
            </div>
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScanSubmit}
              placeholder="Name, tab number, NFC tag..."
              className="w-full h-14 px-0 text-xl bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b-2 border-border/30 focus:border-primary/50 transition-colors"
              data-testid="nfc-scan-input"
            />
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Place tag on reader or type UID and press Enter
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleManualEntry}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/50 bg-card/40 p-6 backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/5"
          data-testid="manual-entry-btn"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
            <UserPlus className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Manual Entry</p>
            <p className="text-xs text-muted-foreground">No NFC needed</p>
          </div>
        </motion.button>
      </motion.div>

      {/* Guest List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        data-testid="guest-list-section"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Today's Guests</h2>
          <span className="rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground" data-testid="active-guests-badge">
            {insideGuests.length} active
          </span>
        </div>

        {insideGuests.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground" data-testid="empty-guest-list">
            No guests registered yet
          </div>
        ) : (
          <div className="space-y-2">
            {insideGuests.map((guest, i) => (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                whileHover={{ x: 4 }}
                className="group flex items-center justify-between rounded-2xl border border-border/30 bg-card/60 p-4 backdrop-blur transition-colors hover:border-primary/20 hover:bg-card/80 cursor-pointer"
                data-testid={`guest-row-${guest.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 overflow-hidden">
                    {guest.avatar ? (
                      <img src={guest.avatar} alt={guest.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {guest.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {guest.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-primary/70">#{guest.tabNumber}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-muted-foreground">{guest.tier}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-muted-foreground">{guest.points} pts</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    ${guest.totalSpent.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(guest.checkedInAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Registration Panel */}
      <AnimatePresence>
        {showRegistration && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowRegistration(false)}
              data-testid="registration-backdrop"
            />
            <GuestRegistration
              onRegister={handleRegister}
              onCancel={() => setShowRegistration(false)}
              prefillNfc={prefillNfc}
            />
          </>
        )}
      </AnimatePresence>
    </PulseLayout>
  );
}

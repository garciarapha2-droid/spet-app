import { useState } from "react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, User, Search, Clock, ArrowUpRight, ArrowDownRight, X,
} from "lucide-react";
import { toast } from "sonner";
import { mockGuests } from "../../data/pulseData";

export default function PulseExitPage() {
  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState(mockGuests);
  const [showExitConfirm, setShowExitConfirm] = useState(null);

  const insideGuests = guests.filter((g) => g.status === "inside");
  const exitedGuests = guests.filter((g) => g.status === "exited");

  const filteredGuests = insideGuests.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.tabNumber.toString().includes(search)
  );

  const handleExit = (guestId) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId
          ? { ...g, status: "exited", checkedOutAt: new Date().toISOString() }
          : g
      )
    );
    const guest = guests.find((g) => g.id === guestId);
    setShowExitConfirm(null);
    toast.success(`${guest?.name} checked out`);
  };

  const getStayDuration = (checkedIn, checkedOut) => {
    const end = checkedOut ? new Date(checkedOut) : new Date();
    const ms = end.getTime() - new Date(checkedIn).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <PulseLayout>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground tracking-normal" data-testid="exit-title">
          Check Out
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {insideGuests.length} guest{insideGuests.length !== 1 ? "s" : ""} inside — tap to register exit
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Inside guests */}
        <div className="col-span-7">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border/30 bg-card/40 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(258_75%_58%/0.1)] transition-all"
              data-testid="exit-search"
            />
          </div>

          {filteredGuests.length === 0 ? (
            <div className="text-center py-16" data-testid="exit-empty">
              <LogOut className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "No matches" : "No guests inside"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2" data-testid="exit-guest-list">
              {filteredGuests.map((guest, i) => (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border/30 bg-card/60 backdrop-blur hover:border-destructive/20 hover:bg-card/80 transition-all cursor-pointer"
                  onClick={() => setShowExitConfirm(guest.id)}
                  data-testid={`exit-guest-${guest.id}`}
                >
                  {/* Avatar */}
                  {guest.photo ? (
                    <img
                      src={guest.photo}
                      alt={guest.name}
                      className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {guest.name}
                      </p>
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                        #{guest.tabNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-muted/50 text-[10px] font-medium">
                        {guest.tier}
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">
                        ${guest.totalSpent.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                        {new Date(guest.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Exit Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExitConfirm(guest.id);
                    }}
                    className="h-9 w-9 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                    data-testid={`exit-btn-${guest.id}`}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Exits Today */}
        <div className="col-span-5 border-l border-border/30 pl-8">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-sm font-bold text-foreground">
              Exits Today
            </h3>
            <span className="text-[10px] font-bold bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
              {exitedGuests.length}
            </span>
          </div>

          {exitedGuests.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No exits today
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[calc(100vh-20rem)] overflow-y-auto" data-testid="exits-today">
              {exitedGuests.map((guest, i) => (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/40 border border-border/20"
                  data-testid={`exited-${guest.id}`}
                >
                  {guest.photo ? (
                    <img
                      src={guest.photo}
                      alt={guest.name}
                      className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {guest.name}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-2.5 w-2.5 text-emerald-400" />
                        {new Date(guest.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {guest.checkedOutAt && (
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="h-2.5 w-2.5 text-destructive" />
                          {new Date(guest.checkedOutAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {guest.checkedOutAt && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {getStayDuration(guest.checkedInAt, guest.checkedOutAt)}
                      </p>
                      <p className="text-xs font-bold text-foreground tabular-nums">
                        ${guest.totalSpent.toFixed(2)}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm &&
          (() => {
            const guest = insideGuests.find((g) => g.id === showExitConfirm);
            if (!guest) return null;
            return (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
                  onClick={() => setShowExitConfirm(null)}
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
                    data-testid="exit-confirm-modal"
                  >
                    {guest.photo ? (
                      <img
                        src={guest.photo}
                        alt={guest.name}
                        className="h-20 w-20 rounded-full object-cover mx-auto border-4 border-destructive/20 mb-4"
                      />
                    ) : (
                      <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center mb-4">
                        <LogOut className="h-10 w-10 text-destructive/40" />
                      </div>
                    )}
                    <h3 className="text-xl font-extrabold text-foreground tracking-normal">
                      {guest.name}
                    </h3>
                    <span className="inline-block text-xs font-mono font-bold bg-muted/50 px-3 py-1 rounded-full mt-2 mb-1">
                      Tab #{guest.tabNumber}
                    </span>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Total: ${guest.totalSpent.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Confirm checkout for this guest?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowExitConfirm(null)}
                        className="py-3 rounded-xl border border-border/30 font-semibold text-foreground hover:bg-muted/50 transition-colors"
                        data-testid="exit-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleExit(guest.id)}
                        className="py-3 rounded-xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-bold shadow-lg shadow-destructive/20 hover:shadow-xl transition-all"
                        data-testid="exit-confirm"
                      >
                        Check Out
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            );
          })()}
      </AnimatePresence>
    </PulseLayout>
  );
}

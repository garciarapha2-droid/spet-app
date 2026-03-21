import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, LogOut, ChevronDown,
  Zap, Beer, LayoutGrid, ChefHat, BarChart3, Settings,
  Scan, Users, UtensilsCrossed, DoorOpen, Crown,
  CookingPot, GlassWater,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

function cn(...classes) { return classes.filter(Boolean).join(" "); }

const modules = [
  {
    key: "pulse", label: "Pulse", icon: Zap, type: "dropdown",
    items: [
      { label: "Entry", icon: Scan, path: "/pulse/guest" },
      { label: "Inside", icon: Users, path: "/pulse/inside" },
      { label: "Bar", icon: UtensilsCrossed, path: "/pulse/bar" },
      { label: "Exit", icon: DoorOpen, path: "/pulse/exit" },
      { label: "Rewards", icon: Crown, path: "/pulse/rewards" },
    ],
  },
  { key: "tap", label: "TAP", icon: Beer, type: "link", path: "/tap" },
  { key: "table", label: "Table", icon: LayoutGrid, type: "link", path: "/table" },
  {
    key: "kds", label: "KDS", icon: ChefHat, type: "dropdown",
    items: [
      { label: "Kitchen", icon: CookingPot, path: "/kitchen" },
      { label: "Bar", icon: GlassWater, path: "/kitchen" },
    ],
  },
  { key: "manager", label: "Manager", icon: BarChart3, type: "link", path: "/manager" },
  { key: "owner", label: "Owner", icon: Settings, type: "link", path: "/owner" },
];

const breadcrumbMap = {
  "/pulse/guest": { module: "PULSE", page: "Entry" },
  "/pulse/entry": { module: "PULSE", page: "Entry" },
  "/pulse/inside": { module: "PULSE", page: "Inside" },
  "/pulse/bar": { module: "PULSE", page: "Bar" },
  "/pulse/exit": { module: "PULSE", page: "Exit" },
  "/pulse/rewards": { module: "PULSE", page: "Rewards" },
  "/tap": { module: "TAP", page: "Orders" },
  "/table": { module: "TABLE", page: "Orders" },
  "/kitchen": { module: "KDS", page: "Kitchen" },
  "/manager": { module: "MANAGER", page: "Dashboard" },
  "/owner": { module: "OWNER", page: "Overview" },
};

function DropdownModule({ mod, isActive, currentPath }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const Icon = mod.icon;

  const handleEnter = () => { clearTimeout(timeoutRef.current); setOpen(true); };
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setOpen(false), 150); };

  useEffect(() => { return () => clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave} data-testid={`nav-module-${mod.key}`}>
      <button className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}>
        <Icon className="h-4 w-4" />
        {mod.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[180px] py-1.5 bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl shadow-black/30 z-50"
          >
            {mod.items.map(item => {
              const ItemIcon = item.icon;
              const itemActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors",
                    itemActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                  data-testid={`nav-item-${item.label.toLowerCase()}`}
                >
                  <ItemIcon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PulseLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = theme === "dark";
  const currentPath = location.pathname;

  const handleLogout = async () => {
    const { handleFullLogout } = await import("../../utils/logout");
    await handleFullLogout(logout);
  };

  const isModuleActive = (mod) => {
    if (mod.type === "dropdown") return mod.items.some(i => currentPath.startsWith(i.path));
    return currentPath === mod.path || currentPath.startsWith(mod.path + "/");
  };

  const crumb = breadcrumbMap[currentPath] ||
    (currentPath.startsWith("/pulse/guest/") ? { module: "PULSE", page: "Guest" } :
    (currentPath.startsWith("/pulse") ? { module: "PULSE", page: "" } :
    (currentPath.startsWith("/manager") ? { module: "MANAGER", page: "" } :
    (currentPath.startsWith("/owner") ? { module: "OWNER", page: "" } :
    { module: "", page: "" }))));

  return (
    <div className="pulse-scope min-h-screen bg-background text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center h-14 border-b border-border/50 backdrop-blur-xl bg-card/70 px-6" data-testid="pulse-navbar">

        {/* Zone Left — Branding */}
        <div className="flex items-center shrink-0">
          {/* SPET Icon */}
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center" data-testid="spet-icon">
            <span className="text-white text-sm font-bold">S</span>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border/40 mx-3" />

          {/* Venue Selector */}
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="venue-selector">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">DC</span>
            </div>
            <span className="text-sm font-semibold text-foreground">Demo Club</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </button>
        </div>

        {/* Zone Center — Module Navigation */}
        <div className="flex-1 flex items-center justify-center gap-0.5" data-testid="nav-modules">
          {modules.map(mod => {
            const active = isModuleActive(mod);
            if (mod.type === "dropdown") {
              return <DropdownModule key={mod.key} mod={mod} isActive={active} currentPath={currentPath} />;
            }
            const Icon = mod.icon;
            return (
              <button
                key={mod.key}
                onClick={() => navigate(mod.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-module-${mod.key}`}
              >
                <Icon className="h-4 w-4" />
                {mod.label}
              </button>
            );
          })}
        </div>

        {/* Zone Right — Breadcrumb + Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Breadcrumb */}
          {crumb.module && (
            <div className="flex items-center gap-1.5 mr-4" data-testid="breadcrumb">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{crumb.module}</span>
              {crumb.page && (
                <>
                  <span className="text-muted-foreground/40">&#8250;</span>
                  <span className="text-xs font-semibold text-primary">{crumb.page}</span>
                </>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            data-testid="theme-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Separator */}
          <div className="w-px h-5 bg-border/40 mx-1" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            data-testid="logout-btn"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10">
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-6 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

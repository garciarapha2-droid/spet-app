import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, LogOut, ChevronDown,
  Zap, Building2, Grid3X3, ChefHat, BarChart3, Settings, Crown,
  Scan, Users, UtensilsCrossed, DoorOpen,
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
  { key: "tap", label: "TAP", icon: Building2, type: "link", path: "/pulse/bar" },
  { key: "table", label: "Table", icon: Grid3X3, type: "link", path: "/pulse/inside" },
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
  "/kitchen": { module: "KDS", page: "Kitchen" },
  "/manager": { module: "MANAGER", page: "Overview" },
  "/manager/staff": { module: "MANAGER", page: "Staff" },
  "/manager/tables": { module: "MANAGER", page: "Tables" },
  "/manager/menu": { module: "MANAGER", page: "Menu" },
  "/manager/shift": { module: "MANAGER", page: "Shift" },
  "/manager/tips": { module: "MANAGER", page: "Tips" },
  "/manager/guests": { module: "MANAGER", page: "Guests" },
  "/manager/reports": { module: "MANAGER", page: "Reports" },
  "/manager/settings": { module: "MANAGER", page: "Settings" },
  "/owner": { module: "OWNER", page: "Overview" },
  "/owner/performance/revenue": { module: "OWNER", page: "Revenue Analytics" },
  "/owner/performance/profit": { module: "OWNER", page: "Profit Analysis" },
  "/owner/performance/venues": { module: "OWNER", page: "Comparison" },
  "/owner/performance/time": { module: "OWNER", page: "Time Analysis" },
  "/owner/performance/shift-operations": { module: "OWNER", page: "Shift vs Operations" },
  "/owner/performance/staff": { module: "OWNER", page: "Staff" },
  "/owner/customers/intelligence": { module: "OWNER", page: "Customer Intelligence" },
  "/owner/customers/audience": { module: "OWNER", page: "Audience Intelligence" },
  "/owner/customers/segments": { module: "OWNER", page: "Segments" },
  "/owner/customers/churn": { module: "OWNER", page: "Churn & Retention" },
  "/owner/growth/loyalty": { module: "OWNER", page: "Loyalty" },
  "/owner/growth/campaigns": { module: "OWNER", page: "Campaigns" },
  "/owner/finance/overview": { module: "OWNER", page: "Financial Overview" },
  "/owner/finance/costs": { module: "OWNER", page: "Cost Analysis" },
  "/owner/finance/risk": { module: "OWNER", page: "Risk & Alerts" },
  "/owner/insights/smart": { module: "OWNER", page: "Smart Insights" },
  "/owner/insights/actions": { module: "OWNER", page: "Action Center" },
  "/owner/system/venues": { module: "OWNER", page: "Venues" },
  "/owner/system/settings": { module: "OWNER", page: "Settings" },
};

function resolveBreadcrumb(pathname) {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
  if (pathname.startsWith("/pulse/guest/")) return { module: "PULSE", page: "Guest" };
  if (pathname.startsWith("/manager/loyalty")) return { module: "MANAGER", page: "Loyalty" };
  if (pathname.startsWith("/manager")) return { module: "MANAGER", page: "" };
  if (pathname.startsWith("/owner/customers/audience/")) return { module: "OWNER", page: "Genre Detail" };
  if (pathname.startsWith("/owner/customers/")) return { module: "OWNER", page: "Customer Profile" };
  if (pathname.startsWith("/owner/system/venues/") && pathname.includes("/events/")) return { module: "OWNER", page: "Event Detail" };
  if (pathname.startsWith("/owner/system/venues/")) return { module: "OWNER", page: "Venue Detail" };
  if (pathname.startsWith("/owner/finance/costs/")) return { module: "OWNER", page: "Venue Costs" };
  if (pathname.startsWith("/owner")) return { module: "OWNER", page: "" };
  if (pathname.startsWith("/ceo")) return { module: "CEO", page: "Overview" };
  return null;
}

function DropdownModule({ mod, isActive, currentPath }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const Icon = mod.icon;

  const handleEnter = () => { clearTimeout(timeoutRef.current); setOpen(true); };
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setOpen(false), 150); };
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave} data-testid={`nav-module-${mod.key}`}>
      <button className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
        isActive ? "text-primary font-semibold" : "text-muted-foreground font-medium hover:text-foreground"
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
            className="absolute top-full left-0 mt-1 rounded-lg border border-border bg-card shadow-lg p-1 min-w-[160px] z-50"
          >
            {mod.items.map(item => {
              const ItemIcon = item.icon;
              const itemActive = currentPath === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                    itemActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"
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

export default function GlobalNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const isDark = theme === "dark";
  const currentPath = location.pathname;

  const handleLogout = async () => {
    const { handleFullLogout } = await import("../../utils/logout");
    await handleFullLogout(logout);
  };

  const isModuleActive = (mod) => {
    if (mod.key === "tap") return false;
    if (mod.key === "table") return false;
    if (mod.type === "dropdown") return mod.items.some(i => currentPath.startsWith(i.path));
    return currentPath === mod.path || currentPath.startsWith(mod.path + "/");
  };

  const crumb = resolveBreadcrumb(currentPath);
  const userRole = user?.role || "owner";

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-14 border-b border-border backdrop-blur-xl bg-card/80 px-6" data-testid="global-navbar">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-full" style={{ background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.06), transparent 70%)' }} />
      </div>

      {/* Zone Left — Branding */}
      <div className="flex items-center shrink-0 relative z-10">
        <img src="/spet-icon.png" alt="spet" className="h-8 w-8 rounded-lg object-cover" data-testid="spet-icon" />
        <span className="text-lg font-bold tracking-tight text-foreground ml-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }} data-testid="spet-text">spet.</span>
        <span className="text-sm text-muted-foreground ml-2" data-testid="venue-name">Demo Club</span>
      </div>

      {/* Zone Center — Navigation */}
      <div className="flex-1 flex items-center justify-center gap-1 relative z-10" data-testid="nav-modules">
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
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground font-medium hover:text-foreground"
              )}
              data-testid={`nav-module-${mod.key}`}
            >
              <Icon className="h-4 w-4" />
              {mod.label}
            </button>
          );
        })}

        {/* CEO — role-gated */}
        {userRole === "ceo" && (
          <button
            onClick={() => navigate("/ceo")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              currentPath.startsWith("/ceo") ? "text-primary font-semibold" : "text-muted-foreground font-medium hover:text-foreground"
            )}
            data-testid="nav-module-ceo"
          >
            <Crown className="h-4 w-4" />
            CEO
          </button>
        )}
      </div>

      {/* Zone Right — Breadcrumb + Controls */}
      <div className="flex items-center shrink-0 relative z-10">
        {/* Breadcrumb */}
        {crumb && crumb.module && (
          <div className="flex items-center gap-1.5 mr-4" data-testid="breadcrumb">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{crumb.module}</span>
            {crumb.page && (
              <>
                <span className="text-muted-foreground/50 mx-1">&rsaquo;</span>
                <span className="text-xs font-bold text-primary">{crumb.page}</span>
              </>
            )}
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-3" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          data-testid="theme-toggle"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 ml-2"
          data-testid="logout-btn"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

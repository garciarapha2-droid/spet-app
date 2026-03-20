import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, ChevronDown, Scan, Users, DoorOpen, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

import spetIcon from "@/assets/spet-icon.png";

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={spetIcon} alt="spet" className="h-6 w-6 rounded-md" />
      <span
        className="text-foreground text-base leading-none"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
      >
        spet.
      </span>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const tabs = [
  { label: "Check-in", path: "/pulse/guest", icon: Scan },
  { label: "Inside", path: "/pulse/inside", icon: Users },
  { label: "Exit", path: "/pulse/exit", icon: DoorOpen },
  { label: "Membership", path: "/pulse/rewards", icon: Crown },
];

export function PulseLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const isDark = theme === "dark";

  const handleLogout = async () => {
    const { handleFullLogout } = await import("../../utils/logout");
    await handleFullLogout(logout);
  };

  return (
    <div className="pulse-scope min-h-screen bg-background text-foreground">
      {/* Ambient glow — 800x400 blurred ellipse */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[400px] w-[800px] mx-auto rounded-full bg-primary/5 blur-[120px]" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-16 items-center gap-2 border-b border-border/50 bg-card/70 px-6 backdrop-blur-xl" data-testid="pulse-navbar">
        <BrandLogo />

        <div className="mx-4 h-7 w-px bg-border/50" />

        {/* Venue selector */}
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors" data-testid="venue-selector">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-primary-foreground">
            DC
          </span>
          Demo Club
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="mx-4 h-7 w-px bg-border/50" />

        {/* Tab navigation */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1" data-testid="pulse-tabs">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`pulse-tab-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="pulse-tab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Right actions */}
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
          {children}
        </motion.div>
      </main>
    </div>
  );
}

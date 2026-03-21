import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, BarChart3,
  DollarSign, Smartphone, FileBarChart, Settings, ChevronDown,
  Flame, UserCheck, Crown, Target, Sparkles, Heart,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import GlobalNavbar from '../../components/shared/GlobalNavbar';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/manager', end: true },
  { label: 'Staff & Roles', icon: Users, path: '/manager/staff' },
  { label: 'Tables by Server', icon: UtensilsCrossed, path: '/manager/tables' },
  { label: 'Menu / Products', icon: ShoppingBag, path: '/manager/menu' },
  { label: 'Shift vs Operations', icon: BarChart3, path: '/manager/shift' },
  { label: 'Tips', icon: DollarSign, path: '/manager/tips' },
  { label: 'NFC & Guests', icon: Smartphone, path: '/manager/guests' },
  { label: 'Reports & Finance', icon: FileBarChart, path: '/manager/reports' },
  { label: 'Settings', icon: Settings, path: '/manager/settings' },
];

const loyaltyItems = [
  { label: 'Overview', icon: Flame, path: '/manager/loyalty', end: true },
  { label: 'Guests', icon: UserCheck, path: '/manager/loyalty/guests' },
  { label: 'Tiers', icon: Crown, path: '/manager/loyalty/tiers' },
  { label: 'Campaigns', icon: Target, path: '/manager/loyalty/campaigns' },
  { label: 'Rewards', icon: Sparkles, path: '/manager/loyalty/rewards' },
  { label: 'Insights', icon: Heart, path: '/manager/loyalty/insights' },
];

export default function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isLoyaltyActive = location.pathname.startsWith('/manager/loyalty');
  const [loyaltyOpen, setLoyaltyOpen] = useState(isLoyaltyActive);

  useEffect(() => {
    if (isLoyaltyActive) setLoyaltyOpen(true);
  }, [isLoyaltyActive]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Global Navbar */}
      <GlobalNavbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="flex flex-col h-full border-r transition-all duration-300 shrink-0"
          style={{ width: collapsed ? 60 : 240, background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))' }}
        >
          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-2 px-1.5" data-testid="manager-sidebar-nav">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
                    isActive
                      ? 'text-[hsl(var(--sidebar-accent-foreground))]'
                      : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent)_/_0.5)]'
                  }`
                }
                style={({ isActive }) => isActive ? { background: 'hsl(var(--sidebar-accent))' } : {}}
                data-testid={`manager-nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}

            {/* Loyalty Section */}
            <div className="mt-1">
              <button
                onClick={() => collapsed ? navigate('/manager/loyalty') : setLoyaltyOpen(o => !o)}
                className={`flex items-center w-full gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
                  isLoyaltyActive
                    ? 'text-[hsl(var(--sidebar-accent-foreground))]'
                    : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent)_/_0.5)]'
                }`}
                style={isLoyaltyActive ? { background: 'hsl(var(--sidebar-accent))' } : {}}
                data-testid="manager-nav-loyalty"
              >
                <Crown className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Loyalty</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${loyaltyOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {!collapsed && (
                <AnimatePresence>
                  {loyaltyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-4 pl-2 border-l"
                      style={{ borderColor: 'hsl(var(--sidebar-border))' }}
                    >
                      {loyaltyItems.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors mb-0.5 ${
                              isActive
                                ? 'text-[hsl(var(--sidebar-accent-foreground))]'
                                : 'text-[hsl(var(--sidebar-foreground)_/_0.7)] hover:text-[hsl(var(--sidebar-foreground))]'
                            }`
                          }
                          style={({ isActive }) => isActive ? { background: 'hsl(var(--sidebar-accent))' } : {}}
                          data-testid={`manager-nav-loyalty-${item.label.toLowerCase()}`}
                        >
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </nav>

          {/* Collapse */}
          <div className="p-2 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex items-center justify-center w-full h-8 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'hsl(var(--sidebar-foreground))' }}
              data-testid="manager-sidebar-collapse"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6" data-testid="manager-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

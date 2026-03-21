import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, BarChart3,
  DollarSign, Smartphone, FileBarChart, Settings, ChevronDown,
  Flame, UserCheck, Crown, Target, Sparkles, Heart,
  ArrowLeft, Sun, Moon, ChevronLeft, ChevronRight
} from 'lucide-react';

const SPET_ICON_URL = 'https://customer-assets.emergentagent.com/job_998e69ff-635a-4d21-9638-f7d0d6b75555/artifacts/0ovqxfrw_spet-icon.png';

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

const pageTitles = {
  '/manager': { title: 'Dashboard', subtitle: 'Real-time overview' },
  '/manager/staff': { title: 'Staff & Roles', subtitle: 'Team management' },
  '/manager/tables': { title: 'Tables by Server', subtitle: 'Floor assignment' },
  '/manager/menu': { title: 'Menu / Products', subtitle: 'Item management' },
  '/manager/shift': { title: 'Shift vs Operations', subtitle: 'Shift analytics' },
  '/manager/tips': { title: 'Tips', subtitle: 'Tip tracking' },
  '/manager/guests': { title: 'NFC & Guests', subtitle: 'Guest profiles' },
  '/manager/reports': { title: 'Reports & Finance', subtitle: 'Financial overview' },
  '/manager/settings': { title: 'Settings', subtitle: 'Configuration' },
  '/manager/loyalty': { title: 'Loyalty Overview', subtitle: 'Membership engine' },
  '/manager/loyalty/guests': { title: 'Loyalty Guests', subtitle: 'Member directory' },
  '/manager/loyalty/tiers': { title: 'Tiers', subtitle: 'Tier configuration' },
  '/manager/loyalty/campaigns': { title: 'Campaigns', subtitle: 'Campaign management' },
  '/manager/loyalty/rewards': { title: 'Rewards', subtitle: 'Reward catalog' },
  '/manager/loyalty/insights': { title: 'Insights', subtitle: 'Loyalty analytics' },
};

export default function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('spet-theme') || 'light');
  const isLoyaltyActive = location.pathname.startsWith('/manager/loyalty');
  const [loyaltyOpen, setLoyaltyOpen] = useState(isLoyaltyActive);

  useEffect(() => {
    if (isLoyaltyActive) setLoyaltyOpen(true);
  }, [isLoyaltyActive]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('spet-theme', theme);
  }, [theme]);

  const currentPage = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/manager/loyalty/guests/') ? { title: 'Guest Profile', subtitle: 'Member detail' } : { title: 'Manager', subtitle: '' });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col h-screen sticky top-0 border-r transition-all duration-300 shrink-0"
        style={{
          width: collapsed ? 60 : 240,
          background: 'hsl(var(--sidebar-background))',
          borderColor: 'hsl(var(--sidebar-border))',
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center h-14 px-2.5 gap-2 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'hsl(var(--sidebar-foreground))' }}
            data-testid="manager-back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-1.5 flex-1">
              <img src={SPET_ICON_URL} alt="SPET" className="h-6 w-6" />
              <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'hsl(var(--sidebar-primary-foreground))' }}>
                spet.
              </span>
            </div>
          )}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'hsl(var(--sidebar-foreground))' }}
            data-testid="manager-theme-toggle"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

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
              onClick={() => {
                if (collapsed) {
                  navigate('/manager/loyalty');
                } else {
                  setLoyaltyOpen(o => !o);
                }
              }}
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

        {/* Bottom: collapse toggle */}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between h-14 px-6 border-b shrink-0"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          data-testid="manager-header"
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-wide" style={{ color: 'hsl(var(--primary))' }}>Manager</span>
            <span className="text-muted-foreground text-[13px]">/</span>
            <span className="text-[13px] font-semibold text-foreground">{currentPage.title}</span>
          </div>
          {currentPage.subtitle && (
            <span className="text-[12px] text-muted-foreground">{currentPage.subtitle}</span>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6" data-testid="manager-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

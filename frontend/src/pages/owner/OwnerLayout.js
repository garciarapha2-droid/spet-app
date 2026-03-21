import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, TrendingUp, DollarSign, Building2, Clock,
  Users, Layers, Heart, Target, Sparkles, AlertTriangle, ListChecks,
  Settings, ArrowLeft, Sun, Moon, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';

const navGroups = [
  {
    label: 'Owner', type: 'section',
    items: [{ label: 'Overview', icon: LayoutDashboard, path: '/owner', end: true }],
  },
  {
    label: 'Performance', icon: BarChart3, type: 'expandable',
    items: [
      { label: 'Revenue Analytics', icon: TrendingUp, path: '/owner/performance/revenue' },
      { label: 'Profit Analysis', icon: DollarSign, path: '/owner/performance/profit' },
      { label: 'Comparison', icon: Building2, path: '/owner/performance/venues' },
      { label: 'Time Analysis', icon: Clock, path: '/owner/performance/time' },
    ],
  },
  {
    label: 'Customers', icon: Users, type: 'expandable',
    items: [
      { label: 'Customer Intelligence', icon: Users, path: '/owner/customers/intelligence' },
      { label: 'Audience Intelligence', icon: Users, path: '/owner/customers/audience' },
      { label: 'Segments', icon: Layers, path: '/owner/customers/segments' },
      { label: 'Churn & Retention', icon: Heart, path: '/owner/customers/churn' },
    ],
  },
  {
    label: 'Growth & Loyalty', icon: Target, type: 'expandable',
    items: [
      { label: 'Loyalty Performance', icon: Sparkles, path: '/owner/growth/loyalty' },
      { label: 'Campaign Performance', icon: Target, path: '/owner/growth/campaigns' },
    ],
  },
  {
    label: 'Finance & Risk', icon: DollarSign, type: 'expandable',
    items: [
      { label: 'Financial Overview', icon: DollarSign, path: '/owner/finance/overview' },
      { label: 'Cost Analysis', icon: BarChart3, path: '/owner/finance/costs' },
      { label: 'Risk & Alerts', icon: AlertTriangle, path: '/owner/finance/risk' },
    ],
  },
  {
    label: 'AI Insights', icon: Sparkles, type: 'expandable',
    items: [
      { label: 'Smart Insights', icon: Sparkles, path: '/owner/insights/smart' },
      { label: 'Action Center', icon: ListChecks, path: '/owner/insights/actions' },
    ],
  },
  {
    label: 'System', type: 'section',
    items: [
      { label: 'Venues', icon: Building2, path: '/owner/system/venues' },
      { label: 'Settings', icon: Settings, path: '/owner/system/settings' },
    ],
  },
];

const pageTitles = {
  '/owner': { title: 'Overview', subtitle: 'Business Command Center' },
  '/owner/performance/revenue': { title: 'Revenue Analytics', subtitle: 'Revenue deep dive' },
  '/owner/performance/profit': { title: 'Profit Analysis', subtitle: 'Margin intelligence' },
  '/owner/performance/venues': { title: 'Comparison', subtitle: 'Venue benchmarking' },
  '/owner/performance/time': { title: 'Time Analysis', subtitle: 'Peak & dead hours' },
  '/owner/customers/intelligence': { title: 'Customer Intelligence', subtitle: 'Guest ranking' },
  '/owner/customers/audience': { title: 'Audience Intelligence', subtitle: 'Demographics & genres' },
  '/owner/customers/segments': { title: 'Segments', subtitle: 'Guest segmentation' },
  '/owner/customers/churn': { title: 'Churn & Retention', subtitle: 'Guest return health' },
  '/owner/growth/loyalty': { title: 'Loyalty Performance', subtitle: 'Tier & enrollment' },
  '/owner/growth/campaigns': { title: 'Campaign Performance', subtitle: 'Campaign ROI' },
  '/owner/finance/overview': { title: 'Financial Overview', subtitle: 'P&L summary' },
  '/owner/finance/costs': { title: 'Cost Analysis', subtitle: 'Expense breakdown' },
  '/owner/finance/risk': { title: 'Risk & Alerts', subtitle: 'Active alerts' },
  '/owner/insights/smart': { title: 'Smart Insights', subtitle: 'AI-generated' },
  '/owner/insights/actions': { title: 'Action Center', subtitle: 'Prioritized tasks' },
  '/owner/system/venues': { title: 'Venues', subtitle: 'Venue management' },
  '/owner/system/settings': { title: 'Settings', subtitle: 'Configuration' },
};

const SPET_ICON_URL = 'https://customer-assets.emergentagent.com/job_998e69ff-635a-4d21-9638-f7d0d6b75555/artifacts/0ovqxfrw_spet-icon.png';

export default function OwnerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('spet-theme') || 'light');
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('spet-theme', theme);
  }, [theme]);

  // Auto-expand group when its path is active
  useEffect(() => {
    navGroups.forEach(g => {
      if (g.type === 'expandable' && g.items.some(i => location.pathname.startsWith(i.path.split('/').slice(0, 3).join('/')))) {
        setExpandedGroups(prev => ({ ...prev, [g.label]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const currentPage = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/owner/customers/') && location.pathname.split('/').length === 4 ? { title: 'Customer Profile', subtitle: 'Guest history' } :
    location.pathname.startsWith('/owner/finance/costs/') ? { title: 'Venue Cost Detail', subtitle: 'Cost drill-down' } :
    location.pathname.startsWith('/owner/system/venues/') && location.pathname.includes('/events/') ? { title: 'Event Detail', subtitle: 'Night analysis' } :
    location.pathname.startsWith('/owner/system/venues/') ? { title: 'Venue Detail', subtitle: 'Venue drill-down' } :
    location.pathname.startsWith('/owner/customers/audience/') ? { title: 'Genre Detail', subtitle: 'Audience deep dive' } :
    { title: 'Owner', subtitle: '' });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col h-screen sticky top-0 border-r transition-all duration-300 shrink-0"
        style={{ width: collapsed ? 60 : 240, background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {/* Top Bar */}
        <div className="flex items-center h-14 px-2.5 gap-2 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <button onClick={() => navigate('/')} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:opacity-80" style={{ color: 'hsl(var(--sidebar-foreground))' }} data-testid="owner-back-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-1.5 flex-1">
              <img src={SPET_ICON_URL} alt="SPET" className="h-6 w-6" />
              <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'hsl(var(--sidebar-foreground))' }}>spet.</span>
            </div>
          )}
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:opacity-80" style={{ color: 'hsl(var(--sidebar-foreground))' }} data-testid="owner-theme-toggle">
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5" data-testid="owner-sidebar-nav">
          {navGroups.map(group => (
            <div key={group.label} className="mb-1">
              {group.type === 'section' && !collapsed && (
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-2.5 pt-3 pb-1">{group.label}</p>
              )}
              {group.type === 'expandable' && (
                <button
                  onClick={() => collapsed ? navigate(group.items[0].path) : toggleGroup(group.label)}
                  className="flex items-center w-full gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent)_/_0.5)]"
                  data-testid={`owner-group-${group.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  {group.icon && <group.icon className="h-4 w-4 shrink-0" />}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedGroups[group.label] ? '' : '-rotate-90'}`} />
                    </>
                  )}
                </button>
              )}

              {/* Items */}
              {(group.type === 'section' || expandedGroups[group.label]) && (
                <AnimatePresence>
                  <motion.div
                    initial={group.type === 'expandable' ? { height: 0, opacity: 0 } : false}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={group.type === 'expandable' && !collapsed ? 'overflow-hidden ml-4 pl-2 border-l border-[hsl(var(--sidebar-border))]' : ''}
                  >
                    {group.items.map(item => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg font-medium transition-colors mb-0.5 ${
                            group.type === 'expandable' && !collapsed ? 'text-[12px] px-2 py-1.5' : 'text-[13px] px-2.5 py-2'
                          } ${
                            isActive
                              ? 'text-[hsl(var(--sidebar-primary))] bg-[hsl(var(--sidebar-accent))]'
                              : group.type === 'expandable' ? 'text-[hsl(var(--sidebar-foreground)_/_0.6)] hover:text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]'
                          }`
                        }
                        data-testid={`owner-nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
                      >
                        <item.icon className={`shrink-0 ${group.type === 'expandable' && !collapsed ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <button onClick={() => setCollapsed(c => !c)} className="flex items-center justify-center w-full h-8 rounded-lg transition-colors hover:opacity-80" style={{ color: 'hsl(var(--sidebar-foreground))' }} data-testid="owner-sidebar-collapse">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-6 border-b shrink-0" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} data-testid="owner-header">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-wide" style={{ color: 'hsl(var(--primary))' }}>Owner</span>
            <span className="text-muted-foreground text-[13px]">/</span>
            <span className="text-[13px] font-semibold text-foreground">{currentPage.title}</span>
          </div>
          {currentPage.subtitle && <span className="text-[12px] text-muted-foreground">{currentPage.subtitle}</span>}
        </header>
        <main className="flex-1 overflow-y-auto p-6" data-testid="owner-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

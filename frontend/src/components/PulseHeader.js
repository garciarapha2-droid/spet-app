import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { venueAPI } from '../services/api';
import { Button } from './ui/button';
import {
  Users, CreditCard, LayoutGrid, UtensilsCrossed,
  BarChart3, Building2, Crown, ChevronDown, LogOut, Home
} from 'lucide-react';

const MODULES = [
  { key: 'pulse', name: 'Pulse', icon: Users, path: '/pulse/entry' },
  { key: 'tap', name: 'TAP', icon: CreditCard, path: '/tap' },
  { key: 'table', name: 'Table', icon: LayoutGrid, path: '/table' },
  { key: 'kds', name: 'Kitchen', icon: UtensilsCrossed, path: '/kitchen' },
  { key: 'manager', name: 'Manager', icon: BarChart3, path: '/manager' },
  { key: 'owner', name: 'Owner', icon: Building2, path: '/owner' },
  { key: 'ceo', name: 'CEO', icon: Crown, path: '/ceo' },
];

const PULSE_TABS = [
  { path: '/pulse/entry', label: 'Guest' },
  { path: '/pulse/inside', label: 'Inside' },
  { path: '/pulse/bar', label: 'Bar' },
  { path: '/pulse/exit', label: 'Exit' },
  { path: '/pulse/rewards', label: 'Rewards' },
];

export const PulseHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [modules, setModules] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const menuRef = useRef(null);

  const venueName = localStorage.getItem('active_venue_name') || 'Demo Club';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await venueAPI.getHome();
        setModules(res.data.modules || []);
        setUserEmail(res.data.user_email || '');
      } catch {}
    };
    load();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowModuleMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentModule = MODULES.find(m => location.pathname.startsWith(m.path.split('/')[1] === 'pulse' ? '/pulse' : m.path));

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between" data-testid="pulse-header">
      <div className="flex items-center gap-0">
        {/* Logo + Venue + Module dropdown */}
        <button onClick={() => navigate('/venue/home')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-lg transition-colors mr-1" data-testid="logo-btn">
          <span className="text-lg font-bold tracking-tight">SPETAP</span>
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Module Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowModuleMenu(!showModuleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-lg transition-colors"
            data-testid="module-dropdown-btn"
          >
            <span className="text-sm font-medium">{venueName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showModuleMenu ? 'rotate-180' : ''}`} />
          </button>

          {showModuleMenu && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 min-w-[220px] py-2" data-testid="module-menu">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>

              <button
                onClick={() => { navigate('/venue/home'); setShowModuleMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                data-testid="menu-home">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>Venue Home</span>
              </button>

              <div className="h-px bg-border my-1" />

              {MODULES.map((mod) => {
                const moduleData = modules.find(m => m.key === mod.key);
                const enabled = moduleData?.enabled !== false;
                const Icon = mod.icon;
                const isActive = location.pathname.startsWith(mod.path.split('/').slice(0, 2).join('/'));
                return (
                  <button key={mod.key}
                    onClick={() => {
                      if (enabled) {
                        navigate(mod.path);
                        setShowModuleMenu(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      !enabled ? 'opacity-40 cursor-not-allowed' :
                      isActive ? 'bg-primary/5 text-primary font-medium' :
                      'hover:bg-muted'
                    }`}
                    data-testid={`menu-${mod.key}`}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{mod.name}</span>
                    {!enabled && <span className="text-[10px] text-muted-foreground">Locked</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Pulse sub-tabs */}
        {location.pathname.startsWith('/pulse') && (
          <nav className="flex items-center gap-0.5 ml-1">
            {PULSE_TABS.map((tab) => {
              const isActive = location.pathname === tab.path ||
                (tab.path === '/pulse/entry' && location.pathname.startsWith('/pulse/guest'));
              return (
                <button key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  data-testid={`tab-${tab.label.toLowerCase()}`}>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="h-5 w-px bg-border" />
        <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} data-testid="logout-btn">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

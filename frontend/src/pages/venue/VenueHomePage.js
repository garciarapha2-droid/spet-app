import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { venueAPI } from '../../services/api';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import {
  Users, CreditCard, LayoutGrid, UtensilsCrossed,
  BarChart3, Building2, Crown, Lock, LogOut,
  ChevronDown, X
} from 'lucide-react';

const MODULE_META = {
  pulse:   { icon: Users,              route: '/pulse/entry', color: 'hsl(var(--primary))' },
  tap:     { icon: CreditCard,         route: '/tap',         color: '#2563eb' },
  table:   { icon: LayoutGrid,         route: '/table',       color: '#0891b2' },
  kds:     { icon: UtensilsCrossed,    route: '/kitchen',     color: '#ea580c' },
  manager: { icon: BarChart3,          route: '/manager',     color: '#7c3aed' },
  owner:   { icon: Building2,          route: '/owner',       color: '#4f46e5' },
  ceo:     { icon: Crown,              route: '/ceo',         color: '#be185d' },
};

export const VenueHomePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedModal, setLockedModal] = useState(null);
  const [showVenueSelector, setShowVenueSelector] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await venueAPI.getHome();
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load venue');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleModuleClick = (mod) => {
    if (!mod.enabled) {
      setLockedModal(mod);
      return;
    }
    const meta = MODULE_META[mod.key];
    if (meta) navigate(meta.route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const activeVenue = data?.active_venue;
  const venues = data?.venues || [];
  const modules = data?.modules || [];

  return (
    <div className="min-h-screen bg-background" data-testid="venue-home-page">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-bold tracking-tight" data-testid="venue-home-logo">SPETAP</h1>
          <div className="h-6 w-px bg-border" />
          {/* Venue selector */}
          <div className="relative">
            <button
              onClick={() => venues.length > 1 && setShowVenueSelector(!showVenueSelector)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              data-testid="venue-selector"
            >
              <span className="font-semibold text-foreground" data-testid="venue-name">
                {activeVenue?.name || 'No Venue'}
              </span>
              {venues.length > 1 && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showVenueSelector && venues.length > 1 && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[200px]">
                {venues.map((v) => (
                  <button
                    key={v.id}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => setShowVenueSelector(false)}
                    data-testid={`venue-option-${v.id}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground" data-testid="user-email">{data?.user_email}</span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} data-testid="logout-btn">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="w-full px-8 py-12 max-w-[1400px] mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2" data-testid="venue-home-title">
            {activeVenue?.name || 'Venue'}
          </h2>
          <p className="text-base text-muted-foreground">Select a module to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {modules.map((mod) => {
            const meta = MODULE_META[mod.key];
            if (!meta) return null;
            const Icon = meta.icon;
            const enabled = mod.enabled;

            return (
              <button
                key={mod.key}
                onClick={() => handleModuleClick(mod)}
                className={`group relative text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                  enabled
                    ? 'border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                    : 'border-border/50 bg-muted/30 cursor-not-allowed opacity-65'
                }`}
                data-testid={`module-card-${mod.key}`}
              >
                {/* Lock badge */}
                {!enabled && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium"
                    data-testid={`locked-badge-${mod.key}`}>
                    <Lock className="h-3 w-3" />
                    Locked
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 ${
                    enabled ? 'group-hover:scale-110' : ''
                  }`}
                  style={{ backgroundColor: enabled ? `${meta.color}15` : 'hsl(var(--muted))' }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: enabled ? meta.color : 'hsl(var(--muted-foreground))' }}
                  />
                </div>

                {/* Text */}
                <h3 className={`text-lg font-semibold mb-1 ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {mod.name}
                </h3>
                <p className={`text-sm ${enabled ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                  {enabled ? mod.description : 'Upgrade required'}
                </p>
              </button>
            );
          })}
        </div>
      </main>

      {/* Locked Modal */}
      {lockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setLockedModal(null)} data-testid="locked-modal-overlay">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()} data-testid="locked-modal">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <button onClick={() => setLockedModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-xl font-semibold mb-2">{lockedModal.name}</h3>
            <p className="text-muted-foreground mb-2">{lockedModal.locked_reason || 'This module is not available for your account.'}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Contact your administrator or upgrade your plan to access this module.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setLockedModal(null)}
              data-testid="locked-modal-close-btn">
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

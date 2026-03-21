import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import BrandLogo from '../../components/BrandLogo';

import WelcomeStep from './steps/WelcomeStep';
import ConfirmAccountStep from './steps/ConfirmAccountStep';
import RoleDecisionStep from './steps/RoleDecisionStep';
import InitialSetupStep from './steps/InitialSetupStep';
import PulseMenuSetup from './steps/PulseMenuSetup';
import PulseRewardsSetup from './steps/PulseRewardsSetup';
import TableSetup from './steps/TableSetup';
import FloorPlanBuilder from './steps/FloorPlanBuilder';
import ReservationSetup from './steps/ReservationSetup';
import FinishSetupStep from './steps/FinishSetupStep';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function getToken() {
  return localStorage.getItem('spetap_token');
}

async function apiCall(endpoint, body = null) {
  const opts = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body) {
    opts.method = 'POST';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}/api/onboarding${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

const DEFAULT_TIERS = [
  { id: '1', name: 'Bronze', minPoints: '0', description: 'Earn points, member updates', color: '#CD7F32' },
  { id: '2', name: 'Silver', minPoints: '500', description: '5% discount, priority entry, early event access', color: '#94A3B8' },
  { id: '3', name: 'Gold', minPoints: '1500', description: '10% discount, free drink, VIP access, skip line', color: '#EAB308' },
  { id: '4', name: 'Platinum', minPoints: '5000', description: '15% discount, free drink+appetizer, reserved table, personal host', color: '#A78BFA' },
];

const DEFAULT_REWARDS = [
  { id: '1', name: 'Free Beer', pointsCost: '100', category: 'drinks' },
  { id: '2', name: 'Free Cocktail', pointsCost: '200', category: 'drinks' },
  { id: '3', name: 'Priority Entry', pointsCost: '300', category: 'access' },
  { id: '4', name: 'Skip the Line', pointsCost: '250', category: 'access' },
  { id: '5', name: 'VIP Table (1h)', pointsCost: '500', category: 'experience' },
  { id: '6', name: 'Birthday Reward', pointsCost: 'Free', category: 'custom' },
];

const INITIAL_DATA = {
  fullName: '',
  venueName: '',
  venueType: [],
  password: '',
  isAlsoManager: null,
  createManagerNow: null,
  managerEmail: '',
  managerName: '',
  enabledModules: ['pulse'],
  paymentFlow: {
    bartendersCanCloseChecks: false,
    serversCanCloseChecks: false,
    cashierOnly: false,
  },
  teamMembers: [],
  pulseMenu: {
    items: [],
    categories: ['Cocktails', 'Beers', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters'],
  },
  pulseRewards: {
    mode: 'overview',
    tiers: DEFAULT_TIERS,
    rewards: DEFAULT_REWARDS,
    pointsPerDollar: '2',
    dailyLimit: '500',
    maxPerVisit: '200',
    diamondMinPoints: '10000',
    vipManualOnly: true,
    automationRules: {
      autoUpgrade: true,
      instantRewardUnlock: true,
      notifyGuest: true,
      downgradeAfterInactivity: false,
    },
  },
  tables: [],
  reservationSettings: {
    useQuickSetup: false,
    totalTables: '20',
    smallTables: '8',
    mediumTables: '8',
    largeTables: '4',
    waitlistEnabled: true,
    avgWaitTime: '15',
    vipPriority: true,
    guestNotifications: true,
    smartFlow: true,
  },
};

const WIDE_STEPS = new Set(['pulse-menu', 'table-setup', 'floor-plan', 'reservation']);

function computeSteps(modules) {
  const base = ['welcome', 'confirm', 'role', 'setup'];
  const conditional = [];
  if (modules.includes('pulse') || modules.includes('tap') || modules.includes('table')) {
    conditional.push('pulse-menu');
  }
  if (modules.includes('pulse')) {
    conditional.push('pulse-rewards');
  }
  if (modules.includes('table')) {
    conditional.push('table-setup');
    conditional.push('floor-plan');
  }
  if (modules.includes('reservation') || modules.includes('reservations')) {
    conditional.push('reservation');
  }
  return [...base, ...conditional, 'finish'];
}

const stepVariants = {
  enter: { opacity: 0, x: 40, filter: 'blur(4px)' },
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -40, filter: 'blur(4px)' },
};

const stepTransition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState(() => ({
    ...INITIAL_DATA,
    fullName: user?.name || '',
  }));

  const steps = useMemo(() => computeSteps(data.enabledModules), [data.enabledModules]);
  const currentStepId = steps[stepIndex] || 'welcome';
  const totalSteps = steps.length;
  const isWide = WIDE_STEPS.has(currentStepId);

  const updateData = useCallback((partial) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const onNext = useCallback(() => {
    setStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const onBack = useCallback(() => {
    setStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const onComplete = useCallback(async () => {
    try {
      await apiCall('/save-config', data);
      await apiCall('/complete', {});
      await refreshUser();
      if (user?.role === 'CEO') {
        navigate('/ceo', { replace: true });
      } else {
        navigate('/venue/home', { replace: true });
      }
    } catch (err) {
      console.error('Onboarding complete error:', err);
    }
  }, [data, refreshUser, navigate, user]);

  const onSkip = useCallback(async () => {
    try {
      await apiCall('/skip', {});
      await refreshUser();
      if (user?.role === 'CEO') {
        navigate('/ceo', { replace: true });
      } else {
        navigate('/venue/home', { replace: true });
      }
    } catch (err) {
      console.error('Onboarding skip error:', err);
    }
  }, [refreshUser, navigate, user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const progressPercent = stepIndex > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  const renderStep = () => {
    const props = { data, updateData, onNext, onBack, onComplete, onSkip };
    switch (currentStepId) {
      case 'welcome': return <WelcomeStep {...props} />;
      case 'confirm': return <ConfirmAccountStep {...props} />;
      case 'role': return <RoleDecisionStep {...props} />;
      case 'setup': return <InitialSetupStep {...props} />;
      case 'pulse-menu': return <PulseMenuSetup {...props} />;
      case 'pulse-rewards': return <PulseRewardsSetup {...props} />;
      case 'table-setup': return <TableSetup {...props} />;
      case 'floor-plan': return <FloorPlanBuilder {...props} />;
      case 'reservation': return <ReservationSetup {...props} />;
      case 'finish': return <FinishSetupStep {...props} />;
      default: return null;
    }
  };

  return (
    <div data-testid="onboarding-wizard" className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-card/70 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center">
          {stepIndex > 0 && (
            <button
              data-testid="onboarding-nav-back"
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          {stepIndex > 0 && (
            <div className="w-px h-6 bg-border/40 mx-3" />
          )}
          <BrandLogo variant="navbar" size="default" />
        </div>
        <div className="flex items-center">
          <button
            data-testid="onboarding-theme-toggle"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-px h-6 bg-border/40 mx-2" />
          <button
            data-testid="onboarding-logout"
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Progress Bar */}
      {stepIndex > 0 && (
        <div className="w-full h-[3px] bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}

      {/* Step Content */}
      <div className={`flex-1 flex items-center justify-center px-4 ${isWide ? '' : ''}`}>
        <div className={`w-full ${isWide ? 'max-w-5xl' : 'max-w-lg'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Step Indicator Dots */}
      {stepIndex > 0 && currentStepId !== 'finish' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-40">
          {steps.map((s, i) => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? 24 : 6,
                height: 6,
                backgroundColor: i === stepIndex
                  ? 'hsl(var(--primary))'
                  : i < stepIndex
                    ? 'hsl(var(--primary) / 0.4)'
                    : 'hsl(var(--muted))',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

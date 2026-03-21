import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { PublicOnly, AuthOnly, ActiveOnly, ProtectedRoute, CEORoute } from './components/ProtectedRoute';

// Auth pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import LandingPage from './pages/landing/LandingPage';

// Payment pages
import { PaymentPendingPage } from './pages/PaymentPendingPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';

// Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

// Protected pages
import { VenueSelectPage } from './pages/venue/VenueHomePage';
import { PulseEntryPage } from './pages/pulse/PulseEntryPage';
import PulseGuest from './pages/pulse/PulseGuest';
import PulseInsidePage from './pages/pulse/PulseInsidePage';
import PulseExitPage from './pages/pulse/PulseExitPage';
import PulseBarPage from './pages/pulse/PulseBarPage';
import PulseRewardsPage from './pages/pulse/PulseRewardsPage';
import { GuestProfilePage } from './pages/pulse/GuestProfilePage';
import { TapPage } from './pages/TapPage';
import { TablePage } from './pages/TablePage';
import { KitchenPage } from './pages/KitchenPage';
import { OwnerPage } from './pages/OwnerPage';

// Manager Dashboard Module
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerOverview from './pages/manager/ManagerOverview';
import StaffRoles from './pages/manager/StaffRoles';
import TablesByServer from './pages/manager/TablesByServer';
import MenuProducts from './pages/manager/MenuProducts';
import ShiftOperations from './pages/manager/ShiftOperations';
import Tips from './pages/manager/Tips';
import NfcGuests from './pages/manager/NfcGuests';
import ReportsFinance from './pages/manager/ReportsFinance';
import ManagerSettings from './pages/manager/ManagerSettings';
import LoyaltyRewards from './pages/manager/loyalty/LoyaltyRewards';
import LoyaltyGuests from './pages/manager/loyalty/LoyaltyGuests';
import LoyaltyGuestProfile from './pages/manager/loyalty/LoyaltyGuestProfile';
import LoyaltyTiers from './pages/manager/loyalty/LoyaltyTiers';
import LoyaltyCampaigns from './pages/manager/loyalty/LoyaltyCampaigns';
import LoyaltyRewardsPage from './pages/manager/loyalty/LoyaltyRewardsPage';
import LoyaltyInsights from './pages/manager/loyalty/LoyaltyInsights';
import CeoPage from './pages/CeoPage';
import { useAuth } from './contexts/AuthContext';
const CEOPage = CeoPage;

const AppEntryRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'CEO') return <Navigate to="/ceo" replace />;
  return <Navigate to="/venue/home" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public only routes (redirect if authenticated) */}
              <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
              <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

              {/* Payment routes (require auth, any status) */}
              <Route path="/payment/pending" element={<AuthOnly><PaymentPendingPage /></AuthOnly>} />
              <Route path="/payment/success" element={<AuthOnly><PaymentSuccessPage /></AuthOnly>} />

              {/* Onboarding (require auth + active) */}
              <Route path="/onboarding" element={<ActiveOnly><OnboardingWizard /></ActiveOnly>} />
              <Route path="/onboarding/legacy" element={<ActiveOnly><OnboardingPage /></ActiveOnly>} />

              {/* Protected routes (require auth + active + onboarded) */}
              <Route path="/venue/home" element={<ProtectedRoute><VenueSelectPage /></ProtectedRoute>} />
              <Route path="/modules" element={<ProtectedRoute><Navigate to="/venue/home" replace /></ProtectedRoute>} />
              <Route path="/pulse" element={<ProtectedRoute><Navigate to="/pulse/guest" replace /></ProtectedRoute>} />
              <Route path="/pulse/guest" element={<ProtectedRoute><PulseGuest /></ProtectedRoute>} />
              <Route path="/pulse/entry" element={<ProtectedRoute><PulseEntryPage /></ProtectedRoute>} />
              <Route path="/pulse/inside" element={<ProtectedRoute><PulseInsidePage /></ProtectedRoute>} />
              <Route path="/pulse/bar" element={<ProtectedRoute><PulseBarPage /></ProtectedRoute>} />
              <Route path="/pulse/exit" element={<ProtectedRoute><PulseExitPage /></ProtectedRoute>} />
              <Route path="/pulse/rewards" element={<ProtectedRoute><PulseRewardsPage /></ProtectedRoute>} />
              <Route path="/pulse/guest/:guestId" element={<ProtectedRoute><GuestProfilePage /></ProtectedRoute>} />
              <Route path="/tap" element={<ProtectedRoute><TapPage /></ProtectedRoute>} />
              {/* Manager Dashboard Module */}
              <Route path="/manager" element={<ProtectedRoute><ManagerLayout /></ProtectedRoute>}>
                <Route index element={<ManagerOverview />} />
                <Route path="staff" element={<StaffRoles />} />
                <Route path="tables" element={<TablesByServer />} />
                <Route path="menu" element={<MenuProducts />} />
                <Route path="shift" element={<ShiftOperations />} />
                <Route path="tips" element={<Tips />} />
                <Route path="guests" element={<NfcGuests />} />
                <Route path="reports" element={<ReportsFinance />} />
                <Route path="settings" element={<ManagerSettings />} />
                <Route path="loyalty" element={<LoyaltyRewards />} />
                <Route path="loyalty/guests" element={<LoyaltyGuests />} />
                <Route path="loyalty/guests/:id" element={<LoyaltyGuestProfile />} />
                <Route path="loyalty/tiers" element={<LoyaltyTiers />} />
                <Route path="loyalty/campaigns" element={<LoyaltyCampaigns />} />
                <Route path="loyalty/rewards" element={<LoyaltyRewardsPage />} />
                <Route path="loyalty/insights" element={<LoyaltyInsights />} />
              </Route>
              <Route path="/table" element={<ProtectedRoute><TablePage /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />
              <Route path="/owner" element={<ProtectedRoute><OwnerPage /></ProtectedRoute>} />
              <Route path="/ceo" element={<CEORoute><CEOPage /></CEORoute>} />

              {/* /app route — redirects based on user role */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <AppEntryRedirect />
                </ProtectedRoute>
              } />

              {/* Default: unauthenticated → /login, authenticated → role-based */}
              <Route path="*" element={<ProtectedRoute><AppEntryRedirect /></ProtectedRoute>} />
            </Routes>
            <Toaster />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { PublicOnly, AuthOnly, ActiveOnly, ProtectedRoute, CEORoute } from './components/ProtectedRoute';

// Auth pages
import { LoginPage } from './pages/LoginPage';
import { AuthHandoffPage } from './pages/AuthHandoffPage';
import { SignupPage } from './pages/SignupPage';

// Payment pages
import { PaymentPendingPage } from './pages/PaymentPendingPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';

// Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Protected pages
import { VenueSelectPage } from './pages/venue/VenueHomePage';
import { PulseEntryPage } from './pages/pulse/PulseEntryPage';
import { PulseInsidePage } from './pages/pulse/PulseInsidePage';
import { PulseExitPage } from './pages/pulse/PulseExitPage';
import { PulseBarPage } from './pages/pulse/PulseBarPage';
import { PulseRewardsPage } from './pages/pulse/PulseRewardsPage';
import { GuestProfilePage } from './pages/pulse/GuestProfilePage';
import { TapPage } from './pages/TapPage';
import { TablePage } from './pages/TablePage';
import { KitchenPage } from './pages/KitchenPage';
import { ManagerPage } from './pages/ManagerPage';
import { OwnerPage } from './pages/OwnerPage';
import CeoPage from './pages/CeoPage';
const CEOPage = CeoPage;

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              {/* Public only routes (redirect if authenticated) */}
              <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
              <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

              {/* Auth handoff (special case) */}
              <Route path="/auth/handoff" element={<AuthHandoffPage />} />

              {/* Payment routes (require auth, any status) */}
              <Route path="/payment/pending" element={<AuthOnly><PaymentPendingPage /></AuthOnly>} />
              <Route path="/payment/success" element={<AuthOnly><PaymentSuccessPage /></AuthOnly>} />

              {/* Onboarding (require auth + active) */}
              <Route path="/onboarding" element={<ActiveOnly><OnboardingPage /></ActiveOnly>} />

              {/* Protected routes (require auth + active + onboarded) */}
              <Route path="/venue/home" element={<ProtectedRoute><VenueSelectPage /></ProtectedRoute>} />
              <Route path="/modules" element={<ProtectedRoute><Navigate to="/venue/home" replace /></ProtectedRoute>} />
              <Route path="/pulse" element={<ProtectedRoute><Navigate to="/pulse/entry" replace /></ProtectedRoute>} />
              <Route path="/pulse/entry" element={<ProtectedRoute><PulseEntryPage /></ProtectedRoute>} />
              <Route path="/pulse/inside" element={<ProtectedRoute><PulseInsidePage /></ProtectedRoute>} />
              <Route path="/pulse/bar" element={<ProtectedRoute><PulseBarPage /></ProtectedRoute>} />
              <Route path="/pulse/exit" element={<ProtectedRoute><PulseExitPage /></ProtectedRoute>} />
              <Route path="/pulse/rewards" element={<ProtectedRoute><PulseRewardsPage /></ProtectedRoute>} />
              <Route path="/pulse/guest/:guestId" element={<ProtectedRoute><GuestProfilePage /></ProtectedRoute>} />
              <Route path="/tap" element={<ProtectedRoute><TapPage /></ProtectedRoute>} />
              <Route path="/manager" element={<ProtectedRoute><ManagerPage /></ProtectedRoute>} />
              <Route path="/table" element={<ProtectedRoute><TablePage /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />
              <Route path="/owner" element={<ProtectedRoute><OwnerPage /></ProtectedRoute>} />
              <Route path="/ceo" element={<CEORoute><CEOPage /></CEORoute>} />

              {/* Default */}
              <Route path="*" element={<ProtectedRoute><Navigate to="/venue/home" replace /></ProtectedRoute>} />
            </Routes>
            <Toaster />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

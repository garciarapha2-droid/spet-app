import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ModulesPage } from './pages/ModulesPage';
import { PulseEntryPage } from './pages/pulse/PulseEntryPage';
import { TapPage } from './pages/TapPage';
import { ManagerPage } from './pages/ManagerPage';
import { OwnerPage } from './pages/OwnerPage';
import { CEOPage } from './pages/CEOPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/modules"
                element={
                  <ProtectedRoute>
                    <ModulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pulse"
                element={
                  <ProtectedRoute>
                    <Navigate to="/pulse/entry" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pulse/entry"
                element={
                  <ProtectedRoute>
                    <PulseEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pulse/inside"
                element={
                  <ProtectedRoute>
                    <PulseEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pulse/bar"
                element={
                  <ProtectedRoute>
                    <PulseEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pulse/exit"
                element={
                  <ProtectedRoute>
                    <PulseEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pulse/rewards"
                element={
                  <ProtectedRoute>
                    <PulseEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tap"
                element={
                  <ProtectedRoute>
                    <TapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager"
                element={
                  <ProtectedRoute>
                    <ManagerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner"
                element={
                  <ProtectedRoute>
                    <OwnerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ceo"
                element={
                  <ProtectedRoute>
                    <CEOPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

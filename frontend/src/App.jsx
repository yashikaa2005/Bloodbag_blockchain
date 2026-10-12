import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QrScannerModal } from './components/QrScannerModal';

import { LandingPage } from './pages/LandingPage';
import { VerifyPage } from './pages/VerifyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { BloodBankDashboard } from './pages/BloodBankDashboard';
import { LabDashboard } from './pages/LabDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Validating Cryptographic Session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-zinc-50">
        <h2 className="text-lg font-black uppercase tracking-wider text-blood-700 mb-2">
          Unauthorized Participant Access
        </h2>
        <p className="text-xs text-zinc-600 max-w-md mb-4 font-mono">
          Your active role [{user.role}] does not have authorization permissions for this portal.
        </p>
        <a href="/" className="btn-dark text-xs">
          Return to Overview
        </a>
      </div>
    );
  }

  return children;
};

export function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenScanner={() => setIsScannerOpen(true)} />
      
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<LandingPage onOpenScanner={() => setIsScannerOpen(true)} />}
          />
          <Route path="/verify/:bagId" element={<VerifyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Role Protected Portals */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank"
            element={
              <ProtectedRoute allowedRoles={['BLOOD_BANK']}>
                <BloodBankDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab"
            element={
              <ProtectedRoute allowedRoles={['LAB']}>
                <LabDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital"
            element={
              <ProtectedRoute allowedRoles={['HOSPITAL']}>
                <HospitalDashboard onOpenScanner={() => setIsScannerOpen(true)} />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Global QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

export default App;

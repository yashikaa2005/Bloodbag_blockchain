import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, Shield, LogOut, User, Activity, Building, Menu, X } from 'lucide-react';

export const Navbar = ({ onOpenScanner }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'BLOOD_BANK': return '/blood-bank';
      case 'LAB': return '/lab';
      case 'HOSPITAL': return '/hospital';
      default: return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-zinc-800 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-blood-600 flex items-center justify-center text-white font-black text-lg tracking-tighter">
            BC
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
              BLOOD<span className="text-blood-500">CHAIN</span>
            </span>
            <span className="text-[10px] text-zinc-400 tracking-widest uppercase font-mono hidden sm:inline">
              DLT Traceability System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider">
          <Link
            to="/"
            className={`hover:text-blood-400 transition-colors ${
              location.pathname === '/' ? 'text-blood-500 border-b-2 border-blood-500 pb-1' : 'text-zinc-300'
            }`}
          >
            Overview
          </Link>

          {isAuthenticated ? (
            <Link
              to={getDashboardRoute()}
              className={`hover:text-blood-400 transition-colors ${
                location.pathname.startsWith('/admin') ||
                location.pathname.startsWith('/blood-bank') ||
                location.pathname.startsWith('/lab') ||
                location.pathname.startsWith('/hospital')
                  ? 'text-blood-500 border-b-2 border-blood-500 pb-1'
                  : 'text-zinc-300'
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={`hover:text-blood-400 transition-colors ${
                location.pathname === '/login' ? 'text-blood-500 border-b-2 border-blood-500 pb-1' : 'text-zinc-300'
              }`}
            >
              Sign In
            </Link>
          )}

          {/* User Role Badge */}
          {isAuthenticated && (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-mono text-zinc-400">{user?.role}</span>
              <span className="text-zinc-500">|</span>
              <span className="text-[11px] text-zinc-200 font-bold max-w-[120px] truncate">
                {user?.organizationName}
              </span>
            </div>
          )}
        </nav>

        {/* Action Button Segment (Ref Design Photo Style: Bold Red Block) */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}

          {/* Bold Crimson Red Button matching the Reference Photo's "Free Quote" button */}
          <button
            onClick={onOpenScanner}
            className="bg-blood-600 hover:bg-blood-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-4 sm:px-6 py-2.5 transition-all flex items-center gap-2 shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Verify QR</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-white p-1.5"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 pt-3 pb-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-blood-400"
          >
            Overview
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardRoute()}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-blood-400 font-bold"
              >
                Dashboard ({user.role})
              </Link>
              <div className="text-[11px] text-zinc-400 font-mono">
                {user.organizationName}
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block text-xs font-semibold uppercase tracking-wider text-red-400 pt-2"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-blood-400"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

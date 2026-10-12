import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    switch (role) {
      case 'ADMIN': navigate('/admin'); break;
      case 'BLOOD_BANK': navigate('/blood-bank'); break;
      case 'LAB': navigate('/lab'); break;
      case 'HOSPITAL': navigate('/hospital'); break;
      default: navigate('/'); break;
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand emblem */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-black flex items-center justify-center border-2 border-blood-600 shadow-md">
            <span className="text-white font-black text-xl tracking-tighter">BC</span>
          </div>
        </div>

        <h2 className="text-center text-2xl font-black uppercase tracking-wider text-black">
          Authorized Participant Portal
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
          Cryptographic Access Point
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-white border-2 border-black p-8 shadow-xl space-y-6">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-blood-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blood-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. bloodbank@bloodchain.org"
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none text-xs font-sans text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none text-xs text-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-bold tracking-wider"
            >
              {loading ? 'Authenticating...' : 'Sign In To Portal'}
            </button>
          </form>

          {/* QUICK DEMO CREDENTIAL SELECTOR — Perfect for Viva Demonstration */}
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 text-center">
              VIVA DEMO ROLES (CLICK TO AUTO-FILL)
            </span>

            <div className="grid grid-cols-2 gap-2">
              
              <button
                type="button"
                onClick={() => fillDemo('admin@bloodchain.org', 'password123')}
                className="p-2 border border-zinc-200 bg-zinc-50 hover:bg-black hover:text-white hover:border-black transition text-left text-[11px] font-mono group"
              >
                <span className="block font-bold font-sans text-black group-hover:text-white text-[10px] uppercase">
                  ADMIN
                </span>
                <span className="text-zinc-500 group-hover:text-zinc-300 truncate block">admin@bloodchain.org</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('bloodbank@bloodchain.org', 'password123')}
                className="p-2 border border-zinc-200 bg-zinc-50 hover:bg-blood-600 hover:text-white hover:border-blood-600 transition text-left text-[11px] font-mono group"
              >
                <span className="block font-bold font-sans text-blood-600 group-hover:text-white text-[10px] uppercase">
                  BLOOD BANK
                </span>
                <span className="text-zinc-500 group-hover:text-zinc-100 truncate block">bloodbank@...</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('lab@bloodchain.org', 'password123')}
                className="p-2 border border-zinc-200 bg-zinc-50 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition text-left text-[11px] font-mono group"
              >
                <span className="block font-bold font-sans text-amber-700 group-hover:text-white text-[10px] uppercase">
                  LABORATORY
                </span>
                <span className="text-zinc-500 group-hover:text-zinc-100 truncate block">lab@...</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('hospital@bloodchain.org', 'password123')}
                className="p-2 border border-zinc-200 bg-zinc-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition text-left text-[11px] font-mono group"
              >
                <span className="block font-bold font-sans text-blue-700 group-hover:text-white text-[10px] uppercase">
                  HOSPITAL
                </span>
                <span className="text-zinc-500 group-hover:text-zinc-100 truncate block">hospital@...</span>
              </button>

            </div>
          </div>

        </div>

        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="text-xs text-zinc-600 hover:text-black font-semibold uppercase tracking-wider"
          >
            Register new healthcare participant
          </Link>
        </div>

      </div>
    </div>
  );
};

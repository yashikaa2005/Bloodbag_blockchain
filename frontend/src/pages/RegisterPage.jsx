import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Building2, User, Mail, Lock, Shield } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'BLOOD_BANK',
    organizationName: '',
    walletAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await register(formData);
      switch (user.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'BLOOD_BANK': navigate('/blood-bank'); break;
        case 'LAB': navigate('/lab'); break;
        case 'HOSPITAL': navigate('/hospital'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-black flex items-center justify-center border-2 border-blood-600 shadow-md">
            <span className="text-white font-black text-xl">BC</span>
          </div>
        </div>

        <h2 className="text-center text-2xl font-black uppercase tracking-wider text-black">
          Participant Enrollment
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
          Register Organization on BloodChain
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-white border-2 border-black p-8 shadow-xl space-y-5">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-blood-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blood-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Representative Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Jane Doe"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Official Organization Name
              </label>
              <input
                type="text"
                name="organizationName"
                required
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="e.g. St. Jude Regional Hospital"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                System Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none font-bold"
              >
                <option value="BLOOD_BANK">BLOOD_BANK (Collection & Logistics)</option>
                <option value="LAB">LAB (Testing & Certification)</option>
                <option value="HOSPITAL">HOSPITAL (Receipt & Transfusion)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@organization.org"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Ethereum Wallet Address (Optional)
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                placeholder="0x... (leave empty for testnet auto-assign)"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-bold tracking-wider mt-2"
            >
              {loading ? 'Registering Participant...' : 'Create Account'}
            </button>
          </form>

        </div>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-xs text-zinc-600 hover:text-black font-semibold uppercase tracking-wider"
          >
            Already registered? Sign in here
          </Link>
        </div>

      </div>
    </div>
  );
};

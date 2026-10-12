import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  Building2,
  Droplet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('BLOOD_BANK');
  const [assigning, setAssigning] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/users'),
        api.get('/stats'),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load system data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAssigning(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post('/users/assign-role', {
        userId: selectedUser._id,
        role: newRole,
      });
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `On-chain role ${newRole} assigned successfully! Tx: ${res.data.transactionHash || 'Confirmed'}`,
        });
        setSelectedUser(null);
        fetchData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to assign role on-chain',
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-black text-white p-6 border-b-4 border-blood-600 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blood-500 font-mono">
              GOVERNANCE CONSOLE
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              System Administration
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Admin: {user?.organizationName} ({user?.walletAddress})
            </p>
          </div>

          <button
            onClick={fetchData}
            className="btn-outline text-white border-zinc-700 hover:bg-zinc-800 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Ledger
          </button>
        </div>

        {feedback.message && (
          <div
            className={`p-4 border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-red-50 text-blood-800 border-blood-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-blood-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-white p-5 border-l-4 border-l-black">
            <span className="text-[10px] font-bold uppercase text-zinc-500">Participants</span>
            <span className="block text-2xl font-black text-black mt-1">
              {stats?.totalUsers ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">Registered Entities</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-blood-600">
            <span className="text-[10px] font-bold uppercase text-blood-600">Blood Banks</span>
            <span className="block text-2xl font-black text-black mt-1">
              {stats?.bloodBanksCount ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">Authorized Centers</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-amber-600">
            <span className="text-[10px] font-bold uppercase text-amber-600">Diagnostics</span>
            <span className="block text-2xl font-black text-black mt-1">
              {stats?.labsCount ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">Certified Labs</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-blue-600">
            <span className="text-[10px] font-bold uppercase text-blue-600">Hospitals</span>
            <span className="block text-2xl font-black text-black mt-1">
              {stats?.hospitalsCount ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">Clinical Facilities</span>
          </div>
        </div>

        {/* Registered Users Table */}
        <div className="card-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
                <Users className="w-4 h-4 text-blood-600" />
                Participant Role Directory & Permissions
              </h2>
              <p className="text-xs text-zinc-500">
                Grant or modify cryptographic access roles on the live BloodChain smart contract
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-2" />
              <span className="text-xs font-bold uppercase">Loading Participant Directory...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Ethereum Wallet Address</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-zinc-50 transition">
                      <td className="py-3 px-4 font-bold text-black">
                        {u.organizationName}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {u.name} <span className="text-zinc-400">({u.email})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-700">
                        {u.walletAddress}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRole(u.role);
                          }}
                          className="btn-dark text-[10px] py-1 px-3"
                        >
                          Modify On-Chain Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Modify Role On-Chain */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white border-2 border-black max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="border-b border-zinc-200 pb-2">
                <h3 className="font-extrabold uppercase text-sm text-black">
                  Assign On-Chain Role
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Entity: {selectedUser.organizationName}
                </p>
              </div>

              <form onSubmit={handleAssignRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Select New System Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none font-bold text-xs"
                  >
                    <option value="BLOOD_BANK">BLOOD_BANK (Code: 2)</option>
                    <option value="LAB">LAB (Code: 3)</option>
                    <option value="HOSPITAL">HOSPITAL (Code: 4)</option>
                    <option value="ADMIN">ADMIN (Code: 1)</option>
                  </select>
                </div>

                <div className="p-3 bg-zinc-100 text-zinc-700 font-mono text-[11px] space-y-1">
                  <div>Target Wallet: {selectedUser.walletAddress}</div>
                  <div className="text-zinc-500">Caller: Admin ({user?.walletAddress})</div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="btn-primary text-xs"
                  >
                    {assigning ? 'Broadcasting Tx...' : 'Execute assignRole()'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

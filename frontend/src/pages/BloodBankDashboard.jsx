import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { BloodBagModal } from '../components/BloodBagModal';
import {
  Plus,
  Send,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Droplet,
  ExternalLink,
} from 'lucide-react';

export const BloodBankDashboard = () => {
  const { user } = useAuth();
  const [bags, setBags] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [transferringBag, setTransferringBag] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [viewingBagId, setViewingBagId] = useState(null);

  // Forms & feedback
  const [registerForm, setRegisterForm] = useState({
    bagId: `BC-BAG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    bloodGroup: 'O+',
    collectionDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    volumeMl: 450,
    location: 'Main Blood Bank Storage',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bagsRes, orgsRes] = await Promise.all([
        api.get('/blood-bags'),
        api.get('/users/organizations?role=HOSPITAL'),
      ]);
      if (bagsRes.data.success) setBags(bagsRes.data.bloodBags);
      if (orgsRes.data.success) {
        setHospitals(orgsRes.data.organizations);
        if (orgsRes.data.organizations.length > 0) {
          setSelectedRecipient(orgsRes.data.organizations[0].walletAddress);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load inventory data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post('/blood-bags/register', registerForm);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Blood bag ${registerForm.bagId} successfully registered on blockchain! Tx: ${res.data.transactionHash}`,
        });
        setIsRegisterOpen(false);
        // Reset ID for next registration
        setRegisterForm({
          bagId: `BC-BAG-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          bloodGroup: 'O+',
          collectionDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          volumeMl: 450,
          location: 'Main Blood Bank Storage',
          notes: '',
        });
        fetchData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Registration failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferringBag || !selectedRecipient) return;
    setSubmitting(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/blood-bags/${transferringBag.bagId}/transfer`, {
        recipientAddress: selectedRecipient,
      });
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Bag ${transferringBag.bagId} transferred to ${selectedRecipient}! Tx: ${res.data.transactionHash}`,
        });
        setTransferringBag(null);
        fetchData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Transfer failed on blockchain',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered bags
  const filteredBags = bags.filter((b) => {
    const matchSearch =
      b.bagId.toLowerCase().includes(search.toLowerCase()) ||
      b.registeredByOrg?.toLowerCase().includes(search.toLowerCase());
    const matchGroup = selectedGroup ? b.bloodGroup === selectedGroup : true;
    const matchStatus = selectedStatus ? b.authoritativeStatus === selectedStatus : true;
    return matchSearch && matchGroup && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-black text-white p-6 border-b-4 border-blood-600 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blood-500 font-mono">
              COLLECTION & DISPATCH PORTAL
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Blood Bank Operations
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Organization: {user?.organizationName} ({user?.walletAddress})
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="btn-outline text-white border-zinc-700 hover:bg-zinc-800 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-4 h-4" />
              Register Blood Bag
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* Inventory Control & Filters */}
        <div className="card-white p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Bag ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-300 text-xs font-bold focus:outline-none"
            >
              <option value="">All Blood Groups</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-300 text-xs font-bold focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="COLLECTED">COLLECTED</option>
              <option value="TESTING">TESTING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="TRANSFERRED">IN TRANSIT</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="CONSUMED">CONSUMED</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blood-600" />
              Blood Bag Inventory ({filteredBags.length} units)
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">Authoritative Smart Contract State</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-2" />
              <span className="text-xs font-bold uppercase">Loading Live Ledger Inventory...</span>
            </div>
          ) : filteredBags.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 bg-zinc-50 border border-zinc-200">
              <Droplet className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs font-bold uppercase">No matching blood bags found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Bag ID</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Authoritative Status</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Current Custodian</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredBags.map((bag) => {
                    const isAvailable = bag.authoritativeStatus === 'AVAILABLE';
                    return (
                      <tr key={bag._id} className="hover:bg-zinc-50 transition">
                        <td className="py-3.5 px-4 font-bold font-mono text-black">
                          {bag.bagId}
                        </td>
                        <td className="py-3.5 px-4">
                          <BloodGroupBadge group={bag.bloodGroup} size="sm" />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={bag.authoritativeStatus} />
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                          <div>Col: {new Date(bag.collectionDate).toLocaleDateString()}</div>
                          <div className={bag.isExpired ? 'text-blood-600 font-bold' : ''}>
                            Exp: {new Date(bag.expiryDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-700">
                          <span className="truncate max-w-[150px] block" title={bag.currentCustodian}>
                            {bag.currentCustodian}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setViewingBagId(bag.bagId)}
                            className="btn-outline text-[10px] py-1 px-2.5"
                          >
                            Details & QR
                          </button>

                          {/* Transfer action only permitted when AVAILABLE */}
                          {isAvailable && (
                            <button
                              onClick={() => setTransferringBag(bag)}
                              className="btn-primary text-[10px] py-1 px-2.5"
                            >
                              <Send className="w-3 h-3" />
                              Transfer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Register Blood Bag */}
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white border-2 border-black max-w-lg w-full shadow-2xl p-6 space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <h3 className="font-extrabold uppercase text-sm text-black">
                  Register Blood Bag On Blockchain
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Executes registerBloodBag() on smart contract (Status: COLLECTED)
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Blood Bag ID
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.bagId}
                      onChange={(e) => setRegisterForm({ ...registerForm, bagId: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 font-mono font-bold focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={registerForm.bloodGroup}
                      onChange={(e) => setRegisterForm({ ...registerForm, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 font-bold focus:border-black focus:outline-none"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Collection Date
                    </label>
                    <input
                      type="date"
                      required
                      value={registerForm.collectionDate}
                      onChange={(e) => setRegisterForm({ ...registerForm, collectionDate: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 font-mono focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      required
                      value={registerForm.expiryDate}
                      onChange={(e) => setRegisterForm({ ...registerForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 font-mono focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Volume (mL)
                    </label>
                    <input
                      type="number"
                      value={registerForm.volumeMl}
                      onChange={(e) => setRegisterForm({ ...registerForm, volumeMl: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 font-mono focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Storage Facility
                    </label>
                    <input
                      type="text"
                      value={registerForm.location}
                      onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs"
                  >
                    {submitting ? 'Minting On-Chain...' : 'Register On Blockchain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Transfer Blood Bag */}
        {transferringBag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white border-2 border-black max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <h3 className="font-extrabold uppercase text-sm text-black">
                  Transfer Blood Bag: {transferringBag.bagId}
                </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Smart contract transferBloodBag() &rarr; Status: TRANSFERRED
                  </p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Select Recipient Hospital
                  </label>
                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 font-bold focus:border-black focus:outline-none text-xs"
                  >
                    {hospitals.map((h) => (
                      <option key={h._id} value={h.walletAddress}>
                        {h.organizationName} ({h.walletAddress.substring(0, 10)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-zinc-100 text-zinc-700 text-[11px] font-mono space-y-1">
                  <div>Unit: {transferringBag.bagId} ({transferringBag.bloodGroup})</div>
                  <div>Current Status: {transferringBag.authoritativeStatus}</div>
                  <div className="text-zinc-500">Destination: {selectedRecipient}</div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setTransferringBag(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs"
                  >
                    {submitting ? 'Executing Transfer...' : 'Confirm Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Details */}
        <BloodBagModal
          bagId={viewingBagId}
          isOpen={!!viewingBagId}
          onClose={() => setViewingBagId(null)}
        />

      </div>
    </div>
  );
};

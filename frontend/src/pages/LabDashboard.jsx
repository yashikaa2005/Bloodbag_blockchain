import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { BloodBagModal } from '../components/BloodBagModal';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const LabDashboard = () => {
  const { user } = useAuth();
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [viewingBagId, setViewingBagId] = useState(null);

  const fetchBags = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blood-bags');
      if (res.data.success) {
        setBags(res.data.bloodBags);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load laboratory queue',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBags();
  }, []);

  const handleStartTesting = async (bagId) => {
    setActionInProgress(bagId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/blood-bags/${bagId}/testing`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Laboratory testing initiated for ${bagId}! Tx: ${res.data.transactionHash}`,
        });
        fetchBags();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to start testing',
      });
    } finally {
      setActionInProgress('');
    }
  };

  const handleApprove = async (bagId) => {
    setActionInProgress(bagId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/blood-bags/${bagId}/approve`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Blood bag ${bagId} approved & certified AVAILABLE! Tx: ${res.data.transactionHash}`,
        });
        fetchBags();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve bag',
      });
    } finally {
      setActionInProgress('');
    }
  };

  const handleReject = async (bagId) => {
    if (!window.confirm(`Confirm rejection of blood bag ${bagId}? This action is irreversible on the blockchain.`)) {
      return;
    }
    setActionInProgress(bagId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/blood-bags/${bagId}/reject`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Blood bag ${bagId} REJECTED and disqualified from distribution. Tx: ${res.data.transactionHash}`,
        });
        fetchBags();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reject bag',
      });
    } finally {
      setActionInProgress('');
    }
  };

  // Split bags by lab stages
  const pendingQueue = bags.filter((b) => b.authoritativeStatus === 'COLLECTED');
  const activeTesting = bags.filter((b) => b.authoritativeStatus === 'TESTING');
  const resolvedBags = bags.filter((b) => ['APPROVED', 'AVAILABLE', 'REJECTED'].includes(b.authoritativeStatus));

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-black text-white p-6 border-b-4 border-amber-500 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
              DIAGNOSTIC & SEROLOGY CONSOLE
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Laboratory Testing Workflow
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Facility: {user?.organizationName} ({user?.walletAddress})
            </p>
          </div>

          <button
            onClick={fetchBags}
            className="btn-outline text-white border-zinc-700 hover:bg-zinc-800 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Queue
          </button>
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

        {/* Lab Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-white p-5 border-l-4 border-l-zinc-700">
            <span className="text-[10px] font-bold uppercase text-zinc-500">Awaiting Testing</span>
            <span className="block text-2xl font-black text-black mt-1">
              {pendingQueue.length}
            </span>
            <span className="text-[11px] text-zinc-500">Status: COLLECTED</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-bold uppercase text-amber-700">Active In Analysis</span>
            <span className="block text-2xl font-black text-black mt-1">
              {activeTesting.length}
            </span>
            <span className="text-[11px] text-zinc-500">Status: TESTING</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-emerald-600">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Certified Results</span>
            <span className="block text-2xl font-black text-black mt-1">
              {resolvedBags.length}
            </span>
            <span className="text-[11px] text-zinc-500">Approved or Rejected</span>
          </div>
        </div>

        {/* SECTION 1: Active In Testing (Decisions Required) */}
        <div className="card-white p-6 space-y-4">
          <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-600" />
              Units Under Active Serological Examination ({activeTesting.length})
            </h2>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
              ACTION REQUIRED: APPROVE OR REJECT
            </span>
          </div>

          {activeTesting.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 bg-zinc-50 border border-zinc-200 text-xs">
              No units currently under active testing. Start analysis on collected bags below.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Bag ID</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Origin Center</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4 text-right">Certification Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {activeTesting.map((bag) => {
                    const isBusy = actionInProgress === bag.bagId;
                    return (
                      <tr key={bag._id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3.5 px-4 font-bold text-black">{bag.bagId}</td>
                        <td className="py-3.5 px-4 font-sans">
                          <BloodGroupBadge group={bag.bloodGroup} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 font-sans text-zinc-700">
                          {bag.registeredByOrg || 'Central Blood Bank'}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600">
                          {new Date(bag.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                          <button
                            onClick={() => setViewingBagId(bag.bagId)}
                            className="btn-outline text-[10px] py-1 px-2.5"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleReject(bag.bagId)}
                            disabled={isBusy}
                            className="bg-zinc-900 hover:bg-black text-red-400 border border-red-800 text-[10px] font-bold uppercase py-1 px-3"
                          >
                            <XCircle className="w-3.5 h-3.5 inline mr-1" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(bag.bagId)}
                            disabled={isBusy}
                            className="btn-primary text-[10px] py-1 px-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                            {isBusy ? 'Processing...' : 'Approve Unit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: Pending Testing Queue (Status: COLLECTED) */}
        <div className="card-white p-6 space-y-4">
          <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              Collected Blood Bags Awaiting Laboratory Ingestion ({pendingQueue.length})
            </h2>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 bg-zinc-50 border border-zinc-200 text-xs">
              All registered blood bags have either been processed or are currently undergoing testing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Bag ID</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Collection Date</th>
                    <th className="py-3 px-4">Current Custodian</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {pendingQueue.map((bag) => {
                    const isBusy = actionInProgress === bag.bagId;
                    return (
                      <tr key={bag._id} className="hover:bg-zinc-50 transition">
                        <td className="py-3.5 px-4 font-bold text-black">{bag.bagId}</td>
                        <td className="py-3.5 px-4 font-sans">
                          <BloodGroupBadge group={bag.bloodGroup} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600">
                          {new Date(bag.collectionDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 text-[11px] truncate max-w-[140px]">
                          {bag.currentCustodian}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                          <button
                            onClick={() => setViewingBagId(bag.bagId)}
                            className="btn-outline text-[10px] py-1 px-2.5"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStartTesting(bag.bagId)}
                            disabled={isBusy}
                            className="btn-dark text-[10px] py-1 px-3"
                          >
                            <Play className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                            {isBusy ? 'Starting...' : 'Start Testing'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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

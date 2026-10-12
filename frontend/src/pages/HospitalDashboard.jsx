import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { BloodBagModal } from '../components/BloodBagModal';
import {
  Hospital,
  Inbox,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  QrCode,
  Droplets,
  ArrowDownToLine,
  Activity,
  HeartPulse,
} from 'lucide-react';

export const HospitalDashboard = ({ onOpenScanner }) => {
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
        message: err.response?.data?.message || 'Failed to load hospital inventory',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBags();
  }, []);

  const handleReceiveBag = async (bagId) => {
    setActionInProgress(bagId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/blood-bags/${bagId}/receive`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Blood bag ${bagId} successfully received and authenticated by hospital! Tx: ${res.data.transactionHash}`,
        });
        fetchBags();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to receive blood bag',
      });
    } finally {
      setActionInProgress('');
    }
  };

  const handleConsumeBag = async (bagId) => {
    if (!window.confirm(`Mark blood bag ${bagId} as CONSUMED for clinical transfusion? This finalizes the unit's lifecycle on the smart contract.`)) {
      return;
    }
    setActionInProgress(bagId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/blood-bags/${bagId}/consume`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Blood bag ${bagId} marked CONSUMED for patient transfusion! Tx: ${res.data.transactionHash}`,
        });
        fetchBags();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to consume blood bag',
      });
    } finally {
      setActionInProgress('');
    }
  };

  // Hospital-relevant collections
  // Bags transferred to this hospital
  const incomingBags = bags.filter(
    (b) =>
      b.authoritativeStatus === 'TRANSFERRED' &&
      b.currentCustodian?.toLowerCase() === user?.walletAddress?.toLowerCase()
  );

  // Bags in hospital possession
  const hospitalInventory = bags.filter(
    (b) =>
      b.authoritativeStatus === 'RECEIVED' &&
      b.currentCustodian?.toLowerCase() === user?.walletAddress?.toLowerCase()
  );

  const consumedBags = bags.filter((b) => b.authoritativeStatus === 'CONSUMED');

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-black text-white p-6 border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono">
              CLINICAL RECEIVING & TRANSFUSION CONSOLE
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Hospital Operations
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Facility: {user?.organizationName} ({user?.walletAddress})
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchBags}
              className="btn-outline text-white border-zinc-700 hover:bg-zinc-800 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
            <button
              onClick={onOpenScanner}
              className="btn-primary text-xs"
            >
              <QrCode className="w-4 h-4" />
              Bedside QR Verify
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

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-white p-5 border-l-4 border-l-blue-600">
            <span className="text-[10px] font-bold uppercase text-blue-700">Incoming Deliveries</span>
            <span className="block text-2xl font-black text-black mt-1">
              {incomingBags.length}
            </span>
            <span className="text-[11px] text-zinc-500">Status: TRANSFERRED</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-teal-600">
            <span className="text-[10px] font-bold uppercase text-teal-700">Ready for Transfusion</span>
            <span className="block text-2xl font-black text-black mt-1">
              {hospitalInventory.length}
            </span>
            <span className="text-[11px] text-zinc-500">Status: RECEIVED</span>
          </div>

          <div className="card-white p-5 border-l-4 border-l-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-600">Transfused to Patients</span>
            <span className="block text-2xl font-black text-black mt-1">
              {consumedBags.length}
            </span>
            <span className="text-[11px] text-zinc-500">Status: CONSUMED</span>
          </div>
        </div>

        {/* SECTION 1: Incoming Blood Transfers (Action Required: Receive) */}
        <div className="card-white p-6 space-y-4">
          <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-600" />
              Incoming Blood Shipments In Transit ({incomingBags.length})
            </h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">
              ACTION: CONFIRM CUSTODIAL RECEIPT
            </span>
          </div>

          {incomingBags.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 bg-zinc-50 border border-zinc-200 text-xs">
              No incoming blood shipments currently in transit to this facility.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Bag ID</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Origin Center</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Custodial Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {incomingBags.map((bag) => {
                    const isBusy = actionInProgress === bag.bagId;
                    return (
                      <tr key={bag._id} className="hover:bg-blue-50/40 transition">
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
                            Audit Chain
                          </button>
                          <button
                            onClick={() => handleReceiveBag(bag.bagId)}
                            disabled={isBusy}
                            className="btn-primary text-[10px] py-1 px-3"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5 inline mr-1" />
                            {isBusy ? 'Verifying...' : 'Receive Unit'}
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

        {/* SECTION 2: Hospital On-Site Inventory (Status: RECEIVED) */}
        <div className="card-white p-6 space-y-4">
          <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <Droplets className="w-4 h-4 text-teal-600" />
              Verified Clinical Reserve in Hospital Storage ({hospitalInventory.length})
            </h2>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 border border-teal-200">
              READY FOR TRANSFUSION
            </span>
          </div>

          {hospitalInventory.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 bg-zinc-50 border border-zinc-200 text-xs">
              No units currently in verified hospital stock. Receive incoming shipments above to populate stock.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Bag ID</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Volume</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Clinical Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {hospitalInventory.map((bag) => {
                    const isBusy = actionInProgress === bag.bagId;
                    return (
                      <tr key={bag._id} className="hover:bg-zinc-50 transition">
                        <td className="py-3.5 px-4 font-bold text-black">{bag.bagId}</td>
                        <td className="py-3.5 px-4 font-sans">
                          <BloodGroupBadge group={bag.bloodGroup} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600">
                          {bag.volumeMl || 450} mL
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
                            onClick={() => handleConsumeBag(bag.bagId)}
                            disabled={isBusy}
                            className="btn-dark text-[10px] py-1 px-3"
                          >
                            <HeartPulse className="w-3.5 h-3.5 inline mr-1 text-blood-500" />
                            {isBusy ? 'Executing...' : 'Consume for Transfusion'}
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

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/client';
import { StatusBadge } from './StatusBadge';
import { BloodGroupBadge } from './BloodGroupBadge';
import { LifecycleTimeline } from './LifecycleTimeline';
import { X, ShieldCheck, Download, ExternalLink, RefreshCw } from 'lucide-react';

export const BloodBagModal = ({ bagId, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    if (!bagId) return;
    setLoading(true);
    setError('');
    try {
      const [bagRes, histRes] = await Promise.all([
        api.get(`/blood-bags/${bagId}`),
        api.get(`/blood-bags/${bagId}/history`),
      ]);
      if (bagRes.data.success) setData(bagRes.data.bloodBag);
      if (histRes.data.success) setHistory(histRes.data.history);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bag details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bagId) {
      fetchDetails();
    }
  }, [isOpen, bagId]);

  if (!isOpen) return null;

  const verifyUrl = `${window.location.origin}/verify/${bagId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white border-2 border-black max-w-2xl w-full shadow-2xl my-8 overflow-hidden">
        
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blood-600"></div>
            <div>
              <h3 className="font-extrabold uppercase tracking-wider text-sm">
                Blood Bag Details: {bagId}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Smart Contract Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blood-600" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Retrieving Authoritative State from Blockchain...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-blood-800 text-xs font-semibold">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Primary Attributes Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 border border-zinc-200">
                <div className="flex items-center gap-3">
                  <BloodGroupBadge group={data.bloodGroup} size="lg" />
                  <div>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase">
                      Blood Group
                    </span>
                    <span className="text-sm font-extrabold text-black">
                      {data.bloodGroup}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase">
                    Current Lifecycle
                  </span>
                  <StatusBadge status={data.authoritativeStatus} />
                </div>

                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase">
                    Volume & Condition
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-800">
                    {data.volumeMl || 450} mL | {data.storageCondition || '2-6°C'}
                  </span>
                </div>
              </div>

              {/* Custody and Expiry Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-zinc-200 bg-white">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">
                    Current Custodian Address
                  </span>
                  <span className="font-mono text-[11px] text-black break-all block bg-zinc-100 p-1.5 border border-zinc-200">
                    {data.currentCustodian}
                  </span>
                  <span className="text-[11px] text-zinc-600 font-semibold mt-1 block">
                    Organization: {data.custodianOrgName || 'Verified Entity'}
                  </span>
                </div>

                <div className="p-3 border border-zinc-200 bg-white">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">
                    Dates & Expiration
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div>
                      <span className="text-zinc-500">Collected:</span>{' '}
                      {new Date(data.collectionDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-zinc-500">Expires:</span>{' '}
                      <span className={data.isExpired ? 'text-blood-600 font-bold' : 'text-zinc-800'}>
                        {new Date(data.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code and Quick Verification Link */}
              <div className="p-4 border-2 border-dashed border-zinc-300 flex flex-col sm:flex-row items-center gap-6 bg-white">
                <div className="p-2 border border-black bg-white">
                  <QRCodeSVG value={verifyUrl} size={110} level="M" />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Cryptographically Audited
                  </span>
                  <p className="text-xs text-zinc-600">
                    Scan or open this QR code to access the public verification portal directly backed by smart contract events.
                  </p>
                  <a
                    href={`/verify/${bagId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blood-600 hover:text-blood-800 uppercase tracking-wider underline"
                  >
                    Open Public Verification Page
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Immutable Blockchain Lifecycle History */}
              <div className="pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black mb-4 border-b border-zinc-200 pb-2">
                  Smart Contract History ({history.length} events)
                </h4>
                <LifecycleTimeline history={history} />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-zinc-100 px-6 py-3 border-t border-zinc-200 flex justify-end">
          <button onClick={onClose} className="btn-dark text-xs">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

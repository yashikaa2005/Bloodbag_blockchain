import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { BloodBagModal } from '../components/BloodBagModal';
import {
  ShieldCheck,
  Search,
  QrCode,
  Droplet,
  Activity,
  CheckCircle2,
  ArrowRight,
  Truck,
  Building,
  AlertTriangle,
} from 'lucide-react';

export const LandingPage = ({ onOpenScanner }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBags, setRecentBags] = useState([]);
  const [quickSearchId, setQuickSearchId] = useState('');
  const [selectedBagId, setSelectedBagId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const res = await api.get('/stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentBags(res.data.recentBags || []);
        }
      } catch {
        // Not critical on initial landing
      }
    };
    loadOverview();
  }, []);

  const handleQuickVerify = (e) => {
    e.preventDefault();
    if (!quickSearchId.trim()) return;
    navigate(`/verify/${quickSearchId.trim().toUpperCase()}`);
  };

  const openBag = (id) => {
    setSelectedBagId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      
      {/* HERO SECTION — Inspired by Reference Photo */}
      <section className="relative bg-black text-white border-b-4 border-blood-600 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-blood-500 text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blood-600 animate-ping" />
              Decentralized Ledger Technology Framework
            </div>

            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[1.1]">
              Making Blood Verification <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-500 via-red-400 to-white">
                Transparent & Tamper-Proof
              </span>
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              BloodChain guarantees end-to-end provenance for every unit of blood. Powered by an authoritative Solidity smart contract, every collection, laboratory testing approval, transit transfer, and transfusion is permanently audited on the blockchain.
            </p>
          </div>

          {/* SPLIT HERO ACTION CARDS — Exactly matches Black & Red Card Layout in Reference Photo */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            
            {/* Left Card: Solid Black Box */}
            <div className="bg-[#111113] border-2 border-zinc-800 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  DIRECT VERIFICATION
                </span>
                <p className="text-xs text-zinc-300 mb-4">
                  Enter any official Blood Bag ID to review its real-time smart contract state and chain history.
                </p>
              </div>

              <form onSubmit={handleQuickVerify} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BC-BAG-2026-00001"
                  value={quickSearchId}
                  onChange={(e) => setQuickSearchId(e.target.value)}
                  className="flex-1 bg-black border border-zinc-700 px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-blood-500"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black font-extrabold uppercase px-4 py-2 text-xs transition"
                >
                  Verify
                </button>
              </form>
            </div>

            {/* Right Card: Vibrant Crimson Red Box */}
            <div className="bg-blood-600 text-white p-6 shadow-xl flex flex-col justify-between border-2 border-blood-700">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-widest text-blood-100 mb-1">
                  QUICK QR AUDIT
                </span>
                <p className="text-xs text-blood-50 mb-4 leading-relaxed">
                  Scan physical unit labels at the point of care to confirm authenticity before clinical transfusion.
                </p>
              </div>

              <button
                onClick={onOpenScanner}
                className="w-full bg-black hover:bg-zinc-900 text-white font-extrabold uppercase px-4 py-3 text-xs tracking-wider transition flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4 text-blood-500" />
                Launch Camera QR Scanner
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* METRIC COUNTERS BAR */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            
            <div className="border-r border-zinc-200 last:border-r-0">
              <span className="block text-2xl sm:text-3xl font-black text-black">
                {stats?.totalBags ?? '—'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Total Blood Bags
              </span>
            </div>

            <div className="border-r border-zinc-200 last:border-r-0">
              <span className="block text-2xl sm:text-3xl font-black text-blood-600">
                {stats?.statusCounts?.AVAILABLE ?? '—'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Available In Reserve
              </span>
            </div>

            <div className="border-r border-zinc-200 last:border-r-0">
              <span className="block text-2xl sm:text-3xl font-black text-amber-600">
                {stats?.statusCounts?.TESTING ?? '—'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Under Lab Testing
              </span>
            </div>

            <div>
              <span className="block text-2xl sm:text-3xl font-black text-zinc-800">
                {stats?.statusCounts?.CONSUMED ?? '—'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Transfused to Patients
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* RECENT BLOOD BAGS & WORKFLOW OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        
        {/* Recent Bags Table */}
        <div className="card-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-black flex items-center gap-2">
                <span className="w-3 h-3 bg-blood-600" />
                Live Cataloged Blood Units
              </h2>
              <p className="text-xs text-zinc-500">
                Direct view of units logged in MongoDB and verified on the local Hardhat ledger
              </p>
            </div>

            <Link
              to="/login"
              className="btn-outline text-xs"
            >
              Sign In To Manage Units
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentBags.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 bg-zinc-50 border border-zinc-200">
              <Droplet className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs font-bold uppercase">No blood bags registered yet</p>
              <p className="text-xs text-zinc-500 mt-1">Sign in as Blood Bank to register units onto the blockchain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Bag ID</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Collection Date</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Registered By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {recentBags.map((bag) => (
                    <tr key={bag._id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-black">
                        {bag.bagId}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <BloodGroupBadge group={bag.bloodGroup} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {new Date(bag.collectionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {new Date(bag.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-700">
                        {bag.registeredByOrg || 'Central Blood Center'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          onClick={() => openBag(bag.bagId)}
                          className="btn-dark text-[10px] py-1 px-3"
                        >
                          View Chain Record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Technical Architecture Pillar Cards */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 mb-4 text-center">
            Blockchain Security Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="card-white p-5 border-t-4 border-t-black">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pillar 01</span>
              <h4 className="font-extrabold uppercase text-xs mt-1 mb-2 text-black">
                Immutable Lifecycle
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                State transitions from COLLECTED to CONSUMED are enforced exclusively by the smart contract. Reverted on unauthorized bypass.
              </p>
            </div>

            <div className="card-white p-5 border-t-4 border-t-blood-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blood-600">Pillar 02</span>
              <h4 className="font-extrabold uppercase text-xs mt-1 mb-2 text-black">
                Role-Based Guardrails
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Only authenticated Blood Banks can register, only certified Labs can approve, and only authorized Hospitals can receive or consume.
              </p>
            </div>

            <div className="card-white p-5 border-t-4 border-t-black">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pillar 03</span>
              <h4 className="font-extrabold uppercase text-xs mt-1 mb-2 text-black">
                Zero PII On-Chain
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Donor personal identities remain completely isolated from the ledger, preventing privacy breaches while guaranteeing traceability.
              </p>
            </div>

            <div className="card-white p-5 border-t-4 border-t-blood-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blood-600">Pillar 04</span>
              <h4 className="font-extrabold uppercase text-xs mt-1 mb-2 text-black">
                Cryptographic Custody
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Only the designated current custodian has permission to execute transfers, preventing intercept or duplicate distribution.
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* Bag Details Modal */}
      <BloodBagModal
        bagId={selectedBagId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBagId(null);
        }}
      />

    </div>
  );
};

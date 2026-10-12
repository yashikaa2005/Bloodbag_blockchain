import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { LifecycleTimeline } from '../components/LifecycleTimeline';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Download,
  Building,
  Calendar,
  Layers,
  FileCheck2,
} from 'lucide-react';

export const VerifyPage = () => {
  const { bagId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/verification/${bagId}`);
        if (res.data.success) {
          setData(res.data);
        } else {
          setError(res.data.message || 'Verification failed');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Blood bag not found on the smart contract. Verification failed.'
        );
      } finally {
        setLoading(false);
      }
    };
    if (bagId) fetchVerification();
  }, [bagId]);

  const downloadQR = () => {
    const svg = document.getElementById('verification-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${bagId}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Overview
        </Link>

        {loading ? (
          <div className="card-white p-16 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-blood-600 mx-auto" />
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              Querying BloodChain Smart Contract...
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Verifying cryptographic record for {bagId}
            </p>
          </div>
        ) : error ? (
          <div className="card-white border-2 border-blood-600 p-8 space-y-4 text-center">
            <div className="w-14 h-14 bg-blood-100 text-blood-700 flex items-center justify-center mx-auto border-2 border-blood-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-black">
              Unverified Blood Bag Unit
            </h2>
            <p className="text-xs text-zinc-700 max-w-md mx-auto leading-relaxed">
              {error}
            </p>
            <div className="pt-2">
              <Link to="/" className="btn-dark text-xs">
                Back to Search
              </Link>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* High-Impact Verification Banner */}
            <div className="bg-black text-white p-6 border-b-4 border-blood-600 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  AUTHENTICATED ON-CHAIN
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-mono">
                  {data.bloodBag.bagId}
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  Contract: {data.verificationDetails.contractAddress}
                </p>
              </div>

              <div className="text-right flex flex-col items-end">
                <StatusBadge status={data.bloodBag.authoritativeStatus} className="text-xs px-3 py-1" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                  Authoritative State
                </span>
              </div>
            </div>

            {/* Core Bag Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Unit Specifications */}
              <div className="card-white p-5 space-y-4 md:col-span-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-black border-b border-zinc-200 pb-2 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blood-600" />
                  Unit Specifications & Custody
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 border border-zinc-200">
                    <span className="block text-[10px] font-bold uppercase text-zinc-500">
                      Blood Group
                    </span>
                    <div className="mt-1">
                      <BloodGroupBadge group={data.bloodBag.bloodGroup} size="lg" />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 border border-zinc-200">
                    <span className="block text-[10px] font-bold uppercase text-zinc-500">
                      Volume & Storage
                    </span>
                    <span className="text-sm font-extrabold text-black block mt-1">
                      {data.bloodBag.volumeMl} mL
                    </span>
                    <span className="text-[11px] text-zinc-600 font-mono">
                      {data.bloodBag.storageCondition}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-zinc-500">
                    Current Designated Custodian
                  </span>
                  <span className="text-xs font-bold text-black block">
                    {data.bloodBag.custodianName}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600 break-all block">
                    Address: {data.bloodBag.currentCustodian}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 border border-zinc-200">
                    <span className="block text-[10px] font-sans font-bold uppercase text-zinc-500">
                      Collection Timestamp
                    </span>
                    <span className="text-zinc-900 font-bold mt-1 block">
                      {new Date(data.bloodBag.collectionDate).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 border border-zinc-200">
                    <span className="block text-[10px] font-sans font-bold uppercase text-zinc-500">
                      Expiration Threshold
                    </span>
                    <span className={`mt-1 block font-bold ${data.bloodBag.isExpired ? 'text-blood-600' : 'text-zinc-900'}`}>
                      {new Date(data.bloodBag.expiryDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code & Physical Inspection */}
              <div className="card-white p-5 flex flex-col items-center justify-between text-center space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-black mb-1">
                    Label QR Verification
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Cryptographic tag for hospital bedside verification
                  </p>
                </div>

                <div className="p-3 border-2 border-black bg-white shadow-sm">
                  <QRCodeSVG
                    id="verification-qr"
                    value={window.location.href}
                    size={150}
                    level="M"
                  />
                </div>

                <button
                  onClick={downloadQR}
                  className="w-full btn-outline text-xs"
                >
                  <Download className="w-4 h-4" />
                  Save Unit QR Code
                </button>
              </div>

            </div>

            {/* Authoritative Smart Contract Lifecycle Timeline */}
            <div className="card-white p-6 space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
                  <span className="w-3 h-3 bg-black" />
                  Authoritative Blockchain Event Log
                </h3>
                <p className="text-xs text-zinc-500">
                  Chronological event history immutably emitted and sealed on the local Hardhat ledger
                </p>
              </div>

              <LifecycleTimeline history={data.lifecycleHistory} />
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};

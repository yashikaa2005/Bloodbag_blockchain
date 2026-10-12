import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, Search, Camera, AlertCircle } from 'lucide-react';

export const QrScannerModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
    }
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // scanner already stopped
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-target');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          stopScanner();
          onClose();
          // If decodedText is full URL, extract bag ID
          const match = decodedText.match(/verify\/(BC-BAG-[A-Za-z0-9-]+)/i) || decodedText.match(/(BC-BAG-[A-Za-z0-9-]+)/i);
          const bagId = match ? match[1] : decodedText.trim();
          navigate(`/verify/${bagId}`);
        },
        () => {
          // Ignore scanning frame errors
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable or blocked. Please enter the Blood Bag ID manually below.');
      setCameraActive(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    const cleanId = manualId.trim().toUpperCase();
    stopScanner();
    onClose();
    navigate(`/verify/${cleanId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border-2 border-black max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blood-500" />
            <h3 className="font-extrabold uppercase tracking-wider text-sm">
              Blood Bag Verification
            </h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* Camera Scanner Container */}
          <div className="bg-zinc-100 border border-zinc-300 p-3 text-center">
            <div
              id="qr-reader-target"
              className="w-full min-h-[200px] flex items-center justify-center bg-black/5 overflow-hidden"
            >
              {!cameraActive && (
                <div className="py-6 px-4">
                  <Camera className="w-12 h-12 mx-auto text-zinc-400 mb-2" />
                  <p className="text-xs font-semibold text-zinc-600 uppercase mb-3">
                    Scan Blood Bag QR via Camera
                  </p>
                  <button
                    onClick={startCamera}
                    type="button"
                    className="btn-dark text-xs"
                  >
                    Activate Camera
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-2 text-xs text-blood-700 bg-blood-50 p-2 border border-blood-200 flex items-start gap-1 text-left">
                <AlertCircle className="w-4 h-4 text-blood-600 flex-shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-300"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              OR ENTER MANUALLY
            </span>
            <div className="flex-grow border-t border-zinc-300"></div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Blood Bag ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. BC-BAG-2026-00001"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border-2 border-zinc-300 focus:border-black focus:outline-none text-xs font-mono tracking-wider uppercase text-zinc-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-3"
            >
              <Search className="w-4 h-4" />
              Verify on Blockchain
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

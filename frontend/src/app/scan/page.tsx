"use client";

import { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Ticket, 
  Mail,
  ArrowLeft,
  Camera,
  Loader2
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface TicketData {
  id: string;
  ticket_code: string;
  status: string;
  expires_at: string;
  passes: Array<{
    id: string;
    product_id: string;
    name: string;
    type: string;
    used_quantity: number;
    total_quantity: number;
    status: string;
  }>;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    ticket: TicketData;
  };
}

export default function QRScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLaunched, setCameraLaunched] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async (detectedCodes: any[]) => {
    if (!detectedCodes || detectedCodes.length === 0 || !isScanning || isLoading) return;
    
    const result = detectedCodes[0].rawValue;
    if (!result) return;

    setIsScanning(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/tickets/scan/${result}`);
      setScanResult(response.data);
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.response?.data?.message || "Failed to validate ticket");
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [isScanning, isLoading]);

  const handleError = useCallback((error: any) => {
    console.error("QR Scanner error:", error);
    setError("Camera access denied or not available");
  }, []);

  const launchCamera = () => {
    setCameraLaunched(true);
    setIsScanning(true);
    setError(null);
  };

  const resetScanner = () => {
    setIsScanning(false);
    setCameraLaunched(false);
    setScanResult(null);
    setError(null);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Ticket Scanner
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Scan QR codes to validate tickets
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {!cameraLaunched && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-3 bg-indigo-50 rounded-full">
                    <Camera className="text-accent" size={32} />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 text-center mb-2">
                  Ready to Scan
                </h2>
                <p className="text-slate-500 text-center mb-8">
                  Click the button below to launch the camera and start scanning QR codes
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={launchCamera}
                    className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 transition-all active:scale-95"
                  >
                    <Camera size={20} />
                    <span>Launch Camera</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isScanning && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-3 bg-indigo-50 rounded-full">
                    <Camera className="text-accent" size={32} />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 text-center mb-2">
                  Scan QR Code
                </h2>
                <p className="text-slate-500 text-center mb-6">
                  Position QR code within frame to validate
                </p>

                {/* QR Scanner */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    styles={{
                      container: { width: "100%", height: "300px" },
                      video: { width: "100%", height: "100%", objectFit: "cover" }
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-indigo-400/50 rounded-2xl">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-2xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-2xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-2xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12"
            >
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-accent mb-4" size={48} />
                <p className="text-slate-700 text-lg font-medium">Validating ticket...</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-50 rounded-full mb-4">
                  <XCircle className="text-red-600" size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Scan Error</h3>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                  onClick={resetScanner}
                  className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <div className={`bg-white rounded-3xl border shadow-sm p-6 ${
                scanResult.success && scanResult.data.valid 
                  ? 'border-green-200' 
                  : 'border-red-200'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${
                    scanResult.success && scanResult.data.valid
                      ? 'bg-green-50'
                      : 'bg-red-50'
                  }`}>
                    {scanResult.success && scanResult.data.valid ? (
                      <CheckCircle2 className="text-green-600" size={32} />
                    ) : (
                      <XCircle className="text-red-600" size={32} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      {scanResult.success && scanResult.data.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                    </h3>
                    <p className="text-slate-500">{scanResult.message}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              {scanResult.data && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Ticket size={20} />
                    Ticket Details
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Ticket Code</p>
                        <p className="text-slate-900 font-mono font-medium">{scanResult.data.ticket.ticket_code}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Booking Reference</p>
                        <p className="text-slate-900 font-medium">{scanResult.data.ticket.booking_reference}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          scanResult.data.ticket.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {scanResult.data.ticket.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Expires At</p>
                        <p className={`font-medium ${
                          isExpired(scanResult.data.ticket.expires_at) 
                            ? 'text-red-600' 
                            : 'text-slate-900'
                        }`}>
                          {formatDateTime(scanResult.data.ticket.expires_at)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-slate-400 text-sm mb-1">Guest Information</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span className="text-slate-900 font-medium">{scanResult.data.ticket.guest_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-slate-400" />
                          <span className="text-slate-600">{scanResult.data.ticket.guest_email}</span>
                        </div>
                      </div>
                    </div>

                    {scanResult.data.ticket.passes.length > 0 && (
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-slate-400 text-sm mb-3">Included Passes</p>
                        <div className="space-y-2">
                          {scanResult.data.ticket.passes.map((pass, index) => (
                            <div key={pass.id} className="bg-slate-50 rounded-xl p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-slate-900 font-medium">{pass.name}</p>
                                  <p className="text-slate-500 text-sm">{pass.type}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-slate-900 font-medium">
                                    {pass.used_quantity} / {pass.total_quantity}
                                  </p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    pass.status === 'AVAILABLE'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {pass.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center">
                <button
                  onClick={resetScanner}
                  className="px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
                >
                  Scan Another Ticket
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

interface ScannerProps {
  onScan: (scannedText: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleMockScan = () => {
    // In a real app, we'd use a library like zxing or jsQR to decode the video frame.
    // For this demo, we simulate scanning a random serial number from our inventory.
    const mockSerials = ['CS-40-001', 'CM-002', 'TX-1212-01', 'LT-600D-05', 'AB-SET-03'];
    const randomSerial = mockSerials[Math.floor(Math.random() * mockSerials.length)];
    onScan(randomSerial);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 className="text-zinc-100 font-bold uppercase tracking-tighter italic">Equipment Scanner</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 bg-black min-h-[300px] flex items-center justify-center">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover grayscale opacity-60"
              />
              {/* Scanning Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-amber-500/50 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-amber-500/30 animate-pulse"></div>
                </div>
              </div>
              <div className="absolute bottom-6 inset-x-0 flex justify-center">
                <p className="bg-zinc-900/80 px-3 py-1 rounded-full text-[10px] text-zinc-300 uppercase tracking-widest border border-zinc-700">
                  Align barcode within frame
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 space-y-3">
          <Button fullWidth onClick={handleMockScan} disabled={!!error}>
            Capture & Scan
          </Button>
          <p className="text-[10px] text-zinc-500 text-center uppercase">Scan serial number to instantly check-in/out</p>
        </div>
      </div>
    </div>
  );
};

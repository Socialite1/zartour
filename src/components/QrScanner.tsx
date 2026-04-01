import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Date.now());

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Extract QR param from URL or use raw text
            try {
              const url = new URL(decodedText);
              const qr = url.searchParams.get("qr");
              if (qr) {
                onScan(qr);
                return;
              }
            } catch {
              // Not a URL
            }
            onScan(decodedText);
          },
          () => {} // ignore failures
        );
      } catch (err: any) {
        setError("Camera access denied or not available. Please allow camera permissions.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <XCircle className="w-8 h-8" />
        </Button>
      </div>

      <div className="text-center mb-6">
        <Camera className="w-8 h-8 text-white mx-auto mb-2" />
        <p className="text-white font-medium">Scan QR Code</p>
        <p className="text-white/60 text-sm">Point your camera at a location QR code</p>
      </div>

      <div className="w-[300px] h-[300px] relative rounded-2xl overflow-hidden">
        <div id={containerRef.current} className="w-full h-full" />
        {/* Corner markers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" />
        </div>
      </div>

      {error && (
        <div className="mt-6 px-6 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

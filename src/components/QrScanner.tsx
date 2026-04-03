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
    let stopped = false;
    const onScanRef = onScan;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          async (decodedText) => {
            if (stopped) return;
            stopped = true;
            // Stop scanner before processing to prevent duplicate scans
            try {
              await scanner.stop();
            } catch {}

            // Extract QR param from URL or use raw text
            let result = decodedText;
            try {
              const url = new URL(decodedText);
              const qr = url.searchParams.get("qr");
              if (qr) result = qr;
            } catch {
              // Not a URL, use raw text
            }
            onScanRef(result);
          },
          () => {} // ignore scan failures
        );
      } catch (err: any) {
        console.error("QR Scanner error:", err);
        setError("Camera access denied or not available. Please allow camera permissions and reload.");
      }
    };

    startScanner();

    return () => {
      stopped = true;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

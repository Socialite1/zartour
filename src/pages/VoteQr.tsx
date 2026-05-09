import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Trophy, Download, ArrowLeft } from "lucide-react";

export default function VoteQr() {
  const voteUrl = `${window.location.origin}/vote`;

  const downloadQr = () => {
    const svg = document.getElementById("public-vote-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 0, 0, 1024, 1024);
      }
      const a = document.createElement("a");
      a.download = "limpopo-cup-vote-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary/90 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-6 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-secondary" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold">Scan to Vote for Your Team</p>
          <p className="text-muted-foreground text-sm mt-1">Keep Seleteng Alive (Kgomumg)</p>
        </div>
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeSVG id="public-vote-qr-svg" value={voteUrl} size={260} level="H" includeMargin />
        </div>
        <p className="text-xs text-muted-foreground break-all">{voteUrl}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={downloadQr} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />Download
          </Button>
          <Button asChild className="gap-2">
            <Link to="/vote"><Trophy className="w-4 h-4" />Open Vote</Link>
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/"><ArrowLeft className="w-4 h-4" />Home</Link>
        </Button>
      </div>
    </div>
  );
}

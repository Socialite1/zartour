import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Share2 } from "lucide-react";

export default function VoteShared() {
  const [params] = useSearchParams();
  const team = params.get("team") ?? "your team";
  const voteUrl = `${window.location.origin}/vote`;
  const shareText = `🔥 I just voted for ${team} in the Limpopo Cup! Cast your vote now: ${voteUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(voteUrl)}&quote=${encodeURIComponent(shareText)}`;

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Limpopo Cup Vote", text: shareText, url: voteUrl }); } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary/90 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-6 text-center space-y-5 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
          <Trophy className="w-10 h-10 text-secondary" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold">🔥 You voted for</p>
          <p className="text-3xl font-display font-bold text-primary mt-1">{team}!</p>
          <p className="text-muted-foreground mt-2">Share to boost your team!</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </Button>
          <Button asChild className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>
          </Button>
        </div>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button variant="outline" onClick={nativeShare} className="w-full gap-2">
            <Share2 className="w-4 h-4" />More share options
          </Button>
        )}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="ghost" className="flex-1"><Link to="/vote">Back</Link></Button>
          <Button asChild variant="default" className="flex-1"><Link to="/leaderboard-vote">Leaderboard</Link></Button>
        </div>
      </div>
    </div>
  );
}

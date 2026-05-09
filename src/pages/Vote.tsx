import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trophy, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  display_order: number;
}

// Voting deadline — 7 days from first load
const DEFAULT_DEADLINE = (() => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("vote_deadline") : null;
  if (stored) return parseInt(stored, 10);
  const d = Date.now() + 7 * 24 * 60 * 60 * 1000;
  if (typeof window !== "undefined") localStorage.setItem("vote_deadline", String(d));
  return d;
})();

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s, ended: diff === 0 };
}

export default function Vote() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [voterName, setVoterName] = useState("");
  const [selected, setSelected] = useState<Team | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState<string | null>(null);
  const deviceId = useMemo(() => getDeviceId(), []);
  const countdown = useCountdown(DEFAULT_DEADLINE);

  useEffect(() => {
    (async () => {
      const [teamsRes, voteRes] = await Promise.all([
        supabase.from("teams").select("*").order("display_order"),
        supabase.from("votes").select("team_id, voter_name").eq("device_id", deviceId).maybeSingle(),
      ]);
      setTeams(teamsRes.data ?? []);
      if (voteRes.data) {
        setAlreadyVoted(voteRes.data.team_id);
        setVoterName(voteRes.data.voter_name);
      }
      setLoading(false);
    })();
  }, [deviceId]);

  const handleSelect = (team: Team) => {
    if (countdown.ended) {
      toast.error("Voting has closed");
      return;
    }
    if (alreadyVoted) {
      toast.error("You've already voted from this device");
      return;
    }
    if (!voterName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    setSelected(team);
    setConfirmOpen(true);
  };

  const submitVote = async () => {
    if (!selected) return;
    setSubmitting(true);
    const { error } = await supabase.from("votes").insert({
      team_id: selected.id,
      voter_name: voterName.trim().slice(0, 60),
      device_id: deviceId,
    });
    setSubmitting(false);
    setConfirmOpen(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("You've already voted from this device");
        setAlreadyVoted(selected.id);
      } else {
        toast.error("Vote failed: " + error.message);
      }
      return;
    }
    setAlreadyVoted(selected.id);
    toast.success(`Vote cast for ${selected.name}!`);
    navigate(`/vote/shared?team=${encodeURIComponent(selected.name)}`);
  };

  const votedTeam = teams.find(t => t.id === alreadyVoted);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground py-6 px-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-7 h-7 text-secondary" />
              Keep Seleteng Alive (Kgomumg)
            </h1>
            <Link to="/leaderboard" className="text-xs sm:text-sm underline hover:opacity-80">
              Leaderboard →
            </Link>
          </div>
          <p className="text-sm opacity-90">Pick your champion. One vote per fan.</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            {countdown.ended ? (
              <span className="font-mono font-bold">VOTING CLOSED</span>
            ) : (
              <span className="font-mono font-bold">
                {String(countdown.h).padStart(2, "0")}:{String(countdown.m).padStart(2, "0")}:{String(countdown.s).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {votedTeam && (
          <Card className="border-secondary/50 bg-secondary/10">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Your vote</p>
                <p className="font-display font-bold text-lg">{votedTeam.name}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to={`/vote/shared?team=${encodeURIComponent(votedTeam.name)}`}>
                  <Share2 className="w-4 h-4" />Share
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!alreadyVoted && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label htmlFor="voter-name" className="font-display">Your name or nickname</Label>
              <Input
                id="voter-name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="e.g. Thabo M."
                maxLength={60}
                disabled={countdown.ended}
              />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading teams…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {teams.map((team) => {
              const isVoted = alreadyVoted === team.id;
              const initials = team.name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <button
                  key={team.id}
                  onClick={() => handleSelect(team)}
                  disabled={!!alreadyVoted || countdown.ended}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isVoted
                      ? "border-secondary bg-secondary/15 shadow-md"
                      : "border-border bg-card hover:border-primary hover:shadow-lg active:scale-95"
                  } ${alreadyVoted && !isVoted ? "opacity-50" : ""} disabled:cursor-not-allowed`}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-display font-bold text-lg shadow-inner">
                    {initials}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-center leading-tight line-clamp-2 min-h-[2.5rem]">
                    {team.name}
                  </p>
                  {isVoted && (
                    <span className="absolute top-1 right-1 text-[10px] font-bold bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                      ✓ VOTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Confirm your vote</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground mb-1">You are voting for</p>
              <p className="font-display font-bold text-2xl text-primary">{selected.name}</p>
              <p className="text-xs text-muted-foreground mt-3">This cannot be changed.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitVote} disabled={submitting}>{submitting ? "Submitting…" : "Confirm Vote"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

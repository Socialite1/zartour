import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Download, RotateCcw, FileDown, QrCode, Vote as VoteIcon } from "lucide-react";
import { toast } from "sonner";

interface Row { id: string; name: string; vote_count: number }
interface VoteRow { id: string; team_id: string; voter_name: string; device_id: string; created_at: string }

export default function VoteAdmin() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("team_vote_counts" as never)
      .select("id, name, vote_count")
      .order("vote_count", { ascending: false }) as { data: Row[] | null };
    if (data) setRows(data);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const total = rows.reduce((s, r) => s + r.vote_count, 0);
  const voteUrl = `${window.location.origin}/vote`;

  const exportCsv = async () => {
    const { data: votes } = await supabase.from("votes").select("id, team_id, voter_name, device_id, created_at");
    const teamMap = new Map(rows.map(r => [r.id, r.name]));
    const header = "vote_id,team_name,voter_name,device_id,created_at\n";
    const csv = header + (votes ?? []).map((v: VoteRow) =>
      [v.id, teamMap.get(v.team_id) ?? v.team_id, `"${v.voter_name.replace(/"/g, '""')}"`, v.device_id, v.created_at].join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `votes-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const resetVotes = async () => {
    setResetting(true);
    const { error } = await supabase.from("votes").delete().not("id", "is", null);
    setResetting(false);
    setResetOpen(false);
    if (error) { toast.error("Reset failed: " + error.message); return; }
    toast.success("All votes reset");
    load();
  };

  const downloadQr = () => {
    const svg = document.getElementById("vote-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = "vote-qr.png";
      a.href = canvas.toDataURL("image/png"); a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (adminLoading) return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading…</div></AppLayout>;
  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <p className="text-muted-foreground text-sm">Vote Admin</p>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <VoteIcon className="w-6 h-6" />Limpopo Cup
          </h1>
        </div>

        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs uppercase text-muted-foreground tracking-wide">Total votes</p>
            <p className="font-display text-4xl font-bold text-primary mt-1">{total.toLocaleString()}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setQrOpen(true)} variant="outline" className="gap-1.5"><QrCode className="w-4 h-4" />QR Code</Button>
          <Button onClick={exportCsv} variant="outline" className="gap-1.5"><FileDown className="w-4 h-4" />Export CSV</Button>
          <Button onClick={() => setResetOpen(true)} variant="destructive" className="col-span-2 gap-1.5"><RotateCcw className="w-4 h-4" />Reset All Votes</Button>
        </div>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <span className="font-display font-bold w-8 text-center">#{i + 1}</span>
                <span className="flex-1 text-sm truncate">{r.name}</span>
                <span className="font-display font-bold text-secondary">{r.vote_count}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset all votes?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This permanently deletes every vote. Cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetting}>Cancel</Button>
            <Button variant="destructive" onClick={resetVotes} disabled={resetting}>{resetting ? "Resetting…" : "Yes, reset"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-center">Scan to Vote for Your Team</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG id="vote-qr-svg" value={voteUrl} size={240} level="H" includeMargin />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all px-4">{voteUrl}</p>
            <Button onClick={downloadQr} variant="outline" className="gap-2"><Download className="w-4 h-4" />Download PNG</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

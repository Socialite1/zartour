import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Camera, CheckCircle2, MessageCircle, QrCode, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ShareButton from "@/components/ShareButton";

type Theme = "earth" | "art" | "history" | "culture" | "nature";

interface Checkpoint {
  n: number;
  theme: Theme;
  title: string;
  place: string;
  points: number;
  badge: string;
  intro: string;
  question: string;
  options?: { v: string; label: string }[];
  choices?: string[];
  qrStory?: string;
}

const CHECKPOINTS: Checkpoint[] = [
  { n: 1, theme: "earth", title: "Enter the Ancient Land", place: "Makgabeng Plateau", points: 100, badge: "Earth Explorer",
    intro: "Find a dramatic sandstone formation and take a photograph.",
    question: "How old are the rock formations of Makgabeng?",
    options: [{ v: "A", label: "20 million years" }, { v: "B", label: "200 million years" }, { v: "C", label: "2 billion years" }, { v: "D", label: "10 billion years" }] },
  { n: 2, theme: "art", title: "Read the Rock", place: "Rock Art Site", points: 150, badge: "Rock Art Seeker",
    intro: "Look closely at the paintings. They carry San, Khoi and Northern Sotho traditions. Capture your favourite detail.",
    question: "In your own words: why is rock art important?" },
  { n: 3, theme: "history", title: "The Maleboho Trail", place: "Maleboho Battlefield / Chief Malebogo statue", points: 150, badge: "History Keeper",
    intro: "Find the heritage site, scan the QR, and take a photograph.",
    qrStory: "Kgoshi Malebogo of the Bahananwa led his people in resisting the Boer republic in 1894, defending the Blouberg hills from fortified caves for months before being captured. His stand remains a powerful symbol of dignity and resistance in Limpopo.",
    question: "Answer the question your guide gives you." },
  { n: 4, theme: "culture", title: "Culture is Alive", place: "Seabakgwana pottery makers / community", points: 200, badge: "Living Culture",
    intro: "Don't just look at culture — participate. Choose one experience and take a photo.",
    choices: ["🏺 Learn about pottery", "🥘 Taste Bahananwa cuisine", "🗣️ Learn a local word", "👵🏾 Hear a local story", "🤝 Meet a local artisan"],
    question: "What is one thing you learned from the community?" },
  { n: 5, theme: "nature", title: "Look to the Sky", place: "Blouberg – Cape Vulture colony", points: 150, badge: "Wildlife Tracker",
    intro: "Find the Cape Vulture viewpoint and capture the landscape or a bird.",
    question: "Answer your guide's question about the Cape Vulture." },
  { n: 6, theme: "earth", title: "The Guardian's View", place: "Makgabeng Plateau viewpoint", points: 200, badge: "Guardian's View",
    intro: "Take your “I discovered Makgabeng” photograph.",
    question: "What should the next generation know about Makgabeng? (One sentence — it goes on the Visitor Wall)" },
];

const HUBS: { theme: Theme; icon: string; name: string; sub: string; book: string }[] = [
  { theme: "earth", icon: "🪨", name: "Earth Quest", sub: "Hiking · geology · viewpoints", book: "a guided Makgabeng hike / camping weekend" },
  { theme: "art", icon: "🎨", name: "Art Quest", sub: "Rock paintings · storytelling", book: "a guided rock art tour" },
  { theme: "history", icon: "⚔️", name: "History Quest", sub: "Maleboho · Chief Malebogo", book: "a guided heritage tour" },
  { theme: "culture", icon: "🏺", name: "Culture Quest", sub: "Cuisine · pottery · village", book: "a pottery / food experience or homestay" },
  { theme: "nature", icon: "🦅", name: "Nature Quest", sub: "Cape Vulture · wildlife · flora", book: "a Blouberg wildlife outing" },
];

const WHATSAPP = "27607996938";
const book = (what: string) =>
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi Zartour! I'd like to book ${what} in Makgabeng.`)}`, "_blank", "noopener,noreferrer");

interface Done { checkpoint: number; points_awarded: number }

export default function Makgabeng() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<Done[]>([]);
  const [wall, setWall] = useState<{ first_name: string; message: string }[]>([]);
  const [active, setActive] = useState<Checkpoint | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data }, { data: w }] = await Promise.all([
      supabase.from("makgabeng_checkpoints" as never).select("checkpoint, points_awarded").eq("user_id", user.id),
      supabase.rpc("get_makgabeng_wall" as never),
    ]);
    setDone((data as Done[] | null) ?? []);
    setWall((w as { first_name: string; message: string }[] | null) ?? []);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const isDone = (n: number) => done.some((d) => d.checkpoint === n);
  const points = done.reduce((s, d) => s + d.points_awarded, 0);
  const hubDone = (t: Theme) => CHECKPOINTS.filter((c) => c.theme === t).every((c) => isDone(c.n));
  const allDone = done.length === 6;

  if (active) return <CheckpointView cp={active} onBack={() => setActive(null)} onDone={() => { setActive(null); load(); }} />;

  return (
    <AppLayout>
      <div className="p-4 space-y-5 animate-fade-in">
        <button onClick={() => navigate("/quests")} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Quests
        </button>

        <div className="rounded-2xl p-5 bg-gradient-to-br from-accent/30 via-primary/15 to-background border space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Zartour Adventure Hub</p>
          <h1 className="font-display text-2xl font-bold">🏔️ The Guardians of Makgabeng</h1>
          <p className="text-sm text-muted-foreground">Ancient Rock. Living Culture. One Journey.</p>
          <p className="text-sm">Uncover five layers of the Makgabeng Plateau — Earth, Art, History, Culture and Nature — and earn Guardian status.</p>
          <div className="pt-2 space-y-1">
            <div className="flex justify-between text-xs"><span>{done.length}/6 checkpoints</span><span className="font-semibold">{points}/950 pts</span></div>
            <Progress value={(done.length / 6) * 100} />
          </div>
        </div>

        {allDone && (
          <Card className="border-accent">
            <CardContent className="p-5 text-center space-y-3">
              <Trophy className="w-12 h-12 mx-auto text-accent" />
              <h2 className="font-display text-xl font-bold">Makgabeng Master 🥇</h2>
              <div className="rounded-xl border-2 border-dashed p-4">
                <p className="font-display font-bold">🏔️ MAKGABENG</p>
                <p className="text-xs text-muted-foreground">Ancient Rock • Living Culture • Untamed Wilderness</p>
                <p className="text-xs font-bold mt-1 tracking-widest">QUEST COMPLETED</p>
              </div>
              <ShareButton title="I became a Guardian of Makgabeng on Zartour! 🏔️" text="Ancient Rock • Living Culture • Untamed Wilderness" />
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="font-display font-semibold">Choose your quest</h2>
          {HUBS.map((h) => (
            <Card key={h.theme} className={hubDone(h.theme) ? "border-primary" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{h.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{h.name} {hubDone(h.theme) && "✅"}</p>
                    <p className="text-xs text-muted-foreground">{h.sub}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {CHECKPOINTS.filter((c) => c.theme === h.theme).map((c) => (
                    <button key={c.n} onClick={() => setActive(c)}
                      className="w-full text-left rounded-lg bg-muted/50 hover:bg-muted p-3 flex items-center gap-2">
                      {isDone(c.n) ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <span className="text-xs font-bold w-4">{c.n}</span>}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">📍 {c.place}</p>
                      </div>
                      <span className="text-xs font-semibold">+{c.points}</span>
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => book(h.book)}>
                  <MessageCircle className="w-4 h-4" /> Book the experience
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="font-display font-semibold">🧱 Makgabeng Visitor Wall</h2>
          {wall.length === 0 ? (
            <p className="text-sm text-muted-foreground">Be the first Guardian to leave a message.</p>
          ) : wall.map((w, i) => (
            <Card key={i}><CardContent className="p-3">
              <p className="text-sm italic">“{w.message}”</p>
              <p className="text-xs text-muted-foreground mt-1">— {w.first_name}</p>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function CheckpointView({ cp, onBack, onDone }: { cp: Checkpoint; onBack: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState("");
  const [choice, setChoice] = useState("");
  const [showStory, setShowStory] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!file) return toast.error("Please add a photo");
    if (cp.choices && !choice) return toast.error("Choose an experience");
    if (!answer.trim()) return toast.error("Please answer the question");
    setBusy(true);
    const path = `${user.id}/makgabeng-${cp.n}-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const { error: upErr } = await supabase.storage.from("checkin-images").upload(path, file);
    if (upErr) { setBusy(false); return toast.error("Photo upload failed"); }
    const { data, error } = await supabase.rpc("submit_makgabeng_checkpoint" as never, {
      _checkpoint: cp.n, _answer: answer.trim(), _choice: choice || null, _photo_path: path,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    const res = data as { points: number; completed: number };
    toast.success(`+${res.points} ZARPoints · 🏅 ${cp.badge}`);
    if (res.completed === 6) toast.success("🏆 You are a Guardian of Makgabeng!");
    onDone();
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to hub
        </button>
        <div>
          <p className="text-xs text-muted-foreground">Checkpoint {cp.n} of 6 · 📍 {cp.place}</p>
          <h1 className="font-display text-xl font-bold">{cp.title}</h1>
          <Progress value={(cp.n / 6) * 100} className="mt-2" />
        </div>
        <p className="text-sm">{cp.intro}</p>

        {cp.qrStory && (
          <Card><CardContent className="p-4 space-y-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowStory(true)}>
              <QrCode className="w-4 h-4" /> I scanned the QR — show the story
            </Button>
            {showStory && <><p className="font-semibold text-sm">Who was Chief Malebogo?</p><p className="text-sm text-muted-foreground">{cp.qrStory}</p></>}
          </CardContent></Card>
        )}

        {cp.choices && (
          <div className="grid gap-2">
            {cp.choices.map((c) => (
              <button key={c} onClick={() => setChoice(c)}
                className={`text-left rounded-lg p-3 text-sm border ${choice === c ? "border-primary bg-primary/10" : "bg-muted/40"}`}>{c}</button>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 rounded-lg border border-dashed p-4 cursor-pointer">
          <Camera className="w-5 h-5" />
          <span className="text-sm flex-1">{file ? file.name : "Take or upload a photo"}</span>
          <Input type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <p className="font-medium text-sm">{cp.question}</p>
        {cp.options ? (
          <div className="grid gap-2">
            {cp.options.map((o) => (
              <button key={o.v} onClick={() => setAnswer(o.v)}
                className={`text-left rounded-lg p-3 text-sm border ${answer === o.v ? "border-primary bg-primary/10" : "bg-muted/40"}`}>
                {o.v}. {o.label}
              </button>
            ))}
          </div>
        ) : (
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={1000} rows={4} placeholder="Write your answer…" />
        )}

        <Button className="w-full" disabled={busy} onClick={submit}>
          {busy ? "Submitting…" : `Complete checkpoint · +${cp.points} pts`}
        </Button>
      </div>
    </AppLayout>
  );
}

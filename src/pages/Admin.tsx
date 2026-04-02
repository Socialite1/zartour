import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Pencil, Trash2, QrCode, MapPin, Download, Users, Building2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import UserManagement from "@/components/admin/UserManagement";

interface Location {
  id: string;
  name: string;
  description: string | null;
  qr_code_id: string;
  points_reward: number;
  image_url: string | null;
}

interface GuideProfile {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsReward, setPointsReward] = useState("10");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [locsRes, guidesRes] = await Promise.all([
      supabase.from("locations").select("*").order("created_at", { ascending: false }),
      supabase.from("guide_profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setLocations(locsRes.data ?? []);
    setGuides(guidesRes.data as GuideProfile[] ?? []);
    setLoading(false);
  };

  const generateQrId = () => `loc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const getCheckinUrl = (qrCodeId: string) => `${window.location.origin}/checkin?qr=${qrCodeId}`;

  const openCreate = () => {
    setEditingLocation(null);
    setName(""); setDescription(""); setPointsReward("10"); setImageUrl("");
    setDialogOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingLocation(loc);
    setName(loc.name); setDescription(loc.description ?? "");
    setPointsReward(String(loc.points_reward)); setImageUrl(loc.image_url ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Location name is required"); return; }
    const points = parseInt(pointsReward) || 10;

    if (editingLocation) {
      const { error } = await supabase.from("locations").update({
        name: name.trim(), description: description.trim() || null,
        points_reward: points, image_url: imageUrl.trim() || null,
      }).eq("id", editingLocation.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Location updated");
    } else {
      const { error } = await supabase.from("locations").insert({
        name: name.trim(), description: description.trim() || null,
        qr_code_id: generateQrId(), points_reward: points,
        image_url: imageUrl.trim() || null,
      });
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Location created");
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (loc: Location) => {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    const { error } = await supabase.from("locations").delete().eq("id", loc.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted"); fetchData();
  };

  const showQr = (loc: Location) => { setSelectedLocation(loc); setQrDialogOpen(true); };

  const downloadQr = () => {
    if (!selectedLocation) return;
    const svg = document.getElementById("admin-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `qr-${selectedLocation.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const toggleGuideApproval = async (guide: GuideProfile) => {
    await supabase.from("guide_profiles").update({ is_approved: !guide.is_approved }).eq("id", guide.id);
    toast.success(guide.is_approved ? "Guide approval revoked" : "Guide approved!");
    fetchData();
  };

  if (adminLoading || loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground animate-pulse">Loading...</p></div></AppLayout>;
  }
  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <p className="text-muted-foreground text-sm">Admin Panel</p>
          <h1 className="font-display text-2xl font-bold">Management</h1>
        </div>

        <Tabs defaultValue="locations">
          <TabsList className="w-full">
            <TabsTrigger value="locations" className="flex-1 gap-1.5"><MapPin className="w-4 h-4" />Locations</TabsTrigger>
            <TabsTrigger value="guides" className="flex-1 gap-1.5"><Building2 className="w-4 h-4" />Guides</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 gap-1.5"><Users className="w-4 h-4" />Users</TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={openCreate} size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Add Location</Button>
            </div>
            {locations.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No locations yet.</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {locations.map((loc) => (
                  <Card key={loc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold truncate">{loc.name}</h3>
                          {loc.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{loc.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{loc.points_reward} pts</span>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{loc.qr_code_id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => showQr(loc)}><QrCode className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(loc)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="guides" className="space-y-4 mt-4">
            {guides.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No guide registrations yet.</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {guides.map((guide) => (
                  <Card key={guide.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold">{guide.business_name}</h3>
                            {guide.is_approved ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-600 font-medium">Approved</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/10 text-yellow-600 font-medium">Pending</span>
                            )}
                          </div>
                          {guide.description && <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>}
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {guide.contact_email && <p>{guide.contact_email}</p>}
                            {guide.contact_phone && <p>{guide.contact_phone}</p>}
                          </div>
                        </div>
                        <Button
                          variant={guide.is_approved ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleGuideApproval(guide)}
                          className="gap-1.5"
                        >
                          {guide.is_approved ? <><XCircle className="w-3 h-3" />Revoke</> : <><CheckCircle2 className="w-3 h-3" />Approve</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editingLocation ? "Edit Location" : "New Location"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Heritage Site" maxLength={100} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." maxLength={500} rows={3} /></div>
            <div className="space-y-2"><Label>Points Reward</Label><Input type="number" value={pointsReward} onChange={e => setPointsReward(e.target.value)} min={1} max={1000} /></div>
            <div className="space-y-2"><Label>Image URL (optional)</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingLocation ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-center">{selectedLocation?.name}</DialogTitle></DialogHeader>
          {selectedLocation && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG id="admin-qr-svg" value={getCheckinUrl(selectedLocation.qr_code_id)} size={240} level="H" includeMargin />
              </div>
              <p className="text-xs text-muted-foreground text-center break-all px-4">{getCheckinUrl(selectedLocation.qr_code_id)}</p>
              <Button onClick={downloadQr} variant="outline" className="gap-2"><Download className="w-4 h-4" />Download PNG</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

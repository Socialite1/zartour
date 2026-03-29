import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, ShieldCheck, User, Search, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProfileWithRole {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  points: number;
  role: AppRole | null;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, color: "bg-destructive text-destructive-foreground" },
  moderator: { label: "Moderator", icon: Shield, color: "bg-secondary text-secondary-foreground" },
  user: { label: "User", icon: User, color: "bg-muted text-muted-foreground" },
};

export default function UserManagement() {
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, points")
      .order("full_name");

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role as AppRole]));

    setUsers(
      (profiles ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) ?? null,
      }))
    );
    setLoading(false);
  };

  const assignRole = async (userId: string, role: AppRole) => {
    // Remove existing role first
    await supabase.from("user_roles").delete().eq("user_id", userId);

    if (role !== "user") {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) {
        toast.error("Failed to assign role");
        return;
      }
    }

    toast.success(`Role updated to ${role}`);
    fetchUsers();
  };

  const removeRole = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to remove role");
      return;
    }
    toast.success("Role removed");
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground animate-pulse">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-9"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} users</p>

      <div className="space-y-2">
        {filtered.map((u) => {
          const roleKey = u.role ?? "user";
          const config = ROLE_CONFIG[roleKey];
          const Icon = config.icon;

          return (
            <Card key={u.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {u.full_name || "Unnamed User"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {u.points} pts
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={roleKey}
                    onValueChange={(val) => assignRole(u.user_id, val as AppRole)}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Save, Lock, ShieldCheck, UserMinus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { createAdminUser } from "@/app/actions/admin";

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type AdminRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  username: string | null;
  status: string;
  created_at: string | null;
};

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile>({ first_name: "", last_name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile({
          first_name: (data as Profile).first_name ?? "",
          last_name: (data as Profile).last_name ?? "",
          email: (data as Profile).email ?? user.email ?? "",
          phone: (data as Profile).phone ?? "",
        });
      }
      setLoading(false);
    });

    const supabase2 = createClient();
    supabase2
      .from("profiles")
      .select("id, first_name, last_name, email, username, status, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAdmins((data as AdminRow[]) ?? []);
        setAdminsLoading(false);
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone })
      .eq("id", userId);
    setSaving(false);
    if (error) toast.error("Failed to save profile.");
    else toast.success("Profile updated.");
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = form.get("new_password") as string;
    const confirmPassword = form.get("confirm_password") as string;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password changed successfully.");
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("admin_email") as string;
    const password = form.get("admin_password") as string;
    setCreatingAdmin(true);
    const result = await createAdminUser(email, password);
    setCreatingAdmin(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Admin account created.");
      (e.target as HTMLFormElement).reset();
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, username, status, created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: false });
      setAdmins((data as AdminRow[]) ?? []);
    }
  };

  const handleRemoveAdmin = async (admin: AdminRow) => {
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: "user" }).eq("id", admin.id);
    if (error) {
      setAdmins((prev) => [...prev, admin]);
      toast.error("Failed to remove admin role.");
    } else {
      toast.success("Admin role removed.");
    }
  };

  const handleToggleAdminStatus = async (admin: AdminRow) => {
    const newStatus = admin.status === "suspended" ? "active" : "suspended";
    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, status: newStatus } : a)));
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", admin.id);
    if (error) {
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, status: admin.status } : a)));
      toast.error("Failed to update status.");
    } else {
      toast.success(newStatus === "suspended" ? "Admin suspended." : "Admin reactivated.");
    }
  };

  const adminDisplayName = (a: AdminRow) =>
    `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.username || a.email || "Admin";

  const displayName = `${profile.first_name} ${profile.last_name}`.trim() || "Admin";

  return (
    <div className="p-7 flex flex-col gap-6 max-w-2xl">
      {/* Profile section */}
      <Card padding="lg">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={displayName} size="xl" />
          <div>
            <h3 className="font-sans font-bold text-lg text-ink dark:text-[#dceee3]">{displayName}</h3>
            <p className="text-sm text-ink-500 dark:text-[#668074] font-sans">{profile.email}</p>
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-gold-light text-gold-dark text-xs font-semibold border border-gold/30">
              Administrator
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              value={profile.first_name}
              onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
              disabled={loading}
            />
            <Input
              label="Last name"
              value={profile.last_name}
              onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
              disabled={loading}
            />
          </div>
          <Input
            label="Email address"
            value={profile.email}
            disabled
            helper="Email cannot be changed from here."
          />
          <Input
            label="Phone number"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+234 800 000 0000"
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" leadingIcon={<Save size={15} />} loading={saving} disabled={loading}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Password change */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-full bg-brand-light dark:bg-[#112618] flex items-center justify-center text-brand dark:text-[#2E9B5A]">
            <Lock size={16} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Change Password</h3>
            <p className="text-xs text-ink-500 dark:text-[#668074] font-sans">Use a strong password at least 8 characters long.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Input
            label="New password"
            name="new_password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
          />
          <Input
            label="Confirm new password"
            name="confirm_password"
            type="password"
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" leadingIcon={<Lock size={15} />} loading={savingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Create Admin */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-full bg-gold-light dark:bg-[#2a1e00] flex items-center justify-center text-gold-dark dark:text-[#F5C518]">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Create Admin</h3>
            <p className="text-xs text-ink-500 dark:text-[#668074] font-sans">Add a new administrator account to the panel.</p>
          </div>
        </div>

        <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
          <Input
            label="Email address"
            name="admin_email"
            type="email"
            placeholder="admin@example.com"
            required
          />
          <Input
            label="Temporary password"
            name="admin_password"
            type="password"
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="gold" leadingIcon={<ShieldCheck size={15} />} loading={creatingAdmin}>
              Create Admin
            </Button>
          </div>
        </form>
      </Card>

      {/* Manage Admin Roles */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-ink-100 dark:bg-[#1b2d20] flex items-center justify-center text-ink-500 dark:text-[#668074]">
            <ShieldCheck size={15} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Admin Roles</h3>
            <p className="text-xs text-ink-500 dark:text-[#668074] font-sans">Manage administrator accounts and access.</p>
          </div>
        </div>

        {adminsLoading ? (
          <p className="px-5 py-8 text-sm text-ink-400 font-sans text-center">Loading admins…</p>
        ) : admins.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-400 font-sans text-center">No admin accounts found.</p>
        ) : (
          <div className="divide-y divide-ink-200 dark:divide-[#263a2b]">
            {admins.map((admin) => (
              <div key={admin.id} className="px-5 py-3 flex items-center gap-3">
                <Avatar name={adminDisplayName(admin)} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-ink dark:text-[#dceee3] font-sans truncate">{adminDisplayName(admin)}</div>
                  <div className="text-xs text-ink-500 dark:text-[#668074] font-sans truncate">{admin.email ?? "—"}</div>
                </div>
                <StatusBadge status={admin.status ?? "active"} />
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={admin.status === "suspended" ? "text-success-green" : "text-ink-500"}
                    onClick={() => handleToggleAdminStatus(admin)}
                  >
                    {admin.status === "suspended" ? "Reactivate" : "Suspend"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error"
                    onClick={() => handleRemoveAdmin(admin)}
                    title="Remove admin role"
                  >
                    <UserMinus size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

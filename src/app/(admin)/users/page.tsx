"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { createRegularUser } from "@/app/actions/admin";

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  username: string | null;
  role: string;
  status: string;
  created_at: string | null;
};

type RoleFilter = "all" | "user" | "vendor";

const ROLE_TONE: Record<string, "brand" | "gold" | "neutral"> = {
  user: "neutral",
  vendor: "brand",
  admin: "gold",
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-[#668074] border-b border-ink-200 dark:border-[#263a2b] bg-ink-100 dark:bg-[#1b2d20] font-sans";
const td = "px-5 py-4 text-sm text-ink-600 dark:text-[#89a895] border-b border-ink-200 dark:border-[#263a2b] font-sans";

function displayName(u: UserRow) {
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return name || u.username || u.email || "Unknown";
}

type CreateForm = { email: string; password: string; role: "user" | "vendor" };

function loadUsers(setUsers: (u: UserRow[]) => void, setLoading?: (b: boolean) => void) {
  const supabase = createClient();
  supabase
    .from("profiles")
    .select("id, first_name, last_name, email, username, role, status, created_at")
    .neq("role", "admin")
    .order("created_at", { ascending: false })
    .then(({ data }) => {
      setUsers((data as UserRow[]) ?? []);
      setLoading?.(false);
    });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ email: "", password: "", role: "user" });

  useEffect(() => { loadUsers(setUsers, setLoading); }, []);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    if (!matchRole) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      displayName(u).toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q)
    );
  });

  const handleToggleSuspend = async (u: UserRow) => {
    const newStatus = u.status === "suspended" ? "active" : "suspended";
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: newStatus } : x)));
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", u.id);
    if (error) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: u.status } : x)));
      toast.error("Failed to update user status.");
    } else {
      toast.success(newStatus === "suspended" ? "User suspended." : "User reactivated.");
    }
  };

  const handleRoleChange = async (u: UserRow, newRole: "user" | "vendor") => {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    if (error) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: u.role } : x)));
      toast.error("Failed to update role.");
    } else {
      toast.success(`Role updated to ${newRole}.`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const result = await createRegularUser(createForm.email, createForm.password, createForm.role);
    setCreating(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User created successfully.");
      setShowModal(false);
      setCreateForm({ email: "", password: "", role: "user" });
      loadUsers(setUsers);
    }
  };

  const stats = [
    { label: "Total Users", value: users.length },
    { label: "Members", value: users.filter((u) => u.role === "user").length },
    { label: "Vendors", value: users.filter((u) => u.role === "vendor").length },
    { label: "Suspended", value: users.filter((u) => u.status === "suspended").length },
  ];

  return (
    <>
    <div className="p-7 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="primary" size="sm" leadingIcon={<UserPlus size={15} />} onClick={() => setShowModal(true)}>
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} padding="md" className="text-center">
            <div className="font-display font-bold text-3xl text-ink dark:text-[#dceee3] leading-none">
              {loading ? "—" : s.value}
            </div>
            <div className="mt-1 text-xs text-ink-500 dark:text-[#668074] font-sans">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center gap-4 flex-wrap">
          <div className="max-w-xs flex-1">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search size={15} />}
            />
          </div>
          <div className="flex items-center gap-1 bg-ink-100 dark:bg-[#1b2d20] rounded-lg p-1">
            {(["all", "user", "vendor"] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md font-sans transition-colors capitalize ${
                  roleFilter === r ? "bg-white dark:bg-[#162018] text-ink dark:text-[#dceee3] shadow-[var(--shadow-xs)]" : "text-ink-500 dark:text-[#668074] hover:text-ink dark:hover:text-[#dceee3]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading users…</p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No users found.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>User</th>
                  <th className={th}>Username</th>
                  <th className={th}>Role</th>
                  <th className={th}>Joined</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-ink-100 dark:hover:bg-[#1b2d20] transition-colors">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName(u)} size="sm" />
                        <div>
                          <div className="font-semibold text-ink text-sm">{displayName(u)}</div>
                          <div className="text-xs text-ink-500">{u.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>{u.username ? `@${u.username}` : "—"}</td>
                    <td className={td}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as "user" | "vendor")}
                        className="text-xs font-semibold border border-ink-200 dark:border-[#263a2b] rounded-md px-2 py-1 bg-white dark:bg-[#1b2d20] font-sans text-ink dark:text-[#dceee3] focus:outline-none focus:border-brand"
                      >
                        <option value="user">Member</option>
                        <option value="vendor">Vendor</option>
                      </select>
                    </td>
                    <td className={td}>{formatDate(u.created_at)}</td>
                    <td className={td}><StatusBadge status={u.status ?? "active"} /></td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-1">
                        <Badge tone={ROLE_TONE[u.role] ?? "neutral"} size="sm" className="capitalize hidden sm:inline-flex">
                          {u.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.status === "suspended" ? "text-success-green" : "text-error"}
                          onClick={() => handleToggleSuspend(u)}
                        >
                          {u.status === "suspended" ? "Reactivate" : "Suspend"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>

    {showModal && (

      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#162018] rounded-xl shadow-xl w-full max-w-md border border-transparent dark:border-[#263a2b]">
          <div className="p-5 border-b border-ink-200 dark:border-[#263a2b] flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-ink dark:text-[#dceee3]">Create User</h3>
            <button onClick={() => setShowModal(false)} className="text-ink-400 dark:text-[#4d6356] hover:text-ink dark:hover:text-[#dceee3] transition-colors">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="p-5 flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              required
              placeholder="user@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
              placeholder="Min. 8 characters"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink dark:text-[#dceee3] font-sans">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as "user" | "vendor" }))}
                className="w-full h-11 rounded-lg border border-ink-200 dark:border-[#263a2b] px-4 font-sans text-sm text-ink dark:text-[#dceee3] bg-white dark:bg-[#1b2d20] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="user">Member</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={creating} leadingIcon={<UserPlus size={15} />}>
                Create User
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

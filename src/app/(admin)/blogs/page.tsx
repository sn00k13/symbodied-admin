"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Plus, X, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type BlogRow = {
  id: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string | null;
  status: string;
  author: string | null;
};

type BlogForm = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string;
  status: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "published";

const CATEGORIES = ["Agriculture", "Medicine", "Technology", "Textile", "Community", "Education", "Other"];
const STATUS_OPTIONS = ["draft", "pending", "approved", "published", "rejected"];
const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "approved", "published", "rejected"];

const emptyForm: BlogForm = { title: "", category: "Agriculture", excerpt: "", content: "", image_url: "", status: "published" };

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";
const ta = "w-full rounded-lg border border-ink-200 px-4 py-3 font-sans text-sm text-ink bg-white resize-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-ink-400";
const sel = "w-full h-11 rounded-lg border border-ink-200 px-4 font-sans text-sm text-ink bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AdminBlogsPage() {
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  type RawBlog = { id: string; title: string; category: string | null; excerpt: string | null; content: string | null; image_url: string | null; created_at: string | null; status: string; profiles?: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null };

  const load = () => {
    const supabase = createClient();
    supabase
      .from("blogs")
      .select("id, title, category, excerpt, content, image_url, created_at, status, profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(
          (data ?? []).map((b) => {
            const raw = b as unknown as RawBlog;
            const p = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
            return { id: raw.id, title: raw.title, category: raw.category, excerpt: raw.excerpt, content: raw.content, image_url: raw.image_url, created_at: raw.created_at, status: raw.status, author: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null : null };
          })
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    createClient().auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUserId(user.id); });
  }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: BlogRow) => {
    setEditingId(r.id);
    setForm({ title: r.title, category: r.category ?? "Agriculture", excerpt: r.excerpt ?? "", content: r.content ?? "", image_url: r.image_url ?? "", status: r.status });
    setShowModal(true);
  };

  const f = (k: keyof BlogForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = { title: form.title, category: form.category, excerpt: form.excerpt || null, content: form.content || null, image_url: form.image_url || null, status: form.status };
    const { error } = editingId
      ? await supabase.from("blogs").update(payload).eq("id", editingId)
      : await supabase.from("blogs").insert({ ...payload, user_id: currentUserId });
    setSaving(false);
    if (error) { toast.error(`Failed to ${editingId ? "update" : "create"} blog.`); return; }
    toast.success(editingId ? "Blog updated." : "Blog created.");
    setShowModal(false);
    load();
  };

  const handleDelete = async (r: BlogRow) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    const { error } = await createClient().from("blogs").delete().eq("id", r.id);
    if (error) { toast.error("Failed to delete blog."); load(); }
    else toast.success("Blog deleted.");
  };

  const setStatus = async (id: string, status: "approved" | "rejected" | "published") => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    const { error } = await createClient().from("blogs").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update blog status.");
    else toast.success(`Blog ${status}.`);
  };

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || (r.author ?? "").toLowerCase().includes(q);
  });

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className="p-7 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          {pending > 0 ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-warning font-sans">
              <Bell size={16} /> {pending} pending review
            </span>
          ) : <div />}
          <Button variant="primary" size="sm" leadingIcon={<Plus size={15} />} onClick={openCreate}>
            Write Blog
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_FILTERS.map((s) => (
            <Card key={s} padding="sm" className="text-center cursor-pointer" onClick={() => setStatusFilter(s)}
              style={{ outline: statusFilter === s ? "2px solid #1A6B3C" : undefined }}>
              <div className="font-display font-bold text-2xl text-ink leading-none">
                {loading ? "—" : (s === "all" ? rows.length : rows.filter((r) => r.status === s).length)}
              </div>
              <div className="mt-0.5 text-xs text-ink-500 font-sans capitalize">{s}</div>
            </Card>
          ))}
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 max-w-sm">
            <Input placeholder="Search blogs…" value={search} onChange={(e) => setSearch(e.target.value)} leadingIcon={<Search size={15} />} />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading blogs…</p>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No blog posts found.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Title</th>
                    <th className={th}>Author</th>
                    <th className={th}>Category</th>
                    <th className={th}>Submitted</th>
                    <th className={th}>Status</th>
                    <th className={`${th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-ink-100 transition-colors">
                      <td className={`${td} font-semibold text-ink max-w-64`}>
                        <span className="line-clamp-2">{r.title}</span>
                      </td>
                      <td className={td}>{r.author ?? "Admin"}</td>
                      <td className={td}>
                        {r.category ? <Badge tone="brand" size="sm">{r.category}</Badge> : "—"}
                      </td>
                      <td className={td}>{formatDate(r.created_at, { day: "numeric", month: "short" })}</td>
                      <td className={td}><StatusBadge status={r.status} /></td>
                      <td className={`${td} text-right`}>
                        <div className="inline-flex items-center gap-1">
                          {r.status === "pending" && (
                            <>
                              <Button variant="primary" size="sm" onClick={() => setStatus(r.id, "approved")}>Approve</Button>
                              <Button variant="secondary" size="sm" onClick={() => setStatus(r.id, "rejected")}>Reject</Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button variant="ghost" size="sm" className="text-brand" onClick={() => setStatus(r.id, "published")}>Publish</Button>
                          )}
                          <button onClick={() => openEdit(r)} title="Edit"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(r)} title="Delete"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-error/10 hover:text-error transition-colors">
                            <Trash2 size={14} />
                          </button>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-5 border-b border-ink-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink">{editingId ? "Edit Blog Post" : "Write Blog Post"}</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-400 hover:text-ink transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <Input label="Title" value={form.title} onChange={f("title")} required placeholder="Blog post title" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink font-sans">Category</label>
                  <select value={form.category} onChange={f("category")} className={sel}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink font-sans">Status</label>
                  <select value={form.status} onChange={f("status")} className={sel}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Cover Image URL" value={form.image_url} onChange={f("image_url")} placeholder="https://..." type="url" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink font-sans">Excerpt <span className="font-normal text-ink-400">(shown on listing)</span></label>
                <textarea value={form.excerpt} onChange={f("excerpt")} placeholder="Brief summary shown on the blog listing page…" rows={2} className={ta} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink font-sans">Content</label>
                <textarea value={form.content} onChange={f("content")} placeholder="Full article content…" rows={10} className={ta} />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving} leadingIcon={editingId ? <Pencil size={15} /> : <Plus size={15} />}>
                  {editingId ? "Save Changes" : "Publish Blog"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

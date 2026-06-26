"use client";

import { useEffect, useState } from "react";
import { Plus, X, ExternalLink, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  category: string | null;
  published: boolean;
  created_at: string | null;
};

type ResourceForm = {
  title: string;
  description: string;
  url: string;
  type: string;
  category: string;
  published: boolean;
};

const RESOURCE_TYPES = ["link", "document", "video", "guide"] as const;
const CATEGORIES = ["Agriculture", "Medicine", "Technology", "Textile", "Community", "Education", "Finance", "Other"] as const;

const emptyForm: ResourceForm = { title: "", description: "", url: "", type: "link", category: "", published: false };

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm);

  const fetchResources = () => {
    const supabase = createClient();
    supabase
      .from("resources")
      .select("id, title, description, url, type, category, published, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load resources. Ensure the resources table exists.");
        setResources((data as Resource[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchResources(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r: Resource) => {
    setEditingId(r.id);
    setForm({
      title: r.title,
      description: r.description ?? "",
      url: r.url ?? "",
      type: r.type,
      category: r.category ?? "",
      published: r.published,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title,
      description: form.description || null,
      url: form.url || null,
      type: form.type,
      category: form.category || null,
      published: form.published,
    };

    if (editingId) {
      const { error } = await supabase.from("resources").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to update resource.");
      else { toast.success("Resource updated."); setShowModal(false); fetchResources(); }
    } else {
      const { error } = await supabase.from("resources").insert(payload);
      if (error) toast.error("Failed to create resource.");
      else { toast.success("Resource created."); setShowModal(false); fetchResources(); }
    }
    setSaving(false);
  };

  const handleDelete = async (r: Resource) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    setResources((prev) => prev.filter((x) => x.id !== r.id));
    const supabase = createClient();
    const { error } = await supabase.from("resources").delete().eq("id", r.id);
    if (error) { toast.error("Failed to delete resource."); fetchResources(); }
    else toast.success("Resource deleted.");
  };

  const handleTogglePublish = async (r: Resource) => {
    const newVal = !r.published;
    setResources((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: newVal } : x)));
    const supabase = createClient();
    const { error } = await supabase.from("resources").update({ published: newVal }).eq("id", r.id);
    if (error) {
      setResources((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: r.published } : x)));
      toast.error("Failed to update resource.");
    } else {
      toast.success(newVal ? "Resource published." : "Resource unpublished.");
    }
  };

  const stats = [
    { label: "Total", value: resources.length },
    { label: "Published", value: resources.filter((r) => r.published).length },
    { label: "Drafts", value: resources.filter((r) => !r.published).length },
  ];

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="primary" size="sm" leadingIcon={<Plus size={15} />} onClick={openCreate}>
          Add Resource
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} padding="md" className="text-center">
            <div className="font-display font-bold text-3xl text-ink leading-none">
              {loading ? "—" : s.value}
            </div>
            <div className="mt-1 text-xs text-ink-500 font-sans">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading resources…</p>
          ) : resources.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No resources yet. Add your first one.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Title</th>
                  <th className={th}>Type</th>
                  <th className={th}>Category</th>
                  <th className={th}>Status</th>
                  <th className={th}>Created</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-100 transition-colors">
                    <td className={td}>
                      <div className="font-semibold text-ink text-sm">{r.title}</div>
                      {r.description && (
                        <div className="text-xs text-ink-500 mt-0.5 max-w-xs truncate">{r.description}</div>
                      )}
                    </td>
                    <td className={td}>
                      <span className="capitalize text-xs font-semibold">{r.type}</span>
                    </td>
                    <td className={td}>{r.category ?? "—"}</td>
                    <td className={td}>
                      <StatusBadge status={r.published ? "active" : "pending"} />
                    </td>
                    <td className={td}>{formatDate(r.created_at)}</td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex items-center gap-1">
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink transition-colors"
                            title="Open link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleTogglePublish(r)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink transition-colors"
                          title={r.published ? "Unpublish" : "Publish"}
                        >
                          {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-error/10 hover:text-error transition-colors"
                          title="Delete"
                        >
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-ink-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-display font-bold text-lg text-ink">
                {editingId ? "Edit Resource" : "Add Resource"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-400 hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                placeholder="e.g. Community Farming Guide"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink font-sans">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this resource"
                  rows={3}
                  className="w-full rounded-lg border border-ink-200 px-4 py-3 font-sans text-sm text-ink bg-white resize-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-ink-400"
                />
              </div>
              <Input
                label="URL"
                type="url"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://example.com/resource"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink font-sans">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-ink-200 px-4 font-sans text-sm text-ink bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink font-sans">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-ink-200 px-4 font-sans text-sm text-ink bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">No category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  className="h-4 w-4 rounded border-ink-300 accent-brand"
                />
                <span className="text-sm font-semibold text-ink font-sans">Publish immediately</span>
              </label>
              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving} leadingIcon={editingId ? <Pencil size={15} /> : <Plus size={15} />}>
                  {editingId ? "Save Changes" : "Add Resource"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

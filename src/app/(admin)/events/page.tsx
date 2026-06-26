"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Plus, X, Pencil, Trash2, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type EventRow = {
  id: string;
  name: string;
  theme: string | null;
  venue: string | null;
  city: string | null;
  event_date: string | null;
  slots: number | null;
  created_at: string | null;
  status: string;
  author: string | null;
};

type EventForm = {
  name: string;
  theme: string;
  venue: string;
  city: string;
  event_date: string;
  slots: string;
  status: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "approved", "rejected"];
const STATUS_OPTIONS = ["draft", "pending", "approved", "rejected"];
const emptyForm: EventForm = { name: "", theme: "", venue: "", city: "", event_date: "", slots: "", status: "approved" };

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";
const sel = "w-full h-11 rounded-lg border border-ink-200 px-4 font-sans text-sm text-ink bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AdminEventsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  type RawEvent = { id: string; name: string; theme: string | null; venue: string | null; city: string | null; event_date: string | null; slots: number | null; created_at: string | null; status: string; profiles?: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null };

  const load = () => {
    const supabase = createClient();
    supabase
      .from("events")
      .select("id, name, theme, venue, city, event_date, slots, created_at, status, profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(
          (data ?? []).map((e) => {
            const raw = e as unknown as RawEvent;
            const p = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
            return { ...raw, author: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null : null };
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
  const openEdit = (r: EventRow) => {
    setEditingId(r.id);
    setForm({ name: r.name, theme: r.theme ?? "", venue: r.venue ?? "", city: r.city ?? "", event_date: r.event_date ? r.event_date.slice(0, 10) : "", slots: r.slots != null ? String(r.slots) : "", status: r.status });
    setShowModal(true);
  };

  const f = (k: keyof EventForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = { name: form.name, theme: form.theme || null, venue: form.venue || null, city: form.city || null, event_date: form.event_date || null, slots: form.slots ? parseInt(form.slots) : null, status: form.status };
    const { error } = editingId
      ? await supabase.from("events").update(payload).eq("id", editingId)
      : await supabase.from("events").insert({ ...payload, user_id: currentUserId });
    setSaving(false);
    if (error) { toast.error(`Failed to ${editingId ? "update" : "create"} event.`); return; }
    toast.success(editingId ? "Event updated." : "Event created.");
    setShowModal(false);
    load();
  };

  const handleDelete = async (r: EventRow) => {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    const { error } = await createClient().from("events").delete().eq("id", r.id);
    if (error) { toast.error("Failed to delete event."); load(); }
    else toast.success("Event deleted.");
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    const { error } = await createClient().from("events").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update event.");
    else toast.success(`Event ${status}.`);
  };

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q) || (r.author ?? "").toLowerCase().includes(q);
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
            Create Event
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <Input placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} leadingIcon={<Search size={15} />} />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading events…</p>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No events found.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Event</th>
                    <th className={th}>Organiser</th>
                    <th className={th}>Date</th>
                    <th className={th}>Location</th>
                    <th className={th}>Slots</th>
                    <th className={th}>Status</th>
                    <th className={`${th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-ink-100 transition-colors">
                      <td className={`${td} font-semibold text-ink max-w-52`}>
                        <div className="line-clamp-1">{r.name}</div>
                        {r.theme && <Badge tone="neutral" size="sm" className="mt-1">{r.theme}</Badge>}
                      </td>
                      <td className={td}>{r.author ?? "Admin"}</td>
                      <td className={td}>
                        {r.event_date ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-ink-400" />
                            {formatDate(r.event_date, { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        ) : "—"}
                      </td>
                      <td className={td}>
                        {r.city ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-ink-400" />
                            {r.venue ? `${r.venue}, ` : ""}{r.city}
                          </span>
                        ) : "—"}
                      </td>
                      <td className={td}>{r.slots ?? "—"}</td>
                      <td className={td}><StatusBadge status={r.status} /></td>
                      <td className={`${td} text-right`}>
                        <div className="inline-flex items-center gap-1">
                          {r.status === "pending" && (
                            <>
                              <Button variant="primary" size="sm" onClick={() => setStatus(r.id, "approved")}>Approve</Button>
                              <Button variant="secondary" size="sm" onClick={() => setStatus(r.id, "rejected")}>Reject</Button>
                            </>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-5 border-b border-ink-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink">{editingId ? "Edit Event" : "Create Event"}</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-400 hover:text-ink transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <Input label="Event Name" value={form.name} onChange={f("name")} required placeholder="e.g. Community Harvest Festival" />
              <Input label="Theme" value={form.theme} onChange={f("theme")} placeholder="Optional theme or tagline" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Venue" value={form.venue} onChange={f("venue")} placeholder="Hall, address…" />
                <Input label="City" value={form.city} onChange={f("city")} placeholder="Lagos, Enugu…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={form.event_date} onChange={f("event_date")} />
                <Input label="Slots" type="number" min="1" value={form.slots} onChange={f("slots")} placeholder="Max attendees" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink font-sans">Status</label>
                <select value={form.status} onChange={f("status")} className={sel}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving} leadingIcon={editingId ? <Pencil size={15} /> : <Plus size={15} />}>
                  {editingId ? "Save Changes" : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

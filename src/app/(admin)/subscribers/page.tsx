"use client";

import { useEffect, useState } from "react";
import { Search, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Subscriber = {
  id: string;
  email: string;
  status: "active" | "unsubscribed";
  subscribed_at: string;
  unsubscribed_at: string | null;
};

type StatusFilter = "all" | "active" | "unsubscribed";

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";

function loadSubscribers(
  setRows: (r: Subscriber[]) => void,
  setLoading?: (b: boolean) => void
) {
  const supabase = createClient();
  supabase
    .from("subscribers")
    .select("id, email, status, subscribed_at, unsubscribed_at")
    .order("subscribed_at", { ascending: false })
    .then(({ data }) => {
      setRows((data as Subscriber[]) ?? []);
      setLoading?.(false);
    });
}

export default function SubscribersPage() {
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    loadSubscribers(setRows, setLoading);
  }, []);

  const filtered = rows.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    return matchStatus && r.email.toLowerCase().includes(search.toLowerCase());
  });

  const stats = [
    { label: "Total", value: rows.length },
    { label: "Active", value: rows.filter((r) => r.status === "active").length },
    { label: "Unsubscribed", value: rows.filter((r) => r.status === "unsubscribed").length },
    {
      label: "This Month",
      value: rows.filter((r) => {
        const d = new Date(r.subscribed_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    },
  ];

  const handleDelete = async (sub: Subscriber) => {
    if (!confirm(`Remove ${sub.email} from the list permanently?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("subscribers").delete().eq("id", sub.id);
    if (error) {
      toast.error("Failed to remove subscriber.");
    } else {
      toast.success("Subscriber removed.");
      setRows((prev) => prev.filter((r) => r.id !== sub.id));
    }
  };

  const handleToggleStatus = async (sub: Subscriber) => {
    const newStatus = sub.status === "active" ? "unsubscribed" : "active";
    setRows((prev) =>
      prev.map((r) => (r.id === sub.id ? { ...r, status: newStatus as Subscriber["status"] } : r))
    );
    const supabase = createClient();
    const patch =
      newStatus === "unsubscribed"
        ? { status: newStatus, unsubscribed_at: new Date().toISOString() }
        : { status: newStatus, unsubscribed_at: null };
    const { error } = await supabase.from("subscribers").update(patch).eq("id", sub.id);
    if (error) {
      setRows((prev) =>
        prev.map((r) => (r.id === sub.id ? { ...r, status: sub.status } : r))
      );
      toast.error("Failed to update subscriber.");
    } else {
      toast.success(newStatus === "active" ? "Subscriber reactivated." : "Subscriber unsubscribed.");
    }
  };

  const handleExportCsv = () => {
    const active = rows.filter((r) => r.status === "active");
    const csv = ["email,subscribed_at", ...active.map((r) => `${r.email},${r.subscribed_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `symbodied-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported active subscribers.");
  };

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div />
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Download size={15} />}
          onClick={handleExportCsv}
        >
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="px-5 py-4 border-b border-ink-200 flex items-center gap-4 flex-wrap">
          <div className="max-w-xs flex-1">
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search size={15} />}
            />
          </div>
          <div className="flex items-center gap-1 bg-ink-100 rounded-lg p-1">
            {(["all", "active", "unsubscribed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md font-sans transition-colors capitalize ${
                  filter === s
                    ? "bg-white text-ink shadow-[var(--shadow-xs)]"
                    : "text-ink-500 hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading subscribers…</p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No subscribers found.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Subscribed</th>
                  <th className={th}>Unsubscribed</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-ink-100 transition-colors">
                    <td className={td}>
                      <span className="font-medium text-ink">{sub.email}</span>
                    </td>
                    <td className={td}>{formatDate(sub.subscribed_at)}</td>
                    <td className={td}>{sub.unsubscribed_at ? formatDate(sub.unsubscribed_at) : "—"}</td>
                    <td className={td}>
                      <Badge
                        tone={sub.status === "active" ? "success" : "neutral"}
                        size="sm"
                        className="capitalize"
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={sub.status === "active" ? "text-ink-500" : "text-success-green"}
                          onClick={() => handleToggleStatus(sub)}
                        >
                          {sub.status === "active" ? "Unsubscribe" : "Reactivate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error"
                          onClick={() => handleDelete(sub)}
                        >
                          <Trash2 size={14} />
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
  );
}

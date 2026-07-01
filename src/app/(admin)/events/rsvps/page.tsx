"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Users, Calendar, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type RsvpRow = {
  id: string;
  created_at: string;
  event_id: string;
  event_name: string;
  event_date: string | null;
  user_name: string;
  user_email: string;
  user_phone: string;
};

type EventSummary = {
  id: string;
  name: string;
  date: string | null;
  rsvp_count: number;
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-[#668074] border-b border-ink-200 dark:border-[#263a2b] bg-ink-100 dark:bg-[#1b2d20] font-sans";
const td = "px-5 py-4 text-sm text-ink-600 dark:text-[#89a895] border-b border-ink-200 dark:border-[#263a2b] font-sans";

function exportCsv(rows: RsvpRow[], eventName?: string) {
  const headers = ["Name", "Email", "Phone", "Event", "Event Date", "RSVP'd On"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escape(r.user_name || "—"),
        escape(r.user_email || "—"),
        escape(r.user_phone || "—"),
        escape(r.event_name),
        escape(r.event_date ? new Date(r.event_date).toLocaleDateString("en-GB") : "—"),
        escape(new Date(r.created_at).toLocaleDateString("en-GB")),
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = eventName ? `rsvps-${eventName.toLowerCase().replace(/\s+/g, "-")}.csv` : "rsvps.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function EventRsvpsPage() {
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [eventSummaries, setEventSummaries] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/rsvps")
      .then((r) => r.json())
      .then((data: RsvpRow[]) => {
        setRsvps(data);
        const eventMap = new Map<string, EventSummary>();
        data.forEach((r) => {
          if (!eventMap.has(r.event_id)) {
            eventMap.set(r.event_id, { id: r.event_id, name: r.event_name, date: r.event_date, rsvp_count: 0 });
          }
          eventMap.get(r.event_id)!.rsvp_count++;
        });
        setEventSummaries(Array.from(eventMap.values()).sort((a, b) => b.rsvp_count - a.rsvp_count));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rsvps.filter((r) => {
    if (selectedEventId && r.event_id !== selectedEventId) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user_name.toLowerCase().includes(q) ||
      r.user_email.toLowerCase().includes(q) ||
      r.event_name.toLowerCase().includes(q)
    );
  });

  const selectedEventName = selectedEventId
    ? eventSummaries.find((e) => e.id === selectedEventId)?.name
    : undefined;

  const handleExport = useCallback(() => {
    exportCsv(filtered, selectedEventName);
  }, [filtered, selectedEventName]);

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-ink-200 dark:border-[#263a2b] -mx-7 -mt-7 px-7 pt-5 bg-white dark:bg-[#162018]">
        <Link
          href="/events"
          className="px-4 py-2.5 text-sm font-semibold font-sans text-ink-500 hover:text-ink dark:text-[#668074] dark:hover:text-[#dceee3] transition-colors"
        >
          Manage Events
        </Link>
        <div className="px-4 py-2.5 text-sm font-semibold font-sans text-ink border-b-2 border-brand dark:text-[#dceee3]">
          RSVPs
        </div>
      </div>

      {/* Event summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <Card
            padding="sm"
            className={`cursor-pointer text-center transition-all ${!selectedEventId ? "outline outline-2 outline-brand" : ""}`}
            onClick={() => setSelectedEventId(null)}
          >
            <div className="font-display font-bold text-2xl text-ink dark:text-[#dceee3] leading-none">{rsvps.length}</div>
            <div className="mt-0.5 text-xs text-ink-500 dark:text-[#668074] font-sans">All Events</div>
          </Card>
          {eventSummaries.map((ev) => (
            <Card
              key={ev.id}
              padding="sm"
              className={`cursor-pointer transition-all ${selectedEventId === ev.id ? "outline outline-2 outline-brand" : ""}`}
              onClick={() => setSelectedEventId(selectedEventId === ev.id ? null : ev.id)}
            >
              <div className="font-display font-bold text-2xl text-ink dark:text-[#dceee3] leading-none">{ev.rsvp_count}</div>
              <div className="mt-0.5 text-xs text-ink-500 dark:text-[#668074] font-sans line-clamp-1" title={ev.name}>{ev.name}</div>
              {ev.date && (
                <div className="mt-1 text-[10px] text-ink-400 dark:text-[#4d6356] font-sans flex items-center gap-1 justify-center">
                  <Calendar size={10} />
                  {formatDate(ev.date, { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
            </Card>
          ))}
          {eventSummaries.length === 0 && !loading && (
            <p className="col-span-full text-sm text-ink-400 font-sans">No RSVPs recorded yet.</p>
          )}
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by name, email or event…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search size={15} />}
            />
          </div>
          {selectedEventId && (
            <button
              onClick={() => setSelectedEventId(null)}
              className="text-sm font-semibold text-brand hover:underline font-sans"
            >
              Clear filter
            </button>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Download size={14} />}
              onClick={handleExport}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading RSVPs…</p>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Users size={36} className="mx-auto text-ink-300 mb-3" />
              <p className="text-sm text-ink-400 font-sans">No RSVPs found.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Event</th>
                  <th className={th}>Event Date</th>
                  <th className={th}>RSVP'd On</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-100 dark:hover:bg-[#1b2d20] transition-colors">
                    <td className={`${td} font-semibold text-ink dark:text-[#dceee3]`}>
                      {r.user_name || <span className="text-ink-400 font-normal">—</span>}
                    </td>
                    <td className={td}>{r.user_email || <span className="text-ink-400">—</span>}</td>
                    <td className={td}>{r.user_phone || <span className="text-ink-400">—</span>}</td>
                    <td className={td}>
                      <span className="line-clamp-1">{r.event_name}</span>
                    </td>
                    <td className={td}>
                      {r.event_date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-ink-400 dark:text-[#4d6356]" />
                          {formatDate(r.event_date, { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={td}>
                      {formatDate(r.created_at, { day: "numeric", month: "short", year: "numeric" })}
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

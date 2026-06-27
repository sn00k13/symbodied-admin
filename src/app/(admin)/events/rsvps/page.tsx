"use client";

import { useEffect, useState } from "react";
import { Search, Users, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type RsvpRow = {
  id: string;
  created_at: string;
  event_id: string;
  user_name: string;
  event_name: string;
  date: string | null;
};

type EventSummary = {
  id: string;
  name: string;
  date: string | null;
  rsvp_count: number;
};

type RawRsvp = {
  id: string;
  created_at: string;
  event_id: string;
  events: { id: string; name: string; date: string | null } | { id: string; name: string; date: string | null }[] | null;
  profiles: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null;
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";

export default function EventRsvpsPage() {
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [eventSummaries, setEventSummaries] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("event_rsvps")
      .select("id, created_at, event_id, events(id, name, date), profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows: RsvpRow[] = (data ?? []).map((raw) => {
          const r = raw as unknown as RawRsvp;
          const ev = Array.isArray(r.events) ? r.events[0] : r.events;
          const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return {
            id: r.id,
            created_at: r.created_at,
            event_id: r.event_id,
            user_name: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unknown User" : "Unknown User",
            event_name: ev?.name ?? "Unknown Event",
            date: ev?.date ?? null,
          };
        });
        setRsvps(rows);

        const eventMap = new Map<string, EventSummary>();
        rows.forEach((r) => {
          if (!eventMap.has(r.event_id)) {
            eventMap.set(r.event_id, { id: r.event_id, name: r.event_name, date: r.date, rsvp_count: 0 });
          }
          eventMap.get(r.event_id)!.rsvp_count++;
        });
        setEventSummaries(Array.from(eventMap.values()).sort((a, b) => b.rsvp_count - a.rsvp_count));
        setLoading(false);
      });
  }, []);

  const filtered = rsvps.filter((r) => {
    if (selectedEventId && r.event_id !== selectedEventId) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.user_name.toLowerCase().includes(q) || r.event_name.toLowerCase().includes(q);
  });

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-ink-200 -mx-7 -mt-7 px-7 pt-5 bg-white dark:bg-[#162018]">
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
            <div className="font-display font-bold text-2xl text-ink leading-none">{rsvps.length}</div>
            <div className="mt-0.5 text-xs text-ink-500 font-sans">All Events</div>
          </Card>
          {eventSummaries.map((ev) => (
            <Card
              key={ev.id}
              padding="sm"
              className={`cursor-pointer transition-all ${selectedEventId === ev.id ? "outline outline-2 outline-brand" : ""}`}
              onClick={() => setSelectedEventId(selectedEventId === ev.id ? null : ev.id)}
            >
              <div className="font-display font-bold text-2xl text-ink leading-none">{ev.rsvp_count}</div>
              <div className="mt-0.5 text-xs text-ink-500 font-sans line-clamp-1" title={ev.name}>{ev.name}</div>
              {ev.date && (
                <div className="mt-1 text-[10px] text-ink-400 font-sans flex items-center gap-1 justify-center">
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
        <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
          <div className="max-w-sm">
            <Input
              placeholder="Search by name or event…"
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
                  <th className={th}>Attendee</th>
                  <th className={th}>Event</th>
                  <th className={th}>Event Date</th>
                  <th className={th}>RSVPd On</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-100 transition-colors">
                    <td className={`${td} font-semibold text-ink`}>{r.user_name}</td>
                    <td className={td}>
                      <span className="line-clamp-1">{r.event_name}</span>
                    </td>
                    <td className={td}>
                      {r.date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-ink-400" />
                          {formatDate(r.date, { day: "numeric", month: "short", year: "numeric" })}
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

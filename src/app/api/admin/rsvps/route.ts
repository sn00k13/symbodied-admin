import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  // Verify caller is an admin
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await auth.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();

  // Fetch RSVPs with event and profile joins
  const { data: rsvps, error } = await service
    .from("event_rsvps")
    .select("id, created_at, event_id, user_id, events(id, name, date), profiles(first_name, last_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Collect unique user IDs to fetch auth records
  const userIds = [...new Set((rsvps ?? []).map((r: { user_id: string }) => r.user_id))];

  // Fetch auth users in batches of 100
  const authUserMap = new Map<string, { email: string; phone: string }>();
  for (let i = 0; i < userIds.length; i += 100) {
    const batch = userIds.slice(i, i + 100);
    const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    (data?.users ?? [])
      .filter((u) => batch.includes(u.id))
      .forEach((u) => {
        authUserMap.set(u.id, {
          email: u.email ?? "",
          phone: u.phone ?? "",
        });
      });
    break; // one pass is enough for ≤ 1000 total users
  }

  type RawRsvp = {
    id: string;
    created_at: string;
    event_id: string;
    user_id: string;
    events: { id: string; name: string; date: string | null } | { id: string; name: string; date: string | null }[] | null;
    profiles: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null;
  };

  const rows = (rsvps ?? []).map((raw) => {
    const r = raw as unknown as RawRsvp;
    const ev = Array.isArray(r.events) ? r.events[0] : r.events;
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const authUser = authUserMap.get(r.user_id);
    return {
      id: r.id,
      created_at: r.created_at,
      event_id: r.event_id,
      event_name: ev?.name ?? "",
      event_date: ev?.date ?? null,
      user_name: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "" : "",
      user_email: authUser?.email ?? "",
      user_phone: authUser?.phone ?? "",
    };
  });

  return NextResponse.json(rows);
}

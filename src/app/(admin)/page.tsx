import { Users, Package, Wallet, Bell, ShoppingBag, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { naira, formatDate } from "@/lib/utils";
import { createServiceClient } from "@/lib/supabase/service";

const PROGRAM_COLORS: Record<string, string> = {
  Agriculture: "#1A6B3C",
  Textile: "#2E9B5A",
  Medicine: "#F5C518",
  Technology: "#9AA3AE",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const [
    { count: userCount },
    { count: productCount },
    { count: pendingBlogCount },
    { data: monthOrderRows },
    { data: weekOrderRows },
    { data: recentBlogs },
    { data: recentOrders },
    { data: productCategories },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).neq("role", "admin"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("blogs").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("total").gte("created_at", monthStart),
    supabase.from("orders").select("created_at").gte("created_at", weekAgo.toISOString()),
    supabase
      .from("blogs")
      .select("id, title, status, created_at, profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("orders")
      .select("id, customer, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("products").select("category"),
  ]);

  const monthRevenue = (monthOrderRows ?? []).reduce((s, o) => s + ((o.total as number) ?? 0), 0);

  // Weekly orders bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weeklyData = last7.map((d) => {
    const dayStr = d.toISOString().slice(0, 10);
    return {
      label: DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      count: (weekOrderRows ?? []).filter((o) => (o.created_at as string)?.slice(0, 10) === dayStr).length,
    };
  });
  const maxCount = Math.max(...weeklyData.map((w) => w.count), 1);

  // Products by program
  const catMap: Record<string, number> = {};
  (productCategories ?? []).forEach((p) => {
    const c = (p.category as string) ?? "Other";
    catMap[c] = (catMap[c] ?? 0) + 1;
  });
  const total = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
  const cats = Object.entries(catMap)
    .map(([n, v]) => ({ n, v: Math.round((v / total) * 100), color: PROGRAM_COLORS[n] ?? "#9AA3AE" }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 4);

  type RawBlog = { id: string; title: string; status: string; created_at: string | null; profiles?: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null };
  const blogs = (recentBlogs ?? []).map((b) => {
    const raw = b as unknown as RawBlog;
    const p = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
    const author = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—" : "—";
    return { id: raw.id, title: raw.title, status: raw.status, created_at: raw.created_at, author };
  });

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Users"
          value={userCount != null ? userCount.toLocaleString() : "—"}
          icon={<Users size={18} />}
          iconVariant="green"
        />
        <StatCard
          label="Products Listed"
          value={productCount != null ? productCount.toLocaleString() : "—"}
          icon={<Package size={18} />}
          iconVariant="blue"
        />
        <StatCard
          label="Revenue (this month)"
          value={monthRevenue > 0 ? naira(monthRevenue) : "—"}
          icon={<Wallet size={18} />}
          iconVariant="gold"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingBlogCount != null ? String(pendingBlogCount) : "0"}
          delta={pendingBlogCount ? "Blogs awaiting review" : "All caught up"}
          deltaTone={pendingBlogCount ? "warning" : "success"}
          icon={<Bell size={18} />}
          iconVariant={pendingBlogCount ? "red" : "green"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid sm:grid-cols-3 gap-5">
        <StatCard
          label="Orders This Month"
          value={(monthOrderRows?.length ?? 0).toLocaleString()}
          icon={<ShoppingBag size={18} />}
          iconVariant="purple"
        />
        <StatCard
          label="All-time GMV"
          value="—"
          delta="Connect orders table"
          icon={<TrendingUp size={18} />}
          iconVariant="green"
        />
        <StatCard
          label="Orders This Week"
          value={(weekOrderRows?.length ?? 0).toLocaleString()}
          icon={<ShoppingBag size={18} />}
          iconVariant="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center justify-between">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Orders This Week</h3>
            <span className="text-xs text-ink-500 dark:text-[#668074] font-sans">
              {last7[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
              {last7[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="p-6 flex items-end gap-3 h-52">
            {weeklyData.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                {w.count > 0 && <span className="text-xs text-ink-500 dark:text-[#668074] font-sans">{w.count}</span>}
                <div
                  className="w-full max-w-9 rounded-t-md transition-all"
                  style={{
                    height: `${(w.count / maxCount) * 100}%`,
                    minHeight: w.count > 0 ? "6px" : "3px",
                    background: w.count > 0
                      ? "linear-gradient(180deg, #2E9B5A 0%, #1A6B3C 100%)"
                      : "var(--border-subtle)",
                  }}
                />
                <span className="text-xs text-ink-400 dark:text-[#4d6356] font-sans">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Products by Program</h3>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {cats.length > 0 ? cats.map((c) => (
              <div key={c.n}>
                <div className="flex justify-between text-sm mb-1.5 font-sans">
                  <span className="text-ink-600 dark:text-[#89a895]">{c.n}</span>
                  <strong className="text-ink dark:text-[#dceee3]">{c.v}%</strong>
                </div>
                <div className="h-2 bg-ink-200 dark:bg-[#263a2b] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.v}%`, background: c.color }} />
                </div>
              </div>
            )) : (
              <p className="text-sm text-ink-400 dark:text-[#4d6356] font-sans">No product data yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent content row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent blogs needing approval */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Recent Blog Submissions</h3>
            {(pendingBlogCount ?? 0) > 0 && (
              <Badge tone="warning" size="sm">{pendingBlogCount} pending</Badge>
            )}
          </div>
          <div className="divide-y divide-ink-200 dark:divide-[#263a2b]">
            {blogs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400 dark:text-[#4d6356] font-sans text-center">No blog submissions.</p>
            ) : blogs.map((b) => (
              <div key={b.id} className="flex items-start justify-between px-5 py-3.5 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-[#dceee3] font-sans truncate">{b.title}</p>
                  <p className="text-xs text-ink-500 dark:text-[#668074] font-sans mt-0.5">{b.author} · {formatDate(b.created_at, { day: "numeric", month: "short" })}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent orders */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Recent Orders</h3>
          </div>
          <div className="divide-y divide-ink-200 dark:divide-[#263a2b]">
            {(recentOrders ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400 dark:text-[#4d6356] font-sans text-center">No orders yet.</p>
            ) : (recentOrders ?? []).map((o) => {
              const order = o as { id: string; customer: string | null; total: number | null; status: string; created_at: string | null };
              return (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink dark:text-[#dceee3] font-sans">{order.customer ?? "—"}</p>
                    <p className="text-xs font-mono text-ink-500 dark:text-[#668074] mt-0.5">{order.id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-brand font-sans">
                      {order.total != null ? naira(order.total) : "—"}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
